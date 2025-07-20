// controllers/create-checkout-session.controller.ts
import { Hono } from 'hono';
import { createCheckoutSession } from 'services/payment/create-checkout-session.service';
import { upgradeSubscription } from 'services/payment/upgrade.service';
import { downgradeSubscription } from 'services/payment/downgrade.service';
import HttpStatusCode from 'types/enums/httpstatuses';


const paymentController = new Hono();

paymentController.post('/create-checkout-session', async (c) => {
    const body = await c.req.json();
    const url = await createCheckoutSession(body);
    return c.json({ url });
});

paymentController.post('/upgrade-subscription', async (c) => {
    try {
        const body = await c.req.json();
        const { userId, newPlanId, stripeSubscriptionId } = body;
        const result = await upgradeSubscription({ userId, newPlanId, stripeSubscriptionId });
        return c.json(result);
    } catch (err: any) {
        return c.json({ error: err.message }, HttpStatusCode.BAD_REQUEST);
    }
});

paymentController.post('/downgrade-subscription', async (c) => {
    try {
        const body = await c.req.json();
        const { userId, newPlanId, stripeSubscriptionId } = body;
        const result = await downgradeSubscription({ userId, newPlanId, stripeSubscriptionId });
        return c.json(result);
    } catch (err: any) {
        return c.json({ error: err.message }, HttpStatusCode.BAD_REQUEST);
    }
});

export default paymentController;
