#!/usr/bin/env python3
"""Coleta da Lista "Controle de Projetos e Pedidos" (SharePoint/Teams) pela API do Microsoft Graph,
somente leitura, para o Painel Executivo.

Gera API-SharePoint_Controle_de_Projetos_e_Pedidos.xlsx com as mesmas colunas da exportação manual
da Lista (os nomes que aparecem na tela), que o importador do painel reconhece como Controle de Pedidos.

Acesso: um aplicativo registrado no Microsoft Entra da LS Fire, com permissão de LEITURA do SharePoint
(Sites.Selected com leitura só no site Comercial, ou Sites.Read.All). As credenciais não ficam no código:
  MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET   (variáveis de ambiente)
Opcional: SP_SITE (padrão lsfirebr.sharepoint.com:/sites/Comercial) e SP_LISTA (padrão Controle de Projetos e Pedidos).

Chamadas feitas: um POST para obter o token (login.microsoftonline.com) e GETs no Graph
(site, listas, colunas, itens). Nada é criado, alterado ou apagado.

Uso:  python3 -I ferramentas/sharepoint_coletar.py <pasta de saída>
"""
import json, os, re, ssl, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

GRAPH = 'https://graph.microsoft.com/v1.0'
SITE = os.environ.get('SP_SITE', 'lsfirebr.sharepoint.com:/sites/Comercial')
LISTA = os.environ.get('SP_LISTA', 'Controle de Projetos e Pedidos')
ARQ = 'API-SharePoint_Controle_de_Projetos_e_Pedidos.xlsx'
BRT = timezone(timedelta(hours=-3))   # Brasília (sem horário de verão desde 2019)
MINIMO = 50                          # menos linhas que isso = algo errado: não grava
# colunas internas do SharePoint que não são dados do Controle
SISTEMA = {'ContentType', 'Attachments', 'Edit', 'LinkTitle', 'LinkTitleNoMenu', 'DocIcon', 'ItemChildCount',
           'FolderChildCount', '_ComplianceFlags', '_ComplianceTag', '_ComplianceTagWrittenTime', '_ComplianceTagUserId',
           '_IsRecord', 'AppAuthor', 'AppEditor', '_UIVersionString', '_ColorTag', 'ComplianceAssetId'}


def ctx():
    c = ssl.create_default_context()
    for f in (os.environ.get('SSL_CERT_FILE'), '/root/.ccr/ca-bundle.crt'):
        if f and os.path.exists(f):
            c.load_verify_locations(f)
            break
    return c


