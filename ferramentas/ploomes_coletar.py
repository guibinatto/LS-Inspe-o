#!/usr/bin/env python3
"""Coleta do Ploomes pela API (somente leitura) para o Painel Executivo.

Gera as mesmas planilhas que hoje são exportadas à mão do Ploomes, com as
colunas que o importador do painel reconhece:
  Negocios_Todos.xlsx, Propostas_Todas.xlsx (cabeçalho, todas as revisões),
  Propostas_Itens.xlsx (produtos de cada proposta), Empresas.xlsx,
  Interacoes.xlsx e Vendas.xlsx.

Só faz GET. A chave (User-Key) não fica no código:
  - na sessão do Claude, a rede injeta a chave salva no ambiente;
  - em outro computador, defina PLOOMES_USER_KEY antes de rodar.

Uso:  python3 -I ferramentas/ploomes_coletar.py <pasta de saída>
"""
import json, os, ssl, sys, time, urllib.parse, urllib.request
from datetime import datetime

API = 'https://api2.ploomes.com'
CHAVE = os.environ.get('PLOOMES_USER_KEY') or 'proxy-injected'
PAG = 300

# campos personalizados (Key no Ploomes)
D = {  # negócio
    'obra': 'deal_D0A1AEED-D22C-4445-8B38-AE5C3D49733A', 'cidadeObra': 'deal_3EADACD0-CEFE-449B-AFDD-1FF94802E77C',
    'statusObra': 'deal_9DFC5A62-D229-443C-9517-A1FC2F97C95F', 'previsao': 'deal_A97EB828-4EB9-4286-B161-C2012BB6FBF9',
    'vendaGanha': 'deal_B22DA22B-FDF4-478F-9766-5D2B28B6DE32', 'dtConversao': 'deal_758BE008-E7FD-491B-8DCE-7E6A566521BD',
    'divisao': 'deal_19B61C98-7020-4344-B6CA-5D83602EB35B', 'norma': 'deal_395507DF-51CD-4CA0-81ED-5B0857D5CFD7',
    'agente': 'deal_11A6C0E5-FAD3-4AB1-874A-1665A4F016E1', 'pedido': 'deal_92BCE2F8-1920-4467-ADCA-1E80C78F4352',
    'comissao': 'deal_768FA788-FA97-4DA4-A755-58CE9E4984E7', 'cadencia': 'deal_185F9859-1A81-4CCA-BBDB-B200440B9626',
}
Q = {'condPag': 'quote_88C0CB57-FAA9-4C4F-BE76-25E0E92026DE'}
QP = {'vazaoNom': '', 'vazaoProj': '', 'pressao': ''}   # produto da proposta: chaves lidas pelo nome do campo
C = {'ie': 'contact_9EB4654B-0871-4DDF-B5F6-85EDA44493E4', 'situacao': 'contact_778FE234-44D1-4BFC-B895-9CB21408A031'}
O = {'idVP': 'order_E9619B5A-2EFB-41EA-A71B-566A9C50872B', 'numVP': 'order_26E83148-6A52-4A72-8F89-827139C159D8'}


def ctx():
    c = ssl.create_default_context()
    for f in (os.environ.get('SSL_CERT_FILE'), '/root/.ccr/ca-bundle.crt'):
        if f and os.path.exists(f):
            c.load_verify_locations(f)
            break
    return c


CTX = ctx()


