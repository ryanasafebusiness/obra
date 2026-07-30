import type { SupabaseClient } from '@supabase/supabase-js'
import type { Calculation } from '@/types/database'

interface SaveCalculationParams {
  tipo: Calculation['tipo']
  nome: string
  dados: Record<string, unknown>
  resultado: unknown
}

// Shared by all calculator pages so the "guardar" flow behaves the same
// everywhere: always clears the saving state, and surfaces auth/insert
// errors instead of failing silently.
export async function saveCalculation(
  supabase: SupabaseClient,
  params: SaveCalculationParams
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sessão expirada. Inicie sessão novamente.' }
  }

  const { error } = await supabase.from('calculations').insert({
    user_id: user.id,
    tipo: params.tipo,
    nome: params.nome,
    dados: params.dados,
    resultado: params.resultado,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
