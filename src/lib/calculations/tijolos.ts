// Tijolos/Blocos calculation types and logic

export interface TijolosInput {
  nome: string
  cliente_id?: string
  comprimento_parede: number
  altura_parede: number
  tipo_bloco: string // id from BLOCK_TYPES
  blocos_por_m2: number
  margem_desperdicio: number
}

export interface TijolosResult {
  area_parede: number
  quantidade_blocos: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

export function calcularTijolos(input: TijolosInput): TijolosResult {
  const area_parede = input.comprimento_parede * input.altura_parede
  const area_com_margem = area_parede * (1 + input.margem_desperdicio / 100)
  const quantidade_blocos = Math.ceil(area_com_margem * input.blocos_por_m2)

  // For mortar: ~25kg cement per m² of wall, ~0.03m³ sand per m²
  const sacos_cimento = Math.ceil((area_com_margem * 12) / 25) // 12kg per m², sacos de 25kg
  const areia_m3 = Math.ceil(area_com_margem * 0.03 * 10) / 10

  const materiais = [
    {
      nome: `Blocos ${input.tipo_bloco}`,
      quantidade: quantidade_blocos,
      unidade: 'un',
      preco_estimado: quantidade_blocos * 0.6, // avg price per block
    },
    {
      nome: 'Cimento para argamassa (25kg)',
      quantidade: sacos_cimento,
      unidade: 'saco',
      preco_estimado: sacos_cimento * 6,
    },
    {
      nome: 'Areia',
      quantidade: areia_m3,
      unidade: 'm³',
      preco_estimado: Math.ceil(areia_m3) * 30,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    area_parede,
    quantidade_blocos,
    materiais,
    custo_total_materiais,
  }
}
