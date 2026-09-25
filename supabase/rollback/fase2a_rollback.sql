-- Rollback da Fase 2A: recria exatamente as policies públicas removidas
-- e devolve os privilégios de anon. Executar só se houver bloqueio.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes, public.contas_receber, public.empresa, public.estoque, public.orcamentos, public.ordens_servico, public.pagamentos_receber, public.vendas TO anon;
CREATE POLICY "Public access clientes" ON public.clientes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access contas_receber" ON public.contas_receber FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access empresa" ON public.empresa FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access estoque" ON public.estoque FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access orc" ON public.orcamentos FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access os" ON public.ordens_servico FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access pagamentos_receber" ON public.pagamentos_receber FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access vendas" ON public.vendas FOR ALL TO public USING (true) WITH CHECK (true);
