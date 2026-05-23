import { useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  InlineStack,
  Badge,
  Box,
  SkeletonBodyText,
  Button,
  Divider,
} from "@shopify/polaris";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getShopSettings } from "~/models/shop-settings.server";
import { bulkImportProducts } from "~/jobs/price-calculator.server";
import { ensureMetafieldDefinitions, bulkSyncAllMetafields } from "~/utils/metafield-sync.server";
import prisma from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const settings = await getShopSettings(shop);

  // Get stats
  const [trackedProducts, priceRecords] = await Promise.all([
    prisma.productSyncStatus.count({ where: { shop } }),
    prisma.priceHistory.count({ where: { shop } }),
  ]);

  return {
    shop,
    settings,
    stats: {
      trackedProducts,
      priceRecords,
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "initial-sync") {
    // Create metafield definitions first
    await ensureMetafieldDefinitions(admin);

    // Import all existing products
    const imported = await bulkImportProducts(admin, shop);

    // Sync metafields for all products
    const synced = await bulkSyncAllMetafields(admin, shop);

    return {
      success: true,
      message: `${imported} urun iceri aktarildi, ${synced} urun metafield senkronize edildi.`,
    };
  }

  return { success: false, message: "Bilinmeyen islem." };
};

export default function Index() {
  const { shop, settings, stats } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isLoading = navigation.state === "submitting";

  const handleInitialSync = () => {
    submit({ action: "initial-sync" }, { method: "POST" });
  };

  return (
    <Page title="Indirim Takip">
      <BlockStack gap="500">
        {/* Welcome Banner */}
        <Banner
          title="AB Omnibus & Ticaret Bakanligi Uyumlu Fiyat Takip"
          tone="info"
        >
          <p>
            Bu uygulama, urunlerinizin son 30 gunluk en dusuk fiyatini otomatik
            olarak takip eder ve magaza vitrininizde gosterir. AB Omnibus
            Direktifi ve Turkiye Ticaret Bakanligi duzenlemelerine uyumluluk
            saglar.
          </p>
        </Banner>

        <Layout>
          {/* Stats */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Takip Edilen Urunler
                </Text>
                <Text as="p" variant="headingXl" fontWeight="bold">
                  {stats.trackedProducts}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Fiyat Kayitlari
                </Text>
                <Text as="p" variant="headingXl" fontWeight="bold">
                  {stats.priceRecords}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Rozet Durumu
                </Text>
                <InlineStack gap="200" align="start">
                  <Badge
                    tone={settings.badgeEnabled ? "success" : "critical"}
                  >
                    {settings.badgeEnabled ? "Aktif" : "Pasif"}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Initial Sync */}
        {stats.trackedProducts === 0 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Ilk Kurulum
              </Text>
              <Text as="p" variant="bodyMd">
                Uygulamayi ilk kez kullaniyorsunuz. Mevcut tum urunlerinizin
                fiyatlarini iceri aktarmak ve metafield tanimlarini olusturmak
                icin asagidaki butona tiklayin.
              </Text>
              <InlineStack gap="200">
                <Button
                  variant="primary"
                  onClick={handleInitialSync}
                  loading={isLoading}
                >
                  Urunleri Iceri Aktar ve Senkronize Et
                </Button>
              </InlineStack>
              {isLoading && (
                <Box paddingBlockStart="200">
                  <SkeletonBodyText lines={2} />
                </Box>
              )}
            </BlockStack>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Hizli Islemler
            </Text>
            <Divider />
            <InlineStack gap="300">
              <Button url="/app/settings">Rozet Ayarlari</Button>
              {stats.trackedProducts > 0 && (
                <Button onClick={handleInitialSync} loading={isLoading}>
                  Tum Metafield&apos;lari Yeniden Senkronize Et
                </Button>
              )}
            </InlineStack>
          </BlockStack>
        </Card>

        {/* How It Works */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Nasil Calisir?
            </Text>
            <Divider />
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                <strong>1.</strong> Urun fiyatlari degistiginde webhook ile
                otomatik olarak kaydedilir.
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>2.</strong> Son 30 gunun en dusuk fiyati hesaplanir ve
                urun metafield&apos;ina yazilir.
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>3.</strong> Magaza vitrininizde rozet olarak
                gosterilir (Theme Editor&apos;dan App Block ekleyin).
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>4.</strong> Ayarlar sayfasindan rozet gorunumunu
                ozellestirin.
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
