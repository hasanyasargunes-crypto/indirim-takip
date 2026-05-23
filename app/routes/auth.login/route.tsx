import { useState } from "react";
import {
  AppProvider as PolarisAppProvider,
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Text,
  BlockStack,
} from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "~/shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const errors = {
    shop: url.searchParams.get("error") || undefined,
  };
  return { errors, polarisTranslations: {} };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = await login(request);
  return errors;
};

export default function Auth() {
  const { errors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");

  return (
    <PolarisAppProvider i18n={{}}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Indirim Takip - Giris
                </Text>
                <TextField
                  type="text"
                  name="shop"
                  label="Magaza adresi"
                  helpText="ornek: magaza-adi.myshopify.com"
                  value={shop}
                  onChange={setShop}
                  autoComplete="on"
                  error={errors?.shop}
                />
                <Button submit variant="primary">
                  Giris Yap
                </Button>
              </BlockStack>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
