#!/usr/bin/env python3
"""Coletor do Omie — SOMENTE LEITURA.

Lê pedidos de venda (com itens), clientes, produtos, projetos, vendedores, notas fiscais,
ordens de serviço, contratos, departamentos, categorias, etapas de faturamento e famílias pela
API do Omie e grava cada um em JSON, para o painel importar.

Segurança
- As chaves vêm só das variáveis de ambiente OMIE_APP_KEY e OMIE_APP_SECRET (configuradas no
  ambiente do Claude, nunca no código, no git ou em arquivo). O coletor nunca as imprime.
- Só chama métodos da lista PERMITIDOS abaixo, todos de consulta (Listar…/Consultar…/Pesquisar…).
  Qualquer outro método é recusado antes de sair — não há como incluir, alterar ou excluir.
- A mesma chave é usada pela integração Ploomes ↔ Omie (webhook): NÃO gere chave nova sem
  atualizar também a integração do Ploomes.

Uso
  python3 -I ferramentas/omie_coletar.py testar           # 1 chamada: confirma que as chaves funcionam
  python3 -I ferramentas/omie_coletar.py coletar <pasta>  # coleta tudo em <pasta>/omie-*.json
  python3 -I ferramentas/omie_coletar.py coletar <pasta> pedidos clientes   # só algumas bases
  python3 -I ferramentas/omie_coletar.py coletar <pasta> --anexos-anteriores <base.json>   # anexos incrementais

Velocidade
- As bases são buscadas em paralelo (OMIE_PARALELO, padrão 4). O Omie não aceita duas chamadas do
  MESMO método ao mesmo tempo ("Já existe uma requisição desse método sendo executada"), então as
  páginas de uma base e os anexos seguem um de cada vez; se o Omie pedir, espera e tenta de novo.
- Anexos incrementais (--anexos-anteriores, com a base omieAnexos do painel publicado, gerada por
  `node ferramentas/dados.js base <dados.json> omieAnexos <arquivo>`): só consulta de novo os
  documentos incluídos ou alterados nos últimos 60 dias, os sem anexo dos últimos 180 dias e todos
  os contratos; dos demais, repete os anexos que o painel já tinha. Sem o arquivo, consulta todos.
"""
import json, os, sys, time, threading, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
PARALELO = max(1, int(os.environ.get('OMIE_PARALELO', '4') or 4))   # bases ao mesmo tempo
_impr = threading.Lock()
def log(msg):
    with _impr:
        print(msg, flush=True)

URL = 'https://app.omie.com.br/api/v1/'
# base -> (caminho, método, chave da lista na resposta, registros por página, parâmetros extras)
PERMITIDOS = {
    'pedidos':    ('produtos/pedido/',     'ListarPedidos',    'pedido_venda_produto',     50,  {'apenas_importado_api': 'N'}),
    # exibir_caracteristicas traz as características do cliente (ex.: Agente de Negócio, Segmento)
    'clientes':   ('geral/clientes/',      'ListarClientes',   'clientes_cadastro',        500, {'apenas_importado_api': 'N', 'exibir_caracteristicas': 'S'}),
    'produtos':   ('geral/produtos/',      'ListarProdutos',   'produto_servico_cadastro', 500, {'apenas_importado_api': 'N', 'filtrar_apenas_omiepdv': 'N'}),
    'projetos':   ('geral/projetos/',      'ListarProjetos',   'cadastro',                 500, {}),
    'vendedores': ('geral/vendedores/',    'ListarVendedores', 'cadastro',                 500, {}),
    'notas':      ('produtos/nfconsultar/', 'ListarNF',        'nfCadastro',               100, {}),
    'os':         ('servicos/os/',         'ListarOS',         'osCadastro',               100, {}),
    'contratos':  ('servicos/contrato/',   'ListarContratos',  'contratoCadastro',         100, {}),
    # cadastros auxiliares, para traduzir códigos em nomes (omie_para_planilha.py)
    'departamentos': ('geral/departamentos/', 'ListarDepartamentos',     'departamentos',      500, {}),
    'categorias':    ('geral/categorias/',    'ListarCategorias',        'categoria_cadastro', 500, {}),
    'etapas':        ('produtos/etapafat/',   'ListarEtapasFaturamento', 'cadastros',          100, {}),
    'familias':      ('geral/familias/',      'PesquisarFamilias',       'famCadastro',        500, {}),
    # anexos (só os nomes dos arquivos) das vendas, contratos e OS: uma consulta por documento,
    # depois de coletados pedidos, contratos e os — ver coletar_anexos()
    'anexos':        ('geral/anexo/',         'ListarAnexo',             'listaAnexos',        50,  {}),
}
METODOS_OK = {m for _, m, _, _, _ in PERMITIDOS.values()}
PREFIXOS_CONSULTA = ('Listar', 'Consultar', 'Pesquisar')


def chaves():
    k, s = os.environ.get('OMIE_APP_KEY', '').strip(), os.environ.get('OMIE_APP_SECRET', '').strip()
    if not k or not s:
        sys.exit('Faltam as variáveis OMIE_APP_KEY e OMIE_APP_SECRET neste ambiente (abra uma sessão nova depois de salvá-las).')
    return k, s


