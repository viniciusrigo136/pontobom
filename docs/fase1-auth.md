# Fase 1 — Autenticação real em paralelo

Status: preparada, DESLIGADA (`USE_SUPABASE_AUTH = false` em `src/lib/auth-mode.ts`).

## O que existe
- Papéis `owner`/`staff` em `public.user_roles`; funções `has_role` e `is_team` (security definer).
- Policies "Team access ..." adicionais para `authenticated` com papel. Policies públicas originais intactas.
- `print_jobs` e storage `protechos` sem alterações. Endpoints da impressora usam token próprio + cliente admin (não dependem de RLS).
- `garantia_regras`: equipe lê, owner edita. Nada migrado de OS/vendas.
- Cadastro público desligado; e-mail/senha ligado; checagem de senha vazada ligada.
- Rotas `/auth` e `/reset-password`; `AuthGate` escolhe entre login antigo e novo pela flag.

## Criar o primeiro owner (manual)
1. Cloud → Users → "Add user": e-mail real do dono + senha forte (marcar como confirmado).
2. Copiar o UUID do usuário criado.
3. Executar no backend (SQL, pelo agente ou Cloud):
   `INSERT INTO public.user_roles (user_id, role) VALUES ('<UUID>', 'owner');`
4. Funcionários: mesmo processo com `'staff'` (ou o owner insere depois).

## Ativar
1. Owner criado e testado em `/auth`.
2. Mudar `USE_SUPABASE_AUTH` para `true`, testar no preview, depois publicar.
3. Rollback imediato: voltar a flag para `false`.

## Fase 2 (não feita)
- Remover policies públicas das tabelas e de `print_jobs` (manter authenticated).
- Storage `protechos`: policies só para equipe; trocar URLs assinadas longas por caminho + URL curta.

## Rollback do banco
`supabase/rollback/fase1_rollback.sql`.
