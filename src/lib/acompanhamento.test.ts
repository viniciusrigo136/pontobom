import { describe, it, expect } from "vitest";
import { montarPublico, tokenValido, gerarToken, statusPublico } from "./acompanhamento";

const os = { numero: 7, modelo_aparelho: "iPhone 11", problema_relatado: "tela", status: "Em andamento", tipo_dispositivo: "Celular", data_entrada: "2026-01-01T00:00:00Z", valor_total: 350 };
const at = (id: string, publico: boolean) => ({ id, status: "Em testes", observacao: "obs " + id, publico, fotos: [], created_at: "2026-01-02T00:00:00Z", editado_em: null });

describe("portal de acompanhamento", () => {
  it("token gerado tem 64 hex e id sequencial não é aceito", () => {
    expect(tokenValido(gerarToken())).toBe(true);
    expect(tokenValido("7")).toBe(false);
  });
  it("atualizações internas não aparecem", () => {
    const r = montarPublico({ os, atualizacoes: [at("a", true), at("b", false)] });
    expect(r.linha.map((l) => l.id)).toEqual(["a"]);
  });
  it("detalhes da OS aparecem: aparelho, defeito e valor", () => {
    const r = montarPublico({ os, atualizacoes: [] });
    expect(r.modelo).toBe("iPhone 11");
    expect(r.tipo).toBe("Celular");
    expect(r.defeito).toBe("tela");
    expect(r.valor).toBe(350);
  });
  it("status antigo é traduzido", () => {
    expect(statusPublico("Pronto")).toBe("Pronto para retirada");
  });
});
