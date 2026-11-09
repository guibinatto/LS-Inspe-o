#!/usr/bin/env python3
"""Base de teste: o CÓDIGO atual do painel com os DADOS de 26/10/2026.

Os testes de regras, gráficos, totais e contratos conferem números conhecidos
dessa base (ex.: 675 de 2.619 interações, SEPAC R$ 118.911). Quando o painel
recebe planilhas novas, os números mudam; para validar o código, rode os testes
nesta base, e não no arquivo com os dados do dia.

Uso: python3 -I ferramentas/base-de-teste.py [saida.html]
     (padrão: /tmp/base-de-teste.html; dados do commit 4e7b376)
"""
import re, subprocess, sys
COMMIT = '4e7b376'
ARQ = 'Painel-Executivo-LS-Fire-2026-10-26.html'
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/base-de-teste.html'
a = open(ARQ, encoding='utf-8').read()
b = subprocess.run(['git', 'show', f'{COMMIT}:{ARQ}'], capture_output=True, check=True).stdout.decode('utf-8')
for sid in ['seed-dados', 'seed-config']:
    pat = r'(<script id="%s"[^>]*>)(.*?)(</script>)' % sid
    v = re.search(pat, b, re.S).group(2)
    a = re.sub(pat, lambda m: m.group(1) + v + m.group(3), a, count=1, flags=re.S)
open(out, 'w', encoding='utf-8').write(a)
print('base de teste:', out)
