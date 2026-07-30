import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip proxy if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/calcular', '/clientes', '/orcamentos', '/ajustes', '/obras']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rotas que exigem plano ativo (trial ou pago) — /ajustes fica de fora
  // porque é lá que o utilizador ativa o trial.
  const planGatedPaths = ['/dashboard', '/calcular', '/clientes', '/orcamentos', '/obras']
  const isPlanGatedPath = planGatedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isPlanGatedPath && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.plano !== 'pro') {
      const url = request.nextUrl.clone()
      url.pathname = '/ajustes/planos'
      url.searchParams.set('trial', 'necessario')
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/registro']
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
