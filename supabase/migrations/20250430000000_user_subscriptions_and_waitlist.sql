
-- Tabela de Assinaturas
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' NOT NULL, -- free, pro
  status TEXT DEFAULT 'active' NOT NULL, -- active, trialing, past_due, canceled
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar e editar sua assinatura"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela de Lista de Espera para o Plano Pro
CREATE TABLE public.pro_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  origin TEXT DEFAULT 'landing' NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pro_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem registrar interesse"
  ON public.pro_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Ajuste em profiles para slug público
ALTER TABLE public.profiles
ADD COLUMN slug TEXT UNIQUE;

-- Ajuste em appointments
ALTER TABLE public.appointments
ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancellation_reason TEXT;

-- Trigger para atualizar o campo updated_at na tabela user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
