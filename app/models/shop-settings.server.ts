import prisma from "~/db.server";

export interface ShopSettingsData {
  badgeEnabled: boolean;
  badgeText: string;
  badgeTextEn: string;
  badgeColor: string;
  badgeBgColor: string;
  badgePosition: string;
  currency: string;
  language: string;
}

const DEFAULT_SETTINGS: ShopSettingsData = {
  badgeEnabled: true,
  badgeText: "Son 30 gunun en dusuk fiyati:",
  badgeTextEn: "Lowest price in 30 days:",
  badgeColor: "#1a1a1a",
  badgeBgColor: "#fff3cd",
  badgePosition: "below_price",
  currency: "TRY",
  language: "tr",
};

/**
 * Get shop settings, creating defaults if they don't exist.
 */
export async function getShopSettings(shop: string): Promise<ShopSettingsData> {
  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    badgeEnabled: settings.badgeEnabled,
    badgeText: settings.badgeText,
    badgeTextEn: settings.badgeTextEn,
    badgeColor: settings.badgeColor,
    badgeBgColor: settings.badgeBgColor,
    badgePosition: settings.badgePosition,
    currency: settings.currency,
    language: settings.language,
  };
}

/**
 * Update shop settings (upsert).
 */
export async function updateShopSettings(
  shop: string,
  data: Partial<ShopSettingsData>,
) {
  return prisma.shopSettings.upsert({
    where: { shop },
    update: { ...data },
    create: {
      shop,
      ...DEFAULT_SETTINGS,
      ...data,
    },
  });
}

/**
 * Delete all shop data (for GDPR shop/redact webhook).
 */
export async function deleteShopData(shop: string) {
  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { shop } }),
    prisma.productSyncStatus.deleteMany({ where: { shop } }),
    prisma.shopSettings.deleteMany({ where: { shop } }),
    prisma.session.deleteMany({ where: { shop } }),
  ]);
}
