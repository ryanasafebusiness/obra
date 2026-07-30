import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'

// Cria uma sessão do Stripe Billing Portal — trocar cartão, ver faturas e
// cancelar a subscrição, tudo gerido pela Stripe (nunca vemos dados de
// cartão).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'Ainda não tem uma subscrição associada.' }, { status: 404 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/ajustes/planos`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao contactar a Stripe.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
