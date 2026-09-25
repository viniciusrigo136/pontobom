CREATE TABLE public.bot_nonces (nonce text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX bot_nonces_created_idx ON public.bot_nonces(created_at);
GRANT ALL ON public.bot_nonces TO service_role;
REVOKE ALL ON public.bot_nonces FROM anon, authenticated;
ALTER TABLE public.bot_nonces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_rate_limit (chave text NOT NULL, janela timestamptz NOT NULL, contador integer NOT NULL DEFAULT 0, PRIMARY KEY (chave, janela));
CREATE INDEX bot_rate_limit_janela_idx ON public.bot_rate_limit(janela);
GRANT ALL ON public.bot_rate_limit TO service_role;
REVOKE ALL ON public.bot_rate_limit FROM anon, authenticated;
ALTER TABLE public.bot_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bot_consume_nonce(_nonce text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  DELETE FROM public.bot_nonces WHERE created_at < now() - interval '15 minutes';
  INSERT INTO public.bot_nonces(nonce) VALUES (_nonce) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END $$;

CREATE OR REPLACE FUNCTION public.bot_rate_hit(_chave text, _limite integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c int; w timestamptz := date_trunc('minute', now());
BEGIN
  DELETE FROM public.bot_rate_limit WHERE janela < now() - interval '5 minutes';
  INSERT INTO public.bot_rate_limit(chave, janela, contador) VALUES (_chave, w, 1)
  ON CONFLICT (chave, janela) DO UPDATE SET contador = public.bot_rate_limit.contador + 1
  RETURNING contador INTO c;
  RETURN c <= _limite;
END $$;

CREATE OR REPLACE FUNCTION public.bot_norm(_t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(lower(coalesce(_t,'')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
$$;

CREATE OR REPLACE FUNCTION public.bot_palavras(_termo text)
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(array_agg(w), '{}') FROM (
    SELECT regexp_replace(w, '[%_\\]', '', 'g') AS w
    FROM unnest(regexp_split_to_array(public.bot_norm(trim(_termo)), '[^a-z0-9]+')) w
  ) s WHERE length(w) >= 2 AND w NOT IN ('de','da','do','das','dos','para','pra','com','um','uma','os','as','no','na','em','quanto','custa','tem','valor','preco')
$$;

CREATE OR REPLACE FUNCTION public.bot_buscar_estoque(_termo text)
RETURNS TABLE(nome text, disponivel boolean, preco_venda numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (SELECT public.bot_palavras(_termo) AS ws)
  SELECT e.nome,
         (e.quantidade > 0) AS disponivel,
         CASE WHEN e.quantidade > 0 AND e.preco_venda > 0 THEN e.preco_venda ELSE NULL END
  FROM public.estoque e, p
  WHERE cardinality(p.ws) > 0
    AND NOT EXISTS (SELECT 1 FROM unnest(p.ws) w
      WHERE position(w IN public.bot_norm(e.nome || ' ' || coalesce(e.descricao,'') || ' ' || coalesce(e.categoria,''))) = 0)
  ORDER BY (e.quantidade > 0) DESC, e.nome
  LIMIT 5
$$;

CREATE OR REPLACE FUNCTION public.bot_buscar_garantia(_termo text)
RETURNS TABLE(tipo_servico text, descricao text, prazo_dias integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (SELECT public.bot_palavras(_termo) AS ws)
  SELECT g.tipo_servico, g.descricao, g.prazo_dias
  FROM public.garantia_regras g, p
  WHERE g.ativo AND g.aprovado_bot AND cardinality(p.ws) > 0
    AND EXISTS (SELECT 1 FROM unnest(p.ws) w
      WHERE position(w IN public.bot_norm(g.tipo_servico || ' ' || coalesce(g.descricao,''))) > 0)
  ORDER BY g.tipo_servico
  LIMIT 5
$$;

REVOKE ALL ON FUNCTION public.bot_consume_nonce(text), public.bot_rate_hit(text,integer), public.bot_buscar_estoque(text), public.bot_buscar_garantia(text), public.bot_norm(text), public.bot_palavras(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_consume_nonce(text), public.bot_rate_hit(text,integer), public.bot_buscar_estoque(text), public.bot_buscar_garantia(text), public.bot_norm(text), public.bot_palavras(text) TO service_role;