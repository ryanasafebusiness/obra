// Calculator modules
export const CALCULATOR_MODULES = [
  {
    id: 'pintura',
    nome: 'Pintura',
    emoji: '🎨',
    descricao: 'Calcular tinta, rolos e materiais',
    href: '/calcular/pintura',
    cor: 'from-orange-500 to-amber-500',
  },
  {
    id: 'piso',
    nome: 'Piso',
    emoji: '🧱',
    descricao: 'Pavimento, caixas e cola',
    href: '/calcular/piso',
    cor: 'from-stone-500 to-stone-700',
  },
  {
    id: 'azulejo',
    nome: 'Azulejo',
    emoji: '🪨',
    descricao: 'Revestimento, peças e rejunte',
    href: '/calcular/azulejo',
    cor: 'from-sky-500 to-blue-600',
  },
  {
    id: 'betao',
    nome: 'Betão',
    emoji: '🏗️',
    descricao: 'Cimento, areia e brita',
    href: '/calcular/betao',
    cor: 'from-gray-500 to-gray-700',
  },
  {
    id: 'tijolos',
    nome: 'Tijolos',
    emoji: '🧱',
    descricao: 'Blocos, cimento e argamassa',
    href: '/calcular/tijolos',
    cor: 'from-red-500 to-red-700',
  },
  {
    id: 'pladur',
    nome: 'Pladur',
    emoji: '🪵',
    descricao: 'Placas, perfis e parafusos',
    href: '/calcular/pladur',
    cor: 'from-emerald-500 to-green-700',
  },
] as const

// Dashboard quick action cards
export const DASHBOARD_CARDS = [
  ...CALCULATOR_MODULES,
  {
    id: 'orcamentos',
    nome: 'Orçamentos',
    emoji: '📄',
    descricao: 'Criar e gerir orçamentos',
    href: '/orcamentos',
    cor: 'from-violet-500 to-purple-700',
  },
  {
    id: 'clientes',
    nome: 'Clientes',
    emoji: '👥',
    descricao: 'Gerir clientes e contactos',
    href: '/clientes',
    cor: 'from-pink-500 to-rose-700',
  },
] as const

// Project status options
export const PROJECT_STATUS = {
  orcamento: { label: 'Orçamento', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800' },
  em_andamento: { label: 'Em andamento', emoji: '🔵', color: 'bg-blue-100 text-blue-800' },
  finalizada: { label: 'Finalizada', emoji: '🟢', color: 'bg-green-100 text-green-800' },
} as const

// Budget status options
export const BUDGET_STATUS = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  aceite: { label: 'Aceite', color: 'bg-green-100 text-green-800' },
  recusado: { label: 'Recusado', color: 'bg-red-100 text-red-800' },
} as const

// Professions list
export const PROFISSOES = [
  'Pintor',
  'Pedreiro',
  'Canalizador',
  'Eletricista',
  'Empreiteiro',
  'Remodelador',
  'Estucador',
  'Ladrilhador',
  'Carpinteiro',
  'Outro',
] as const

// Default material prices (Portugal market)
export const DEFAULT_MATERIALS = {
  pintura: {
    tinta_interior: { nome: 'Tinta Interior (CIN/Barbot)', preco: 35, unidade: 'L', rendimento: 10 },
    tinta_exterior: { nome: 'Tinta Exterior', preco: 45, unidade: 'L', rendimento: 8 },
    primario: { nome: 'Primário', preco: 25, unidade: 'L', rendimento: 12 },
    rolo: { nome: 'Rolo de pintura', preco: 5, unidade: 'un' },
    pincel: { nome: 'Pincel', preco: 3, unidade: 'un' },
    fita: { nome: 'Fita de proteção', preco: 3, unidade: 'rolo' },
    plastico: { nome: 'Plástico de proteção', preco: 4, unidade: 'rolo' },
  },
  piso: {
    cola: { nome: 'Cola para pavimento', preco: 15, unidade: 'saco 25kg', rendimento: 5 },
    rejunte: { nome: 'Rejunte', preco: 8, unidade: 'saco 5kg', rendimento: 3 },
    espacadores: { nome: 'Espaçadores', preco: 2, unidade: 'saco 100un' },
  },
  betao: {
    cimento: { nome: 'Cimento CEM II', preco: 6, unidade: 'saco 25kg' },
    areia: { nome: 'Areia', preco: 30, unidade: 'm³' },
    brita: { nome: 'Brita', preco: 35, unidade: 'm³' },
  },
  pladur: {
    placa_standard: { nome: 'Placa Pladur Standard', preco: 8, unidade: 'un', area: 3 },
    placa_hidrofuga: { nome: 'Placa Pladur Hidrófuga', preco: 12, unidade: 'un', area: 3 },
    montante: { nome: 'Montante 48mm', preco: 4, unidade: 'un' },
    calha: { nome: 'Calha U 48mm', preco: 3, unidade: 'un' },
    parafusos: { nome: 'Parafusos Pladur', preco: 5, unidade: 'caixa 500un' },
    massa: { nome: 'Massa para juntas', preco: 10, unidade: 'saco 5kg' },
    fita_juntas: { nome: 'Fita para juntas', preco: 4, unidade: 'rolo 90m' },
  },
} as const

// Block types for masonry calculation
export const BLOCK_TYPES = [
  { id: '7cm', nome: 'Tijolo 7cm', largura: 0.07, altura: 0.20, comprimento: 0.30, por_m2: 17 },
  { id: '9cm', nome: 'Tijolo 9cm', largura: 0.09, altura: 0.20, comprimento: 0.30, por_m2: 17 },
  { id: '11cm', nome: 'Tijolo 11cm', largura: 0.11, altura: 0.20, comprimento: 0.30, por_m2: 17 },
  { id: '15cm', nome: 'Tijolo 15cm', largura: 0.15, altura: 0.20, comprimento: 0.30, por_m2: 17 },
  { id: '20cm', nome: 'Bloco 20cm', largura: 0.20, altura: 0.20, comprimento: 0.40, por_m2: 13 },
] as const
