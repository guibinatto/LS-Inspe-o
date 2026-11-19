/* "Para onde vamos": cenários, base instalada, rotas e as duas visões da apresentação.
   Uso: LANG=C.UTF-8 node testes/futuro.js <painel.html (caminho absoluto)> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 1000 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]), FU = futuroDados(), R = hoje(), a = R.getFullYear();
    /* cenários: o ritmo é a mesma conta da tela Resultados (realizado ÷ fração do ano) */
    const rAno = conciliacao(_d(a, 0, 1), R).total, fr = fracAno(a);
    t(Math.abs(FU.cen[0].v - (fr > 0 && fr < 1 ? rAno / fr : rAno)) < 1, 'cenário "no ritmo" = projeção por ritmo da tela Resultados: ' + fmtCompacto(FU.cen[0].v));
    t(FU.cen[1].v >= FU.rAno && FU.cen[2].v >= FU.cen[1].v, 'realizado ≤ realizado + previsão ponderada ≤ se tudo fechar: ' + FU.cen.map(c => fmtCompacto(c.v)).join(' · '));
    /* base instalada = a mesma da tela */
    const B = biModelo(); t(FU.B && FU.B.n === B.C.length && FU.B.sem.length === B.C.filter(c => !c.temCtr).length, `base instalada igual à tela: ${FU.B && FU.B.n} clientes, ${FU.B && FU.B.sem.length} sem contrato`);
    /* rotas: meta primeiro (se falta), depois do maior valor em jogo para o menor */
    const rs = FU.rotas, semMeta = rs.filter(x => x.tema !== 'Meta');
    t(rs.length >= 3 && semMeta.every((x, i) => i === 0 || (semMeta[i - 1].impacto || 0) >= (x.impacto || 0)), 'rotas ordenadas pelo valor em jogo: ' + rs.map(x => x.tema).join(' > '));
    t(!FU.meta || FU.rAno >= FU.meta || rs[0].tema === 'Meta', 'falta meta: a primeira rota é fechar o que falta');
    t(rs.every(x => x.tit && x.por && x.acao && x.num), 'cada rota tem número, porquê e ação');
    /* rota vira ação no plano */
    const n0 = (CFG.plano || []).length; rotaPlano(0); const pl = CFG.plano[CFG.plano.length - 1];
    t(CFG.plano.length === n0 + 1 && pl.origem === 'Rotas (Para onde vamos)' && pl.evidencia === rs[0].por, 'rota incluída no plano de ação com a evidência');
    CFG.plano.pop(); planoGuardar();
    /* duas visões da apresentação */
    const secs = h => [...new DOMParser().parseFromString(h, 'text/html').querySelectorAll('section[id]')].map(x => x.id);
    APRES.modelo = 'futuro'; APRES.per = null; APRES.caps = null; const sf = secs(apresGerar());
    APRES.modelo = 'anual'; const sa = secs(apresGerar());
    t(JSON.stringify(sf) === JSON.stringify(['capa', 'cenarios', 'pipeline', 'previsao', 'contratos', 'base', 'estudos', 'rotas', 'metodo']), 'Para onde vamos: ' + sf.join(','));
    t(sa.includes('anos') && sa.includes('execucao') && !sa.includes('rotas') && !sa.includes('cenarios') && !sa.includes('base'), 'Como estamos: com anos anteriores e contratos em execução, sem os capítulos de futuro');
    irTela('apresentacao'); const v = [...document.querySelectorAll('.apres-v')].map(x => x.innerText.split('\n')[0]);
    t(v.join('|') === 'Como estamos|Para onde vamos', 'aba Apresentação com as duas visões: ' + v.join(' · '));
    apresEscolher('futuro'); t(/Rotas sugeridas/.test(document.getElementById('tela').innerText) && document.querySelectorAll('#tela button[onclick^="rotaPlano"]').length === rs.length, 'na visão de futuro, as rotas com botão ＋ plano');
    apresEscolher('anual');
    /* tela Base instalada traz cenários e rotas */
    irTela('baseinst'); const ids = [...document.querySelectorAll('#tela [data-sid]')].map(x => x.dataset.sid);
    t(ids.includes('fut-cen') && ids.includes('fut-rotas'), 'tela Base instalada com cenários e rotas');
    return ok; });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
