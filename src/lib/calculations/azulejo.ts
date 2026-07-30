// Azulejo/Revestimento calculation types and logic

export interface AzulejoInput {
  nome: string
  cliente_id?: string
  comprimento_parede: number
  altura_parede: number
  quantidade_paredes: number
  largura_peca: number // cm
  altura_peca: number // cm
  pecas_por_caixa: number
  margem_desperdicio: number // percentage
}

export interface AzulejoResult {
  area_total: number
  area_com_margem: number
  pecas_necessarias: number
  caixas_necessarias: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

export function calcularAzulejo(input: AzulejoInput): AzulejoResult {
  const area_total = input.comprimento_parede * input.altura_parede * input.quantidade_paredes
  const area_com_margem = area_total * (1 + input.margem_desperdicio / 100)

  // Area per piece in m²
  const area_peca = (input.largura_peca / 100) * (input.altura_peca / 100)
  const pecas_necessarias = Math.ceil(area_com_margem / area_peca)
  const caixas_necessarias = Math.ceil(pecas_necessarias / input.pecas_por_caixa)

  const materiais = [
    {
      nome: 'Azulejos (caixas)',
      quantidade: caixas_necessarias,
      unidade: 'cx',
      preco_estimado: caixas_necessarias * 20,
    },
    {
      nome: 'Cola para azulejo',
      quantidade: Math.ceil(area_com_margem / 4), // 1 saco per 4m²
      unidade: 'saco 25kg',
      preco_estimado: Math.ceil(area_com_margem / 4) * 12,
    },
    {
      nome: 'Rejunte',
      quantidade: Math.ceil(area_com_margem / 4),
      unidade: 'saco 5kg',
      preco_estimado: Math.ceil(area_com_margem / 4) * 8,
    },
    {
      nome: 'Espaçadores',
      quantidade: Math.ceil(pecas_necessarias / 100),
      unidade: 'saco 100un',
      preco_estimado: Math.ceil(pecas_necessarias / 100) * 2,
    },
    {
      nome: 'Cruzetas',
      quantidade: Math.ceil(pecas_necessarias / 50),
      unidade: 'saco 50un',
      preco_estimado: Math.ceil(pecas_necessarias / 50) * 3,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    area_total,
    area_com_margem,
    pecas_necessarias,
    caixas_necessarias,
    materiais,
    custo_total_materiais,
  }
}
