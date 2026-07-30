import type { SupabaseClient } from '@supabase/supabase-js'

// Valor especial usado nos <select> de obra para significar "criar uma obra
// nova" em vez de escolher uma existente — partilhado entre orçamentos e
// calculadoras para que o comportamento seja sempre o mesmo.
export const NOVA_OBRA_VALUE = '__nova__'

interface ProjectSelection {
  projetoId: string
  novaObraNome: string
  clienteId?: string | null
}

// Resolve a seleção de obra de um formulário num project_id real: se o
// utilizador escolheu "+ Criar nova obra", cria-a agora; caso contrário
// devolve o id escolhido (ou null se não associou a nenhuma).
export async function resolveProjectId(
  supabase: SupabaseClient,
  userId: string,
  selection: ProjectSelection
): Promise<{ projectId: string | null; error: string | null }> {
  if (selection.projetoId !== NOVA_OBRA_VALUE) {
    return { projectId: selection.projetoId || null, error: null }
  }

  const nome = selection.novaObraNome.trim()
  if (!nome) {
    return { projectId: null, error: 'Indique o nome da nova obra.' }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, nome, client_id: selection.clienteId || null })
    .select('id')
    .single()

  if (error) {
    return { projectId: null, error: error.message }
  }

  return { projectId: data.id as string, error: null }
}
