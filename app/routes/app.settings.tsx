import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  Select,
  Button,
  InlineStack,
  Banner,
  Box,
  Checkbox,
  Divider,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getShopSettings, updateShopSettings } from "~/models/shop-settings.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getShopSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    badgeEnabled: formData.get("badgeEnabled") === "true",
    badgeText: (formData.get("badgeText") as string) || "Son 30 gunun en dusuk fiyati:",
    badgeTextEn: (formData.get("badgeTextEn") as string) || "Lowest price in 30 days:",
    badgeColor: (formData.get("badgeColor") as string) || "#1a1a1a",
    badgeBgColor: (formData.get("badgeBgColor") as string) || "#fff3cd",
    badgePosition: (formData.get("badgePosition") as string) || "below_price",
    language: (formData.get("language") as string) || "tr",
  };

  await updateShopSettings(session.shop, data);

  return { success: true, message: "Ayarlar basariyla kaydedildi." };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [badgeEnabled, setBadgeEnabled] = useState(settings.badgeEnabled);
  const [badgeText, setBadgeText] = useState(settings.badgeText);
  const [badgeTextEn, setBadgeTextEn] = useState(settings.badgeTextEn);
  const [badgeColor, setBadgeColor] = useState(settings.badgeColor);
  const [badgeBgColor, setBadgeBgColor] = useState(settings.badgeBgColor);
  const [badgePosition, setBadgePosition] = useState(settings.badgePosition);
  const [language, setLanguage] = useState(settings.language);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("badgeEnabled", String(badgeEnabled));
    formData.append("badgeText", badgeText);
    formData.append("badgeTextEn", badgeTextEn);
    formData.append("badgeColor", badgeColor);
    formData.append("badgeBgColor", badgeBgColor);
    formData.append("badgePosition", badgePosition);
    formData.append("language", language);
    submit(formData, { method: "POST" });
  }, [badgeEnabled, badgeText, badgeTextEn, badgeColor, badgeBgColor, badgePosition, language, submit]);

  const positionOptions = [
    { label: "Fiyatin altinda", value: "below_price" },
    { label: "Sepete ekle butonunun ustunde", value: "above_add_to_cart" },
    { label: "Ozel konum (Theme Editor)", value: "custom" },
  ];

  const languageOptions = [
    { label: "Turkce", value: "tr" },
    { label: "English", value: "en" },
  ];

  return (
    <Page
      title="Rozet Ayarlari"
      backAction={{ url: "/app" }}
      primaryAction={{
        content: "Kaydet",
        onAction: handleSave,
        loading: isLoading,
      }}
    >
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner
            title={actionData.message}
            tone="success"
            onDismiss={() => {}}
          />
        )}

        <Layout>
          {/* Badge Settings */}
          <Layout.AnnotatedSection
            title="Rozet Goruntuleme"
            description="Magaza vitrininizde gosterilecek indirim rozetinin gorunumunu ayarlayin."
          >
            <Card>
              <BlockStack gap="400">
                <Checkbox
                  label="Rozeti aktif et"
                  checked={badgeEnabled}
                  onChange={setBadgeEnabled}
                  helpText="Pasif edildiginde rozet magaza vitrininizde gosterilmez."
                />

                <Divider />

                <Select
                  label="Dil"
                  options={languageOptions}
                  value={language}
                  onChange={setLanguage}
                  helpText="Rozetin gosterilecegi dil."
                />

                <TextField
                  label="Rozet Metni (Turkce)"
                  value={badgeText}
                  onChange={setBadgeText}
                  autoComplete="off"
                  helpText="Fiyattan once gosterilecek metin. Ornek: 'Son 30 gunun en dusuk fiyati:'"
                />

                <TextField
                  label="Badge Text (English)"
                  value={badgeTextEn}
                  onChange={setBadgeTextEn}
                  autoComplete="off"
                  helpText="Text shown before the price in English."
                />
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          {/* Appearance */}
          <Layout.AnnotatedSection
            title="Gorunum"
            description="Rozet renkleri ve konumunu ayarlayin."
          >
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="400">
                  <Box width="50%">
                    <TextField
                      label="Yazi Rengi"
                      value={badgeColor}
                      onChange={setBadgeColor}
                      autoComplete="off"
                      helpText="CSS renk kodu (orn: #1a1a1a)"
                      prefix={
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            backgroundColor: badgeColor,
                            borderRadius: 4,
                            border: "1px solid #ccc",
                          }}
                        />
                      }
                    />
                  </Box>
                  <Box width="50%">
                    <TextField
                      label="Arka Plan Rengi"
                      value={badgeBgColor}
                      onChange={setBadgeBgColor}
                      autoComplete="off"
                      helpText="CSS renk kodu (orn: #fff3cd)"
                      prefix={
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            backgroundColor: badgeBgColor,
                            borderRadius: 4,
                            border: "1px solid #ccc",
                          }}
                        />
                      }
                    />
                  </Box>
                </InlineStack>

                <Select
                  label="Konum"
                  options={positionOptions}
                  value={badgePosition}
                  onChange={setBadgePosition}
                  helpText="Rozetin urun sayfasinda nerede gosterilecegini secin."
                />
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>

          {/* Preview */}
          <Layout.AnnotatedSection
            title="Onizleme"
            description="Rozetin magaza vitrininizde nasil gorunecegini onizleyin."
          >
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Canli Onizleme
                </Text>
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      Ornek Urun Adi
                    </Text>
                    <Text as="p" variant="headingLg">
                      149,99 TL
                    </Text>
                    <div
                      style={{
                        backgroundColor: badgeBgColor,
                        color: badgeColor,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        display: "inline-block",
                        maxWidth: "fit-content",
                      }}
                    >
                      {language === "tr" ? badgeText : badgeTextEn}{" "}
                      <strong>129,99 TL</strong>
                    </div>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.AnnotatedSection>
        </Layout>
      </BlockStack>
    </Page>
  );
}
