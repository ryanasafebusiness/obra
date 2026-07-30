import type { SupabaseClient } from '@supabase/supabase-js'

export interface MaterialPreco {
  nome: string
  preco_medio: number | null
}

// Uma leitura por calculadora — todos os preços da categoria de uma vez,
// para depois filtrar em memória por termo (evita N pedidos separados).
export async function fetchPrecosCategoria(
  supabase: SupabaseClient,
  categoria: string
): Promise<MaterialPreco[]> {
  const { data } = await supabase
    .from('materials')
    .select('nome, preco_medio')
    .eq('categoria', categoria)

  return data || []
}

// Média dos preços cujo nome contém o termo (case-insensitive, sem
// acentuação sensível). Cai para o valor por omissão quando não há nenhum
// material correspondente na tabela — mantém a calculadora a funcionar
// mesmo sem dados de preço reais para aquele item.
export function precoMedioPorTermo(precos: MaterialPreco[], termo: string, fallback: number): number {
  const termoLower = termo.toLowerCase()
  const matches = precos.filter(
    (p) => p.preco_medio != null && p.nome.toLowerCase().includes(termoLower)
  )
  if (matches.length === 0) return fallback
  return matches.reduce((sum, m) => sum + Number(m.preco_medio), 0) / matches.length
}
