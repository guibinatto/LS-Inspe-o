/* Teste rápido (cerca de 30 s) para a atualização pelo botão ↻: abre o painel, passa por todas as
   telas e por todas as abas de Resultados e confere que nada quebrou e que os números principais
   existem. O teste completo de cliques (clica-tudo.js) fica para a atualização agendada da manhã.
   Uso: LANG=C.UTF-8 node testes/fumaca.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  const r = await p.evaluate(async () => {
    const ok = [], t = (c, m) => ok.push([!!c, m]), espera = () => new Promise(r => setTimeout(r, 60));
    t((F.todas || []).length > 0 && (M.negocios || []).length > 0, `bases carregadas: ${(F.todas || []).length} pedidos, ${(M.negocios || []).length} negócios`);
    const vazias = [];
    for (const tela of TELAS.map(x => x.id)) { irTela(tela); await espera(); if (document.getElementById('tela').innerText.trim().length < 40) vazias.push(tela); }
    t(!vazias.length, 'todas as telas abrem com conteúdo' + (vazias.length ? ': vazias ' + vazias.join(', ') : ` (${TELAS.length})`));
    const semAba = [];
    for (const a of RES_ABAS) { RES.aba = a.k; irTela('resultados'); await espera(); if (!document.querySelector('#tela .res-corpo .sec, #tela .res-corpo .g')) semAba.push(a.k); }
    t(!semAba.length, 'abas de Resultados com conteúdo' + (semAba.length ? ': vazias ' + semAba.join(', ') : ''));
    RES.aba = 'geral'; irTela('resultados');
    const X = indicadoresPeriodo(PER) || {};
    t((X.ped || 0) > 0, 'pedidos no período: ' + fmtCompacto(X.ped || 0));
    t(somar(F.ab, n => n.vNum || 0) > 0, 'pipeline aberto: ' + fmtCompacto(somar(F.ab, n => n.vNum || 0)));
    t(typeof apresGerar === 'function' && /<section/.test(apresGerar()), 'apresentação monta');
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
