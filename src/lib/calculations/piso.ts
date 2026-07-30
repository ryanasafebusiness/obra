// Piso calculation types and logic

export interface PisoInput {
  nome: string
  cliente_id?: string
  comprimento: number
  largura: number
  tipo_piso: string
  m2_por_caixa: number
  margem_desperdicio: number // percentage, e.g. 10 for 10%
}

export interface PisoResult {
  area: number
  area_com_margem: number
  caixas_necessarias: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

export function calcularPiso(input: PisoInput): PisoResult {
  const area = input.comprimento * input.largura
  const area_com_margem = area * (1 + input.margem_desperdicio / 100)
  const caixas_necessarias = Math.ceil(area_com_margem / input.m2_por_caixa)

  const materiais = [
    {
      nome: `${input.tipo_piso} (caixas)`,
      quantidade: caixas_necessarias,
      unidade: 'cx',
      preco_estimado: caixas_necessarias * 25, // avg price per box
    },
    {
      nome: 'Cola para pavimento',
      quantidade: Math.ceil(area_com_margem / 5), // 1 saco per 5m²
      unidade: 'saco 25kg',
      preco_estimado: Math.ceil(area_com_margem / 5) * 15,
    },
    {
      nome: 'Rejunte',
      quantidade: Math.ceil(area_com_margem / 3), // 1 saco per 3m²
      unidade: 'saco 5kg',
      preco_estimado: Math.ceil(area_com_margem / 3) * 8,
    },
    {
      nome: 'Espaçadores',
      quantidade: Math.ceil(area_com_margem / 2), // 1 saco per 2m²
      unidade: 'saco',
      preco_estimado: Math.ceil(area_com_margem / 2) * 2,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    area,
    area_com_margem,
    caixas_necessarias,
    materiais,
    custo_total_materiais,
  }
}
