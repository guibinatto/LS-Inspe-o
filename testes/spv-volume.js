/* Olhar da SPV (Resultados e metas): tipo de serviço/peça, segmento e região.
   Uso: LANG=C.UTF-8 node testes/spv-volume.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]), T = (pr, cat) => spvTipo(pr, cat).k;
    /* classificação pela descrição (serviço × peça e o tipo) */
    t(T('SERVICO DE INSPECAO DE CASA DE BOMBAS NFPA-25', 'Serviços / ITM') === 'Inspeção e contrato ITM', 'inspeção NFPA 25 → contrato ITM');
    t(T('Manutenção em Motobombas - Corretiva Externa', 'Serviços / ITM') === 'Manutenção (prev. e corretiva)', 'manutenção corretiva');
    t(T('ROTOR PARA BOMBA PERRLESS LVA 3X1.5-6', 'Componentes / peças') === 'Peças de bomba', 'rotor → peça de bomba');
    t(T('PAINEL COMANDO MOTOBOMBA JOCKEY 7.5KW', 'Painel elétrico') === 'Painéis e elétrica', 'painel de motobomba é painel, não equipamento');
    t(T('TESTADOR AUTOMATICO DE CHAVE DE FLUXO 2"', 'Outros') === 'Instrumentos e medição', 'testador de chave de fluxo → instrumento');
    t(T('202-00004 - MOTOR DE PARTIDA - BD30', '') === 'Motor diesel e consumíveis', 'código do Omie na frente é ignorado; motor de partida é peça');
    t(T('CMB LSF D SC 100', 'Conjunto motobomba') === 'Equipamentos completos', 'motobomba completa');
    t(spvTipo('Consultoria c/ Automação', 'Outros').g === 's', 'consultoria é serviço');
    /* estudo: totais batem com as propostas da SPV do recorte */
    const Q = spvVolume(), n = propostasRecorte().filter(x => x.div === 'SPV' && !spvForaDe(x)).length;
    t(Q.props.length === n, `propostas da SPV: ${Q.props.length} = ${n}`);
    t(Math.abs(Q.vS + Q.vP - somar(Q.itens, i => i.v)) < 1, 'serviço + peça = soma dos itens');
    t(Q.tipos.every(x => x.nProp <= Q.props.length) && Q.tipos.every((x, i, a) => !i || a[i - 1].nProp >= x.nProp), 'tipos ordenados por nº de propostas');
    t(somar(Q.regs, x => x.nProp) === Q.props.length, 'regiões somam todas as propostas');
    t(somar(Q.segL, s => s.nProp) === Q.props.length && somar(Q.segL, s => s.nNeg) === Q.neg.length, 'segmentos somam propostas e negócios');
    /* tela */
    irTela('resultados'); const el = document.querySelector('[data-sid="res-spv-vol"]');
    t(el && ['spv-tipo', 'spv-seg', 'spv-reg'].every(id => document.getElementById('gb-' + id)), 'seção e gráficos na tela Resultados');
    const bar = document.querySelector('#gb-spv-tipo .svg-cl'); bar && bar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    t(bar && /Propostas da SPV com/.test(document.body.innerText), 'clique no tipo abre as propostas');
    EST.div = 'SEQ'; aplicar(); t(secSpvVolume() === '', 'filtro SEQ esconde o olhar da SPV'); EST.div = ''; aplicar();
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
