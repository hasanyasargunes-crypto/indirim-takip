import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { getLowestPrice30d } from "~/models/price-history.server";
import prisma from "~/db.server";

// Metafield namespace & keys
const METAFIELD_NAMESPACE = "$app:price-tracker";
const METAFIELD_KEY_LOWEST = "lowest_price_30d";
const METAFIELD_KEY_DATE = "lowest_price_date";

/**
 * Create metafield definitions with storefront access.
 * Must be called once during app installation.
 */
export async function ensureMetafieldDefinitions(admin: AdminApiContext) {
  const definitions = [
    {
      name: "Lowest Price (30 days)",
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY_LOWEST,
      type: "number_decimal",
      description: "The lowest price in the last 30 days (Omnibus/TR compliance)",
      ownerType: "PRODUCT",
    },
    {
      name: "Lowest Price Date",
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY_DATE,
      type: "date",
      description: "The date of the lowest price in the last 30 days",
      ownerType: "PRODUCT",
    },
  ];

  for (const def of definitions) {
    await admin.graphql(
      `#graphql
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          definition: {
            ...def,
            access: {
              storefront: "PUBLIC_READ",
            },
            pin: true,
          },
        },
      },
    );
  }
}

/**
 * Sync the lowest price metafield for a single product.
 * Gets the lowest price across all variants and writes it to the product metafield.
 */
export async function syncProductMetafield(
  admin: AdminApiContext,
  shop: string,
  productId: string,
) {
  // Get all variant IDs for this product
  const variants = await prisma.priceHistory.findMany({
    where: { shop, productId },
    select: { variantId: true },
    distinct: ["variantId"],
  });

  if (variants.length === 0) return;

  // Find the lowest price across all variants
  let overallLowest: { lowestPrice: number; date: Date } | null = null;

  for (const { variantId } of variants) {
    const result = await getLowestPrice30d(shop, variantId);
    if (result && (!overallLowest || result.lowestPrice < overallLowest.lowestPrice)) {
      overallLowest = result;
    }
  }

  if (!overallLowest) return;

  // Write to product metafield via GraphQL
  const response = await admin.graphql(
    `#graphql
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY_LOWEST,
            type: "number_decimal",
            value: overallLowest.lowestPrice.toFixed(2),
          },
          {
            ownerId: productId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY_DATE,
            type: "date",
            value: overallLowest.date.toISOString().split("T")[0],
          },
        ],
      },
    },
  );

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error(
      "Metafield sync error:",
      data.data.metafieldsSet.userErrors,
    );
    return;
  }

  // Update sync status
  await prisma.productSyncStatus.upsert({
    where: { shop_productId: { shop, productId } },
    update: {
      lastSyncedAt: new Date(),
      lowestPrice30d: overallLowest.lowestPrice,
      metafieldSynced: true,
    },
    create: {
      shop,
      productId,
      lowestPrice30d: overallLowest.lowestPrice,
      metafieldSynced: true,
    },
  });
}

/**
 * Bulk sync metafields for all products of a shop.
 * Used during initial app installation.
 */
export async function bulkSyncAllMetafields(
  admin: AdminApiContext,
  shop: string,
) {
  const products = await prisma.productSyncStatus.findMany({
    where: { shop },
    select: { productId: true },
  });

  let synced = 0;
  for (const { productId } of products) {
    try {
      await syncProductMetafield(admin, shop, productId);
      synced++;
    } catch (error) {
      console.error(`Failed to sync metafield for ${productId}:`, error);
    }
  }

  return synced;
}
