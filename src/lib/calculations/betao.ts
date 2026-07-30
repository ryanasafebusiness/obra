// Betão calculation types and logic

export interface BetaoInput {
  nome: string
  cliente_id?: string
  comprimento: number
  largura: number
  altura: number // profundidade
  tipo_betao: string // standard ratio
}

// Preços por unidade — vêm da tabela `materials` quando disponíveis.
export interface BetaoPrecos {
  cimento_saco?: number
  areia_m3?: number
  brita_m3?: number
}

export interface BetaoResult {
  volume_m3: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

// Standard concrete mix ratio 1:2:3 (cement:sand:gravel)
// For 1m³ of concrete: ~350kg cement, 0.5m³ sand, 0.8m³ gravel, ~175L water
export function calcularBetao(input: BetaoInput, precos: BetaoPrecos = {}): BetaoResult {
  const volume_m3 = input.comprimento * input.largura * input.altura

  // Add 10% waste margin
  const volume_com_margem = volume_m3 * 1.10

  const sacos_cimento = Math.ceil((volume_com_margem * 350) / 25) // sacos de 25kg
  const areia_m3 = Math.ceil(volume_com_margem * 0.5 * 10) / 10
  const brita_m3 = Math.ceil(volume_com_margem * 0.8 * 10) / 10
  const agua_litros = Math.ceil(volume_com_margem * 175)

  const precoCimento = precos.cimento_saco ?? 6
  const precoAreia = precos.areia_m3 ?? 30
  const precoBrita = precos.brita_m3 ?? 35

  const materiais = [
    {
      nome: 'Cimento CEM II (25kg)',
      quantidade: sacos_cimento,
      unidade: 'saco',
      preco_estimado: sacos_cimento * precoCimento,
    },
    {
      nome: 'Areia',
      quantidade: areia_m3,
      unidade: 'm³',
      preco_estimado: Math.ceil(areia_m3) * precoAreia,
    },
    {
      nome: 'Brita',
      quantidade: brita_m3,
      unidade: 'm³',
      preco_estimado: Math.ceil(brita_m3) * precoBrita,
    },
    {
      nome: 'Água',
      quantidade: agua_litros,
      unidade: 'L',
      preco_estimado: 0,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    volume_m3,
    materiais,
    custo_total_materiais,
  }
}
