-- Rollback Fase 2B: recria as policies públicas originais (print_jobs e storage protechos)
DROP POLICY IF EXISTS "Team reads print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Team queues print jobs" ON public.print_jobs;
CREATE POLICY "App can queue print jobs" ON public.print_jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can read print jobs" ON public.print_jobs FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT, INSERT ON public.print_jobs TO anon;

DROP POLICY IF EXISTS "protechos team read" ON storage.objects;
DROP POLICY IF EXISTS "protechos team insert" ON storage.objects;
DROP POLICY IF EXISTS "protechos team update" ON storage.objects;
DROP POLICY IF EXISTS "protechos team delete" ON storage.objects;
CREATE POLICY "protechos read" ON storage.objects FOR SELECT USING (bucket_id = 'protechos');
CREATE POLICY "protechos insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'protechos');
CREATE POLICY "protechos update" ON storage.objects FOR UPDATE USING (bucket_id = 'protechos');
CREATE POLICY "protechos delete" ON storage.objects FOR DELETE USING (bucket_id = 'protechos');
