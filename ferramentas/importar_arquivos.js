/* Importa planilhas no painel pelo MESMO importador da tela "Dados e configurações" e grava o painel.
   Uso: node ferramentas/importar_arquivos.js <painel.html> <saída.html> [--financeiro AAAA-MM-DD] arquivo1.xlsx [arquivo2 ...]
   --financeiro: planilhas do e-mail semanal do Financeiro com aquela data. Se o painel já tem planilhas do
   Financeiro dessa data ou mais novas, não importa nada, imprime "SEM NOVIDADE" e sai com código 3.
   Depois de importar, guarda a data em BRUTO._meta.financeiro (vai junto no painel publicado). */
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
(async () => {
  const a = process.argv.slice(2), [src, out] = a; let fin = null, arqs = a.slice(2);
  const i = arqs.indexOf('--financeiro'); if (i >= 0) { fin = arqs[i + 1]; arqs.splice(i, 2); }
  if (!src || !out || !arqs.length) { console.error('uso: importar_arquivos.js <painel.html> <saída.html> [--financeiro AAAA-MM-DD] arquivos...'); process.exit(2); }
  const b = await chromium.launch(), p = await b.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(src)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  if (fin) { const ja = await p.evaluate(() => (BRUTO._meta && BRUTO._meta.financeiro && BRUTO._meta.financeiro.data) || null);
    console.log('planilhas do Financeiro no painel:', ja || 'nenhuma registrada', '· no e-mail:', fin);
    if (ja && ja >= fin) { console.log('SEM NOVIDADE'); await b.close(); process.exit(3); } }
  for (const f of arqs) { await p.setInputFiles('#inp-arq', path.resolve(f)); await p.waitForFunction(() => [...document.querySelectorAll('#arqs .arq .st')].every(s => !/lendo/.test(s.textContent)), null, { timeout: 60000 }); }
  const st = await p.evaluate(() => [...document.querySelectorAll('#arqs .arq')].map(d => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 200)));
  console.log(st.join('\n'));
  if (st.some(x => !/✓/.test(x))) { console.error('FALHA: alguma planilha não foi reconhecida'); process.exit(1); }
  await p.evaluate(f => { setRef(''); if (f) BRUTO._meta = Object.assign({}, BRUTO._meta, { financeiro: { data: f, em: new Date().toISOString() } }); }, fin);
  console.log(await p.evaluate(() => { const X = indicadoresPeriodo(PER), c = X.conc; return `referência ${fmtData(hoje())} · pedidos oficiais ${fmtBRL(X.ped)}${c ? ` (soma ${fmtBRL(c.registros)}, diferença ${fmtBRL(c.dif)})` : ''} · saldo a faturar ${fmtBRL(saldoFaturar().valor)}`; }));
  if (erros.length) { console.error('ERROS', erros); process.exit(1); }
  fs.writeFileSync(out, '﻿' + await p.evaluate(async () => CAB_LOCAL + await corpoComDados(BRUTO)));
  console.log('gravado', out); await b.close();
})();
