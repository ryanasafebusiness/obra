import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'
import { STRIPE_PRICES, type PaidPlano } from '@/lib/stripe/config'

export async function POST(request: Request) {
  const { plano } = (await request.json()) as { plano?: string }

  if (plano !== 'pro' && plano !== 'empresa') {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  }

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const stripe = getStripe()
  const origin = request.headers.get('origin') || new URL(request.url).origin

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICES[plano as PaidPlano], quantity: 1 }],
      customer: existingSubscription?.stripe_customer_id || undefined,
      customer_email: existingSubscription?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      currency: 'eur',
      success_url: `${origin}/ajustes?checkout=sucesso`,
      cancel_url: `${origin}/ajustes?checkout=cancelado`,
      metadata: {
        user_id: user.id,
        plano,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plano,
        },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Não foi possível criar a sessão de pagamento.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao contactar a Stripe.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
