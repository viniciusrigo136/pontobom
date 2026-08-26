"""
Agente de impressao termica ProTechOS - POSPrinter POS80 (USB, Windows).

Instalacao (Windows):
    pip install requests python-escpos pywin32

Configuracao: defina as variaveis de ambiente abaixo (ou edite os valores padrao).
    PROTECHOS_URL   -> https://pontobom.lovable.app
    PRINTER_TOKEN   -> token do agente (guardado no backend como PRINTER_AGENT_TOKEN)
    PRINTER_ID      -> POS80-01
    PRINTER_NAME    -> nome da impressora no Windows (Painel de Controle > Impressoras)

Executar:
    python agent.py
"""

import os
import time
import textwrap
import requests

BASE_URL = os.environ.get("PROTECHOS_URL", "https://pontobom.lovable.app").rstrip("/")
TOKEN = os.environ.get("PRINTER_TOKEN", "COLE_AQUI_O_TOKEN")
PRINTER_ID = os.environ.get("PRINTER_ID", "POS80-01")
PRINTER_NAME = os.environ.get("PRINTER_NAME", "POS80 Printer")
POLL_SECONDS = 5
WIDTH = 42  # colunas de 80mm em fonte A

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


def brl(v):
    try:
        return f"R$ {float(v or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return "R$ 0,00"


def linha(c="-"):
    return c * WIDTH + "\n"


def par(esq, dir_):
    esq, dir_ = str(esq), str(dir_)
    espaco = max(1, WIDTH - len(esq) - len(dir_))
    return esq + " " * espaco + dir_ + "\n"


def montar_cupom(payload):
    os_ = payload.get("os") or {}
    cli = payload.get("cliente") or {}
    emp = payload.get("empresa") or {}
    out = ""
    if emp.get("nome"):
        out += emp["nome"].center(WIDTH) + "\n"
    for campo in ("cnpj", "endereco", "telefone"):
        if emp.get(campo):
            out += textwrap.fill(str(emp[campo]), WIDTH).center(WIDTH) + "\n"
    out += linha("=")
    out += par("ORDEM DE SERVICO", f"#{os_.get('numero', '')}")
    out += par("Entrada:", str(os_.get("data_entrada", ""))[:10])
    out += par("Status:", os_.get("status", ""))
    out += linha()
    out += f"Cliente: {cli.get('nome', '-')}\n"
    out += f"Telefone: {cli.get('telefone', '-')}\n"
    out += linha()
    out += f"Aparelho: {os_.get('aparelho') or '-'}\n"
    out += f"Tecnico: {os_.get('tecnico') or '-'}\n"
    out += f"Garantia: {os_.get('garantia') or '-'}\n"
    if os_.get("defeito_relatado"):
        out += textwrap.fill(f"Problema: {os_['defeito_relatado']}", WIDTH) + "\n"
    out += linha()
    for item in os_.get("itens") or []:
        out += textwrap.fill(str(item.get("descricao", "")), WIDTH) + "\n"
        qtd, preco = item.get("qtd", 0), item.get("preco", 0)
        out += par(f"{qtd} x {brl(preco)}", brl(float(qtd or 0) * float(preco or 0)))
    out += linha()
    if os_.get("desconto"):
        out += par("Desconto", brl(os_["desconto"]))
    out += par("TOTAL", brl(os_.get("valor_total")))
    out += f"Pagamento: {os_.get('forma_pagamento', '-')}\n"
    if os_.get("senha_valor"):
        out += f"Senha ({os_.get('senha_tipo')}): {os_['senha_valor']}\n"
    if emp.get("pix_chave"):
        out += linha()
        out += "PAGAMENTO VIA PIX\n"
        out += f"{emp.get('pix_tipo') or 'Chave'}: {emp['pix_chave']}\n"
    out += linha()
    out += "\n\n" + "_" * 28 + "\n"
    out += "Assinatura do Responsavel".center(WIDTH) + "\n"
    out += linha()
    out += textwrap.fill(
        "Este comprovante e valido para garantia e nao possui valor fiscal.", WIDTH
    ) + "\n"
    return out


def imprimir(texto):
    """Envia o texto + comandos ESC/POS para a impressora USB via spooler do Windows."""
    import win32print

    dados = b"\x1b\x40" + texto.encode("cp860", "replace") + b"\n\n\n" + b"\x1d\x56\x00"
    h = win32print.OpenPrinter(PRINTER_NAME)
    try:
        win32print.StartDocPrinter(h, 1, ("ProTechOS OS", None, "RAW"))
        win32print.StartPagePrinter(h)
        win32print.WritePrinter(h, dados)
        win32print.EndPagePrinter(h)
        win32print.EndDocPrinter(h)
    finally:
        win32print.ClosePrinter(h)


def loop():
    print(f"Agente iniciado. Impressora {PRINTER_ID} -> {PRINTER_NAME}")
    while True:
        try:
            r = requests.post(
                f"{BASE_URL}/api/public/printer/next",
                headers=HEADERS,
                json={"printer_id": PRINTER_ID},
                timeout=30,
            )
            r.raise_for_status()
            data = r.json()
            job = data.get("job")
            if not job:
                time.sleep(POLL_SECONDS)
                continue

            print("Novo trabalho:", job["id"])
            try:
                imprimir(montar_cupom(data))
                body = {"job_id": job["id"], "status": "printed"}
            except Exception as e:  # falha de impressao
                body = {"job_id": job["id"], "status": "error", "error": str(e)[:500]}
                print("Erro ao imprimir:", e)

            requests.post(
                f"{BASE_URL}/api/public/printer/complete",
                headers=HEADERS,
                json=body,
                timeout=30,
            )
        except Exception as e:
            print("Erro no agente:", e)
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    loop()
