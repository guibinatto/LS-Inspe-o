#!/usr/bin/env python3
"""Omie (API) -> planilha de itens de venda no formato do export do Omie que o painel já importa.

Lê os JSON gravados por omie_coletar.py (pedidos, clientes, produtos, vendedores, notas,
departamentos, categorias, etapas, famílias) e grava uma planilha com UMA LINHA POR ITEM de
pedido de venda, com os MESMOS CABEÇALHOS do export "itens de venda" do Omie. O painel reconhece
a planilha como a base "Omie — itens de venda" sem nenhuma mudança no painel.

Pedidos cancelados ficam de fora. Não chama a API: só lê os arquivos da coleta.
A planilha tem dados de clientes: grave-a só em pasta fora do git (omie-coleta/ está no .gitignore).

Uso
  python3 -I ferramentas/omie_para_planilha.py <pasta da coleta> [saída.xlsx]
  (saída padrão: <pasta da coleta>/API-Omie_Itens.xlsx)
"""
import datetime as _dt, json, os, re, sys

# cabeçalhos do export "itens de venda" do Omie, na ordem em que o Omie os grava
CABECALHOS = [
    'ORDEM DE VENDA', 'Cliente (Nome Fantasia)', 'Previsão de Faturamento (completa)', 'Operação', 'Situação',
    'Quantidade', 'Total de Mercadoria', 'Total da Nota Fiscal', 'Etapa', 'Descrição do Produto',
    'Descrição do Produto (completa)', 'Observações do Item do Pedido',
    'Característica do Cliente - Agente de Negocio', 'Característica do Cliente - Segmento',
    'Data de Inclusão.Ano', 'Data de Inclusão.Dia', 'Data de Inclusão.Mês', 'Nº do Pedido do Cliente', 'Vendedor',
    'Departamento', 'Previsão de Faturamento.Ano', 'Previsão de Faturamento.Dia', 'Previsão de Faturamento.Mês',
    'Número da OP', 'Número de Parcelas', 'Número do Pedido de Compra', 'Sequencial', 'Série', 'Situação da OP',
    'Código da Família', 'Código do Produto', 'Dias de Garantia', 'Estado', 'Etapa da OP', 'Família de Produto',
    'Frete', 'Incluído por', 'Item', 'Nº do Contrato de Venda', 'Nota Fiscal', 'Tipo do Produto', 'Categoria',
]
MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro',
         'Novembro', 'Dezembro']
# tabela do SPED (tipo do item), no formato do export: "04 - Produto Acabado"
TIPOS_ITEM = {'00': 'Mercadoria para Revenda', '01': 'Matéria Prima', '02': 'Embalagem', '03': 'Produto em Processo',
              '04': 'Produto Acabado', '05': 'Subproduto', '06': 'Produto Intermediário',
              '07': 'Material de Uso e Consumo', '08': 'Ativo Imobilizado', '09': 'Serviços',
              '10': 'Outros Insumos', '99': 'Outras'}
OPERACAO_VENDA_PRODUTO = '11'   # código da operação "Venda de Produto" em ListarEtapasFaturamento
ND = 'N/D'
PROJETO = re.compile(r'^\d{3}-[A-Z]{3}-\d{5}')   # código de projeto no nome do departamento


def ler(pasta, nome, obrigatorio=True):
    arq = os.path.join(pasta, f'omie-{nome}.json')
    if not os.path.exists(arq):
        if obrigatorio:
            sys.exit(f'falta {arq} — rode antes: python3 -I ferramentas/omie_coletar.py coletar {pasta}')
        print(f'  aviso: {arq} não encontrado; os campos que dependem dele saem vazios')
        return []
    with open(arq, encoding='utf-8') as f:
        return json.load(f)


def data(s):
    try:
        return _dt.datetime.strptime((s or '').strip(), '%d/%m/%Y').date()
    except ValueError:
        return None


def txt(v):
    return '' if v is None else str(v).strip()


def nome_categoria(descr):
    """'Venda de Produtos Fabricados (Venda de Mercadorias Fabricadas)' -> 'Venda de Mercadorias Fabricadas',
    que é como o export do Omie mostra a categoria; sem parênteses, fica como está."""
    m = re.search(r'\(\s*([^()]+?)\s*\)\s*$', descr or '')
    return m.group(1) if m else (descr or '')


