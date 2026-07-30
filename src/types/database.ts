// Database types matching Supabase schema

export interface Profile {
  id: string
  nome: string
  email: string
  telefone: string | null
  profissao: string | null
  empresa: string | null
  nif: string | null
  plano: 'gratuito' | 'pro' | 'empresa'
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  nome: string
  telefone: string | null
  email: string | null
  morada: string | null
  notas: string | null
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id: string | null
  nome: string
  tipo_servico: string | null
  data_inicio: string | null
  data_fim: string | null
  status: 'orcamento' | 'em_andamento' | 'finalizada'
  notas: string | null
  created_at: string
  client?: Client
}

export interface Calculation {
  id: string
  user_id: string
  project_id: string | null
  client_id: string | null
  tipo: 'pintura' | 'piso' | 'azulejo' | 'betao' | 'tijolos' | 'pladur'
  nome: string
  dados: Record<string, unknown>
  resultado: Record<string, unknown>
  created_at: string
  client?: Client
}

export interface Material {
  id: string
  nome: string
  categoria: string
  unidade: string
  rendimento: number | null
  preco_medio: number | null
  marca: string | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  project_id: string | null
  client_id: string | null
  numero: string
  itens: BudgetItem[]
  mao_de_obra: number
  materiais_total: number
  desconto: number
  iva: number
  total: number
  notas: string | null
  validade: string | null
  status: 'rascunho' | 'enviado' | 'aceite' | 'recusado'
  created_at: string
  client?: Client
}

export interface BudgetItem {
  descricao: string
  quantidade: number
  unidade: string
  preco_unitario: number
  total: number
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plano: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}
