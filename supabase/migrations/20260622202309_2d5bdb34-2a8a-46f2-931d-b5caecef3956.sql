
-- Empresa (singleton)
CREATE TABLE public.empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  cnpj TEXT,
  endereco TEXT,
  email TEXT,
  telefone TEXT,
  responsavel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa TO anon, authenticated;
GRANT ALL ON public.empresa TO service_role;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access empresa" ON public.empresa FOR ALL USING (true) WITH CHECK (true);

-- Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Estoque
CREATE TABLE public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  preco_custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO anon, authenticated;
GRANT ALL ON public.estoque TO service_role;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

-- Sequences for numbering
CREATE SEQUENCE public.os_numero_seq START 1;
CREATE SEQUENCE public.orc_numero_seq START 1;
CREATE SEQUENCE public.venda_numero_seq START 1;

-- Ordens de Serviço
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.os_numero_seq'),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  modelo_aparelho TEXT,
  problema_relatado TEXT,
  status TEXT NOT NULL DEFAULT 'Aguardando',
  tecnico TEXT,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_saida_prevista DATE,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  senha_tipo TEXT, -- 'senha' | 'desenho' | null
  senha_valor TEXT,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  assinatura_cliente_nome TEXT,
  assinatura_cliente_imagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO anon, authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access os" ON public.ordens_servico FOR ALL USING (true) WITH CHECK (true);

-- Orçamentos
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.orc_numero_seq'),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  modelo_aparelho TEXT,
  descricao_problema TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  validade DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO anon, authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access orc" ON public.orcamentos FOR ALL USING (true) WITH CHECK (true);

-- Vendas
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.venda_numero_seq'),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  aparelho_produto TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  garantia_meses INTEGER NOT NULL DEFAULT 3,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO anon, authenticated;
GRANT ALL ON public.vendas TO service_role;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

-- Seed empresa default
INSERT INTO public.empresa (nome, cnpj, endereco, email, telefone, responsavel)
VALUES ('ProTechOS', '', '', '', '', '');
