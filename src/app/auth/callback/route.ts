import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/checkout'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      let redirectPath = next

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plano')
          .eq('id', user.id)
          .single()

        if (!profile) {
          await supabase.from('profiles').insert({
            id: user.id,
            nome: user.user_metadata?.full_name || user.user_metadata?.nome || 'Utilizador',
            email: user.email || '',
            plano: 'gratuito',
          })
        }

        // Quem se registou a pedir logo um plano pago (trial de 14 dias)
        // só teve sessão a partir de agora — a confirmação de email
        // acabou de acontecer. Manda diretamente para o Stripe Checkout.
        const planoPretendido = user.user_metadata?.plano_pretendido
        const jaTemPlanoAtivo = profile?.plano === 'pro' || profile?.plano === 'empresa'

        if ((planoPretendido === 'pro' || planoPretendido === 'empresa') && !jaTemPlanoAtivo) {
          try {
            redirectPath = await createCheckoutSession({
              supabase,
              userId: user.id,
              userEmail: user.email,
              plano: planoPretendido,
              origin,
            })
            return NextResponse.redirect(redirectPath)
          } catch {
            // Se o checkout falhar aqui, segue para o dashboard — o
            // utilizador pode sempre iniciar o trial em Ajustes.
            redirectPath = '/dashboard'
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
