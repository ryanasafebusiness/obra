import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente com a service role key — só para uso em rotas server-side de
// confiança (ex: webhooks) que precisam de escrever sem uma sessão de
// utilizador associada. Nunca importar isto num componente cliente.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role não está configurada.')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
