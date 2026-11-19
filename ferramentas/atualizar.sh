#!/usr/bin/env bash
# Atualização do painel pelo Ploomes e pelo Omie (usada pela tarefa agendada e pelo botão ↻).
# Só LÊ o Ploomes e o Omie. Não publica nem faz commit: deixa /tmp/painel.html pronto e testado.
#   bash ferramentas/atualizar.sh <painel-publicado-salvo.html> [rapida|completa]
# rapida   (padrão): anexos do Omie incrementais e testes rápidos (~1 min)
# completa : todos os anexos e todos os testes, inclusive o que clica em todas as telas
# Coleta do Ploomes e do Omie rodam ao mesmo tempo. O Omie é opcional: se falhar, segue sem ele.
set -uo pipefail
cd "$(dirname "$0")/.."
PUB="$1"; MODO="${2:-rapida}"; export LANG=C.UTF-8
T0=$(date +%s); passo(){ echo "[$(( $(date +%s)-T0 ))s] $*"; }
rm -rf /tmp/coleta /tmp/omie; mkdir -p /tmp/coleta /tmp/omie
node ferramentas/dados.js extrair "$PUB" /tmp/dados.json >/dev/null || { echo "FALHA: não consegui ler os dados do painel publicado"; exit 1; }
node ferramentas/dados.js injetar Painel-Executivo-LS-Fire.html /tmp/dados.json /tmp/painel.html >/dev/null
ANT=(); if [ "$MODO" = rapida ]; then node ferramentas/dados.js base /tmp/dados.json omieAnexos /tmp/anexos-anteriores.json >/dev/null && ANT=(--anexos-anteriores /tmp/anexos-anteriores.json); fi
passo "coletando Ploomes e Omie ao mesmo tempo (modo $MODO)"
( python3 -I ferramentas/ploomes_coletar.py /tmp/coleta > /tmp/ploomes.log 2>&1; echo $? > /tmp/ploomes.rc ) &
( python3 -I ferramentas/omie_coletar.py coletar /tmp/omie "${ANT[@]}" > /tmp/omie.log 2>&1 \
  && python3 -I ferramentas/omie_para_planilha.py /tmp/omie /tmp/coleta/API-Omie_Itens.xlsx >> /tmp/omie.log 2>&1; echo $? > /tmp/omie.rc ) &
wait
passo "coleta terminada"
if [ "$(cat /tmp/ploomes.rc)" != 0 ]; then echo "FALHA: coleta do Ploomes"; tail -5 /tmp/ploomes.log; exit 1; fi
OMIE=sim; if [ "$(cat /tmp/omie.rc)" != 0 ]; then OMIE="não ($(grep -m1 -E 'Error|FALHA|Faltam' /tmp/omie.log | cut -c1-160))"; rm -f /tmp/coleta/API-Omie_*.xlsx; fi
node ferramentas/ploomes_importar.js /tmp/painel.html /tmp/coleta > /tmp/importar.log 2>&1 || { echo "FALHA: importação"; tail -5 /tmp/importar.log; exit 1; }
passo "importado: $(grep -m1 '^referência' /tmp/importar.log)"
TESTES=(fumaca futuro condicoes-pagamento produtos); [ "$MODO" = completa ] && TESTES+=(apresentacao clica-tudo)
for t in "${TESTES[@]}"; do
  out=$(timeout 600 node "testes/$t.js" /tmp/painel.html 2>&1); rc=$?
  if [ $rc != 0 ] || echo "$out" | grep -qE '^✗|ERROS \([1-9]|ERROS JS: [^n]'; then echo "FALHA: teste $t"; echo "$out" | grep -E '✗|ERROS|verificações' | head -8; exit 1; fi
done
passo "testes ok (${TESTES[*]})"
node ferramentas/publicaveis.js /tmp/painel.html /tmp/pub >/dev/null && passo "versões publicáveis em /tmp/pub · Omie: $OMIE · $(grep -m1 -o "em [0-9]* s" /tmp/omie.log | tail -1)"
echo "OK"