class _SemRedirecionar(urllib.request.HTTPRedirectHandler):
    """Redirecionamento é recusado: a chave (User-Key) nunca segue para outro endereço."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SystemExit(f'Ploomes respondeu redirecionamento {code} para {newurl}: coleta interrompida')


ABRIR = urllib.request.build_opener(urllib.request.HTTPSHandler(context=CTX), _SemRedirecionar()).open


def get(caminho, params):
    url = f"{API}/{caminho}?" + urllib.parse.urlencode(params, safe="$(),;=' ")
    for tent in range(4):
        try:
            req = urllib.request.Request(url, method='GET', headers={'User-Key': CHAVE, 'Accept': 'application/json'})
            with ABRIR(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and tent < 3:
                time.sleep(2 ** (tent + 1)); continue
            raise SystemExit(f'Ploomes respondeu {e.code} em {caminho}: {e.read()[:300]!r}')
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError):
            if tent < 3:   # rede instável ou leitura interrompida: tenta de novo
                time.sleep(2 ** (tent + 1)); continue
            raise


def contar(caminho, params):
    p = {k: v for k, v in params.items() if k == '$filter'}
    return get(caminho, dict(p, **{'$top': 0, '$count': 'true'})).get('@odata.count')


def todos(caminho, params):
    """Pagina por Id e confere o total: registros criados/apagados durante a coleta
    deslocariam as páginas e uma coleta incompleta seria publicada. Se o total não
    bater, coleta de novo; se ainda não bater, para."""
    for tent in range(2):
        esperado = contar(caminho, params)
        out, skip = [], 0
        while True:
            p = dict(params, **{'$top': PAG, '$skip': skip, '$orderby': 'Id'})
            v = get(caminho, p).get('value', [])
            out += v
            if len(v) < PAG:
                break
            skip += PAG
        ids = {x.get('Id') for x in out}
        if esperado is None or (len(ids) == len(out) == esperado):
            return out
    raise SystemExit(f'{caminho}: coleta com {len(out)} registros ({len(ids)} distintos) e o Ploomes informa {esperado}; dados mudaram durante a coleta — rode de novo')


def dt(s):
    """ISO com fuso → datetime local sem fuso (como o export)."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError:
        return None


def op(obj, chave):
    for o in obj.get('OtherProperties') or []:
        if o.get('FieldKey') == chave:
            for k in ('ObjectValueName', 'StringValue', 'BigStringValue', 'DecimalValue', 'IntegerValue', 'UserValueName', 'ContactValueName'):
                if o.get(k) not in (None, ''):
                    return o[k]
            if o.get('DateTimeValue'):
                return dt(o['DateTimeValue'])
            if o.get('BoolValue') is not None:
                return o['BoolValue']
    return None


import re as _re
_RX_MAIL = _re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')
_RX_FONE = _re.compile(r'(\+?55[\s.-]?)?\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b')


def sem_pessoais(t, lim=500):
    """Texto livre de interação (corpo de e-mail etc.): mascara e-mails e telefones de
    terceiros e limita o tamanho. O painel não usa esses dados; assim eles não circulam
    no painel publicado."""
    if not t:
        return t
    t = _RX_FONE.sub('[telefone]', _RX_MAIL.sub('[e-mail]', str(t)))
    return t if len(t) <= lim else t[:lim] + '…'


def nome(o, *ch):
    for c in ch:
        o = (o or {}).get(c)
    return o


def salvar(pasta, arq, cab, linhas):
    import openpyxl
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Ploomes'
    ws.append(cab)
    for l in linhas:
        ws.append([l.get(c) for c in cab])
        for cel in ws[ws.max_row]:   # texto do Ploomes que começa com "=" é TEXTO, não fórmula
            if isinstance(cel.value, str) and cel.value[:1] in '=+-@':
                cel.data_type = 's'
    wb.save(os.path.join(pasta, arq))
    return len(linhas)


