import { Hono } from 'hono';
import Stripe from 'stripe';
import { env } from 'bun';
import { sign as jwtsign } from 'hono/jwt';
import pc from 'helpers/prismaclient.singleton';
import { registerUser } from 'services/auth/register.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
});

const stripeController = new Hono();

stripeController.post('/success', async (c) => {
    try {
        const { session_id } = await c.req.json();

        if (!session_id) {
            return c.json({ error: 'session_id is required' }, 400);
        }

        console.log('🔍 [Stripe Success] Processing session:', session_id);

        // Stripe'dan session bilgilerini al
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['subscription', 'customer'],
        });

        if (!session) {
            return c.json({ error: 'Session not found' }, 404);
        }

        console.log('📋 [Stripe Success] Session details:', {
            id: session.id,
            customer_email: session.customer_email,
            subscription: session.subscription,
            payment_status: session.payment_status,
            metadata: session.metadata
        });

        // Session tamamlanmış mı kontrol et
        if (session.payment_status !== 'paid') {
            return c.json({ error: 'Payment not completed' }, 400);
        }

        // Metadata kontrolü
        const metadata = session.metadata;
        if (!metadata) {
            return c.json({ error: 'No metadata found' }, 400);
        }

        if (!session.customer_email) {
            return c.json({ error: 'No customer email found' }, 400);
        }

        // Kullanıcı zaten var mı kontrol et
        const existingUser = await pc.user.findFirst({
            where: { email: session.customer_email }
        });

        if (existingUser) {
            console.log('👤 [Stripe Success] User already exists:', existingUser.email);
            // Kullanıcının rollerini ve izinlerini çek
            const userWithRoles = await pc.user.findUnique({
                where: { id: existingUser.id },
                include: {
                    userroles: { include: { role: { include: { rolepermissions: { include: { permission: true } } } } } },
                    userpermissions: { include: { permission: true } },
                },
            });
            const roles = userWithRoles?.userroles.map(ur => ur.role.name) || [];
            const permissions = [
                ...(userWithRoles?.userpermissions.map(up => up.permission.value) || []),
                ...((userWithRoles?.userroles || []).flatMap(ur => ur.role.rolepermissions.map(rp => rp.permission.value)))
            ];
            const entitlements = Array.from(new Set(permissions));

            const jwtPayload = {
                id: existingUser.id,
                email: existingUser.email,
                firstname: existingUser.firstname,
                lastname: existingUser.lastname,
                phone: existingUser.phone,
                companyName: existingUser.companyName,
                companyLogoUrl: existingUser.companyLogoUrl,
                taxId: existingUser.taxId,
                address: existingUser.address,
                planId: existingUser.planId,
                status: existingUser.status,
                entitlements,
                permissions: entitlements,
                roles,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
                iss: env.JWT_ISS,
                aud: env.JTW_AUD,
                client_id: env.API_CLIENT_ID,
                tokentype: env.LOGIN_TOKEN_TYPE,
            };

            const loginToken = await jwtsign(jwtPayload, env.JWT_SECRET!);

            return c.json({
                accesstoken: loginToken,
                tokentype: env.JWT_TOKEN_TYPE,
                expiresin: jwtPayload.exp,
                message: 'User already exists, logged in successfully'
            });
        }

        // Yeni kullanıcı kaydı
        const subscription = session.subscription as Stripe.Subscription;
        const invoiceId = subscription?.latest_invoice as string;

        console.log('👤 [Stripe Success] Registering new user:', session.customer_email);

        const registerResult = await registerUser(
            metadata.firstname || '',
            metadata.lastname || '',
            session.customer_email,
            metadata.planId || '',
            metadata.password || 'temp_password_123', // Geçici şifre
            metadata.companyName || '',
            metadata.companyLogoUrl || '',
            metadata.taxId || '',
            metadata.address || '',
            metadata.phone || '',
            subscription?.id || '',
            session.payment_status,
            invoiceId
        );

        console.log('✅ [Stripe Success] User registered successfully');

        return c.json(registerResult);

    } catch (error) {
        console.error('❌ [Stripe Success] Error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default stripeController; 