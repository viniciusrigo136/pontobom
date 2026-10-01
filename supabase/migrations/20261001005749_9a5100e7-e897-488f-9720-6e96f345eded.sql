DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clientes','contas_receber','empresa','estoque','orcamentos','ordens_servico','pagamentos_receber','vendas','garantia_regras'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('CREATE POLICY "Public open %s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
GRANT SELECT, INSERT ON public.print_jobs TO anon, authenticated;
CREATE POLICY "Public reads print jobs" ON public.print_jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public queues print jobs" ON public.print_jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "protechos public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'protechos');
CREATE POLICY "protechos public insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'protechos');
CREATE POLICY "protechos public update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'protechos') WITH CHECK (bucket_id = 'protechos');
CREATE POLICY "protechos public delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'protechos');