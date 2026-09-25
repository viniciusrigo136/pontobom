## PontoBom OS — Segurança antes do bot (plano técnico, nada será alterado agora)

### Estado atual verificado
- Login: `LoginGate` com usuário/senha fixos no código do navegador e flag em `localStorage`. Não é autenticação real; qualquer pessoa com a chave pública do app acessa o banco diretamente.
- Banco: `clientes`, `contas_receber`, `empresa`, `estoque`, `orcamentos`, `ordens_servico`, `pagamentos_receber`, `vendas` têm policy `ALL` para `public` (leitura e escrita abertas).
- `print_jobs`: leitura/inserção para `anon, authenticated`; sem update/delete.
- Storage `protechos` (privado): select/insert/update/delete abertos para `public`. Fotos usam URLs assinadas de 5 anos salvas em `ordens_servico.fotos`.
- Impressora: `/api/public/printer/next` e `/complete` usam `PRINTER_AGENT_TOKEN` + cliente admin no servidor (não depende de RLS).
- Todas as telas leem/escrevem pelo cliente do navegador (19 arquivos). `attachSupabaseAuth` já está registrado em `src/start.ts`.

### Fase 0 — Preparação (sem impacto)
1. Snapshot das policies atuais em `supabase/rollback/policies_publicas.sql` (texto exato para recriar).
2. Export/backup das tabelas (CSV) e lista de objetos do bucket.
3. Janela de mudança fora do horário comercial; avisar funcionários.

### Fase 1 — Autenticação real em paralelo (RLS ainda aberta)
1. Ativar login por e-mail/senha; sem cadastro público (desativar signups após criar contas); HIBP ligado.
2. Criar conta do dono (e funcionários) manualmente.
3. Roles mínimos em tabela separada: enum `app_role` = `owner`, `staff`; `user_roles` + função `has_role()` security definer. Sem role em profile.
4. Nova tela `/auth` e hook de sessão; `onAuthStateChange` no root. Substituir `LoginGate` por um gate baseado em sessão Supabase, com flag de recurso: enquanto desligada, o login antigo continua valendo.
5. Botão "Sair" usando `supabase.auth.signOut()`; página de redefinir senha.
6. Teste: dono entra, usa todo o sistema; nada muda para quem não trocou.

### Fase 2 — Restringir o banco (incremental, tabela a tabela)
1. Migração A (aditiva): policies `TO authenticated` usando `has_role(auth.uid(),'owner') OR has_role(auth.uid(),'staff')` em todas as tabelas; GRANTs para `authenticated`/`service_role`. As públicas continuam — nada quebra.
2. Ligar a flag do novo login no app e validar em produção por 1–2 dias (todos os usuários já logados de verdade).
3. Migração B: remover as policies públicas, começando por `contas_receber`, `pagamentos_receber`, `clientes`; depois o resto. Revogar `anon` das tabelas. `print_jobs`: insert/select só `authenticated`.
4. Regras opcionais por role: `staff` sem acesso a `contas_receber`/`pagamentos_receber`/`empresa` escrita (decidir com o dono).
5. Storage: policies `protechos` só `authenticated`. URLs assinadas já emitidas seguem válidas até expirar; para revogar, trocar para salvar o caminho do arquivo e gerar URL curta ao exibir (mudança separada, compatível com os dois formatos).

### Impressão térmica
- Continua igual: endpoints usam token próprio e cliente admin no servidor, não são afetados pela RLS.
- O botão "Imprimir na térmica" insere em `print_jobs` como usuário logado (policy authenticated). Testar após a Migração B.
- Recomendado depois: rotacionar `PRINTER_AGENT_TOKEN` e atualizar `agent.py`.

### Rollback
- Fase 1: desligar a flag → volta o `LoginGate` antigo.
- Fase 2: executar `policies_publicas.sql` (recria as policies públicas) + desligar a flag. Leva segundos, sem perda de dados (nenhuma coluna removida).

### Testes por fase
- Com sessão: criar/editar OS, orçamento→OS, venda, baixa de estoque, contas a receber, pagamento, upload de fotos, logo, impressão A4/80mm/remota.
- Sem sessão (chave pública via curl): toda tabela retorna vazio/erro; upload no bucket negado.
- Linter e scan de segurança do backend sem alertas críticos.
- Impressora: `/next` sem token 401, com token JSON.

### Fase 3 — Endpoint somente leitura para o bot (só após Fase 2)
1. Banco: view/função `bot_estoque_publico` (security definer, colunas: `nome`, `disponivel` boolean = quantidade>0, `preco_venda`), filtra `preco_venda > 0`. Nunca `preco_custo`, quantidade exata ou outras tabelas. Execução só para `service_role`.
2. Tabela `garantia_regras` (tipo de serviço, texto, `aprovado` boolean, editável só pelo `owner`), com tela simples em Configurações. Bot só lê itens aprovados; sem regras aprovadas responde "encaminhar".
3. Rota `POST /api/public/bot/consulta`:
   - Headers `X-Bot-Timestamp`, `X-Bot-Signature` = HMAC-SHA256(segredo, timestamp + "." + corpo), comparação em tempo constante, janela 5 min, nonce opcional anti-replay.
   - Segredo `BOT_HMAC_SECRET` compartilhado com o n8n (criado pelo dono e salvo nos Secrets), separado do token da impressora.
   - Corpo máx. 2 KB, validação Zod `{ tipo: "estoque"|"garantia", termo: string(2..80) }`.
   - Rate limit: tabela `bot_rate_limit` (janela por minuto por assinatura/IP), ex. 30 req/min; 429 acima disso.
   - Resposta mínima: `{ itens: [{ nome, disponivel, preco_venda }] }` máx. 5; ambíguo → `{ encaminhar: true }`. Garantia: `{ regra }` ou `{ encaminhar: true }`.
   - Logs sem conteúdo sensível; erros genéricos.
4. Testes: assinatura inválida/expirada 401, replay rejeitado, excesso 429, payload grande 413, resposta sem campos proibidos.
5. Só depois: publicar e conectar o n8n (fora deste escopo, exige autorização).

### Riscos
- Travar a loja se alguém não tiver conta real no momento da Migração B → mitigado pela ordem aditiva, flag e script de rollback.
- Sessões antigas em `localStorage` do login falso: ignoradas pelo novo gate.
- URLs de fotos já emitidas continuam acessíveis até expirar (5 anos) — só resolvido com a mudança de caminho + URL curta.
- Preview e publicado usam o mesmo banco: toda migração afeta produção imediatamente; aplicar só na janela combinada.
- Signups abertos por engano → desativar após criar as contas.
- Vazamento do segredo do bot expõe apenas nome/disponibilidade/preço; rotação simples.

### Detalhes técnicos
- Gate: rotas protegidas movidas para `_authenticated/` (layout gerenciado, `ssr:false`) ou gate de sessão no root durante a transição.
- Nenhuma coluna removida; todas as mudanças de schema são aditivas.
- Endpoint do bot usa cliente admin apenas para chamar a função restrita.
