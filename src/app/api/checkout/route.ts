import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/checkout'

export async function POST(request: Request) {
  const { plano } = (await request.json()) as { plano?: string }

  if (plano !== 'pro') {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  try {
    const url = await createCheckoutSession({
      supabase,
      userId: user.id,
      userEmail: user.email,
      plano,
      origin,
    })

    return NextResponse.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao contactar a Stripe.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
