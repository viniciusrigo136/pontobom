import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Printer, Trash2, ArrowLeft } from "lucide-react";
import { brl, fmtDate, fmtDateTime, addMonths } from "@/lib/format";
import { useEmpresa, PrintHeader, PrintSection, PrintItemsTable } from "@/components/PrintHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/vendas/$id")({ component: Detail });

type Venda = {
  id: string; numero: number; cliente_id: string | null; aparelho_produto: string | null;
  itens: Array<{ descricao: string; qtd: number; preco: number }>;
  valor_total: number; garantia_meses: number; data_venda: string; created_at: string;
};

const CLAUSULAS = [
  "Celebram ____________________________________ CPF __________________________ e ({{responsavel}}), pessoa jurídica de direito privado, inscrita sob o CNPJ/MF nº ({{cnpj}}), com sede à ({{endereco}}), contrato de prestação de serviços de manutenção e conserto de aparelho eletrônico, nos moldes do descritivo de entrega pelo cliente assinado.",
  "Neste ato declara o contratante que informou à prestadora de serviço todas as informações inerentes de seu aparelho, bem como todos os problemas e defeitos apresentados.",
  "A prestadora de serviços não se responsabilizará pela perda de garantia do fabricante em caso de manutenção realizada por esta, dentro do prazo de garantia, estando o contratante plenamente ciente de tal condição.",
  "A empresa não se responsabiliza por serviços realizados por qualquer outra assistência técnica antes ou depois da prestação de serviços realizada pela contratada.",
  "Declara o contratante que acompanhou os testes e checklist dos aparelhos deixados.",
  "Declara a contratada que o processo de avarias internas como oxidações, umidade, alto consumo de bateria, entre outros problemas internos serão constatados pela área técnica, após a abertura do equipamento, podendo surgir defeitos não apresentados no primeiro checklist.",
  "Os aparelhos que entrarem desligados, sem bateria, com senha de bloqueio ou inoperantes, durante os primeiros testes e primeiras avaliações, poderão apresentar defeitos não previstos no orçamento inicial. Neste caso, a empresa compromete-se a comunicar o contratante sobre o preço, serviços e prazos entendidos para a reparação do defeito encontrado. Após a constatação, o serviço só será realizado com a autorização do contratante.",
  "A garantia de serviços é de 90 dias corridos, nos termos do artigo 26 do Código de Defesa do Consumidor e só terá validade quando acompanhado do comprovante de pagamento do produto ou serviço. Os serviços de desoxidação e limpeza, não possuem garantia, visto que servem como uma última tentativa de reativar o aparelho que passou por umidade ou sujeira.",
  "A garantia citada na cláusula 08, em troca de tela, cobre: mau funcionamento do touch, descolamento da tela, mas não cobre defeitos oriundos de mau uso do consumidor, como quebras por queda do aparelho, aparecimento de manchas roxas, pretas, esverdeada, vermelhas, listras horizontais ou verticais, listras pretas e esverdeadas, tela totalmente branca ou totalmente preta, que são causadas por pressão excessiva. Rende ainda a garantia, aparelhos que tenham molhado ou passado por vapor, que tenham tido contato com areia, alimentos, oxidação, sobrecarga elétrica, exposição a altas temperaturas, frame descolado da tela, bem como vidros quebrados e ainda tela apagada e que tenham tido contato com água, ou componentes quebrados ou danificados. Nos serviços de reparo de placa, só terá garantia o reparo realizado no componente da placa de acordo com a ordem de serviço, não cobrindo qualquer outro componente que pare de funcionar. Nos serviços de troca dos componentes, como, conector de carga, conector da bateria, microfone, botões, câmera, a garantia cobre o mau funcionamento das peças, desde que o mesmo não apresente quebra e mau uso conforme as disposições descritas nesta cláusula.",
  "A empresa trabalha com peças fornecidas pelos fabricantes, garantindo qualidade aos seus clientes, disponibilizando as telas Similar, que tem linha com qualidade intermediária e preço mais acessível, tela Premium que tem categoria superior com cores e imagem de alta qualidade e Original, que é a mesma tela utilizada pelo fabricante do aparelho. Desta feita, no momento da assinatura deste contrato e da ordem de serviço, autoriza o cliente a utilização de peças que não são originais do fabricante, nos moldes do artigo 21 do Código de Defesa do Consumidor.",
  "A empresa não se responsabiliza pela perda de dados, mensagens, fotos, agenda ou qualquer aplicativo pela realização do serviço, sendo o backup do aparelho de responsabilidade exclusiva do contratante. Além disso, não se responsabiliza a contratada pelo bloqueio do aparelho, conta ou aplicativos por perda do PIN, padrão ou senha.",
  "O contratante fica obrigado a retirar o bem, no prazo de 30 dias, caso não retire após tal data será acrescida multa de 10% sob o valor serviço.",
];

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [cliente, setCliente] = useState<{ nome: string; telefone: string | null; cpf: string | null } | null>(null);
  const empresa = useEmpresa();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vendas").select("*").eq("id", id).single();
      setVenda(data as unknown as Venda);
      if (data?.cliente_id) {
        const { data: c } = await supabase.from("clientes").select("nome,telefone,cpf").eq("id", data.cliente_id).single();
        setCliente(c);
      }
    })();
  }, [id]);

  const excluir = async () => {
    await supabase.from("vendas").delete().eq("id", id);
    toast.success("Venda excluída");
    navigate({ to: "/vendas" });
  };

  if (!venda) return <p className="text-muted-foreground">Carregando...</p>;

  const fimGarantia = addMonths(new Date(venda.data_venda), venda.garantia_meses);

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Venda #${venda.numero}`}
          actions={
            <>
              <Button variant="outline" asChild><Link to="/vendas"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button>
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir venda?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          }
        />
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Cliente:</strong> {cliente?.nome || "—"}</p>
            <p><strong>Produto:</strong> {venda.aparelho_produto || "—"}</p>
            <p><strong>Garantia:</strong> {venda.garantia_meses} meses — válida de {fmtDate(venda.data_venda)} até {fmtDate(fimGarantia)}</p>
            <p className="text-2xl font-bold mt-2">{brl(venda.valor_total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* PRINT — Folha 1 */}
      <div className="print-only print-area text-black bg-white p-6">
        <div className="print-page">
          <PrintHeader
            empresa={empresa}
            rightTitle={`CONTRATO DE GARANTIA · Venda #${venda.numero}`}
            rightLines={[
              ["Emissão", fmtDateTime(venda.created_at)],
              ["Data da Venda", fmtDate(venda.data_venda)],
            ]}
          />
          <PrintSection title="Cliente">
            <p><strong>Nome:</strong> {cliente?.nome || "—"} &nbsp;|&nbsp; <strong>Telefone:</strong> {cliente?.telefone || "—"} &nbsp;|&nbsp; <strong>CPF:</strong> {cliente?.cpf || "—"}</p>
          </PrintSection>
          <PrintSection title="Produto">
            <p><strong>Aparelho / Produto:</strong> {venda.aparelho_produto || "—"} &nbsp;|&nbsp; <strong>Data da Venda:</strong> {fmtDate(venda.data_venda)}</p>
          </PrintSection>
          <PrintSection title="Itens da Venda">
            <PrintItemsTable itens={venda.itens || []} total={venda.valor_total} />
          </PrintSection>
          <PrintSection title="Garantia">
            <p className="text-base font-bold">
              {venda.garantia_meses} MESES — Válida de {fmtDate(venda.data_venda)} até {fmtDate(fimGarantia)}
            </p>
          </PrintSection>
          <div className="mt-16 grid grid-cols-2 gap-8">
            <div className="text-center"><div className="border-t border-black pt-1"><p className="text-xs">Assinatura do Cliente</p></div></div>
            <div className="text-center"><div className="border-t border-black pt-1"><p className="text-xs">{empresa?.responsavel || "Responsável"} — {empresa?.nome || ""}</p></div></div>
          </div>
        </div>

        {/* PRINT — Folha 2 — Contrato de Prestação de Serviço */}
        <div className="print-force-break">
          <h2 className="text-center text-lg font-bold mb-4 uppercase">Contrato de Prestação de Serviço</h2>
          <ol className="text-xs space-y-2 list-decimal pl-5">
            {CLAUSULAS.map((c, i) => (
              <li key={i}>
                <strong>Cláusula {i + 1}:</strong>{" "}
                {c
                  .replace("{{responsavel}}", empresa?.responsavel || "________________")
                  .replace("{{cnpj}}", empresa?.cnpj || "________________")
                  .replace("{{endereco}}", empresa?.endereco || "________________")}
              </li>
            ))}
          </ol>
          <p className="text-xs mt-10">
            Ciência do cliente _______________________________________ &nbsp;&nbsp; Data ____/____/______
          </p>
        </div>
      </div>
    </div>
  );
}
