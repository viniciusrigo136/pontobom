CREATE TABLE public.os_acompanhamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL UNIQUE REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  mostrar_defeito boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.os_atualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  status text,
  observacao text,
  publico boolean NOT NULL DEFAULT false,
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  editado_em timestamptz
);
CREATE INDEX os_atualizacoes_os_idx ON public.os_atualizacoes(os_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_acompanhamento, public.os_atualizacoes TO anon, authenticated;
GRANT ALL ON public.os_acompanhamento, public.os_atualizacoes TO service_role;
ALTER TABLE public.os_acompanhamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_atualizacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public open os_acompanhamento" ON public.os_acompanhamento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public open os_atualizacoes" ON public.os_atualizacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);