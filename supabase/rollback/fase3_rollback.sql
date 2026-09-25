-- Rollback Fase 3: remove apenas objetos técnicos do bot. Não toca em policies das fases 1/2 nem em dados de negócio.
DROP FUNCTION IF EXISTS public.bot_buscar_estoque(text);
DROP FUNCTION IF EXISTS public.bot_buscar_garantia(text);
DROP FUNCTION IF EXISTS public.bot_consume_nonce(text);
DROP FUNCTION IF EXISTS public.bot_rate_hit(text, integer);
DROP FUNCTION IF EXISTS public.bot_palavras(text);
DROP FUNCTION IF EXISTS public.bot_norm(text);
DROP TABLE IF EXISTS public.bot_nonces;
DROP TABLE IF EXISTS public.bot_rate_limit;
-- No código: apagar src/routes/api/public/bot/consulta.ts e src/lib/bot-auth*.ts
