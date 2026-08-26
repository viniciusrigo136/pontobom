CREATE TABLE public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  printer_id text NOT NULL DEFAULT 'POS80-01',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  printed_at timestamptz,
  error text,
  created_by text
);

CREATE INDEX print_jobs_queue_idx ON public.print_jobs (printer_id, status, created_at);
CREATE INDEX print_jobs_os_idx ON public.print_jobs (os_id, created_at DESC);

GRANT SELECT, INSERT ON public.print_jobs TO anon, authenticated;
GRANT ALL ON public.print_jobs TO service_role;

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App can queue print jobs" ON public.print_jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can read print jobs" ON public.print_jobs FOR SELECT TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;
ALTER TABLE public.print_jobs REPLICA IDENTITY FULL;