-- Rollback da Fase 1 (NÃO executar sem necessidade).
-- As policies públicas originais nunca foram removidas, então o sistema
-- volta ao estado anterior apenas removendo o que a Fase 1 adicionou.
DROP POLICY IF EXISTS "Team access clientes" ON public.clientes;
DROP POLICY IF EXISTS "Team access contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Team access empresa" ON public.empresa;
DROP POLICY IF EXISTS "Team access estoque" ON public.estoque;
DROP POLICY IF EXISTS "Team access orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Team access ordens_servico" ON public.ordens_servico;
DROP POLICY IF EXISTS "Team access pagamentos_receber" ON public.pagamentos_receber;
DROP POLICY IF EXISTS "Team access vendas" ON public.vendas;
DROP TABLE IF EXISTS public.garantia_regras;
DROP FUNCTION IF EXISTS public.is_team(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP TABLE IF EXISTS public.user_roles;
DROP TYPE IF EXISTS public.app_role;
-- No código: manter USE_SUPABASE_AUTH = false em src/lib/auth-mode.ts.
