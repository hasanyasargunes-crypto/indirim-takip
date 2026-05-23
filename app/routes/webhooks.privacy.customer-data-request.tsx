import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * GDPR/KVKK Webhook: customers/data_request
 *
 * A customer has requested their stored data.
 * Since we only store product price data (not customer data),
 * we acknowledge the request and respond with 200.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);
  console.log(
    `[GDPR] Customer data request for customer ID: ${payload?.customer?.id}`,
  );

  // This app does not store any customer-specific data.
  // We only track product prices.
  // Acknowledge the request.

  return new Response("OK", { status: 200 });
};
