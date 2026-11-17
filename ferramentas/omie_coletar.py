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
"""
import json, os, sys, time, urllib.request, urllib.error

URL = 'https://app.omie.com.br/api/v1/'
# base -> (caminho, método, chave da lista na resposta, registros por página, parâmetros extras)
PERMITIDOS = {
    'pedidos':    ('produtos/pedido/',     'ListarPedidos',    'pedido_venda_produto',     50,  {'apenas_importado_api': 'N'}),
    'clientes':   ('geral/clientes/',      'ListarClientes',   'clientes_cadastro',        500, {'apenas_importado_api': 'N'}),
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
            if e.code in (425, 429, 500, 503) and ('consumo' in msg.lower() or 'aguarde' in msg.lower() or 'bloque' in msg.lower() or e.code != 500):
                time.sleep(espera); espera = min(espera * 2, 60); continue
            raise RuntimeError(f'{metodo}: {msg[:300]}') from None
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(espera); espera = min(espera * 2, 60)
    raise RuntimeError(f'{metodo}: sem resposta depois de {tentativas} tentativas')


def coletar_base(nome):
    caminho, metodo, lista, por_pag, extra = PERMITIDOS[nome]
    regs, pag, total = [], 1, None
    while True:
        r = chamar(caminho, metodo, dict(extra, pagina=pag, registros_por_pagina=por_pag))
        total = r.get('total_de_paginas', 0) or 0
        achou = r.get(lista)
        if not isinstance(achou, list):   # chave diferente da esperada: usa a primeira lista da resposta
            achou = next((v for v in r.values() if isinstance(v, list)), [])
        regs += achou
        print(f'  {nome}: página {pag}/{total} · {len(regs)} registros', flush=True)
        if pag >= total:
            break
        pag += 1
        time.sleep(0.4)   # gentil com o limite de chamadas do Omie
    esperado = r.get('total_de_registros')
    if esperado is not None and esperado != len(regs):
        print(f'  ATENÇÃO {nome}: Omie informou {esperado} registros, vieram {len(regs)}', flush=True)
    return regs


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'testar':
        r = chamar('geral/clientes/', 'ListarClientes', {'pagina': 1, 'registros_por_pagina': 1, 'apenas_importado_api': 'N'})
        print('Omie conectado (somente leitura): ', r.get('total_de_registros'), 'clientes cadastrados')
        return
    if cmd == 'coletar' and len(sys.argv) >= 3:
        pasta, quais = sys.argv[2], sys.argv[3:] or list(PERMITIDOS)
        os.makedirs(pasta, exist_ok=True)
        resumo = {}
        for nome in quais:
            if nome not in PERMITIDOS:
                sys.exit(f'base desconhecida: {nome} (use: {", ".join(PERMITIDOS)})')
            regs = coletar_base(nome)
            with open(os.path.join(pasta, f'omie-{nome}.json'), 'w', encoding='utf-8') as f:
                json.dump(regs, f, ensure_ascii=False)
            resumo[nome] = len(regs)
        with open(os.path.join(pasta, 'omie-coleta.json'), 'w', encoding='utf-8') as f:
            json.dump({'em': time.strftime('%Y-%m-%dT%H:%M:%S'), 'registros': resumo}, f)
        print('ok', resumo)
        return
    print(__doc__)


if __name__ == '__main__':
    main()
