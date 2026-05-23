import { recordPriceChange } from "~/models/price-history.server";
import { syncProductMetafield } from "~/utils/metafield-sync.server";
import prisma from "~/db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

interface VariantPayload {
  id: number;
  product_id: number;
  price: string;
  compare_at_price: string | null;
  title: string;
  sku: string;
}

interface ProductWebhookPayload {
  id: number;
  title: string;
  variants: VariantPayload[];
  updated_at: string;
}

/**
 * Process a products/update or products/create webhook.
 *
 * This is the "background job" that runs after the webhook
 * responds with HTTP 200. In a serverless environment (Vercel),
 * we use waitUntil or simply process inline since the price
 * comparison and DB write are fast operations.
 *
 * Flow:
 * 1. Extract variant prices from webhook payload
 * 2. Record price changes (only if actually changed)
 * 3. Recalculate lowest 30-day price
 * 4. Sync to product metafield
 */
export async function processProductUpdate(
  admin: AdminApiContext,
  shop: string,
  payload: ProductWebhookPayload,
) {
  const productGid = `gid://shopify/Product/${payload.id}`;

  // Step 1: Record price for each variant
  for (const variant of payload.variants) {
    const variantGid = `gid://shopify/ProductVariant/${variant.id}`;
    const price = parseFloat(variant.price);

    if (isNaN(price) || price <= 0) continue;

    await recordPriceChange(shop, productGid, variantGid, price);
  }

  // Step 2: Sync the product metafield with the lowest price
  await syncProductMetafield(admin, shop, productGid);
}

/**
 * Initial bulk import of all products when app is first installed.
 * Fetches all products via GraphQL and records their current prices.
 */
export async function bulkImportProducts(
  admin: AdminApiContext,
  shop: string,
) {
  let hasNextPage = true;
  let cursor: string | null = null;
  let totalImported = 0;

  while (hasNextPage) {
    const response: any = await admin.graphql(
      `#graphql
      query GetProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            variants(first: 100) {
              nodes {
                id
                price
                compareAtPrice
              }
            }
          }
        }
      }`,
      { variables: { cursor } },
    );

    const data: any = await response.json();
    const products: any = data.data?.products;

    if (!products) break;

    for (const product of products.nodes) {
      for (const variant of product.variants.nodes) {
        const price = parseFloat(variant.price);
        if (isNaN(price) || price <= 0) continue;

        await recordPriceChange(shop, product.id, variant.id, price);
      }

      // Create sync status for this product
      await prisma.productSyncStatus.upsert({
        where: { shop_productId: { shop, productId: product.id } },
        update: { lastSyncedAt: new Date() },
        create: {
          shop,
          productId: product.id,
          metafieldSynced: false,
        },
      });

      totalImported++;
    }

    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return totalImported;
}
