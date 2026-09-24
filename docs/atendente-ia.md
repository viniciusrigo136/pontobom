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
