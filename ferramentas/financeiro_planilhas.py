#!/usr/bin/env python3
"""Planilhas do Financeiro (e-mail semanal "Relatórios de pedidos e faturamentos") -> planilhas que o painel importa.

O conector do Microsoft 365 entrega o conteúdo de cada anexo .xlsx como TEXTO (uma linha por linha da
planilha, colunas separadas por TAB, aba marcada por "=== Sheet: nome ==="), não o arquivo. Este script
remonta as três planilhas no layout original para o importador do painel:

  carteira.txt     -> LS Fire_Carteira de Faturamento_Data DDMMAA.xlsx
  faturamento.txt  -> LS Fire_Faturamento Mensal_data DDMMAA.xlsx
  comparativo.txt  -> LS Fire_Comparativo Pedidos e Faturamento_Data DDMMAA.xlsx

e CONFERE a transcrição antes de gravar (se algo não bater, para com erro e não grava nada):
  - notas: soma das notas = linha TOTAL;
  - comparativo: soma dos meses = TOTAL, em cada bloco;
  - carteira: soma do "Valor faturado" = TOTAIS (a coluna do pedido pode não bater: a planilha às vezes
    não soma as últimas linhas — o painel soma linha a linha e só avisa).
Datas do Excel (número de série) viram datas. Não lê nem grava nada fora da pasta indicada.

Uso: python3 -I ferramentas/financeiro_planilhas.py <pasta com os três .txt> [pasta de saída]
Imprime a data das planilhas (AAAA-MM-DD) na última linha: "DATA AAAA-MM-DD".
"""
import datetime as _dt, os, re, sys

D0 = _dt.datetime(1899, 12, 30)


def serial(v):
    return D0 + _dt.timedelta(days=int(float(v)))


def num(s):
    s = (s or '').strip()
    if s == '':
        return None
    try:
        f = float(s)
    except ValueError:
        return s
    return int(f) if f.is_integer() and 'e' not in s.lower() and '.' not in s else f


def abas(txt):
    out, nome = {}, None
    for l in txt.replace('\r', '').split('\n'):
        m = re.match(r'^=== Sheet: (.*) ===\s*$', l)
        if m:
            nome = m.group(1).strip(); out[nome] = []; continue
        if nome is not None and l.strip():
            out[nome].append(l.split('\t'))
    return out


def achar(abas_, inicio):
    for nome, linhas in abas_.items():
        if linhas and linhas[0] and linhas[0][0].strip().upper().startswith(inicio):
            return nome, linhas
    raise SystemExit(f'FALHA: não achei a aba que começa com "{inicio}"')


def perto(a, b, tol=0.05):
    return abs((a or 0) - (b or 0)) <= tol


def carteira(txt, wb_cls):
    _, L = achar(abas(txt), 'CARTEIRA DE FATURAMENTO')
    data = serial(L[0][L[0].index('Data') + 1])
    h = next(i for i, r in enumerate(L) if r[0].strip().startswith('No PV'))
    rows, tot = [], None
    for r in L[h + 1:]:
        if any(c.strip().upper() == 'TOTAIS' for c in r):
            tot = r; break
        r = (r + [''] * 7)[:7]
        pv = r[0].strip()
        rows.append([int(pv) if pv.isdigit() else pv, r[1].strip() or None, serial(r[2]) if r[2].strip() else None, r[3]] + [num(x) for x in r[4:7]])
    if not rows:
        raise SystemExit('FALHA: carteira sem pedidos')
    soma_fat = round(sum(x[5] or 0 for x in rows), 2)
    if tot:
        i = [c.strip().upper() for c in tot].index('TOTAIS')
        tf = num(tot[i + 2]) if len(tot) > i + 2 else None
        if tf is not None and not perto(soma_fat, tf):
            raise SystemExit(f'FALHA: carteira — soma do faturado {soma_fat} ≠ TOTAIS {tf} (transcrição incompleta?)')
        tp = num(tot[i + 1])
        soma_p = round(sum(x[4] or 0 for x in rows), 2)
        if tp is not None and not perto(soma_p, tp):
            print(f'AVISO: carteira — a linha TOTAIS da planilha ({tp:,.2f}) não bate com a soma dos pedidos ({soma_p:,.2f}); o painel usa a soma das linhas.')
    wb = wb_cls(); wb.active.title = 'Sheet2'; ws = wb.create_sheet('Carteira de Faturamento')
    ws.append(['CARTEIRA DE FATURAMENTO', None, None, None, None, 'Data', data]); ws.append([])
    ws.append(['No PV LS', 'No. PC cliente', 'Data de abertura', 'Cliente ', 'Valor do Pedido', 'Valor faturado', 'Saldo a faturar'])
    for r in rows:
        ws.append(r)
    ws.append([None, None, None, 'TOTAIS'] + [round(sum(x[k] or 0 for x in rows), 2) for k in (4, 5, 6)])
    print(f'carteira: {len(rows)} pedidos · saldo {sum(x[6] or 0 for x in rows):,.2f} · data {data:%d/%m/%Y}')
    return wb, data


