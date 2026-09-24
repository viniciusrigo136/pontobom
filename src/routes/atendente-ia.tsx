import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, ShieldAlert, Tag, ShieldCheck, UserRound, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/atendente-ia")({
  head: () => ({
    meta: [
      { title: "Atendente IA (em preparação) — PontoBom OS" },
      { name: "description", content: "Planejamento do bot de atendimento a clientes via WhatsApp. Desconectado." },
      { property: "og:title", content: "Atendente IA — PontoBom OS" },
      { property: "og:description", content: "Módulo de atendimento em preparação, sem integração ativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AtendenteIAPage,
});

// Dados 100% FICTÍCIOS para a prévia. Esta página não consulta o banco.
const exemplo = [
  { de: "cliente", txt: "Oi, quanto custa trocar a tela do Modelo Exemplo X?" },
  { de: "bot", txt: "Olá! Para a Tela Exemplo X (qualidade Exemplo), temos disponível por R$ 000,00 — valor final já com a instalação. Deseja registrar interesse no conserto? Um atendente confirma com você." },
  { de: "cliente", txt: "E a bateria do Modelo Exemplo Y?" },
  { de: "bot", txt: "No momento não tenho esse item disponível para informar valor. Vou encaminhar para um atendente humano. Pode me dizer o modelo exato e o defeito?" },
  { de: "cliente", txt: "Qual a garantia?" },
  { de: "bot", txt: "A garantia varia conforme o serviço e é confirmada pelo atendente no momento do orçamento. Vou encaminhar sua dúvida." },
];

function Secao({ icon: Icon, title, children }: { icon: typeof Bot; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1.5 text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function AtendenteIAPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Atendente IA"
        description="Bot de atendimento a clientes via WhatsApp — planejamento"
        actions={<Badge variant="outline" className="border-warning text-warning">Em preparação · Desconectado</Badge>}
      />

      <Card className="border-destructive/50">
        <CardContent className="p-4 text-sm flex gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-foreground">Nenhuma integração ativa.</p>
            <p className="text-muted-foreground">Não há WhatsApp conectado, nenhum envio, webhook ou consulta externa. A ativação depende da correção de segurança do login e das permissões do banco, que será aprovada à parte pelo proprietário.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Secao icon={Clock} title="Horário (America/Sao_Paulo)">
          <p>Seg–Sex: 07:30–11:30 e 13:30–18:00</p>
          <p>Sábado: 08:00–11:30</p>
          <p>Domingo: fechado</p>
          <p>Responde 24h, avisando quando a loja estiver fechada.</p>
          <p>Feriados/exceções: a definir.</p>
        </Secao>
        <Secao icon={Tag} title="Regras de preço">
          <p>Preço de venda do estoque = valor FINAL (peça + mão de obra) para serviços.</p>
          <p>Só informa preço se: quantidade &gt; 0, preço válido e correspondência exata de modelo/tipo/qualidade.</p>
          <p>Indisponível ou ambíguo: não mostra preço e encaminha ao humano.</p>
          <p>Produtos avulsos: preço unitário, sem instalação.</p>
          <p>Preço de custo nunca é exposto.</p>
        </Secao>
        <Secao icon={ShieldCheck} title="Garantia">
          <p>Hoje a garantia existe apenas por documento: texto livre na OS e meses na venda.</p>
          <p>A garantia de uma OS passada não vale como política geral do serviço.</p>
          <p>O bot não promete garantia; encaminha ao atendente até existir uma tabela oficial por serviço.</p>
        </Secao>
        <Secao icon={UserRound} title="Encaminhamento ao humano">
          <p>Pergunta não resolvida: coleta modelo e defeito e encaminha.</p>
          <p>Fotos: apenas para avaliação humana, sem diagnóstico nem promessa de orçamento.</p>
          <p>Interesse em conserto é registrado, sem agendamento automático.</p>
          <p>Cliente recebe aviso de encaminhamento; dono recebe resumo no WhatsApp pessoal e assume pelo WhatsApp Business (mesmo número do bot).</p>
        </Secao>
      </div>

      <Secao icon={FlaskConical} title="Dependências a testar">
        <p>• Se a Evolution API (Baileys) distingue mensagens enviadas manualmente pelo celular e pausa o bot — não garantido.</p>
        <p>• Novo chip ainda não cadastrado. VPS, n8n e Evolution ainda não instalados.</p>
      </Secao>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" /> Prévia do comportamento
            <Badge variant="secondary">DADOS FICTÍCIOS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exemplo.map((m, i) => (
            <div key={i} className={m.de === "bot" ? "flex justify-start" : "flex justify-end"}>
              <div className={
                "max-w-[80%] rounded-lg px-3 py-2 text-sm " +
                (m.de === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")
              }>{m.txt}</div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">Exemplo ilustrativo. Nenhum dado real é consultado nesta página.</p>
        </CardContent>
      </Card>
    </div>
  );
}
