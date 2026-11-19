/* Relatório gerado no celular (tela de 390 px): as regras de tela estreita não podem vazar para as páginas
   A4 — sem sombra de rolagem nos gráficos, sem largura mínima nos gráficos e tabelas, nada fora do quadro.
   Uso: LANG=C.UTF-8 node testes/relatorio-celular.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  await p.evaluate(async () => { irTela('relatorios'); RELC.modelo = 'rG'; render(); await relcGerar(); }); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => { const pgs = [...document.querySelectorAll('#rel-view .rel-pag')]; let fora = 0, sombra = 0, min = 0;
    pgs.forEach(pg => { pg.querySelectorAll('.card,.gb').forEach(c => { const cr = c.getBoundingClientRect(); c.querySelectorAll('table,svg').forEach(t => { if (t.getBoundingClientRect().right > cr.right + 2) fora++; }); });
      pg.querySelectorAll('.gb-c').forEach(g => { if (getComputedStyle(g).backgroundImage !== 'none') sombra++; const s = g.querySelector('svg'); if (s && parseFloat(getComputedStyle(s).minWidth) > 0) min++; }); });
    return { n: pgs.length, fora, sombra, min }; });
  const ok = [[r.n > 0, `${r.n} páginas`], [r.sombra === 0, 'gráficos sem sombra de rolagem: ' + r.sombra], [r.min === 0, 'gráficos sem largura mínima de celular: ' + r.min], [r.fora === 0, 'tabelas e gráficos dentro do quadro: ' + r.fora + ' fora']];
  ok.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m)); console.log(`${ok.filter(x => x[0]).length}/${ok.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum')); await b.close(); process.exit(ok.every(x => x[0]) && !erros.length ? 0 : 1);
})();
