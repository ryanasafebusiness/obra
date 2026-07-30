-- ObraCalc PT - Initial Database Schema
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  profissao TEXT,
  empresa TEXT,
  nif TEXT,
  plano TEXT NOT NULL DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'pro', 'empresa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  morada TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROJECTS (Obras)
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo_servico TEXT,
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'orcamento' CHECK (status IN ('orcamento', 'em_andamento', 'finalizada')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CALCULATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pintura', 'piso', 'azulejo', 'betao', 'tijolos', 'pladur')),
  nome TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}',
  resultado JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX idx_calculations_tipo ON public.calculations(tipo);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations"
  ON public.calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
  ON public.calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculations"
  ON public.calculations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
  ON public.calculations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MATERIALS (shared, read-only for users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade TEXT NOT NULL,
  rendimento DECIMAL,
  preco_medio DECIMAL,
  marca TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view materials"
  ON public.materials FOR SELECT
  USING (true);

-- ============================================
-- BUDGETS (Orçamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  mao_de_obra DECIMAL NOT NULL DEFAULT 0,
  materiais_total DECIMAL NOT NULL DEFAULT 0,
  desconto DECIMAL NOT NULL DEFAULT 0,
  iva DECIMAL NOT NULL DEFAULT 23,
  total DECIMAL NOT NULL DEFAULT 0,
  notas TEXT,
  validade DATE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aceite', 'recusado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_client_id ON public.budgets(client_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plano TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- SEED: Portuguese construction materials
-- ============================================
INSERT INTO public.materials (nome, categoria, unidade, rendimento, preco_medio, marca) VALUES
-- Tintas
('Tinta Interior Branca', 'pintura', 'L', 10, 7.00, 'CIN'),
('Tinta Interior Branca', 'pintura', 'L', 10, 6.50, 'Robbialac'),
('Tinta Interior Branca', 'pintura', 'L', 10, 6.00, 'Barbot'),
('Tinta Exterior', 'pintura', 'L', 8, 9.00, 'CIN'),
('Tinta Exterior', 'pintura', 'L', 8, 8.50, 'Robbialac'),
('Primário Universal', 'pintura', 'L', 12, 5.00, NULL),
('Rolo de Pintura 25cm', 'pintura', 'un', NULL, 5.00, NULL),
('Pincel 50mm', 'pintura', 'un', NULL, 3.00, NULL),
('Fita de Proteção 50m', 'pintura', 'rolo', NULL, 3.00, NULL),
('Plástico Proteção 4x5m', 'pintura', 'un', NULL, 4.00, NULL),
-- Pavimentos
('Cerâmico 45x45', 'piso', 'm²', NULL, 15.00, NULL),
('Porcelânico 60x60', 'piso', 'm²', NULL, 22.00, NULL),
('Flutuante AC4', 'piso', 'm²', NULL, 12.00, NULL),
('Vinílico Click', 'piso', 'm²', NULL, 18.00, NULL),
('Cola Pavimento', 'piso', 'saco 25kg', 5, 15.00, 'Weber'),
('Rejunte Cimentício', 'piso', 'saco 5kg', 3, 8.00, 'Mapei'),
('Espaçadores 3mm', 'piso', 'saco 100un', NULL, 2.00, NULL),
-- Cimento e Betão
('Cimento CEM II 25kg', 'betao', 'saco', NULL, 6.00, 'Secil'),
('Cimento CEM I 25kg', 'betao', 'saco', NULL, 7.00, 'Cimpor'),
('Areia Lavada', 'betao', 'm³', NULL, 30.00, NULL),
('Brita Calcária', 'betao', 'm³', NULL, 35.00, NULL),
-- Alvenaria
('Tijolo 7cm', 'tijolos', 'un', NULL, 0.45, NULL),
('Tijolo 9cm', 'tijolos', 'un', NULL, 0.50, NULL),
('Tijolo 11cm', 'tijolos', 'un', NULL, 0.55, NULL),
('Tijolo 15cm', 'tijolos', 'un', NULL, 0.65, NULL),
('Bloco 20cm', 'tijolos', 'un', NULL, 0.85, NULL),
-- Pladur
('Placa Pladur Standard BA13', 'pladur', 'un', NULL, 8.00, 'Knauf'),
('Placa Pladur Hidrófuga', 'pladur', 'un', NULL, 12.00, 'Knauf'),
('Placa Pladur Resistente Fogo', 'pladur', 'un', NULL, 14.00, 'Knauf'),
('Montante 48mm 3m', 'pladur', 'un', NULL, 4.00, NULL),
('Calha U 48mm 3m', 'pladur', 'un', NULL, 3.00, NULL),
('Parafusos Pladur', 'pladur', 'cx 500un', NULL, 5.00, NULL),
('Massa Juntas 5kg', 'pladur', 'saco', NULL, 10.00, 'Knauf'),
('Fita Juntas 90m', 'pladur', 'rolo', NULL, 4.00, NULL),
-- Azulejos
('Azulejo 30x60 Branco', 'azulejo', 'm²', NULL, 12.00, NULL),
('Azulejo 20x20 Metro', 'azulejo', 'm²', NULL, 18.00, NULL),
('Cola Azulejo C2', 'azulejo', 'saco 25kg', 4, 12.00, 'Weber'),
('Rejunte Epóxi', 'azulejo', 'saco 5kg', NULL, 15.00, 'Mapei')
ON CONFLICT DO NOTHING;
