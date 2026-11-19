/* Gera o "Consolidado anual" (rG) do painel em PDF e em texto, para revisão e comparação.
   Uso: LANG=C.UTF-8 node testes/relatorio-anual.js <painel.html> <saida-sem-extensão> */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
(async () => {
  const [arq, saida] = process.argv.slice(2);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +(process.env.LARGURA || 1400), height: 1000 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(arq)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  await p.evaluate(async () => { irTela('relatorios'); RELC.modelo = 'rG'; render(); await relcGerar(); });
  await p.waitForTimeout(1500);
  const txt = await p.evaluate(() => [...document.querySelectorAll('#rel-view .rel-pag')].map((x, i) => `=== página ${i + 1}\n` + x.innerText).join('\n'));
  fs.writeFileSync(saida + '.txt', txt);
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: saida + '.pdf', preferCSSPageSize: true, printBackground: true });
  console.log('páginas', (txt.match(/=== página/g) || []).length, 'erros', erros.length ? erros.join(' | ') : 'nenhum');
  await b.close();
})();
