-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "badgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "badgeText" TEXT NOT NULL DEFAULT 'Son 30 gunun en dusuk fiyati:',
    "badgeTextEn" TEXT NOT NULL DEFAULT 'Lowest price in 30 days:',
    "badgeColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "badgeBgColor" TEXT NOT NULL DEFAULT '#fff3cd',
    "badgePosition" TEXT NOT NULL DEFAULT 'below_price',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSyncStatus" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lowestPrice30d" DECIMAL(10,2),
    "metafieldSynced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductSyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "ShopSettings_shop_idx" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "PriceHistory_shop_variantId_idx" ON "PriceHistory"("shop", "variantId");

-- CreateIndex
CREATE INDEX "PriceHistory_shop_productId_idx" ON "PriceHistory"("shop", "productId");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_shop_variantId_recordedAt_idx" ON "PriceHistory"("shop", "variantId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSyncStatus_shop_productId_key" ON "ProductSyncStatus"("shop", "productId");

-- CreateIndex
CREATE INDEX "ProductSyncStatus_shop_idx" ON "ProductSyncStatus"("shop");