def montar(pasta, hoje=None):
    hoje = hoje or _dt.date.today()
    pedidos = ler(pasta, 'pedidos')
    clientes = {c.get('codigo_cliente_omie'): c for c in ler(pasta, 'clientes')}
    produtos = {p.get('codigo_produto'): p for p in ler(pasta, 'produtos')}
    vendedores = {v.get('codigo'): txt(v.get('nome')) for v in ler(pasta, 'vendedores', False)}
    departamentos = {txt(d.get('codigo')): txt(d.get('descricao')) for d in ler(pasta, 'departamentos', False)}
    categorias = {txt(c.get('codigo')): nome_categoria(txt(c.get('descricao'))) for c in ler(pasta, 'categorias', False)}
    familias = {f.get('codigo'): f for f in ler(pasta, 'familias', False)}
    etapas = {}
    for op in ler(pasta, 'etapas', False):
        if txt(op.get('cCodOperacao')) == OPERACAO_VENDA_PRODUTO:
            etapas = {txt(e.get('cCodigo')): txt(e.get('cDescricao') or e.get('cDescrPadrao')) for e in op.get('etapas') or []}
    # nota fiscal de cada pedido (a mais recente não cancelada)
    nf_do_pedido = {}
    for n in ler(pasta, 'notas', False):
        ide, compl = n.get('ide') or {}, n.get('compl') or {}
        ped = compl.get('nIdPedido')
        if not ped or txt(ide.get('dCan')) or txt(ide.get('tpNF')) == '0':
            continue
        nf_do_pedido[ped] = txt(ide.get('nNF'))

    linhas, cancelados = [], 0
    for p in pedidos:
        cab, info = p.get('cabecalho') or {}, p.get('infoCadastro') or {}
        if txt(info.get('cancelado')) == 'S':
            cancelados += 1
            continue
        adic = p.get('informacoes_adicionais') or {}
        cli = clientes.get(cab.get('codigo_cliente')) or {}
        prev, inc = data(cab.get('data_previsao')), data(info.get('dInc'))
        faturado = txt(info.get('faturado')) == 'S'
        if faturado:
            situacao = 'Faturado'
        elif prev and prev < hoje:
            situacao = 'Faturamento atrasado'
        else:
            situacao = 'Aguardando faturamento'
        cod_etapa = txt(cab.get('etapa'))
        # rateio por departamento: fica o de maior %; no empate, o código de projeto (ex. 017-IRR-09544),
        # que o painel usa para não contar duas vezes a mesma venda faturada em várias OVs
        deps = [(d.get('nPerc') or 0, departamentos.get(txt(d.get('cCodDepto')), txt(d.get('cCodDepto'))))
                for d in p.get('departamentos') or []]
        deps.sort(key=lambda d: (-d[0], not PROJETO.match(d[1])))
        depto = deps[0][1] if deps else ''
        nf = nf_do_pedido.get(cab.get('codigo_pedido')) if faturado else None
        for i, det in enumerate(p.get('det') or [], 1):
            prod, ia = det.get('produto') or {}, det.get('inf_adic') or {}
            cad = produtos.get(prod.get('codigo_produto')) or {}
            fam = familias.get(cad.get('codigo_familia')) or {}
            tipo = txt(cad.get('tipoItem'))
            cat = txt(ia.get('codigo_categoria_item')) or txt(adic.get('codigo_categoria'))
            codigo, descr = txt(prod.get('codigo')), txt(prod.get('descricao'))
            linha = {
                'ORDEM DE VENDA': txt(cab.get('numero_pedido')),
                'Cliente (Nome Fantasia)': txt(cli.get('nome_fantasia')) or txt(cli.get('razao_social')),
                'Previsão de Faturamento (completa)': txt(cab.get('data_previsao')),
                'Operação': 'ORDEM DE VENDA',
                'Situação': situacao,
                'Quantidade': prod.get('quantidade'),
                'Total de Mercadoria': prod.get('valor_mercadoria'),
                'Total da Nota Fiscal': prod.get('valor_total'),
                'Etapa': etapas.get(cod_etapa) or cod_etapa,
                'Descrição do Produto': descr,
                'Descrição do Produto (completa)': f'{codigo} - {descr}' if codigo else descr,
                'Observações do Item do Pedido': txt((det.get('observacao') or {}).get('obs_item')),
                'Data de Inclusão.Ano': inc.year if inc else None,
                'Data de Inclusão.Dia': inc.day if inc else None,
                'Data de Inclusão.Mês': MESES[inc.month - 1] if inc else '',
                'Nº do Pedido do Cliente': txt(adic.get('numero_pedido_cliente')),
                'Vendedor': vendedores.get(adic.get('codVend'), ''),
                'Departamento': depto or ND,
                'Previsão de Faturamento.Ano': prev.year if prev else None,
                'Previsão de Faturamento.Dia': prev.day if prev else None,
                'Previsão de Faturamento.Mês': MESES[prev.month - 1] if prev else '',
                'Número de Parcelas': cab.get('qtde_parcelas'),
                'Número do Pedido de Compra': txt(ia.get('numero_pedido_compra')),
                'Sequencial': txt(cab.get('sequencial')),
                'Código da Família': txt(fam.get('codFamilia')) or ND,
                'Código do Produto': codigo,
                'Dias de Garantia': cad.get('dias_garantia'),
                'Estado': txt(cli.get('estado')),
                'Família de Produto': txt(fam.get('nomeFamilia')) or txt(cad.get('descricao_familia')) or ND,
                'Incluído por': txt(info.get('uInc')),
                'Item': i,
                'Nº do Contrato de Venda': txt(adic.get('numero_contrato')),
                'Nota Fiscal': nf.zfill(8) if nf else ND,
                'Tipo do Produto': f'{tipo} - {TIPOS_ITEM[tipo]}' if tipo in TIPOS_ITEM else (tipo or ND),
                'Categoria': categorias.get(cat, cat),
            }
            linhas.append([linha.get(c) for c in CABECALHOS])
    return linhas, len(pedidos), cancelados


def gravar(linhas, saida):
    from openpyxl import Workbook
    wb = Workbook(); ws = wb.active; ws.title = 'Itens de venda'
    ws.append(CABECALHOS)
    for l in linhas:
        ws.append(['' if v is None else v for v in l])
    wb.save(saida)


def main():
    if len(sys.argv) < 2:
        print(__doc__); return
    pasta = sys.argv[1]
    saida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(pasta, 'API-Omie_Itens.xlsx')
    linhas, n_ped, canc = montar(pasta)
    gravar(linhas, saida)
    print(f'ok: {len(linhas)} itens de {n_ped - canc} pedidos ({canc} cancelados fora) -> {saida}')


if __name__ == '__main__':
    main()