def chamar(caminho, metodo, param, tentativas=6):
    """Uma chamada à API. Recusa qualquer método fora da lista de consulta."""
    if metodo not in METODOS_OK or not metodo.startswith(PREFIXOS_CONSULTA):
        raise PermissionError(f'método {metodo!r} não é de consulta — recusado')
    k, s = chaves()
    corpo = json.dumps({'call': metodo, 'app_key': k, 'app_secret': s, 'param': [param]}).encode()
    espera = 2
    for t in range(tentativas):
        req = urllib.request.Request(URL + caminho, data=corpo, headers={'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            txt = e.read().decode('utf-8', 'replace')
            try:
                j = json.loads(txt)
            except ValueError:
                j = {'faultstring': txt[:300]}
            msg = str(j.get('faultstring', ''))
            if 'Não existem registros' in msg or 'não existem registros' in msg.lower():
                return {'pagina': 1, 'total_de_paginas': 0, 'registros': 0}
            # limite de consumo do Omie: espera e tenta de novo
            if e.code in (425, 429, 500, 503) and ('consumo' in msg.lower() or 'aguarde' in msg.lower() or 'bloque' in msg.lower() or 'sendo executada' in msg.lower() or e.code != 500):
                time.sleep(espera); espera = min(espera * 2, 60); continue
            raise RuntimeError(f'{metodo}: {msg[:300]}') from None
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(espera); espera = min(espera * 2, 60)
    raise RuntimeError(f'{metodo}: sem resposta depois de {tentativas} tentativas')


def coletar_base(nome):
    caminho, metodo, lista, por_pag, extra = PERMITIDOS[nome]
    def pagina(pag):
        r = chamar(caminho, metodo, dict(extra, pagina=pag, registros_por_pagina=por_pag))
        achou = r.get(lista)
        if not isinstance(achou, list):   # chave diferente da esperada: usa a primeira lista da resposta
            achou = next((v for v in r.values() if isinstance(v, list)), [])
        return r, achou
    r, regs = pagina(1)
    total = r.get('total_de_paginas', 0) or 0
    for pag in range(2, total + 1):   # mesmo método: uma página de cada vez
        time.sleep(0.2)
        _, achou = pagina(pag); regs += achou
        if pag % 10 == 0 or pag == total:
            log(f'  {nome}: página {pag}/{total} · {len(regs)} registros')
    esperado = r.get('total_de_registros')
    if esperado is not None and esperado != len(regs):
        log(f'  ATENÇÃO {nome}: Omie informou {esperado} registros, vieram {len(regs)}')
    return regs


TABELA_ROTULO = {'Pedido de venda': 'pedido-venda', 'Contrato de serviço': 'contrato-servico', 'Ordem de serviço': 'ordem-servico'}


def coletar_anexos(pasta, meses=36, anteriores=None, dias_novos=60, dias_sem_anexo=180):
    """Lista os anexos (nome, tipo, data) de cada venda, contrato e OS já coletados na pasta.
    Só consulta (ListarAnexo); vendas canceladas e mais antigas que `meses` ficam de fora.
    Com `anteriores` ({cols, rows} da base omieAnexos do painel), é incremental: consulta de novo
    só os documentos recentes (incluídos/alterados em `dias_novos`), os sem anexo de
    `dias_sem_anexo` e os contratos; dos demais, repete os anexos já conhecidos."""
    import datetime as _dt
    hoje = _dt.date.today(); lim = hoje - _dt.timedelta(days=30 * meses)
    def ler(nome):
        arq = os.path.join(pasta, f'omie-{nome}.json')
        return json.load(open(arq, encoding='utf-8')) if os.path.exists(arq) else []
    def data(s):
        try:
            return _dt.datetime.strptime((s or '').strip(), '%d/%m/%Y').date()
        except ValueError:
            return None
    conhecidos = {}
    if anteriores:
        cols = anteriores.get('cols') or []
        ix = {c: i for i, c in enumerate(cols)}
        for row in anteriores.get('rows') or []:
            g = lambda c: row[ix[c]] if c in ix and ix[c] < len(row) else None
            tab = TABELA_ROTULO.get(g('Tabela do Anexo'), g('Tabela do Anexo'))
            conhecidos.setdefault((tab, str(g('Número do Documento') or '').strip()), []).append(
                {'arquivo': g('Arquivo Anexado'), 'tipo': g('Tipo do Arquivo'), 'data': g('Data do Anexo')})
    alvos = []   # (tabela, id, número, cliente, data mais recente de inclusão/alteração)
    for p in ler('pedidos'):
        cab, inf = p.get('cabecalho') or {}, p.get('infoCadastro') or {}
        d = data(inf.get('dInc'))
        if (inf.get('cancelado') or '') == 'S' or (d and d < lim):
            continue
        alvos.append(('pedido-venda', cab.get('codigo_pedido'), cab.get('numero_pedido'), cab.get('codigo_cliente'), max(filter(None, [d, data(inf.get('dAlt'))]), default=None)))
    for c in ler('contratos'):
        cab = c.get('cabecalho') or {}
        alvos.append(('contrato-servico', cab.get('nCodCtr'), cab.get('cNumCtr'), cab.get('nCodCli'), hoje))
    for o in ler('os'):
        cab, inf = o.get('Cabecalho') or {}, o.get('InfoCadastro') or {}
        alvos.append(('ordem-servico', cab.get('nCodOS'), cab.get('cNumOS'), cab.get('nCodCli'), max(filter(None, [data(inf.get('dDtInc')), data(inf.get('dDtAlt'))]), default=None)))
    alvos = [a for a in alvos if a[1]]
    def consultar(a):
        tab, nid, num, cli, _ = a
        try:
            r = chamar('geral/anexo/', 'ListarAnexo', {'cTabela': tab, 'nId': nid, 'nPagina': 1, 'nRegPorPagina': 50})
        except RuntimeError as e:   # documento apagado no Omie depois da listagem: sem anexos
            if 'não cadastrado' in str(e).lower() or 'nao cadastrado' in str(e).lower():
                return []
            raise
        return [{'tabela': tab, 'nId': nid, 'numero': num, 'codigo_cliente': cli, 'arquivo': x.get('cNomeArquivo'),
                 'tipo': x.get('cTipoArquivo'), 'data': x.get('dInclusao') or x.get('dInc') or ''} for x in r.get('listaAnexos') or []]
    regs, consultar_ja = [], []
    for a in alvos:
        tab, nid, num, cli, quando = a
        ant = conhecidos.get((tab, str(num or '').strip()))
        recente = quando is None or (hoje - quando).days <= (dias_novos if ant else dias_sem_anexo)
        if anteriores is None or recente:
            consultar_ja.append(a)
        elif ant:
            regs += [dict(x, tabela=tab, nId=nid, numero=num, codigo_cliente=cli) for x in ant]
    reaproveitados = len(regs)
    for i, a in enumerate(consultar_ja, 1):   # mesmo método: um documento de cada vez
        regs += consultar(a)
        if i % 50 == 0:
            log(f'  anexos: {i}/{len(consultar_ja)} documentos consultados · {len(regs)} anexos')
        time.sleep(0.15)
    log(f'  anexos: {len(consultar_ja)} documentos consultados de {len(alvos)}' + (f' ({reaproveitados} anexos repetidos do painel)' if anteriores is not None else '') + f' · {len(regs)} anexos')
    return regs


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'testar':
        r = chamar('geral/clientes/', 'ListarClientes', {'pagina': 1, 'registros_por_pagina': 1, 'apenas_importado_api': 'N'})
        print('Omie conectado (somente leitura): ', r.get('total_de_registros'), 'clientes cadastrados')
        return
    if cmd == 'coletar' and len(sys.argv) >= 3:
        pasta, args = sys.argv[2], sys.argv[3:]
        anteriores = None
        if '--anexos-anteriores' in args:
            i = args.index('--anexos-anteriores'); arq = args[i + 1] if i + 1 < len(args) else ''
            args = args[:i] + args[i + 2:]
            if arq and os.path.exists(arq):
                anteriores = json.load(open(arq, encoding='utf-8'))
        quais = args or list(PERMITIDOS)
        os.makedirs(pasta, exist_ok=True)
        for nome in quais:
            if nome not in PERMITIDOS:
                sys.exit(f'base desconhecida: {nome} (use: {", ".join(PERMITIDOS)})')
        resumo, t0 = {}, time.time()
        def uma(nome):
            t = time.time()
            regs = coletar_anexos(pasta, anteriores=anteriores) if nome == 'anexos' else coletar_base(nome)
            with open(os.path.join(pasta, f'omie-{nome}.json'), 'w', encoding='utf-8') as f:
                json.dump(regs, f, ensure_ascii=False)
            log(f'  {nome}: {len(regs)} registros em {time.time() - t:.0f} s')
            return nome, len(regs)
        # bases em paralelo, as mais demoradas primeiro; os anexos só dependem de pedidos, contratos
        # e OS: começam assim que essas três terminam, junto com produtos e notas
        ordem = sorted([n for n in quais if n != 'anexos'], key=lambda n: ['produtos', 'notas', 'pedidos', 'os', 'contratos'].index(n) if n in ('produtos', 'notas', 'pedidos', 'os', 'contratos') else 9)
        with ThreadPoolExecutor(PARALELO) as ex:
            fut = {n: ex.submit(uma, n) for n in ordem}
            if 'anexos' in quais:
                deps = [fut[n] for n in ('pedidos', 'contratos', 'os') if n in fut]
                fut['anexos'] = ex.submit(lambda: ([d.result() for d in deps], uma('anexos'))[1])
            for n, f in fut.items():
                k, v = f.result(); resumo[k] = v
        with open(os.path.join(pasta, 'omie-coleta.json'), 'w', encoding='utf-8') as f:
            json.dump({'em': time.strftime('%Y-%m-%dT%H:%M:%S'), 'registros': resumo, 'segundos': round(time.time() - t0)}, f)
        print('ok', resumo, f'em {time.time() - t0:.0f} s')
        return
    print(__doc__)


if __name__ == '__main__':
    main()
