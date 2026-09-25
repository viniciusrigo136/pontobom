CREATE TYPE public.app_role AS ENUM ('owner','staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','staff'))
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_team(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team(uuid) TO authenticated, service_role;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "Owner inserts roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "Owner updates roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "Owner deletes roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'owner'));

-- Additive team policies (public policies remain untouched in this phase)
CREATE POLICY "Team access clientes" ON public.clientes FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access empresa" ON public.empresa FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access estoque" ON public.estoque FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access orcamentos" ON public.orcamentos FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access ordens_servico" ON public.ordens_servico FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access pagamentos_receber" ON public.pagamentos_receber FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team access vendas" ON public.vendas FOR ALL TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

CREATE TABLE public.garantia_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_servico text NOT NULL,
  descricao text,
  prazo_dias integer,
  ativo boolean NOT NULL DEFAULT true,
  aprovado_bot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garantia_regras TO authenticated;
GRANT ALL ON public.garantia_regras TO service_role;
ALTER TABLE public.garantia_regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads garantia" ON public.garantia_regras FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Owner inserts garantia" ON public.garantia_regras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "Owner updates garantia" ON public.garantia_regras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "Owner deletes garantia" ON public.garantia_regras FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'owner'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER garantia_regras_updated_at BEFORE UPDATE ON public.garantia_regras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();