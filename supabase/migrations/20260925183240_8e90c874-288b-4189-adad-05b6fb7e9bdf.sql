DROP POLICY IF EXISTS "App can queue print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "App can read print jobs" ON public.print_jobs;
REVOKE ALL ON public.print_jobs FROM anon;
GRANT SELECT, INSERT ON public.print_jobs TO authenticated;
GRANT ALL ON public.print_jobs TO service_role;
CREATE POLICY "Team reads print jobs" ON public.print_jobs FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team queues print jobs" ON public.print_jobs FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "protechos read" ON storage.objects;
DROP POLICY IF EXISTS "protechos insert" ON storage.objects;
DROP POLICY IF EXISTS "protechos update" ON storage.objects;
DROP POLICY IF EXISTS "protechos delete" ON storage.objects;
CREATE POLICY "protechos team read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'protechos' AND public.is_team(auth.uid()));
CREATE POLICY "protechos team insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'protechos' AND public.is_team(auth.uid()));
CREATE POLICY "protechos team update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'protechos' AND public.is_team(auth.uid())) WITH CHECK (bucket_id = 'protechos' AND public.is_team(auth.uid()));
CREATE POLICY "protechos team delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'protechos' AND public.is_team(auth.uid()));