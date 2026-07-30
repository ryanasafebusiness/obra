-- Extends handle_new_user() to also capture profissao/telefone from signup
-- metadata. Without this, those fields were silently lost whenever email
-- confirmation is required (the client-side upsert right after signUp()
-- has no session yet, so RLS blocks it — only this SECURITY DEFINER
-- trigger can write the row at that point).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, profissao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'profissao'
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, public.profiles.nome),
    telefone = COALESCE(EXCLUDED.telefone, public.profiles.telefone),
    profissao = COALESCE(EXCLUDED.profissao, public.profiles.profissao);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
