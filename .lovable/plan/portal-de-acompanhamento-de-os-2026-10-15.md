# Portal de Acompanhamento de OS

## Situação atual
- OS já tem `status` (Aguardando / Em andamento / Pronto / Entregue), `fotos` e impressão A4/térmica.
- As tabelas hoje estão abertas ao público (pedido anterior de tirar o login). Isso conflita com o item 5 (segurança) do portal: com tabelas públicas, qualquer pessoa lê todas as OS mesmo sem o link. Ver "Decisão necessária".

## O que será feito
1. **Etapas novas**: lista de 13 status (10 do fluxo + Orçamento recusado, Cancelada, Sem reparo). Os 4 antigos são mapeados (Aguardando→Aparelho recebido, Em andamento→Em manutenção, Pronto→Pronto para retirada, Entregue→Entregue) sem perder dados. O status da OS continua sendo um só, usado no painel e no portal.
2. **Aba Acompanhamento na OS**: mudar etapa, escrever observação, enviar várias fotos (câmera ou galeria, comprimidas e validadas), marcar "visível ao cliente", editar/ocultar atualizações antigas, histórico em ordem de data.
3. **Link exclusivo**: token aleatório de 32 bytes por OS; botões Copiar link, Enviar pelo WhatsApp (wa.me com mensagem pronta, sem envio automático), QR Code, Revogar/Gerar novo.
4. **Portal público `/acompanhar/$token`**: número da OS, modelo, defeito (se autorizado), status em destaque, linha do tempo, fotos públicas com ampliação, observações públicas, última atualização, botão WhatsApp da loja. Feito para celular, `noindex`.
5. **QR Code no comprovante**: pequeno, ao final da A4 e da térmica do navegador, sem mudar o resto do layout. Impressora remota não muda.

## Detalhes técnicos
- Tabelas: `os_acompanhamento_token` (os_id, token_hash, ativo, mostrar_defeito) e `os_atualizacoes` (os_id, status, observacao, publico, fotos jsonb, created_at, editado_em). Sem acesso anônimo.
- Portal lê por server function que valida o hash do token no servidor e devolve só campos públicos; fotos públicas saem como links assinados de 20 min. Nunca usa id sequencial.
- Bibliotecas: `qrcode` (geração local) e compressão via canvas.
- Testes: token inválido/revogado não retorna nada; token de uma OS não mostra outra; resposta não contém campos internos.

## Decisão necessária
Para o portal ser seguro, as tabelas precisam voltar a ficar fechadas ao público. Opções:
- **A (recomendado)**: o painel da loja continua sem login para vocês, mas o acesso aos dados passa a ser só pelo servidor do app — o portal fica realmente protegido.
- **B**: manter tudo aberto como está; o portal funciona, mas qualquer pessoa técnica consegue ver todas as OS e clientes.
