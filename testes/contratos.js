/* Contratos de serviço: importação das planilhas do Omie, regras do acompanhamento,
   tela, Excel, relatórios e celular.
   Uso: LANG=C.UTF-8 node testes/contratos.js <Painel.html> [Contratos.xlsx OS.xlsx]
   Com as planilhas, importa pelo campo de arquivo antes de verificar. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const [src, ...arqs] = process.argv.slice(2).map(p => path.resolve(p));
const ok = [], falhas = []; const t = (c, m) => (c ? ok : falhas).push(m);
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) erros.push(m.text()); });
  await p.goto('file://' + src); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  for (const a of arqs) { await p.setInputFiles('#inp-arq', a); await p.waitForFunction(() => [...document.querySelectorAll('#arqs .arq .st')].every(s => !/lendo/.test(s.textContent)), null, { timeout: 30000 }); }
  if (arqs.length) t(await p.evaluate(() => [...document.querySelectorAll('#arqs .arq .st')].every(s => /✓/.test(s.textContent))), 'planilhas do Omie reconhecidas na importação');

  /* regras puras */
  const r = await p.evaluate(() => {
    const d = x => x ? isoD(x) : null, v = (s, a) => { const o = vigParse(s, a ? data(a) : null); return o && [d(o.ini), d(o.fim), o.aprox]; };
    return {
      v1: v('01/06/25 ~ 01/07/28'), v2: v('05/01 ~ 04/01/27', '2026-05-04'), v3: v('14/04 ~ 14/07', '2026-05-14'), v4: v('20/03 ~ 20/03/28', '2026-04-20'), v5: v('N/D'),
      n1: numContrato('nº 2025/09129'), n2: numContrato(' 2026/00002 '),
      ms: [mesesEntre('2025-11', '2026-02'), mesSoma('2026-11', -12), mesSoma('2026-12', 1)],
      det: [detectar(BRUTO.os ? BRUTO.os.cols : []), detectar(BRUTO.contratos ? BRUTO.contratos.cols : [])],
    };
  });
  t(JSON.stringify(r.v1) === '["2025-06-01","2028-07-01",false]', 'vigência completa: 01/06/25 ~ 01/07/28');
  t(JSON.stringify(r.v2) === '["2026-01-05","2027-01-04",true]', 'vigência sem ano no início: ano pela primeira OS');
  t(JSON.stringify(r.v3) === '["2026-04-14","2026-07-14",true]', 'vigência sem ano nenhum: 14/04 ~ 14/07 → 2026');
  t(JSON.stringify(r.v4) === '["2026-03-20","2028-03-20",true]', 'início e fim no mesmo dia/mês (20/03 ~ 20/03/28)');
  t(r.v5 === null, 'vigência "N/D" não vira data');
  t(r.n1 === '2025/09129' && r.n2 === '2026/00002', 'número do contrato normalizado ("nº 2025/09129")');
  t(JSON.stringify(r.ms) === '[3,"2025-11","2027-01"]', 'aritmética de meses');
  if (arqs.length) t(r.det[0] === 'os' && r.det[1] === 'contratos', 'detecção: OS por Cliente × Contratos por Cliente');

  /* modelo com dados reais, na referência de hoje */
  await p.evaluate(() => setRef(''));
  const m = await p.evaluate(() => { const C = contratosModelo(), g = n => C.L.find(c => c.num === n) || {};
    const soma = C.L.reduce((s, c) => s + c.total, 0) + C.avulsas.reduce((s, o) => s + o.vNum, 0), tot = C.os.reduce((s, o) => s + o.vNum, 0);
    return { n: C.L.length, os: C.os.length, soma, tot, sepac: [g('2025/08302').fat, g('2025/08302').status, g('2025/08302').mesesVazios], cm: [g('2026/00005').status, g('2026/00005').semRenov],
      leg: [g('2026/00004').status, g('2026/00004').fonteVig], vig: C.L.filter(c => c.vigente).length, ori: g('2025/08304').os && g('2025/08304').os.length,
      fa: (c => c.num && [c.status, c.unico, c.parcelas, c.os.length, Math.round(c.total), c.valorPed, c.semRenov, c.atrasado, isoD(c.fim)])(g('PV 2026/09390')),
      sep: [g('2025/08302').valorPed, g('2025/08302').origem], leg6: g('2026/00006').ped && g('2026/00006').ped.ptc, gl: g('PV 8132').status,
      bepe: ['PV 8370', 'PV 8371'].map(n => g(n).status + '/' + g(n).renovar), ntn: (g('PV s/nº').os || []).every(o => !/venda de/i.test(o.cat || '')) }; });
  if (m.os) {
    t(Math.abs(m.soma - m.tot) < 0.01, `toda OS entra uma vez: contratos + avulsas = total das OS (${m.tot.toFixed(2)})`);
    t(Math.round(m.sepac[0]) === 118911 && m.sepac[1] === 'Vigente', 'SEPAC 2025/08302: R$ 118.911 faturado, vigente');
    t(JSON.stringify(m.sepac[2]) === '["2026-02","2026-03"]', 'SEPAC: meses sem OS (fev e mar/26) apontados');
    t(m.cm[0] === 'A vencer' && m.cm[1] === true, 'CM Hospitalar vence em até 90 dias e não tem negócio aberto no Ploomes');
    t(m.leg[0] === 'Cancelado' && /Contratos/.test(m.leg[1]), 'Legrand 2026/00004: situação e vigência vêm do Contratos por Cliente');
    t(m.vig === 10, '10 contratos vigentes (6 do Omie + 4 presumidos pelo Controle de Pedidos)');
    t(JSON.stringify(m.fa) === '["Vigente",true,12,2,94020,94020,true,false,"2027-02-09"]', 'FA Maringá: pedido ITM 2026/09390 vira contrato de 12 parcelas até 09/02/2027, com as 2 OS, sem negócio de renovação, sem alerta de OS mensal');
    t(Math.round(m.sep[0]) === 356732 && /Controle/.test(m.sep[1]), 'SEPAC: pedido ITM do Controle liga ao contrato do Omie (valor vendido R$ 356.732)');
    t(String(m.leg6) === '10149', 'Legrand: pedido 10149 liga ao contrato 2026/00006 (o mais próximo da data), não ao cancelado');
    t(m.gl === 'Encerrado', 'Legrand GL (outro cliente, 2025): contrato presumido próprio, encerrado');
    t(m.bepe.join(',') === 'Encerrado/true,Encerrado/true', 'BEPE Garuva e Clif: encerrados há menos de 120 dias, entram na renovação');
    t(m.ntn, 'contrato presumido só leva OS de serviço (venda de produto do cliente fica fora)');
    /* referência no passado: OS posteriores ficam fora */
    const ref = await p.evaluate(() => { setRef('2026-06-30'); const C = contratosModelo(), o = C.os.every(x => !x.dtI || x.dtI <= C.R), s = C.L.find(c => c.num === '2026/00004'); return { o, n: C.os.length, st: s && s.status }; });
    t(ref.o && ref.n < m.os, `referência 30/06: OS incluídas depois ficam fora (${ref.n} de ${m.os})`);
    t(ref.st === 'Cancelado', 'contrato cancelado continua cancelado em qualquer referência');
    await p.evaluate(() => setRef(''));
  }

  /* tela */
  await p.evaluate(() => { irTela('contratos'); }); await p.waitForTimeout(600);
  const tela = await p.evaluate(() => ({ kpis: document.querySelectorAll('#tela .kpi').length, secs: [...document.querySelectorAll('#tela .sec')].map(s => s.dataset.sid), svg: document.querySelectorAll('#tela figure.gb').length, ch: Object.keys(CHARTS).length, menu: !!document.querySelector('#rail [onclick*="contratos"], #rail [data-t="contratos"], #rail a, #rail button') }));
  if (m.os) {
    t(tela.kpis === 8, '8 indicadores no topo');
    t(['ctr-lista', 'ctr-vig', 'ctr-mes', 'ctr-renov', 'ctr-ag', 'ctr-sn'].every(s => tela.secs.includes(s)), 'seções: lista, vigência, mês a mês, renovação, aguardando, sem número');
    t(tela.svg === 2 && tela.ch === 1, 'gráficos: vigência e mapa de calor (SVG) + faturamento por mês');
    /* clique: número do contrato abre as OS; célula do mapa abre as OS do mês */
    await p.locator('#tela a.td-link', { hasText: '2025/08302' }).first().click(); await p.waitForTimeout(300);
    t(await p.evaluate(() => { const x = document.querySelector('#m-form.aberto, .modal.aberto'); return !!x && /2025\/08302/.test(x.textContent) && x.querySelectorAll('tbody tr').length === 12; }), 'clicar no contrato abre as 12 OS da SEPAC');
    await p.evaluate(() => document.querySelectorAll('.modal.aberto').forEach(m => m.classList.remove('aberto')));
    await p.locator('#gb-ctr-heat .svg-cl').first().click(); await p.waitForTimeout(300);
    t(await p.evaluate(() => { const x = document.querySelector('.modal.aberto'); return !!x && x.querySelectorAll('tbody tr').length >= 1; }), 'clicar no mapa de calor abre as OS do mês');
    await p.evaluate(() => document.querySelectorAll('.modal.aberto').forEach(m => m.classList.remove('aberto')));
    /* Excel */
    const dl = p.waitForEvent('download'); await p.locator('button', { hasText: 'Excel do acompanhamento' }).click();
    const d = await dl, f = await d.path(), XL = await p.evaluate(async () => 1);
    const abas = await p.evaluate(async b64 => { const wb = XLSX.read(Uint8Array.from(atob(b64), c => c.charCodeAt(0)), { type: 'array' }); return wb.SheetNames.map(n => n + ':' + (XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }).length - 1)); }, fs.readFileSync(f).toString('base64'));
    t(/^LS-Fire-Contratos-\d{4}-\d{2}-\d{2}\.xlsx$/.test(d.suggestedFilename()) && abas.join(',').startsWith('Contratos:15,Mês a mês:15,OS:118,Renovação:'), `Excel com abas ${abas.join(' · ')}`);
    /* relatórios */
    for (const [mod, sids] of [['rE', ['6. contratos de serviço', 'contratos vigentes', 'renovação', 'os aguardando faturamento']], ['rF', ['contratos de serviço', 'vigência dos contratos', 'faturamento mês a mês', 'renovação']]]) {
      const rel = await p.evaluate(async mod => { irTela('relatorios'); RELC.modelo = mod; render(); await relcGerar(); const txt = document.querySelector('#rel-view').innerText; fecharRelatorio(); return txt; }, mod);
      t(sids.every(s => rel.toLowerCase().includes(s)), `relatório ${mod === 'rE' ? 'mensal' : 'trimestral'} traz o capítulo de contratos`);
    }
    /* relatórios por tema: título, um capítulo com o nome do tema, nada fora da margem, seção longa fora por padrão */
    const tm = await p.evaluate(async () => { const R = []; for (const m of REL_MODELOS.filter(x => x.tema)) { irTela('relatorios'); RELC.modelo = m.k; render();
        const off = [...document.querySelectorAll('.relc-sec')].filter(c => !c.checked).map(c => c.value); await relcGerar();
        const v = document.querySelector('#rel-view'), pg = [...v.querySelectorAll('.rel-pag')], txt = v.innerText;
        R.push({ k: m.k, ok: txt.includes('Relatório — ' + m.nome) && txt.includes('1. ' + m.nome), fora: pg.filter(x => x.scrollWidth > x.clientWidth + 2 || x.scrollHeight > x.clientHeight + 2).length, n: pg.length, off }); fecharRelatorio(); } return R; });
    t(tm.length === 8 && tm.every(r => r.ok && !r.fora), `8 relatórios por tema com título e capítulo do tema, sem nada fora da margem (${tm.map(r => r.k + ' ' + r.n + 'p').join(', ')})`);
    t(JSON.stringify(tm.find(r => r.k === 'tPIP').off) === '["pipe-insp"]', 'Pipeline: inspeção das oportunidades (33 páginas) vem desmarcada por padrão');
  } else { const tx = await p.evaluate(() => document.getElementById('tela').innerText); t(/nenhuma base de contratos/i.test(tx) || (tela.kpis === 8 && /base incompleta/i.test(tx)), 'sem OS: a tela explica o que falta importar'); }
  /* celular */
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { irTela('contratos'); }); await p.waitForTimeout(500);
  t(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: a página não rola para o lado');
  t(erros.length === 0, 'sem erros de JavaScript' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  console.log(ok.map(m => '✓ ' + m).join('\n')); if (falhas.length) console.log(falhas.map(m => '✗ ' + m).join('\n'));
  console.log(`\n${ok.length}/${ok.length + falhas.length} verificações`); await b.close(); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
