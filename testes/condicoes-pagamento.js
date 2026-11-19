/* Condições de pagamento (Resultados e metas): leitura do texto do Ploomes e das parcelas do Omie.
   Uso: LANG=C.UTF-8 node testes/condicoes-pagamento.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]), C = condPagInfo, pc = x => Math.round(x * 100);
    let i = C('CP-300 - 30% NA EMISSÃO DO PEDIDO, 30% EM ATÉ 5 DIAS APÓS A EMISSÃO DO DESENHO TÉCNICO COMERCIAL (DTC) E 40% FATURADO PARA 28 DDL');
    t(i.tipo === 'Com sinal no pedido' && pc(i.sinal) === 30 && pc(i.antec) === 30 && i.prazo === 28, 'CP-300: sinal 30%, 30% no DTC, 40% a 28 DDL');
    i = C('35% NO ATO DO PEDIDO + 10% P/ 30 DIAS + 10% P/ 60 DIAS + 20% AVISO DE EMBARQUE + SALDO FATURADO 28/56 DDL');
    t(pc(i.sinal) === 35 && pc(i.antec) === 40 && i.prazo === 42, 'marcos + saldo: sinal 35%, 40% antes do faturamento, saldo 28/56 → 42 dias: ' + JSON.stringify([i.sinal, i.antec, i.prazo]));
    i = C('CP-318 - 20% NO ATO DO PEDIDO, 20% 30 DIAS DEPOIS DO PEDIDO, 20% 60 DIAS DEPOIS DO PEDIDO E 40% FATURADO COM EQUIPAMENTO 28 DDL');
    t(pc(i.sinal) === 20 && pc(i.antec) === 40, '"30 dias depois do pedido" é antecipação, não sinal');
    t(C('CP-028 - 28 DDL').tipo === 'Prazo único (DDL)' && C('CP-028 - 28 DDL').prazo === 28, '28 DDL = prazo único');
    t(C('CP-133 - 30/60 DDL').tipo === 'Parcelado no faturamento' && C('CP-133 - 30/60 DDL').prazo === 45, '30/60 DDL = parcelado, prazo médio 45');
    t(C('CP-325 - 100% 30DDL COM A PRIMEIRA VISITA TÉCNICA').sinal === 0, '100% a 30 DDL não é sinal');
    t(C('CP-326 - 25% APÓS CADA VISITA TRIMESTRAL EM 10DDL').tipo === 'Recorrente (mensal/visita)' && C('CP-004 - MENSAL').tipo === 'Recorrente (mensal/visita)', 'mensal e por visita = recorrente');
    t(C('CP-001 - À VISTA').tipo === 'À vista ou antecipado' && C('').tipo === 'Sem condição', 'à vista e sem condição');
    /* Omie: parcela antecipada = vence antes da previsão de faturamento */
    const o = cpOmie({ ov: '1', prev: '22/02/2027', dtInc: '28/08/2026', valor: 100, parcelas: '22.22|28|22/09/2026; 77.78|181|22/02/2027' });
    t(Math.abs(o.antec - .2222) < .001 && o.n === 2, 'OV com 22% antes do faturamento');
    /* estudo: totais e tela */
    const Q = condPagDados();
    t(somar(Q.porTipo, x => x.n) === Q.gan.length, 'tipos somam os ganhos: ' + Q.gan.length);
    t(somar(Q.faixas, x => x.n) === Q.gan.length && Q.faixas[0].n === Q.gan.filter(x => !(x.sinal > 0)).length, 'faixas de sinal somam os ganhos');
    t(Q.gan.every(x => x.n.ganho && noPer(x.n.dtVenda)), 'só ganhos do período');
    t((M.omieParcelas || []).length === 0 || Q.ov.length > 0, 'OVs do Omie com parcelas: ' + Q.ov.length);
    irTela('resultados');
    t(document.querySelector('[data-sid="res-condpag"]') && document.getElementById('gb-cp-tipo'), 'seção na tela Resultados');
    const bar = document.querySelector('#gb-cp-tipo .svg-cl'); bar && bar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    t(bar && /Pedidos ganhos — /.test(document.body.innerText), 'clique abre os pedidos da condição');
    t(polDe('Em negociação').p === (CFG.probs && CFG.probs['Em negociação'] != null ? num(CFG.probs['Em negociação']) : .2), 'ponderado: em negociação = 20%');
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
