/* Importa no painel as planilhas geradas por ploomes_coletar.py, pelo mesmo
   importador da tela "Dados e configurações", e grava o painel com a data de
   referência = hoje. As bases que não vêm do Ploomes (Controle de Pedidos,
   Omie, carteira, notas) ficam como estavam.
   Uso: node ferramentas/ploomes_importar.js <Painel.html> <pasta da coleta> [saída.html] */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const [src, pasta, out] = process.argv.slice(2), alvo = path.resolve(out || src);
  const arqs = fs.readdirSync(pasta).filter(f => /^API-Ploomes_.*\.xlsx$/.test(f)).map(f => path.resolve(pasta, f));
  if (arqs.length < 6) { console.error('coleta incompleta:', arqs); process.exit(1); }
  const b = await chromium.launch(), p = await b.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(src)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  for (const a of arqs) { await p.setInputFiles('#inp-arq', a); await p.waitForFunction(() => [...document.querySelectorAll('#arqs .arq .st')].every(s => !/lendo/.test(s.textContent)), null, { timeout: 60000 }); }
  console.log(await p.evaluate(() => [...document.querySelectorAll('#arqs .arq')].map(d => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 140)).join('\n')));
  await p.evaluate(() => setRef(''));
  console.log(await p.evaluate(() => { const X = indicadoresPeriodo(PER); return `referência ${fmtData(hoje())} · pedidos ${fmtCompacto(X.ped)} · pipeline ${fmtCompacto(somar(F.ab, x => x.vNum || 0))} (${F.ab.length} negócios abertos) · previsão ${fmtCompacto(previsaoPedidos(F.ab, 3).previsao)}`; }));
  if (erros.length) { console.error('ERROS', erros); process.exit(1); }
  const h = await p.evaluate(async () => CAB_LOCAL + await corpoComDados(BRUTO)); fs.writeFileSync(alvo, '﻿' + h);
  console.log('gravado', alvo); await b.close();
})();
