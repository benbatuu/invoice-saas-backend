import Stripe from 'stripe';
import { env } from 'bun';
import pc from 'helpers/prismaclient.singleton';
import type StripeType from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });

/**
 * Kullanıcıyı daha düşük bir plana geçirir (downgrade)
 * @param userId Kullanıcı ID
 * @param newPlanId Yeni plan ID
 * @param stripeSubscriptionId Stripe subscription ID
 * @returns Güncellenmiş subscription bilgisi
 */
export const downgradeSubscription = async ({ userId, newPlanId, stripeSubscriptionId }: {
  userId: string,
  newPlanId: string,
  stripeSubscriptionId: string
}) => {
  // Yeni planı bul
  const newPlan = await pc.plan.findUnique({ where: { id: newPlanId } });
  if (!newPlan) throw new Error('Plan not found');
  if (!newPlan.stripePriceId) throw new Error('Plan is missing stripePriceId');

  // Stripe'da subscription'ı downgrade et (bir sonraki dönem için)
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) throw new Error('Subscription item not found');

  const updatedSub = await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{
      id: itemId,
      price: newPlan.stripePriceId,
    }],
    proration_behavior: 'none', // Downgrade bir sonraki dönemde geçerli olur
    cancel_at_period_end: false,
  }) as StripeType.Subscription;

  // Veritabanında subscription'ı güncelle
  await pc.subscription.updateMany({
    where: { userId, stripeId: stripeSubscriptionId },
    data: {
      planId: newPlanId,
      status: 'active',
      endedat: (updatedSub as any).current_period_end ? new Date((updatedSub as any).current_period_end * 1000) : null,
    },
  });

  // Kullanıcı kaydında da planId güncelle
  await pc.user.update({ where: { id: userId }, data: { planId: newPlanId } });

  return { success: true, stripeSubscription: updatedSub };
}; 