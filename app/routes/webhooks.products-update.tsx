import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { processProductUpdate } from "~/jobs/price-calculator.server";

/**
 * Webhook handler for products/update and products/create.
 *
 * Shopify sends this webhook whenever a product is created or updated.
 * We must respond with HTTP 200 within 5 seconds.
 * The actual price processing happens inline (DB operations are fast).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`[Webhook] ${topic} received for shop: ${shop}`);

  if (!admin) {
    // Shop has uninstalled the app
    console.log(`[Webhook] No admin session for ${shop}, skipping.`);
    return new Response("OK", { status: 200 });
  }

  try {
    await processProductUpdate(admin, shop, payload as any);
    console.log(`[Webhook] Successfully processed ${topic} for product ${payload.id}`);
  } catch (error) {
    // Log error but still return 200 to prevent Shopify from retrying
    console.error(`[Webhook] Error processing ${topic}:`, error);
  }

  return new Response("OK", { status: 200 });
};