class _SemRedirecionar(urllib.request.HTTPRedirectHandler):
    """Redirecionamento é recusado: o token nunca segue para outro endereço."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SystemExit(f'resposta de redirecionamento {code}: coleta interrompida')


ABRIR = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx()), _SemRedirecionar()).open


def credenciais():
    v = {k: os.environ.get(k, '').strip() for k in ('MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET')}
    falta = [k for k, x in v.items() if not x]
    if falta:
        raise SystemExit('Faltam as variáveis de ambiente: ' + ', '.join(falta))
    return v


def token(cred):
    corpo = urllib.parse.urlencode({'client_id': cred['MS_CLIENT_ID'], 'client_secret': cred['MS_CLIENT_SECRET'],
                                    'scope': 'https://graph.microsoft.com/.default', 'grant_type': 'client_credentials'}).encode()
    url = f"https://login.microsoftonline.com/{urllib.parse.quote(cred['MS_TENANT_ID'])}/oauth2/v2.0/token"
    try:
        with ABRIR(urllib.request.Request(url, data=corpo, method='POST'), timeout=60) as r:
            return json.load(r)['access_token']
    except urllib.error.HTTPError as e:   # a mensagem do Entra não traz o segredo
        raise SystemExit(f'login no Microsoft recusado ({e.code}): {e.read()[:300]!r}')


class Graph:
    def __init__(self, tk):
        self.tk = tk

    def get(self, caminho):
        url = caminho if caminho.startswith('https://') else GRAPH + caminho
        if not url.startswith(GRAPH + '/'):
            raise SystemExit('endereço fora do Graph: coleta interrompida')
        for tent in range(5):
            try:
                req = urllib.request.Request(url, method='GET', headers={'Authorization': 'Bearer ' + self.tk, 'Accept': 'application/json',
                                                                         'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'})
                with ABRIR(req, timeout=120) as r:
                    return json.load(r)
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and tent < 4:
                    time.sleep(int(e.headers.get('Retry-After') or 2 ** (tent + 1))); continue
                msg = e.read()[:300]
                if e.code in (401, 403):
                    raise SystemExit(f'Graph recusou o acesso ({e.code}) em {caminho[:80]}: a permissão de leitura do site foi concedida? {msg!r}')
                raise SystemExit(f'Graph respondeu {e.code} em {caminho[:80]}: {msg!r}')
            except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError):
                if tent < 4:
                    time.sleep(2 ** (tent + 1)); continue
                raise

    def todos(self, caminho):
        out, url = [], caminho
        while url:
            j = self.get(url); out += j.get('value', []); url = j.get('@odata.nextLink')
        return out


def norm(s):
    return unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower().strip()


def colunas_visiveis(cols):
    """Colunas de dados da Lista, na ordem em que o Graph as devolve (a ordem do formulário)."""
    out = []
    for c in cols:
        n = c.get('name', '')
        if c.get('hidden') or n in SISTEMA or n.startswith('_'):
            continue
        if c.get('readOnly') and n != 'Title':   # Criado, Modificado, Autor, ID…
            continue
        out.append(c)
    return out


def data_local(v):
    """'2026-11-26T03:00:00Z' (meia-noite de Brasília gravada em UTC) -> datetime local sem hora."""
    try:
        d = datetime.fromisoformat(str(v).replace('Z', '+00:00')).astimezone(BRT)
        return datetime(d.year, d.month, d.day)
    except ValueError:
        return v


def valor(c, f, usuarios, consultas):
    """Valor de uma coluna como aparece na tela da Lista."""
    n = c['name']
    if 'personOrGroup' in c:
        ids = f.get(n + 'LookupId')
        if isinstance(f.get(n), list):   # várias pessoas: mesmo formato da exportação da Lista, ["Nome 1","Nome 2"]
            nomes = [str(x.get('LookupValue') or usuarios.get(str(x.get('LookupId')), '')) for x in f[n]]
            return json.dumps(nomes, ensure_ascii=False) if nomes else None
        return usuarios.get(str(ids), '') if ids not in (None, '') else None
    if 'lookup' in c:
        if isinstance(f.get(n), list):
            return '; '.join(str(x.get('LookupValue', '')) for x in f[n])
        lid = f.get(n + 'LookupId')
        return consultas.get(n, {}).get(str(lid), '') if lid not in (None, '') else None
    v = f.get(n)
    if v is None:
        return None
    if isinstance(v, list):   # escolha múltipla
        return '; '.join(str(x) for x in v)
    if 'dateTime' in c:
        return data_local(v)
    if isinstance(v, dict):   # link/hiperlink e afins
        return v.get('Description') or v.get('Url') or json.dumps(v, ensure_ascii=False)
    return v


def montar(cols, itens, usuarios, consultas):
    vis = colunas_visiveis(cols)
    cab = [c.get('displayName') or c['name'] for c in vis]
    linhas = [[valor(c, it.get('fields', {}), usuarios, consultas) for c in vis] for it in itens]
    linhas = [l for l in linhas if any(x not in (None, '') for x in l)]
    return cab, linhas


def coletar(g):
    site = g.get('/sites/' + SITE)['id']
    listas = g.todos(f'/sites/{site}/lists?$select=id,name,displayName,system')
    alvo = next((l for l in listas if norm(l.get('displayName')) == norm(LISTA)), None)
    if not alvo:
        raise SystemExit(f'Lista "{LISTA}" não encontrada no site (listas visíveis: {len(listas)})')
    lid = alvo['id']
    cols = g.todos(f'/sites/{site}/lists/{lid}/columns')
    itens = g.todos(f'/sites/{site}/lists/{lid}/items?$expand=fields&$top=999')
    usuarios, consultas = {}, {}
    if any('personOrGroup' in c for c in colunas_visiveis(cols)):
        ul = next((l for l in listas if l.get('name') == 'users' or norm(l.get('displayName')) in ('user information list', 'lista de informacoes do usuario')), None)
        if ul:
            for u in g.todos(f"/sites/{site}/lists/{ul['id']}/items?$expand=fields($select=Title)&$top=999"):
                usuarios[str(u['id'])] = u.get('fields', {}).get('Title', '')
    for c in colunas_visiveis(cols):
        lk = c.get('lookup')
        if lk and lk.get('listId'):
            campo = lk.get('columnName') or 'Title'
            consultas[c['name']] = {str(x['id']): x.get('fields', {}).get(campo, '') for x in
                                    g.todos(f"/sites/{site}/lists/{lk['listId']}/items?$expand=fields($select={campo})&$top=999")}
    return montar(cols, itens, usuarios, consultas)


def gravar(cab, linhas, pasta):
    from openpyxl import Workbook
    wb = Workbook(); ws = wb.active; ws.title = 'Controle de Projetos e Pedidos'
    ws.append(cab)
    for l in linhas:
        ws.append(l)
    os.makedirs(pasta, exist_ok=True); arq = os.path.join(pasta, ARQ); wb.save(arq)
    return arq


def main():
    if len(sys.argv) < 2:
        print(__doc__); return
    t0 = time.time()
    g = Graph(token(credenciais()))
    cab, linhas = coletar(g)
    if len(linhas) < MINIMO:
        raise SystemExit(f'FALHA: a Lista veio com só {len(linhas)} linhas (mínimo {MINIMO}); nada gravado')
    obrig = [c for c in ('OV', 'Cliente', 'Valor', 'Divisão', 'Vendedor') if norm(c) not in {norm(x) for x in cab}]
    if obrig:
        raise SystemExit(f'FALHA: faltam colunas na Lista: {", ".join(obrig)} (colunas vistas: {", ".join(cab)})')
    arq = gravar(cab, linhas, sys.argv[1])
    print(f'Controle de Pedidos: {len(linhas)} linhas · {len(cab)} colunas · {os.path.basename(arq)} · em {round(time.time() - t0)} s')


if __name__ == '__main__':
    main()
