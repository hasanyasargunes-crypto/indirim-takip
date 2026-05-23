import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * GDPR/KVKK Webhook: customers/redact
 *
 * A customer has requested deletion of their data.
 * Since we only store product price data (not customer data),
 * we acknowledge the request and respond with 200.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);
  console.log(
    `[GDPR] Customer redact request for customer ID: ${payload?.customer?.id}`,
  );

  // This app does not store any customer-specific data.
  // Nothing to delete for the customer.

  return new Response("OK", { status: 200 });
};
