// Pladur/Drywall calculation types and logic

export interface PladurInput {
  nome: string
  cliente_id?: string
  comprimento: number
  altura: number
  tipo_placa: 'standard' | 'hidrofuga' | 'fogo'
  dupla_face: boolean
}

export interface PladurResult {
  area_total: number
  materiais: {
    nome: string
    quantidade: number
    unidade: string
    preco_estimado: number
  }[]
  custo_total_materiais: number
}

export function calcularPladur(input: PladurInput): PladurResult {
  const area_total = input.comprimento * input.altura
  const multiplicador_face = input.dupla_face ? 2 : 1

  // Each plate covers ~3m² (1.2m x 2.5m)
  const area_placa = 3
  const placas = Math.ceil((area_total / area_placa) * multiplicador_face)

  // Montantes every 0.6m
  const montantes = Math.ceil(input.comprimento / 0.6) + 1
  // Top and bottom rails
  const calhas = Math.ceil(input.comprimento / 3) * 2

  // 25 screws per plate
  const parafusos_total = placas * 25
  const caixas_parafusos = Math.ceil(parafusos_total / 500)

  // Mass for joints: ~0.5kg per m² of plate
  const massa_kg = Math.ceil(area_total * multiplicador_face * 0.5)
  const sacos_massa = Math.ceil(massa_kg / 5) // sacos de 5kg

  // Joint tape: perimeter + seams
  const fita_metros = Math.ceil(area_total * 1.2) // approximate
  const rolos_fita = Math.ceil(fita_metros / 90) // rolos de 90m

  const preco_placa = input.tipo_placa === 'standard' ? 8 : input.tipo_placa === 'hidrofuga' ? 12 : 14

  const materiais = [
    {
      nome: `Placa Pladur ${input.tipo_placa}`,
      quantidade: placas,
      unidade: 'un',
      preco_estimado: placas * preco_placa,
    },
    {
      nome: 'Montante 48mm (3m)',
      quantidade: montantes,
      unidade: 'un',
      preco_estimado: montantes * 4,
    },
    {
      nome: 'Calha U 48mm (3m)',
      quantidade: calhas,
      unidade: 'un',
      preco_estimado: calhas * 3,
    },
    {
      nome: 'Parafusos Pladur',
      quantidade: caixas_parafusos,
      unidade: 'cx 500un',
      preco_estimado: caixas_parafusos * 5,
    },
    {
      nome: 'Massa para juntas (5kg)',
      quantidade: sacos_massa,
      unidade: 'saco',
      preco_estimado: sacos_massa * 10,
    },
    {
      nome: 'Fita para juntas (90m)',
      quantidade: rolos_fita,
      unidade: 'rolo',
      preco_estimado: rolos_fita * 4,
    },
  ]

  const custo_total_materiais = materiais.reduce((acc, m) => acc + m.preco_estimado, 0)

  return {
    area_total,
    materiais,
    custo_total_materiais,
  }
}
