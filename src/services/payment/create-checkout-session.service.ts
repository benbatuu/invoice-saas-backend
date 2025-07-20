// services/create-checkout-session.service.ts
import Stripe from 'stripe';
import { env } from 'bun';

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });

// CLIENT_URL başında http/https yoksa otomatik olarak https:// ekle
const clientUrl = env.CLIENT_URL!.startsWith('http') ? env.CLIENT_URL! : `https://${env.CLIENT_URL!}`;

export const createCheckoutSession = async (data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    planId: string;
    stripePriceId: string;
    companyName: string;
    companyLogoUrl?: string;
    taxId?: string;
    address: string;
    phone: string;
}) => {

    console.log('Creating checkout session with data:', data);

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: data.email,
        line_items: [
            {
                price: data.stripePriceId,
                quantity: 1,
            },
        ],
        success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/cancel`,
        metadata: {
            firstname: data.firstname,
            lastname: data.lastname,
            password: data.password,
            planId: data.planId,
            companyName: data.companyName,
            companyLogoUrl: data.companyLogoUrl || '',
            taxId: data.taxId || '',
            address: data.address,
            phone: data.phone,
        },
    });

    return session.url;
};
