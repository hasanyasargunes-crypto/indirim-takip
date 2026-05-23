import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { deleteShopData } from "~/models/shop-settings.server";

/**
 * GDPR/KVKK Webhook: shop/redact
 *
 * Sent 48 hours after app uninstall. Must delete ALL shop data.
 * This is a mandatory webhook for Shopify App Store compliance.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);

  try {
    await deleteShopData(shop);
    console.log(`[GDPR] All data for ${shop} has been permanently deleted.`);
  } catch (error) {
    console.error(`[GDPR] Error deleting shop data for ${shop}:`, error);
  }

  return new Response("OK", { status: 200 });
};
