## ProTechOS — Sistema de Gestão para Assistência Técnica

Sistema completo em português (PT-BR), dark mode moderno, com backend Lovable Cloud (Supabase) e documentos imprimíveis profissionais.

### 1. Backend (Lovable Cloud)
Habilitar Lovable Cloud e criar as tabelas via migration:
- `empresa` (singleton — dados usados no cabeçalho dos documentos)
- `clientes`, `estoque`
- `ordens_servico` (com senha do aparelho, checklist JSON, assinatura digital)
- `orcamentos`, `vendas`
- Numeração sequencial automática por tipo (#1, #2…) via sequence/trigger
- RLS pública nesta primeira versão (sistema interno single-tenant); preparado para futura autenticação

### 2. Design System
- Dark mode profissional (cinza-azulado escuro, accent azul elétrico, verde para "pronto", amarelo para "aguardando")
- Tokens semânticos no `src/styles.css` (oklch)
- Badges de status coloridos, cards com leve glow, tabelas densas e legíveis
- Inter como fonte principal
- Layout com sidebar fixa à esquerda + área de conteúdo

### 3. Navegação (sidebar fixa)
Dashboard · Ordens de Serviço · Orçamentos · Vendas · Clientes · Estoque · Configurações

### 4. Páginas
- **Dashboard** — 4 cards de KPI, gráfico de barras OS por status (recharts), últimas 5 OS
- **Ordens de Serviço** — lista filtrável + formulário completo com:
  - Busca/cadastro inline de cliente
  - Senha do aparelho: tipo texto OU **padrão de desenho 3×3 interativo** (canvas)
  - Tabela dinâmica de peças/serviços com busca no estoque
  - Checklist de 18 itens em 2 colunas + botão "Marcar todos OK"
  - **Assinatura digital** do cliente em canvas (com modal ampliado)
  - Página de detalhe + impressão A4
- **Orçamentos** — lista + formulário + impressão
- **Vendas** — lista + formulário + impressão em **2 folhas separadas**:
  - Folha 1: Contrato de Garantia + itens + período de garantia calculado
  - Folha 2: Contrato de Prestação de Serviço com as 12 cláusulas completas (`page-break-before: always`)
- **Clientes** — CRUD + histórico de OS/orçamentos por cliente
- **Estoque** — CRUD + alerta visual quando quantidade < 3
- **Configurações** — formulário "Dados da Empresa" persistido, alimenta cabeçalho de todos os documentos

### 5. Impressão
- Componente `PrintLayout` reutilizável com cabeçalho da empresa
- CSS `@media print` ocultando sidebar/UI
- Formatação A4, fontes serifadas no documento, assinaturas no rodapé
- Vendas usam `page-break-before: always` para garantir 2 folhas

### 6. Regras gerais
- Valores formatados em R$ (pt-BR), datas dd/mm/aaaa
- Confirmação antes de excluir (AlertDialog)
- Responsivo (sidebar colapsa em mobile)
- Numeração sequencial automática

### Detalhes técnicos
- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Supabase (Lovable Cloud)
- Roteamento: arquivos em `src/routes/` (`/`, `/ordens`, `/ordens/nova`, `/ordens/$id`, `/orcamentos`, `/orcamentos/novo`, `/vendas`, `/vendas/nova`, `/clientes`, `/estoque`, `/configuracoes`)
- Layout raiz com sidebar via `_layout.tsx` (pathless layout)
- Server functions para operações de escrita; reads diretos pelo client Supabase (RLS pública nesta fase)
- Recharts para o gráfico do dashboard
- Canvas nativo para padrão 3×3 e assinatura digital (sem libs extras)

### Escopo desta primeira entrega
Tudo descrito acima funcional ponta a ponta. Sem autenticação de usuários nesta fase (sistema de uso interno). Posso adicionar login depois se quiser.
