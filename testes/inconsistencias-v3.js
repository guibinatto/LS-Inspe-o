/* Regras v2026.11-3 (revisão do Consolidado anual de 19/11/2026): as 7 inconsistências não voltam.
   Uso: LANG=C.UTF-8 node testes/inconsistencias-v3.js <painel.html (completo, com dados)> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]);
    t(REGRAS_VERSAO === '2026.11-3', 'versão das regras ' + REGRAS_VERSAO);
    /* 1. win rate mensal e tabela de evolução com a mesma base; perdas sem data fora dos meses, dentro do ano */
    const X = indicadoresPeriodo(PER), R = hoje(); let g = 0, pp = 0, dif = [];
    irTela('propostas'); const tx = document.getElementById('tela').innerText;
    for (let m = 0; m < 12; m++) { const i = _d(PER.ano || R.getFullYear(), m, 1); if (i > R) break;
      const x = indicadoresPeriodo(Object.assign({}, PER, { ini: i, fim: menorData(fimMes(i.getFullYear(), m), R), fimCal: fimMes(i.getFullYear(), m), modo: 'mes' }));
      g += x.gan; pp += x.per; if (x.per && !periodoAnual(Object.assign({}, PER, { modo: 'mes' })) && (F.perd || []).some(y => dataPerda(y).aprox && perdaNoPeriodo(y, Object.assign({}, PER, { ini: i, fim: fimMes(i.getFullYear(), m), modo: 'mes' })))) dif.push(m); }
    const sd = (F.perd || []).filter(x => dataPerda(x).aprox && perdaNoPeriodo(x, PER)).length;
    t(X.gan === g && X.per === pp + sd, `ano = meses + perdas sem data: ${X.gan} ganhos, ${X.per} perdidos = ${pp} com data + ${sd} sem data`);
    t(!dif.length, 'nenhum mês conta perda sem data confiável');
    t(/Decididos por mês/.test(tx) && !/\b100%\b[^\n]*nov\/26/.test(tx), 'win rate por mês: tabela por mês, sem 100% falso em novembro');
    /* 2. sem base comparável */
    const A = periodoPrecedente(PER), XA = A ? indicadoresPeriodo(Object.assign({}, PER, { ini: A.ini, fim: A.fim, fimCal: A.fim, parcial: false })) : null;
    t(!XA || XA.per > 0 || /sem perdas/.test(XA.convBase || ''), 'período anterior sem perdas: conversão sem base comparável');
    t(!XA || !(XA.ciclo <= 1) || !!XA.cicloBase, 'ciclo com abertura no fechamento: sem base comparável');
    irTela('resultados'); RES.aba = 'ind'; render(); const ti = document.getElementById('tela').innerText;
    t(!/\+2\.500%|−42 p\.p\./.test(ti) && (!XA || XA.per > 0 || /sem base comparável/.test(ti)), 'tabela de indicadores sem variações sem sentido');
    /* 3. Amanda: critério escrito e contagem com responsável + apoio */
    const Q = spvDados(); RES.aba = 'spv'; render(); const ts = document.getElementById('tela').innerText;
    t(Q.amPed.length === Q.amNResp + Q.amNApoio && /responsável ou apoio/.test(ts), `Amanda: ${Q.amPed.length} = ${Q.amNResp} responsável + ${Q.amNApoio} apoio`);
    irTela('desempenho'); t(/Pedidos \(responsável\)/i.test(document.getElementById('tela').innerText), 'tabela de vendedores: pedidos como responsável');
    /* 4. divisão do negócio ganho = do pedido oficial */
    const br = (M.negocios || []).find(n => String(n.id) === '607100246');
    /* a divisão do Braskem segue a dos pedidos 500221/500222 no Controle, seja qual for (o Controle já trouxe SEQ e SPV) */
    const brPed = (M.pedidos || []).filter(p => ['500221', '500222'].includes(String(p.ov || '').replace(/\D/g, ''))).map(p => p.div);
    t(!br || !brPed.length || (brPed.every(d => d === br.div) && (!br.divPloomes || br.divPloomes !== br.div)), `Braskem 607100246: divisão do Controle (${brPed.join('/') || '—'}) = ${br && br.div}${br && br.divPloomes ? ', Ploomes ' + br.divPloomes + ' sinalizado' : ''}`);
    t(DIV_CONFLITO.every(d => d.ped.every(p => p.div === d.n.div)), 'negócios em conflito seguem a divisão do Controle');
    /* 5. mesma definição de clientes no cadastro */
    const f = F.emp.filter(e => e.resp === 'Fábio Dalagnolo').length; irTela('desempenho');
    t([...document.querySelectorAll('#tela tr')].some(tr => /Fábio Dalagnolo/.test(tr.innerText) && tr.innerText.includes(fmtN(f))), 'tabela de vendedores = cadastros (ativos + inativos): ' + f);
    /* 6. sem próximo passo */
    t(agendaDisp() ? X.semPasso != null : X.semPasso === null, 'sem próximo passo: ' + (agendaDisp() ? X.semPasso : 'indisponível (sem agenda no export)'));
    /* 7. probabilidades não mudaram */
    t(JSON.stringify(POLITICA_PADRAO.map(x => x.p)) === JSON.stringify([1, .2, .5, .25, .1, .2]), 'probabilidades: ' + POLITICA_PADRAO.map(x => x.k + ' ' + x.p).join(', '));
    /* totais */
    const c = conciliacao(PER.ini, PER.fim); t(Math.abs(c.total - X.ped) < .01, `totais: oficial ${fmtBRL(c.total)} · soma ${fmtBRL(c.registros)} · diferença ${fmtBRL(c.dif)}`);
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
