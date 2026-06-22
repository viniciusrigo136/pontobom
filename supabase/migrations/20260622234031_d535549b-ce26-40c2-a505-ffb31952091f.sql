
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS tipo_dispositivo text NOT NULL DEFAULT 'Celular',
  ADD COLUMN IF NOT EXISTS fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS orcamento_origem_numero integer,
  ADD COLUMN IF NOT EXISTS orcamento_origem_id uuid;

ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Storage policies for protechos bucket (open access for single-tenant app)
CREATE POLICY "protechos read" ON storage.objects FOR SELECT USING (bucket_id = 'protechos');
CREATE POLICY "protechos insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'protechos');
CREATE POLICY "protechos update" ON storage.objects FOR UPDATE USING (bucket_id = 'protechos');
CREATE POLICY "protechos delete" ON storage.objects FOR DELETE USING (bucket_id = 'protechos');
