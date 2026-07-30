import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'

function toIso(unixSeconds: number | null | undefined) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null
}

async function upsertSubscription(params: {
  userId: string
  plano: string
  status: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: number | null
  currentPeriodEnd: number | null
}) {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', params.stripeSubscriptionId)
    .maybeSingle()

  const row = {
    user_id: params.userId,
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
    plano: params.plano,
    status: params.status,
    current_period_start: toIso(params.currentPeriodStart),
    current_period_end: toIso(params.currentPeriodEnd),
  }

  if (existing) {
    await supabase.from('subscriptions').update(row).eq('id', existing.id)
  } else {
    await supabase.from('subscriptions').insert(row)
  }

  const profilePlano = params.status === 'active' || params.status === 'trialing' ? params.plano : 'gratuito'
  await supabase.from('profiles').update({ plano: profilePlano }).eq('id', params.userId)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET não configurado.' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura em falta.' }, { status: 400 })
  }

  const body = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assinatura inválida.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plano = session.metadata?.plano
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

        if (userId && plano && subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscription({
            userId,
            plano,
            status: subscription.status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: subscription.items.data[0]?.current_period_start ?? null,
            currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        const plano = subscription.metadata?.plano
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

        if (userId && plano) {
          await upsertSubscription({
            userId,
            plano,
            status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: subscription.items.data[0]?.current_period_start ?? null,
            currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
          })
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error)
    return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
