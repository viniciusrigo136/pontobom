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

# IMPORTANTE: use o dominio final (pontobomos.app). O endereco .lovable.app
# redireciona (307) para o dominio customizado e o requests descarta o header
# Authorization no redirecionamento, causando erro de autenticacao/HTML.
BASE_URL = os.environ.get("PROTECHOS_URL", "https://pontobomos.app").rstrip("/")
TOKEN = os.environ.get("PRINTER_TOKEN", "COLE_AQUI_O_TOKEN")
PRINTER_ID = os.environ.get("PRINTER_ID", "POS80-01")
PRINTER_NAME = os.environ.get("PRINTER_NAME", "POS80 Printer")
POLL_SECONDS = 5
WIDTH = 42  # colunas de 80mm em fonte A
EXPECTED_RECEIPT_VERSION = 2
# Tabela ESC/POS 3 = PC860 (portugues) na POS80. Pode ser ajustada sem editar o agente.
CODEPAGE = max(0, min(255, int(os.environ.get("PRINTER_CODEPAGE", "3"))))

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Printer-Token": TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json",
}


ESC = b"\x1b"
GS = b"\x1d"
NEGRITO_ON = ESC + b"E\x01"
NEGRITO_OFF = ESC + b"E\x00"
AL_ESQ = ESC + b"a\x00"
AL_CENTRO = ESC + b"a\x01"
ALTURA_NORMAL = GS + b"!\x00"
ALTURA_DESTAQUE = GS + b"!\x10"


def quebrar(texto, largura=WIDTH):
    """Quebra texto longo sem cortar palavras."""
    texto = str(texto or "")
    linhas = []
    for bruto in texto.split("\n"):
        if not bruto.strip():
            linhas.append("")
            continue
        linhas.extend(textwrap.wrap(bruto, largura, break_long_words=True) or [""])
    return linhas


def par(esq, dir_, largura=WIDTH):
    """Esquerda + direita na mesma linha; se nao couber, quebra em duas."""
    esq, dir_ = str(esq), str(dir_)
    if len(esq) + len(dir_) + 1 > largura:
        saida = quebrar(esq, largura)
        ultima = saida.pop() if saida else ""
        if len(ultima) + len(dir_) + 1 <= largura:
            saida.append(ultima + " " * (largura - len(ultima) - len(dir_)) + dir_)
        else:
            saida.append(ultima)
            saida.append(" " * (largura - len(dir_)) + dir_)
        return saida
    return [esq + " " * (largura - len(esq) - len(dir_)) + dir_]


def montar_escpos(payload):
    """Converte as linhas do recibo (vindas do backend) em bytes ESC/POS.

    O layout vem pronto do backend (src/lib/recibo-termico.ts), o mesmo usado
    pela impressao termica da tela, entao o agente nao adivinha campos.
    """
    if payload.get("receipt_version") != EXPECTED_RECEIPT_VERSION:
        raise ValueError("Modelo termico incompativel. Atualize o agente de impressao.")
    linhas = payload.get("recibo") or []
    if not linhas:
        raise ValueError("O backend nao enviou o modelo termico da OS.")
    out = bytearray()
    out += ESC + b"@"  # reset
    out += ESC + b"t" + bytes([CODEPAGE])
    out += AL_ESQ
    alinhamento = "left"

    def alinhar(destino):
        nonlocal alinhamento
        if destino != alinhamento:
            out.extend(AL_CENTRO if destino == "center" else AL_ESQ)
            alinhamento = destino

    def escrever(texto, negrito=False, destaque=False):
        if destaque:
            out.extend(ALTURA_DESTAQUE)
        if negrito:
            out.extend(NEGRITO_ON)
        out.extend(str(texto).encode("cp860", "replace") + b"\n")
        if negrito:
            out.extend(NEGRITO_OFF)
        if destaque:
            out.extend(ALTURA_NORMAL)

    for ln in linhas:
        tipo = ln.get("t")
        negrito = bool(ln.get("bold"))
        if tipo == "sep":
            alinhar("left")
            escrever("-" * WIDTH)
        elif tipo == "space":
            alinhar("left")
            pontos = max(0, min(255, int(ln.get("dots", 0))))
            if pontos:
                out.extend(ESC + b"J" + bytes([pontos]))
        elif tipo == "center":
            alinhar("center")
            for parte in quebrar(ln.get("text", "")):
                escrever(parte, negrito, ln.get("style") == "title")
        elif tipo == "item":
            alinhar("left")
            for parte in quebrar(ln.get("description", "")):
                escrever(parte)
            for parte in par(ln.get("quantity", ""), ln.get("total", "")):
                escrever(parte)
            out.extend(ESC + b"J\x03")
        elif tipo == "row":
            alinhar("left")
            for parte in par(ln.get("left", ""), ln.get("right", "")):
                escrever(parte, negrito, ln.get("style") == "total")
        else:  # left
            alinhar("left")
            for parte in quebrar(ln.get("text", "")):
                escrever(parte, negrito)

    alinhar("left")
    out += b"\n\n\n" + GS + b"V\x00"  # avanca e corta
    return bytes(out)


def imprimir(dados):
    """Envia os bytes ESC/POS para a impressora USB via spooler do Windows (RAW)."""
    import win32print

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
                imprimir(montar_escpos(data))
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
