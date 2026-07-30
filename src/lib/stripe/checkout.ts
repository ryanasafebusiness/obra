import type { SupabaseClient } from '@supabase/supabase-js'
import { getStripe } from './server'
import { STRIPE_PRICES, type PaidPlano } from './config'

const TRIAL_DAYS = 14

interface CreateCheckoutParams {
  supabase: SupabaseClient
  userId: string
  userEmail: string | null | undefined
  plano: PaidPlano
  origin: string
}

// Todos os planos pagos incluem 14 dias grátis (cartão pedido no checkout,
// só é cobrado no fim do trial se não for cancelado).
export async function createCheckoutSession({
  supabase,
  userId,
  userEmail,
  plano,
  origin,
}: CreateCheckoutParams): Promise<string> {
  const stripe = getStripe()

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICES[plano], quantity: 1 }],
    customer: existingSubscription?.stripe_customer_id || undefined,
    customer_email: existingSubscription?.stripe_customer_id ? undefined : userEmail || undefined,
    client_reference_id: userId,
    currency: 'eur',
    success_url: `${origin}/ajustes/planos?checkout=sucesso`,
    cancel_url: `${origin}/ajustes/planos?checkout=cancelado`,
    metadata: { user_id: userId, plano },
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { user_id: userId, plano },
    },
  })

  if (!session.url) {
    throw new Error('Não foi possível criar a sessão de pagamento.')
  }

  return session.url
}
