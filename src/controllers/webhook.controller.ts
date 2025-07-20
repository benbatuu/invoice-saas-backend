import { Hono } from 'hono';
import { handleStripeWebhook } from 'webhooks/stripe.webhook';

const stripeWebhookController = new Hono();

stripeWebhookController.post('/stripe', async (c) => {
    console.log('📩 [Webhook] Stripe webhook called');

    const signature = c.req.header('stripe-signature');
    if (!signature) {
        console.warn('⚠️ [Webhook] Missing Stripe-Signature header');
        return c.text('Missing signature', 400);
    }

    let rawBody: ArrayBuffer;
    try {
        rawBody = await c.req.arrayBuffer();
        console.log('📦 [Webhook] Received raw body, length:', rawBody.byteLength);
    } catch (err) {
        console.error('❌ [Webhook] Error reading raw body', err);
        return c.text('Failed to read body', 400);
    }

    try {
        const result = await handleStripeWebhook(rawBody, signature);
        console.log('✅ [Webhook] Event processed successfully:', result);
        console.log('📤 [Webhook] Sending HTTP response:', result);
        return c.json(result);
    } catch (err) {
        console.error('❌ [Webhook] Failed to handle event', err);
        return c.text('Webhook error', 400);
    }
});

export default stripeWebhookController;
