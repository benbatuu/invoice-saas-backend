// services/stripe.webhook.service.ts
import Stripe from 'stripe';
import { env } from 'bun';
import { registerUser } from 'services/auth/register.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
});

/**
 * Stripe webhook event'ini işler
 * 
 * @param rawBody Stripe'ın gönderdiği ham request body (ArrayBuffer)
 * @param signature Stripe-Signature header değeri
 * @returns Başarı veya hata durumu
 */
export const handleStripeWebhook = async (rawBody: ArrayBuffer, signature: string | null) => {
    let event: Stripe.Event;

    try {
        // constructEvent yerine constructEventAsync kullan
        event = await stripe.webhooks.constructEventAsync(
            Buffer.from(rawBody),
            signature!,
            env.STRIPE_WEBHOOK_SECRET!
        );
        console.log('✅ [Webhook] Signature verified successfully');
    } catch (err) {
        console.error('[Webhook] Signature verification failed', err);
        throw new Error('Invalid Stripe signature');
    }

    console.log(`🔄 [Webhook] Processing event: ${event.type}`);

    // Sadece başarılı ödeme tamamlandığında çalıştır
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        console.log('🔍 [Webhook] checkout.session.completed details:', {
            customer_email: session.customer_email,
            subscription: session.subscription,
            payment_status: session.payment_status,
            metadata: metadata
        });

        if (!metadata) {
            console.warn('[Webhook] Metadata eksik');
            throw new Error('Metadata not found');
        }

        if (!session.customer_email) {
            console.warn('[Webhook] Customer email eksik');
            throw new Error('Customer email not found');
        }

        try {
            let invoiceId = null;

            if (session.subscription) {
                // subscription objesini çek
                const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());

                // subscription içindeki en son invoice id'yi al
                invoiceId = subscription.latest_invoice?.toString() || null;
            }

            console.log('👤 [Webhook] Registering user:', session.customer_email);

            const registerResult = await registerUser(
                metadata.firstname,
                metadata.lastname,
                session.customer_email!,
                metadata.planId,
                metadata.password,
                metadata.companyName,
                metadata.companyLogoUrl || '',
                metadata.taxId || '',
                metadata.address,
                metadata.phone,
                session.subscription as string,
                session.payment_status,
                invoiceId || "test_123"
            );

            console.log('✅ [Webhook] User registered successfully', registerResult);
            const response = { success: true, eventType: event.type, ...registerResult };
            console.log('🔄 [Webhook] Returning response:', response);
            return response;
        } catch (err) {
            console.error('[Webhook] User registration error', err);
            throw new Error('User registration failed');
        }
    }

    console.log(`ℹ️ [Webhook] Event type ${event.type} handled but no action taken`);
    return { success: true, message: 'Event received but no action required', eventType: event.type };
};