def main(pasta):
    os.makedirs(pasta, exist_ok=True)
    t0 = time.time()
    # ---------- campos dos produtos da proposta (vazão, pressão) pelo nome ----------
    fs = get('Fields', {'$select': 'Name,Key,EntityId', '$filter': 'EntityId eq 14'}).get('value', [])
    porNome = {f['Name']: f['Key'] for f in fs}
    QP['vazaoNom'] = porNome.get('Vazão Nominal bomba | Curva de desempenho', '')
    QP['vazaoProj'] = porNome.get('Vazão de proj./ oper. | Curva de Desempenho', '')
    QP['pressao'] = porNome.get('Pressão diferencial | Curva de Desempenho', '')

    # ---------- propostas (todas as revisões) ----------
    quotes = todos('Quotes', {'$expand': "OtherProperties,Owner($select=Name),Person($select=Name),Template($select=Name),"
                              "Updater($select=Name),Contact($select=Name;$expand=State($select=Short)),"
                              "Products($select=ProductName,Quantity,UnitPrice,Total;$expand=OtherProperties)"})
    qPorId = {q['Id']: q for q in quotes}

    # ---------- negócios ----------
    deals = todos('Deals', {'$expand': "OtherProperties,Tags($expand=Tag($select=Name)),Owner($select=Name),Stage($select=Name),"
                            "LossReason($select=Name),Origin($select=Name),CollaboratingUsers($expand=User($select=Name)),"
                            "Contact($select=Name;$expand=City($select=Name),State($select=Short),LineOfBusiness($select=Name))"})
    dPorId = {d['Id']: d for d in deals}
    neg = []
    for d in deals:
        lq = qPorId.get(d.get('LastQuoteId')) or {}
        neg.append({
            'Id': d['Id'], 'Código da Proposta': lq.get('QuoteNumber'), 'Cliente': d.get('ContactName'),
            'Cidade do Cliente': nome(d, 'Contact', 'City', 'Name'), 'Estado do Cidade do Cliente': nome(d, 'Contact', 'State', 'Short'),
            'Cidade da Obra': op(d, D['cidadeObra']), 'Título': d.get('Title'), 'Status da Obra': op(d, D['statusObra']),
            'Marcadores': '; '.join(sorted({nome(t, 'Tag', 'Name') for t in d.get('Tags') or [] if nome(t, 'Tag', 'Name')})) or None,
            'Previsão de fechamento/ pedido': op(d, D['previsao']), 'Responsável': nome(d, 'Owner', 'Name'),
            'Usuários colaboradores': '; '.join(nome(u, 'User', 'Name') for u in d.get('CollaboratingUsers') or [] if nome(u, 'User', 'Name')) or None,
            'Venda Ganha': op(d, D['vendaGanha']), 'Data conversão pedido': op(d, D['dtConversao']),
            'Estágio': nome(d, 'Stage', 'Name'), 'Divisão de negócio': op(d, D['divisao']),
            'Produtos da Proposta': '; '.join(p.get('ProductName') or '' for p in lq.get('Products') or []) or None,
            'Norma': op(d, D['norma']), 'Valor': d.get('Amount'),
            'Condição de Pagamento da Proposta': op(lq, Q['condPag']) if lq else None,
            'Data de criação': dt(d.get('CreateDate')), 'Última atualização': dt(d.get('LastUpdateDate')),
            'Dias no estágio': d.get('DaysInStage'), 'Duração': d.get('Length'), 'Agente de negócio': op(d, D['agente']),
            'Número do pedido': op(d, D['pedido']), 'Comissão Vendedor %': op(d, D['comissao']),
            'Motivo de perda': nome(d, 'LossReason', 'Name'), 'Segmento do Cliente': nome(d, 'Contact', 'LineOfBusiness', 'Name'),
            'Origem': nome(d, 'Origin', 'Name')})
    cabN = list(neg[0].keys()) if neg else []

    cab, itens = [], []
    for q in quotes:
        dl = dPorId.get(q.get('DealId')) or {}
        cab.append({
            'Cliente do Negócio': dl.get('ContactName'), 'Cliente': q.get('ContactName'),
            'Estado do Cidade do Cliente': nome(q, 'Contact', 'State', 'Short'), 'Código': q.get('QuoteNumber'),
            'Número da revisão': q.get('ReviewNumber'), 'Nome do Responsável': nome(q, 'Owner', 'Name'),
            'Contato': nome(q, 'Person', 'Name') or q.get('PersonName'), 'Valor': q.get('Amount'), 'Data': dt(q.get('Date')),
            'Data de validade': dt(q.get('ExpirationDate')), 'Estágio do Negócio': nome(dl, 'Stage', 'Name'),
            'Último atualizador': nome(q, 'Updater', 'Name'), 'Modelo': nome(q, 'Template', 'Name'),
            'Data da criação': dt(q.get('CreateDate')), 'Projeto/ Obra do Negócio': op(dl, D['obra']),
            'Cidade da Obra do Negócio': op(dl, D['cidadeObra']), 'Nome do Último atualizador': nome(q, 'Updater', 'Name'),
            'Produtos da proposta': '; '.join(p.get('ProductName') or '' for p in q.get('Products') or []) or None})
        for p in q.get('Products') or []:
            itens.append({
                'Código da Proposta': q.get('QuoteNumber'), 'Número da revisão da proposta': q.get('ReviewNumber'),
                'Descrição do negócio': dl.get('Title'), 'Cliente da proposta': q.get('ContactName'),
                'Nome do produto': p.get('ProductName'), 'Valor unitário': p.get('UnitPrice'), 'Quantidade': p.get('Quantity'),
                'Valor total do item': p.get('Total'),
                'Vazão Nominal bomba | Curva de desempenho': op(p, QP['vazaoNom']) if QP['vazaoNom'] else None,
                'Vazão de proj./ oper. | Curva de Desempenho': op(p, QP['vazaoProj']) if QP['vazaoProj'] else None,
                'Pressão diferencial | Curva de Desempenho': op(p, QP['pressao']) if QP['pressao'] else None,
                'Norma do Negócio': op(dl, D['norma']), 'Responsável': nome(q, 'Owner', 'Name'), 'Data': dt(q.get('Date'))})

    # ---------- empresas (clientes pessoa jurídica) ----------
    emp = []
    for c in todos('Contacts', {'$filter': 'TypeId eq 1', '$expand': "OtherProperties,Owner($select=Name),Status($select=Name),"
                                "Origin($select=Name),LineOfBusiness($select=Name),City($select=Name),State($select=Short),"
                                "LastInteractionRecord($select=Date),LastDeal($select=Title,CreateDate;$expand=OtherProperties)"}):
        emp.append({'Nome': c.get('Name'), 'Responsável': nome(c, 'Owner', 'Name'), 'Inscrição estadual': op(c, C['ie']),
                    'Estado': nome(c, 'State', 'Short'), 'Cidade': nome(c, 'City', 'Name'),
                    'Data do Último contato': dt(nome(c, 'LastInteractionRecord', 'Date')), 'Status': nome(c, 'Status', 'Name'),
                    'Situação': op(c, C['situacao']), 'Último negócio': nome(c, 'LastDeal', 'Title'),
                    'Cadência mais recente (Meetime) do Último negócio': op(c.get('LastDeal') or {}, D['cadencia']),
                    'Data de criação do Último negócio': dt(nome(c, 'LastDeal', 'CreateDate')), 'Origem': nome(c, 'Origin', 'Name'),
                    'Segmento': nome(c, 'LineOfBusiness', 'Name')})

    # ---------- interações ----------
    inter = []
    for i in todos('InteractionRecords', {'$expand': "Type($select=Name),"
                                          "Contact($select=Name,LegalName;$expand=City($select=Name),State($select=Short))"}):
        dl = dPorId.get(i.get('DealId')) or {}
        lq = qPorId.get(dl.get('LastQuoteId')) or {}
        inter.append({'Id da interação': i.get('Id'), 'Cliente': nome(i, 'Contact', 'Name'), 'Razão social do Cliente': nome(i, 'Contact', 'LegalName'),
                      'Cidade do Cliente': nome(i, 'Contact', 'City', 'Name'), 'Estado do Cliente': nome(i, 'Contact', 'State', 'Short'),
                      'Data': dt(i.get('Date')), 'Tipo': nome(i, 'Type', 'Name'), 'Check-in verificado': i.get('VerifiedCheckIn'),
                      'Data de CheckOut': dt(i.get('CheckOutDate')), 'Duração': i.get('DurationInSeconds'),
                      'Endereço': i.get('CheckInAddress') or i.get('Address'), 'Descrição do Tarefa origem': sem_pessoais(i.get('Content')),
                      'Título do Negócio': dl.get('Title'), 'Código da Proposta do Negócio': lq.get('QuoteNumber'),
                      'Responsável do Negócio': nome(dl, 'Owner', 'Name')})   # sem 'Usuário': e-mails sincronizados vêm com o dono da integração como criador

    # ---------- vendas (pedidos no Ploomes, espelho do Omie) ----------
    ven = []
    fo = {f['Name']: f['Key'] for f in get('Fields', {'$select': 'Name,Key,EntityId', '$filter': 'EntityId eq 4'}).get('value', [])}
    OMIE = ['Número Ordem de Serviço (Omie)', 'Categoria (Omie)', 'Etapa ( Omie)', 'Id Ordem de Serviço(Omie)',
            'Metódo de pagamento (Omie)', 'Meio de pagamento (Omie)', 'Status Pedido (Omie)']
    for o in todos('Orders', {'$expand': "OtherProperties,Stage($select=Name),Creator($select=Name),"
                              "Contact($select=Name,LegalName;$expand=State($select=Short))"}):
        dl = dPorId.get(o.get('DealId')) or {}
        ven.append({**{c: op(o, fo[c]) for c in OMIE if c in fo}, **{'Razão social do Cliente': nome(o, 'Contact', 'LegalName'), 'Estado do Cidade do Cliente': nome(o, 'Contact', 'State', 'Short'),
                    'Cliente': nome(o, 'Contact', 'Name') or o.get('ContactName'), 'Data da criação': dt(o.get('CreateDate')),
                    'Número': o.get('OrderNumber'), 'Número Venda de Produto (Omie)': op(o, O['numVP']),
                    'Valor': o.get('Amount'), 'Data': dt(o.get('Date')),
                    'Estágio': nome(o, 'Stage', 'Name'), 'Criador': nome(o, 'Creator', 'Name'),
                    'Id Venda de Produto (Omie)': op(o, O['idVP']),
                    'Divisão de negócio do Negócio': op(dl, D['divisao']), 'Comissão Vendedor % do Negócio': op(dl, D['comissao'])}})

    n = {
        'API-Ploomes_Negocios_Todos.xlsx': salvar(pasta, 'API-Ploomes_Negocios_Todos.xlsx', cabN, neg),
        'API-Ploomes_Propostas_Todas.xlsx': salvar(pasta, 'API-Ploomes_Propostas_Todas.xlsx', list(cab[0].keys()) if cab else [], cab),
        'API-Ploomes_Propostas_Itens.xlsx': salvar(pasta, 'API-Ploomes_Propostas_Itens.xlsx', list(itens[0].keys()) if itens else [], itens),
        'API-Ploomes_Empresas.xlsx': salvar(pasta, 'API-Ploomes_Empresas.xlsx', list(emp[0].keys()) if emp else [], emp),
        'API-Ploomes_Interacoes.xlsx': salvar(pasta, 'API-Ploomes_Interacoes.xlsx', list(inter[0].keys()) if inter else [], inter),
        'API-Ploomes_Vendas.xlsx': salvar(pasta, 'API-Ploomes_Vendas.xlsx', list(ven[0].keys()) if ven else [], ven),
    }
    json.dump({'coletado_em': datetime.now().isoformat(timespec='seconds'), 'fonte': 'API Ploomes (somente leitura)', 'linhas': n},
              open(os.path.join(pasta, 'coleta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(n, ensure_ascii=False), f'em {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'ploomes-coleta')
