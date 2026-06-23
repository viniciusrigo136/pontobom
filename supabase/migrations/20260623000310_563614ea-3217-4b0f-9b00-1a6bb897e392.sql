
CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  origem_tipo text NOT NULL DEFAULT 'Avulso',
  origem_id uuid,
  origem_numero integer,
  descricao text,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_pago numeric NOT NULL DEFAULT 0,
  valor_restante numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Aberto',
  data_vencimento date,
  parcela_numero integer,
  parcela_total integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber TO anon, authenticated;
GRANT ALL ON public.contas_receber TO service_role;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access contas_receber" ON public.contas_receber FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.pagamentos_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos_receber TO anon, authenticated;
GRANT ALL ON public.pagamentos_receber TO service_role;
ALTER TABLE public.pagamentos_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access pagamentos_receber" ON public.pagamentos_receber FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_contas_receber_cliente ON public.contas_receber(cliente_id);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_pagamentos_receber_conta ON public.pagamentos_receber(conta_id);
