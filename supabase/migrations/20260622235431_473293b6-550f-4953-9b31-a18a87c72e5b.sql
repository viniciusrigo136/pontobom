ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS app_titulo text,
  ADD COLUMN IF NOT EXISTS app_subtitulo text,
  ADD COLUMN IF NOT EXISTS app_logo_url text;