def faturamento(txt, wb_cls):
    nome, L = achar(abas(txt), 'RELATÓRIO MENSAL DE FATURAMENTO')
    t0 = L[0]; mes = serial(t0[t0.index('Mês/Ano') + 1]); data = serial(t0[t0.index('Data') + 1])
    h = next(i for i, r in enumerate(L) if r[0].strip().startswith('Cod.Cliente'))
    rows, total, obs = [], None, []
    for r in L[h + 1:]:
        if r[0].strip().lower().startswith('obs'):
            obs.append(r[0]); continue
        if any(c.strip().upper() == 'TOTAL' for c in r):
            i = [c.strip().upper() for c in r].index('TOTAL'); total = num(r[i + 1]); continue
        r = (r + [''] * 9)[:9]
        rows.append([r[0], r[1], r[2], r[3], num(r[4]), num(r[5]), serial(r[6]) if r[6].strip() else None, num(r[7]), r[8]])
    soma = round(sum(x[7] or 0 for x in rows), 2)
    if total is None or not perto(soma, total):
        raise SystemExit(f'FALHA: faturamento — soma das notas {soma} ≠ TOTAL {total} (transcrição incompleta?)')
    wb = wb_cls(); ws = wb.active; ws.title = nome[:31]
    ws.append(['RELATÓRIO MENSAL DE FATURAMENTO', None, None, None, None, 'Mês/Ano', mes, 'Data', data]); ws.append([])
    ws.append(['Cod.Cliente', 'Nome do cliente', 'No. PV LS', 'Projeto', 'Nº NF', 'Série', 'Data Emissão', 'Valor total da NF', 'Status da Nota'])
    for r in rows:
        ws.append(r)
    ws.append([None] * 6 + ['TOTAL', soma]); ws.append([])
    for o in obs:
        ws.append([o])
    print(f'faturamento: {len(rows)} notas · {soma:,.2f} · {mes:%m/%Y}')
    return wb, data


def comparativo(txt, wb_cls):
    A = abas(txt); wb = wb_cls(); wb.remove(wb.active); data = None
    for ini, nome in (('COMPARATIVO DE PEDIDOS', 'Comparativo Pedidos'), ('COMPARATIVO DE FATURAMENTO', 'Comparativo Faturamento')):
        _, L = achar(A, ini); ws = wb.create_sheet(nome)
        d = serial(L[0][L[0].index('Data') + 1]); data = data or d
        ws.append([L[0][0], 'Data', d]); ws.append([])
        bloco, meses = None, []
        for k, r in enumerate(L[1:]):
            rot = r[0].strip()
            if rot.upper() == 'TOTAL':
                # "meses concluídos": o TOTAL só soma os meses que já têm o valor do ano corrente (coluna 2)
                conc = 'CONCLU' in (bloco or '').upper()
                base = [m for m in meses if len(m) > 2 and m[2].strip()] if conc else meses
                for j in (1, 2):
                    tv = num(r[j]) if len(r) > j else None
                    sv = round(sum((num(m[j]) if len(m) > j and m[j].strip() else 0) or 0 for m in base), 2)
                    if isinstance(tv, (int, float)) and not perto(sv, tv, 0.5):
                        raise SystemExit(f'FALHA: {nome} — bloco "{bloco}": soma dos meses {sv} ≠ TOTAL {tv}')
                ws.append([r[0]] + [num(x) for x in r[1:]]); ws.append([]); meses = []; continue
            if rot and not re.search(r'[a-z0-9]', rot) and len(rot) > 12:   # título de bloco: tudo em maiúsculas
                bloco = rot; meses = []
                ws.append([r[0]] + [num(x) for x in r[1:]]); continue
            meses.append(r); ws.append([r[0]] + [num(x) for x in r[1:]])
    print(f'comparativo: data {data:%d/%m/%Y}')
    return wb, data


def main():
    if len(sys.argv) < 2:
        print(__doc__); return
    pasta = sys.argv[1]; saida = sys.argv[2] if len(sys.argv) > 2 else pasta
    from openpyxl import Workbook
    ler = lambda n: open(os.path.join(pasta, n), encoding='utf-8').read()
    wc, dc = carteira(ler('carteira.txt'), Workbook)
    wf, df = faturamento(ler('faturamento.txt'), Workbook)
    wp, dp = comparativo(ler('comparativo.txt'), Workbook)
    data = max(dc, df, dp); s = data.strftime('%d%m%y')
    os.makedirs(saida, exist_ok=True)
    for wb, nome in ((wc, f'LS Fire_Carteira de Faturamento_Data {s}.xlsx'), (wf, f'LS Fire_Faturamento Mensal_data {s}.xlsx'),
                     (wp, f'LS Fire_Comparativo Pedidos e Faturamento_Data {s}.xlsx')):
        wb.save(os.path.join(saida, nome)); print('gravado', nome)
    print('DATA', data.strftime('%Y-%m-%d'))


if __name__ == '__main__':
    main()
