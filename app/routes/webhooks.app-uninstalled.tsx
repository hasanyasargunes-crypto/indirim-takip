import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { deleteShopData } from "~/models/shop-settings.server";

/**
 * Webhook handler for app/uninstalled.
 * Cleans up all shop data when the app is uninstalled.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[Webhook] ${topic} received for shop: ${shop}`);

  try {
    await deleteShopData(shop);
    console.log(`[Webhook] All data deleted for ${shop}`);
  } catch (error) {
    console.error(`[Webhook] Error deleting data for ${shop}:`, error);
  }

  return new Response("OK", { status: 200 });
};
