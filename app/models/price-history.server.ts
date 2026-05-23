import prisma from "~/db.server";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Record a price change for a variant.
 * Only records if the price actually changed from the last recorded price.
 */
export async function recordPriceChange(
  shop: string,
  productId: string,
  variantId: string,
  price: number,
  currency: string = "TRY",
) {
  // Check last recorded price for this variant
  const lastRecord = await prisma.priceHistory.findFirst({
    where: { shop, variantId },
    orderBy: { recordedAt: "desc" },
  });

  // Only record if price changed or no history exists
  if (!lastRecord || Number(lastRecord.price) !== price) {
    await prisma.priceHistory.create({
      data: {
        shop,
        productId,
        variantId,
        price: new Decimal(price),
        currency,
      },
    });
  }
}

/**
 * Record price changes for multiple variants in a batch.
 */
export async function recordBulkPriceChanges(
  shop: string,
  variants: Array<{
    productId: string;
    variantId: string;
    price: number;
    currency?: string;
  }>,
) {
  for (const variant of variants) {
    await recordPriceChange(
      shop,
      variant.productId,
      variant.variantId,
      variant.price,
      variant.currency || "TRY",
    );
  }
}

/**
 * Get the lowest price in the last 30 days for a variant.
 */
export async function getLowestPrice30d(
  shop: string,
  variantId: string,
): Promise<{ lowestPrice: number; date: Date } | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.priceHistory.findFirst({
    where: {
      shop,
      variantId,
      recordedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { price: "asc" },
  });

  if (!result) return null;

  return {
    lowestPrice: Number(result.price),
    date: result.recordedAt,
  };
}

/**
 * Get the lowest price in the last 30 days for a product (across all variants).
 * Returns the minimum price found across any variant.
 */
export async function getLowestProductPrice30d(
  shop: string,
  productId: string,
): Promise<{ lowestPrice: number; date: Date; variantId: string } | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.priceHistory.findFirst({
    where: {
      shop,
      productId,
      recordedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { price: "asc" },
  });

  if (!result) return null;

  return {
    lowestPrice: Number(result.price),
    date: result.recordedAt,
    variantId: result.variantId,
  };
}

/**
 * Get full price history for a product (last 30 days).
 */
export async function getPriceHistory(
  shop: string,
  productId: string,
  days: number = 30,
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.priceHistory.findMany({
    where: {
      shop,
      productId,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "desc" },
  });
}

/**
 * Purge price records older than the retention period (default: 90 days).
 * Keeps extra buffer beyond 30 days for safety.
 */
export async function purgeOldRecords(days: number = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.priceHistory.deleteMany({
    where: { recordedAt: { lt: cutoff } },
  });

  return result.count;
}
