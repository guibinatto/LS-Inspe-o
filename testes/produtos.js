/* Aba "Produtos e mix": leitura do código do produto, curva ABC e combinações de base × agrupamento.
   Uso: LANG=C.UTF-8 node testes/produtos.js <painel.html (caminho absoluto)> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]);
    /* código do produto */
    const a1 = prdAnalisa('CMB LSF J MB BT4-0715E14 1,5 35 38T NFPA20');
    t(a1.acion === 'Jockey' && a1.tipo === 'Multiestágio' && a1.modelo === 'BT4-0715E14' && a1.norma === 'NFPA 20', 'CMB jockey multiestágio NFPA 20: ' + JSON.stringify(a1));
    const a2 = prdAnalisa('CMB LSF D SC SCE 150-460 483 18 RD 22M NFPA20');
    t(a2.acion === 'Diesel' && a2.tipo === 'Bipartida (split case)' && a2.modelo === 'SCE 150-460', 'CMB diesel split case modelo com tamanho: ' + a2.modelo);
    const a3 = prdAnalisa('CMB LSF D SC 8AEF20A 490 21 TR 11M ULFM');
    t(a3.modelo === '8AEF20A' && a3.norma === 'UL/FM', 'modelo sem tamanho e norma UL/FM: ' + a3.modelo + ' ' + a3.norma);
    const a4 = prdAnalisa('ESP CONJUNTO MOTOBOMBA ELÉTRICO MBV-42 F 2.1/2 7,5CV 220/380');
    t(a4.acion === 'Elétrica' && /^MBV-42/.test(a4.modelo), 'descrição livre: elétrica MBV-42');
    t(prdEhMB('CMB LSF E SC 4HF10 40 35 38T ULFM') && prdEhMB('BOMBA CENTRIFUGA MULTIESTAGIO JOCKEY MHE 10') && !prdEhMB('ROTOR PARA BOMBA PERRLESS') && !prdEhMB('Manutenção em Motobombas - Corretiva'),
      'motobomba × peça/serviço');
    t(Math.abs(prdVazao('300 USgpm') - 68.13) < .1 && Math.abs(prdPressao('142 psi') - 99.84) < .1 && prdVazao('1,85m³/h') === 1.85, 'conversão USgpm→m³/h e psi→mca');
    /* motores: código do conjunto e descrição do item */
    const c1 = prdConjuntos('CMB LSF D SC SCE 150-460 483 18 RD 22M NFPA20')[0];
    t(c1.acion === 'Diesel' && c1.hp === 483 && c1.rpm === 1800 && c1.arref === 'Radiador' && c1.painel === '220 V mono', 'motor diesel 483 HP 1800 rpm radiador 220 V: ' + JSON.stringify(c1));
    const c2 = prdConjuntos('SKD LSF DEJ SC SCE 200-500 680 18 22M 16 SC SCE 200-500 600 18 44T 16 MB VSSE 3-17-30 3 35 44T 16');
    t(c2.length === 3 && c2.map(c => c.acion + c.hp).join() === 'Diesel680,Elétrica600,Jockey3' && c2[1].painel === '440 V tri', 'skid DEJ: três motores ' + c2.map(c => c.acion + ' ' + c.hp).join(' / '));
    const o1 = prdMotoresObs('01 x Motor Diesel Clarke, modelo DR8H-UFAA40 490HP @ 2100RPM; 01 x Painel de comando para Motor Diesel SVE');
    t(o1.Diesel.length === 1 && o1.Diesel[0].marca === 'Clarke' && o1.Diesel[0].modelo === 'DR8H-UFAA40', 'marca/modelo do motor pela descrição; "painel para motor diesel SVE" não é motor: ' + JSON.stringify(o1.Diesel));
    const o2 = prdMotoresObs('MOTOR DIESEL Marca: CLARKE FIRE Modelo: C13H0-UFAD38 (BLOCO CATERPILLAR)');
    t(o2.Diesel[0].marca === 'Clarke Fire' && o2.Diesel[0].modelo === 'C13H0-UFAD38', 'formato "Marca: … Modelo: …"');
    /* catálogo de motores padronizados: casamento em camadas */
    { const orig = M.motoresCat; M.motoresCat = [
        { modelo: 'DF15TIH-N', marca: 'De Maas', modeloFicha: 'Doosan PU158Ti', hp: 554, rpm: 2100, _raw: [] },
        { modelo: '6ETAA12.8G21', marca: 'SNAT', modeloFicha: '6ETAA12.8-G21', hp: 543, rpm: 1800, _raw: [] },
        { modelo: '6HTAA8.9G23', marca: 'SNAT', modeloFicha: '6DTAA8.9-G23', hp: 379, rpm: 1800, _raw: [] },
        { modelo: '6M21G390/6', marca: 'Weichai', modeloFicha: '6M21G390/6 (Baudouin)', hp: 600, rpm: 1800, _raw: [] }];
      DADOS_VER++; const m = (marca, modelo, hp, rpm) => { const r = prdCasaCatalogo({ acion: 'Diesel', marca, modelo, hp, rpm }); return r && r.c ? r.c.modelo + '/' + r.como : 'fora'; };
      t(m('Deemas', 'DF15TIH-N', 550, 1900) === 'DF15TIH-N/modelo', 'modelo: Deemas DF15TIH-N do ERP = De Maas DF15TIH-N');
      t(m('Snat', '6ETAA12.8-G22', 543, 1800) === '6ETAA12.8G21/variante do modelo', 'variante: G22 vendido × G21 no catálogo');
      t(m('Baudouin', '', 601, 1800) === '6M21G390/6/marca + potência', 'marca + potência: Baudouin 601 HP = Weichai 6M21G390/6');
      t(m('', '', 379, 1800) === '6HTAA8.9G23/sugestão por potência e rotação', 'sem marca nem modelo: sugestão por potência e rotação');
      t(m('Baudouin', '6M16G308/6', 483, 1800) === 'fora' && m('Clarke', 'DR8H-UFAA40', 490, 2100) === 'fora', 'modelo ou marca fora do catálogo não é forçado a casar');
      t(prdCasaCatalogo({ acion: 'Elétrica', marca: 'Weg', modelo: '', hp: 40, rpm: 3500 }) === null, 'motor elétrico não entra no catálogo diesel');
      M.motoresCat = orig; DADOS_VER++; }
    /* a mesma venda em várias OVs (pedido, reemissão, medições) conta uma vez — caso Irricom */
    { const orig = M.omie, v0 = DADOS_VER, d = new Date(2026, 4, 6), it = (ov, q, v, dep, prod) => ({ ov, qNum: q, vNum: v, departamento: dep, pedidoCli: 'N/D', nCli: 'irr', cli: 'IRRICOM', produto: prod, dt: d });
      const A = 'CON LSF DEJ ES TKF 100-400 217 TKF-M 75', B = 'CON LSF DEJ ES TKF 100-400 217 TKF 125';
      M.omie = [it('500095', 1, 1130614, '017-IRR-09544', A), it('500095', 1, 1130614, '017-IRR-09544', A), it('500095', 1, 1130614, '017-IRR-09544', B),
        it('500107', 1, 1130614, '017-IRR-09544', A), it('500107', 1, 1130614, '017-IRR-09544', A), it('500107', 1, 1130614, '017-IRR-09544', B),
        it('500158', 1, 406966, '017-IRR-09544', A), it('500113', 1, 100000, 'N/D', A), it('500121', 1, 125564, 'Comercial', A)];
      DADOS_VER++; const L = prdBase(), q = L.reduce((s, x) => s + x.qNum, 0), v = L.reduce((s, x) => s + x.vNum, 0);
      t(q === 3 && Math.round(v) === 3391842, `mesma venda em 5 OVs conta uma vez: ${q} containers, R$ ${Math.round(v)} (esperado 3 e R$ 3.391.842)`);
      M.omie = orig; DADOS_VER++; }
    /* curva ABC: classes coerentes e total igual à soma dos itens */
    const I = prdItens(), A = prdABC(I, x => prdTxt(x.produto), x => x.vNum, x => x.qNum || 0);
    const soma = I.reduce((s, x) => s + x.vNum, 0), tA = A.g.filter(x => x.cls === 'A').reduce((s, x) => s + x.t, 0);
    t(Math.abs(A.tot - soma) < 1, `total da ABC = soma dos itens (${Math.round(A.tot)})`);
    t(!A.g.length || (tA / A.tot >= .8 && A.g.every((x, i) => i === 0 || x.t <= A.g[i - 1].t)), `classe A cobre ≥ 80% (${(tA / (A.tot || 1) * 100).toFixed(0)}%) e ordem decrescente`);
    t(A.g.every((x, i) => i === 0 || 'ABC'.indexOf(x.cls) >= 'ABC'.indexOf(A.g[i - 1].cls)), 'classes em sequência A → B → C');
    /* todas as combinações renderizam */
    irTela('produtos'); let comb = 0;
    for (const f of PRD_MB_FONTE) for (const g of PRD_MB_POR) { PRD.mbFonte = f[0]; PRD.mbPor = g[0]; render(); comb++; }
    PRD.mbFonte = 'vendido'; PRD.mbPor = 'modelo'; render();
    const secs = [...document.querySelectorAll('#tela [data-sid]')].map(x => x.dataset.sid);
    t(['prd-kpi', 'prd-fam', 'prd-abc', 'prd-mb', 'prd-mot', 'prd-cot'].every(s => secs.includes(s)), 'seis seções com ID estável: ' + secs.filter(s => /^prd/.test(s)).join(','));
    t(comb === 15, '15 combinações de base × agrupamento');
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  if (erros.length) console.log('✗ erros JS: ' + erros.join(' | '));
  const n = r.filter(x => x[0]).length; console.log(`${n}/${r.length + (erros.length ? 1 : 0)} verificações`);
  await b.close(); process.exit(n === r.length && !erros.length ? 0 : 1);
})();
