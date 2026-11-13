#!/usr/bin/env python3
"""Base de teste: o CÓDIGO atual do painel com os DADOS congelados de 26/10/2026
e a data de referência FIXA em 10/11/2026.

Os testes de regras, gráficos, totais e contratos conferem números conhecidos
dessa base (ex.: 675 de 2.619 interações, SEPAC R$ 118.911). A referência fixa
impede que os testes "envelheçam" com o relógio (ex.: um contrato que passa a
vencer em menos de 90 dias).

Os dados ficam em dados/base-teste.json (fora do git: contêm clientes reais).
Uso: python3 -I ferramentas/base-de-teste.py [saida.html]
"""
import json, os, re, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQ = os.path.join(RAIZ, 'Painel-Executivo-LS-Fire.html')
DADOS = os.path.join(RAIZ, 'dados', 'base-teste.json')
REF_FIXA = '2026-11-10'
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'dados', 'base-de-teste.html')
if not os.path.exists(DADOS):
    sys.exit('faltam os dados de teste em dados/base-teste.json (fora do git; peça a cópia a quem mantém o painel)')
a = open(ARQ, encoding='utf-8').read()
j = json.load(open(DADOS, encoding='utf-8'))
cfg = json.loads(j['config'] or '{}')
blocos = {'seed-dados': ('<script id="seed-dados" type="application/json" data-z="gz">', j['dados']),
          'seed-config': ('<script id="seed-config" type="application/json">', json.dumps(cfg, ensure_ascii=False).replace('<', '\\u003c'))}
for sid, (abre, corpo) in blocos.items():
    a = re.sub(r'<script id="%s"[^>]*>.*?</script>' % sid, lambda m: abre + corpo + '</script>', a, count=1, flags=re.S)
# 'hoje' fixo só neste arquivo de teste (o painel lê data-hoje-teste do <html>)
a = re.sub(r'<html ([^>]*)>', lambda m: '<html ' + m.group(1) + ' data-hoje-teste="%s">' % REF_FIXA, a, count=1)
open(out, 'w', encoding='utf-8').write(a)
print('base de teste:', out, '· referência fixa', REF_FIXA)
