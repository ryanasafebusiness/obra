import type { SupabaseClient } from '@supabase/supabase-js'
import type { Calculation } from '@/types/database'
import { resolveProjectId } from '@/lib/projects'

interface SaveCalculationParams {
  tipo: Calculation['tipo']
  nome: string
  dados: Record<string, unknown>
  resultado: unknown
  projetoId?: string
  novaObraNome?: string
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

  let projectId: string | null = null
  if (params.projetoId) {
    const resolved = await resolveProjectId(supabase, user.id, {
      projetoId: params.projetoId,
      novaObraNome: params.novaObraNome || '',
    })
    if (resolved.error) {
      return { error: resolved.error }
    }
    projectId = resolved.projectId
  }

  const { error: calcError } = await supabase.from('calculations').insert({
    user_id: user.id,
    project_id: projectId,
    tipo: params.tipo,
    nome: params.nome,
    dados: params.dados,
    resultado: params.resultado,
  })

  if (calcError) {
    return { error: calcError.message }
  }

  // Also create a Draft Budget automatically
  const res = params.resultado as any
  if (res && Array.isArray(res.materiais)) {
    const itens = res.materiais.map((m: any) => {
      const precoUnitario = m.quantidade > 0 ? m.preco_estimado / m.quantidade : 0
      return {
        descricao: m.nome,
        quantidade: m.quantidade,
        unidade: m.unidade,
        preco_unitario: Number(precoUnitario.toFixed(2)),
        total: m.preco_estimado,
      }
    })

    const materiais_total = res.custo_total_materiais || 0
    const iva = materiais_total * 0.23
    const total = materiais_total + iva

    const date = new Date()
    const numero = `ORC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

    const { error: budgetError } = await supabase.from('budgets').insert({
      user_id: user.id,
      project_id: projectId,
      numero: numero,
      itens: itens,
      mao_de_obra: 0,
      materiais_total: materiais_total,
      iva: 23,
      total: total,
      notas: `Gerado automaticamente a partir da calculadora de ${params.tipo}.`,
      status: 'rascunho',
    })

    if (budgetError) {
      console.error('Failed to create budget draft:', budgetError)
      // We don't block the user, since the calculation was saved, but we could return the error.
      // Let's silently fail or log it, so it doesn't break the UI.
    }
  }

  return { error: null }
}
