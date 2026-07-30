// Pintura calculation types and logic

export interface PinturaInput {
  nome: string
  cliente_id?: string
  comprimento: number
  altura: number
  quantidade_paredes: number
  area_portas: number
  area_janelas: number
  demaos: number
  rendimento: number // m²/L
}

export interface PinturaResult {
  area_bruta: number
  area_descontada: number
  area_total: number
  litros_necessarios: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

// Tinta não se compra ao litro avulso — vende-se em baldes/galões. Assume-se
// o formato mais comum no retalho português para tinta de interior (15L).
const BALDE_TINTA_L = 15

export function calcularPintura(input: PinturaInput): PinturaResult {
  const area_bruta = input.comprimento * input.altura * input.quantidade_paredes
  const area_descontada = input.area_portas + input.area_janelas
  const area_total = area_bruta - area_descontada
  const litros_necessarios = (area_total / input.rendimento) * input.demaos

  // Round up to nearest liter
  const litros = Math.ceil(litros_necessarios)
  const baldes_tinta = Math.ceil(litros / BALDE_TINTA_L)

  const materiais = [
    {
      nome: 'Tinta',
      quantidade: baldes_tinta,
      unidade: `balde ${BALDE_TINTA_L}L`,
      preco_estimado: baldes_tinta * BALDE_TINTA_L * 7, // ~7€/L average
    },
    {
      nome: 'Rolo de pintura',
      quantidade: Math.ceil(area_total / 50), // 1 rolo per 50m²
      unidade: 'un',
      preco_estimado: Math.ceil(area_total / 50) * 5,
    },
    {
      nome: 'Pincel',
      quantidade: 2,
      unidade: 'un',
      preco_estimado: 6,
    },
    {
      nome: 'Fita de proteção',
      quantidade: Math.ceil(area_total / 20), // 1 rolo per 20m²
      unidade: 'rolo',
      preco_estimado: Math.ceil(area_total / 20) * 3,
    },
    {
      nome: 'Plástico de proteção',
      quantidade: Math.ceil(area_total / 25),
      unidade: 'rolo',
      preco_estimado: Math.ceil(area_total / 25) * 4,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    area_bruta,
    area_descontada,
    area_total,
    litros_necessarios: litros,
    materiais,
    custo_total_materiais,
  }
}
