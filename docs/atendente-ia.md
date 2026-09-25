# Atendente IA — Arquitetura futura (NÃO ATIVO)

Status: em preparação. Nada conectado, nenhum endpoint, token, webhook ou job criado.

## Fluxo planejado
Cliente (WhatsApp) -> Evolution API (VPS) -> n8n (VPS) -> endpoint HTTPS somente-leitura do PontoBom OS -> resposta -> Evolution -> cliente.
Handoff: n8n envia resumo ao WhatsApp pessoal do dono; dono assume no WhatsApp Business (mesmo número).

## Bloqueio (pré-requisito)
- Login atual é apenas no navegador (não é autenticação real).
- Políticas do banco em clientes, contas_receber, empresa, estoque, orcamentos, ordens_servico, vendas permitem leitura/escrita pública.
- Nenhuma rota de consulta deve ser publicada antes da correção.

## Contrato de consulta (futuro)
`POST /api/public/bot/estoque/consulta` (caminho indicativo, não existe)
- Auth servidor-a-servidor: HMAC-SHA256 do corpo + timestamp (janela 5 min, anti-replay) com segredo exclusivo de escopo mínimo.
- Rate limit por origem/assinatura; tamanho máximo do corpo; validação Zod.
- Entrada: `{ modelo, tipo, qualidade? }`.
- Match exato normalizado; ambíguo/múltiplo => `{ disponivel: false, encaminhar: true }`.
- Retorno whitelist: `{ disponivel, nome, preco_venda }` apenas se quantidade > 0 e preco_venda > 0. Nunca preco_custo, quantidade exata, clientes, CPF, financeiro, senhas.
- Leitura via cliente server-side com função/visão restrita a esses campos.

## Garantia — auditoria
- `ordens_servico.garantia_texto`: texto livre por OS.
- `vendas.garantia_meses`: meses por venda (usado no contrato impresso).
- `estoque`: sem campo de garantia.
Conclusão: não há política geral por serviço. Bot não informa garantia até existir tabela oficial aprovada.

## Correção de segurança proposta (requer aprovação)
1. Criar conta real no sistema de login do Cloud para o dono (e funcionários).
2. Nova tela de login real em paralelo; manter a atual até validar.
3. Migração: adicionar políticas `TO authenticated` e só depois remover as públicas. Bucket de fotos idem.
4. Rollback: script que recria as políticas públicas originais.
5. Endpoint da impressora continua funcionando (usa token próprio server-side).

## Checklist VPS
- [ ] Ubuntu atualizado, firewall (22/80/443), SSH por chave
- [ ] Docker + Compose; n8n e Evolution atrás de proxy HTTPS (Caddy/Traefik)
- [ ] n8n com autenticação, sem exposição de editor publicamente sem senha
- [ ] Backups de volumes
- [ ] Chip novo cadastrado; teste de pausa do bot ao responder manualmente
- [ ] Horários e feriados configurados (America/Sao_Paulo)

## Fase 3 — API do bot (preparada, n8n NÃO conectado)
URL: `POST https://pontobomos.app/api/public/bot/consulta` (preview: `https://id-preview--9c1c533c-dae8-428d-b53b-0071a97fcfb0.lovable.app/api/public/bot/consulta`; só existe no site no ar após publicar).

Segredo: `BOT_HMAC_SECRET` (Project Settings → Secrets). Sem ele → 503. O mesmo valor vai numa credencial do n8n.

Headers: `Content-Type: application/json`, `X-Bot-Timestamp` (epoch s), `X-Bot-Nonce` (16–128 chars `[A-Za-z0-9_-]`, único), `X-Bot-Signature` = hex HMAC-SHA256(segredo, `timestamp + "." + nonce + "." + corpo_bruto`).
Corpo (≤2 KB): `{"tipo":"estoque"|"garantia","termo":"2..80 chars"}`.
Respostas: 200 `{tipo:"estoque",itens:[{nome,disponivel,preco_venda|null}],encaminhar}` / `{tipo:"garantia",regras:[{tipo_servico,descricao,prazo_dias}],encaminhar}`; 400, 401, 405, 413, 415, 429 (30/min), 503.

Exemplo n8n (Code node, segredo vem de credencial, nunca fixo):
```js
const crypto = require('crypto');
const body = JSON.stringify({ tipo: 'estoque', termo: 'tela iphone 11' });
const ts = String(Math.floor(Date.now()/1000));
const nonce = crypto.randomBytes(16).toString('hex');
const sig = crypto.createHmac('sha256', SEGREDO).update(`${ts}.${nonce}.${body}`).digest('hex');
// enviar exatamente `body` como corpo bruto
```
Rollback: `supabase/rollback/fase3_rollback.sql`.
