/* Gestão de contratos com um banco simulado (o db/assets/user do Claude, em memória):
   ficha preenchida, valor e vigência da ficha mandam sobre o automático, visitas
   esperadas × realizadas, relatório pendente, anexo, contrato criado só no painel,
   permissões (leitura) e o arquivo baixado sem banco. Sem dados de clientes nos registros.
   Uso: LANG=C.UTF-8 node testes/gestao-contratos.js <painel.html (caminho absoluto)> */
const { chromium } = require('playwright'), path = require('path');
const SIMULADOR = ({ escrever }) => {
  const docs = new Map(), subs = [], blobs = new Map(); let seq = 0;
  const snapCol = col => { const ds = [...docs.entries()].filter(([k]) => k.split('/').slice(0, -1).join('/') === col)
      .map(([k, v]) => ({ id: k.split('/').pop(), exists: true, data: () => JSON.parse(JSON.stringify(v)), metadata: { fromCache: false, hasPendingWrites: false } }));
    return { docs: ds, size: ds.length, empty: !ds.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
  const avisar = () => setTimeout(() => subs.forEach(s => s.next(snapCol(s.col))), 0);
  const docRef = p => ({ id: p.split('/').pop(), path: p,
    get: async () => ({ exists: docs.has(p), data: () => docs.get(p) }),
    set: async d => { if (!escrever) throw { code: 'invalid_argument' }; docs.set(p, JSON.parse(JSON.stringify(d))); avisar(); },
    update: async d => { docs.set(p, Object.assign({}, docs.get(p), d)); avisar(); },
    delete: async () => { if (!escrever) throw { code: 'invalid_argument' }; docs.delete(p); avisar(); } });
  const colRef = c => ({ path: c, doc: id => docRef(c + '/' + (id || 'd' + (++seq))), add: async d => { const r = docRef(c + '/d' + (++seq)); await r.set(d); return r; },
    onSnapshot: (next, err) => { const s = { col: c, next }; subs.push(s); setTimeout(() => next(snapCol(c)), 5); return () => {}; } });
  const db = { doc: docRef, collection: colRef };
  const assets = { upload: async (b, o) => { const id = 'a'.repeat(31) + (blobs.size + 1); blobs.set(id, b); return { id, url: '/_blob/' + id, sizeBytes: b.size, contentType: o.type }; },
    delete: async id => ({ deleted: blobs.delete(id) }), list: async () => ({ assets: [], usage: {} }) };
  const user = { id: async () => 'u-teste', can: async () => escrever, profiles: async ids => Object.fromEntries(ids.map(i => [i, { name: 'Pessoa Teste' }])), isOwner: () => true };
  window.__SIM = { docs, blobs };
  window.claude = { use: async n => n === 'db' ? db : n === 'assets' ? (escrever ? assets : null) : n === 'user' ? user : null };
};
(async () => {
  const b = await chromium.launch(), ok = [], t = (c, m) => ok.push([!!c, m]), erros = [];
  const abrir = async (escrever, semClaude) => { const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
    p.on('pageerror', e => erros.push(e.message)); if (!semClaude) await p.addInitScript(SIMULADOR, { escrever });
    await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
    if (!semClaude) await p.waitForFunction(() => GC.estado === 'ok', null, { timeout: 15000 }); return p; };
  /* 1. sem Claude (arquivo baixado): leitura do automático, sem botões de edição */
  { const p = await abrir(false, true);
    const r = await p.evaluate(() => { irTela('gestao'); GC.aba = 'todos'; render(); const T = document.getElementById('tela').innerText;
      return { est: GC.estado, aviso: /disponível só no painel publicado/.test(T), novo: !!document.querySelector('#tela button[onclick="gcNovo()"]'), n: gcContratos().length }; });
    t(r.est === 'indisponivel' && r.aviso && !r.novo, 'arquivo baixado: aviso de "só no painel publicado" e sem botão de novo contrato');
    t(r.n > 0, 'arquivo baixado: lista os contratos automáticos (' + r.n + ')'); await p.close(); }
  /* 2. com banco e permissão de escrita */
  const p = await abrir(true);
  const r = await p.evaluate(async () => {
    const out = {}; irTela('gestao'); GC.aba = 'todos'; render();
    const L0 = gcContratos(), a = L0.find(x => x.ativo) || L0[0]; out.id = a.id;
    out.auto = { valor: a.valor, src: a.valorSrc, fat: a.fat };
    /* ficha: valor, vigência de 12 meses começando há ~6 meses, visita mensal */
    const R = hoje(), ini = new Date(R.getFullYear(), R.getMonth() - 6, R.getDate() - 3);
    gcEditar(a.id); const f = document.querySelector('#m-form form');
    const set = (n, v) => { const op = f.querySelector(`[name="${n}"][value="${v}"]`); if (op && /radio|checkbox/.test(op.type)) { op.checked = true; return; } f.querySelector(`[name="${n}"]`).value = v; };
    out.toque = ['tipo', 'status', 'reajuste', 'mesReajuste', 'renovAuto', 'periodicidade'].every(n => (f.querySelector(`[name="${n}"]`) || {}).type === 'radio');
    set('valorTotal', '120000'); set('ini', isoD(ini)); set('fim', ''); set('meses', '12'); set('periodicidade', 'mensal'); set('respInterno', 'Responsável Teste'); set('reajuste', 'IPCA'); set('ptc', '99999');
    f.requestSubmit(); await new Promise(r => setTimeout(r, 120));
    let x = gcContratos().find(k => k.id === a.id);
    out.ficha = { valor: x.valor, src: x.valorSrc, meses: x.meses, fase: x.fase, esperadas: x.esperadas, realizadas: x.realizadas.length, atraso: x.visAtraso, saldo: x.saldo, fat: x.fat, completo: x.completo, ptc: x.ptc };
    /* duas visitas realizadas (uma com relatório) e uma agendada */
    for (const [d, st, comRel] of [[isoD(new Date(+ini + 5 * 864e5)), 'Realizada', true], [isoD(new Date(+ini + 40 * 864e5)), 'Realizada', false], [isoD(new Date(+R + 10 * 864e5)), 'Agendada', false]]) {
      gcVisita(a.id); const g = document.querySelector('#m-form form');
      g.querySelector('[name=data]').value = d; g.querySelector(`[name=status][value="${st}"]`).checked = true; g.querySelector('[name=tecnico]').value = 'Técnico Teste'; g.querySelector('[name=resumo]').value = 'Teste';
      [...g.querySelectorAll('[name=feito]')].slice(0, 3).forEach(c => { c.checked = true; });
      if (comRel) { const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1.4 teste'], 'relatorio.pdf', { type: 'application/pdf' })); g.querySelector('[name=rel]').files = dt.files; }
      g.requestSubmit(); await new Promise(r => setTimeout(r, 150)); }
    x = gcContratos().find(k => k.id === a.id); out.feito = x.vis.map(v => (v.feito || []).length);
    out.vis = { realizadas: x.realizadas.length, esperadas: x.esperadas, atraso: x.visAtraso, semRel: x.semRel.length, prox: x.proxVis && x.proxVis.src, ult: x.ultVis && x.ultVis.data, blobs: window.__SIM.blobs.size,
      relId: (x.vis.find(v => v.relatorio) || {}).relatorio || '' };
    /* anexo do contrato */
    const inp = document.createElement('input'); inp.type = 'file'; const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1.4'], 'contrato-assinado.pdf', { type: 'application/pdf' })); inp.files = dt.files;
    gcAnexar(a.id, inp); document.querySelector('#m-form form').requestSubmit(); await new Promise(r => setTimeout(r, 150));
    x = gcContratos().find(k => k.id === a.id); out.anexo = { n: x.anx.length, tipo: x.anx[0] && x.anx[0].tipo, completo: x.completo };
    /* ficha aberta mostra tudo */
    gcFicha(a.id); const M = document.getElementById('m-ctr').innerText; out.fichaTxt = { valor: /120\.000|120 mil/.test(M), vis: /Técnico Teste/.test(M), anexo: /contrato-assinado\.pdf/.test(M), relPend: /sem relatório/.test(M), src: /ficha/.test(M) };
    out.link = !!document.querySelector(`#m-ctr a[href="/_blob/${out.vis.relId}"]`); gcFechar();
    /* contrato criado só no painel */
    gcNovo(); const n = document.querySelector('#m-form form'); n.querySelector('[name=num]').value = 'TESTE/001'; n.querySelector('[name=cli]').value = 'Cliente Teste'; n.querySelector('[name=ini]').value = isoD(R); n.querySelector('[name=meses]').value = '24'; n.querySelector('[name=valorTotal]').value = '48000';
    n.requestSubmit(); await new Promise(r => setTimeout(r, 450)); gcFechar();
    const nv = gcContratos().find(k => k.id === 'TESTE-001'); out.novo = nv && { cli: nv.cli, mensal: nv.mensal, status: nv.status, fase: nv.fase };
    /* equipamentos: sugestão da locação (item da OV no Omie) e nº de série */
    const lc = gcContratos().find(k => k.loc && gcSugestoes(k).length); out.locN = gcContratos().filter(k => k.loc).length;
    if (lc) { await gcAddSug(lc.id, 0); await new Promise(r => setTimeout(r, 120));
      let y = gcContratos().find(k => k.id === lc.id); out.eq = { n: y.eq.length, semSerie: y.eqSemSerie.length, sit: y.eq[0] && y.eq[0].situacao, origem: y.eq[0] && y.eq[0].origem };
      gcEquip(lc.id, y.eq[0]._id); const ef = document.querySelector('#m-form form'); ef.querySelector('[name=serie]').value = 'SN-TESTE-001'; ef.requestSubmit(); await new Promise(r => setTimeout(r, 120));
      y = gcContratos().find(k => k.id === lc.id); out.eq.depois = y.eqSemSerie.length; out.eq.busca = gcContratos().filter(k => k.busca.includes(norm('SN-TESTE-001'))).length;
      out.eq.check = y.check.find(c => /série/.test(c[0]))[1]; }
    /* equipamentos iguais: completar a rotação de um motor 6M16 de 483 HP e propor nos outros */
    const C3 = gcContratos().filter(k => !k.loc).slice(0, 3).map(k => k.id);
    const mot = (ctr, rot) => GC.db.collection('ctrEquip').doc().set({ ctr, tipo: 'Motor diesel', fabricante: 'Baudouin', modelo: '6M16', potencia: '483 HP', rotacao: rot, serie: '', situacao: 'Em operação' });
    await mot(C3[0], ''); await mot(C3[1], ''); await mot(C3[2], '2100'); await new Promise(r => setTimeout(r, 120));
    out.antes = gcPropostas().filter(p => p.campo === 'rotacao').length;   /* 1 diz 2100, 2 vazios: sugere 2100 nos vazios */
    const m0 = GC.equip.find(e => e.ctr === C3[0] && e.modelo === '6M16');
    gcEquip(C3[0], m0._id); const mf = document.querySelector('#m-form form'); mf.querySelector('[name=rotacao]').value = '1800'; mf.requestSubmit();
    await new Promise(r => setTimeout(r, 900));
    const rev = document.querySelector('#m-form .gc-rev'); out.rev = rev ? { txt: /Reconheci que .*6M16.*rotação = 1800/s.test(rev.innerText), marcados: [...rev.querySelectorAll('input:checked')].length, total: rev.querySelectorAll('input').length, div: /divergente/.test(rev.innerText) } : null;
    if (rev) { document.querySelector('#m-form form').requestSubmit(); await new Promise(r => setTimeout(r, 250)); }
    const m1 = GC.equip.find(e => e.ctr === C3[1] && e.modelo === '6M16'), m2 = GC.equip.find(e => e.ctr === C3[2] && e.modelo === '6M16');
    out.depois = { m1: m1.rotacao, fonte: (m1.fontes || {}).rotacao || '', m2: m2.rotacao };
    /* motor de outra potência não é "igual" */
    out.outraPot = gcMesmoModelo({ tipo: 'Motor diesel', modelo: '6M16', potencia: '483 HP' }, { tipo: 'Motor diesel', modelo: '6 M-16', potencia: '400 HP' });
    out.mesmoMod = gcMesmoModelo({ tipo: 'Motor diesel', modelo: '6M16', potencia: '483 HP' }, { tipo: 'Motor diesel', modelo: '6 M-16', fabricante: 'BAUDOUIN' });
    /* ficha sem redundância: o automático vai para um bloco à parte, com o valor à mostra */
    const ca = gcContratos().find(k => !k.loc && k.c.valorPed && !num(k.f.valorTotal) && k.c.ini);
    gcEditar(ca.id); const ff = document.querySelector('#m-form form'); const ord = [...ff.querySelectorAll('.gc-fh, [name]')].map(e => e.classList.contains('gc-fh') ? '|' : e.name).join(',');
    out.redund = { blocoAuto: /Já vem automaticamente/i.test(ff.innerText), valorDepois: ord.indexOf('valorTotal') > ord.lastIndexOf('|'), ph: !!ff.querySelector('[name=valorTotal][placeholder]'), objetoAntes: ord.indexOf('objeto') < ord.lastIndexOf('|') };
    fecharModal('m-form');
    /* base instalada: clientes que compraram equipamento × contratos ativos; andamento por toque */
    irTela('baseinst'); const B = biModelo(), sem = B.C.find(c => !c.temCtr);
    out.bi = { clientes: B.C.length, forn: B.F.length, ctrOk: B.C.filter(c => c.temCtr).every(c => c.ctr.every(x => x.ativo && !x.loc)), kpi: /BASE INSTALADA/i.test(document.getElementById('tela').innerText) && /OPORTUNIDADES SEM CONTRATO/i.test(document.getElementById('tela').innerText) };
    biAndamento(sem.k); const bf = document.querySelector('#m-form form'); bf.querySelector('[name=status][value="Oferecido"]').checked = true; bf.querySelector('[name=oferta]').checked = true; bf.requestSubmit();
    await new Promise(r => setTimeout(r, 200)); const B2 = biModelo(); out.bi.st = (B2.C.find(c => c.k === sem.k) || {}).st; out.bi.of = ((B2.C.find(c => c.k === sem.k) || {}).op || {}).oferta;
    irTela('supervisao'); out.bi.chip = /Base instalada sem contrato/.test(document.getElementById('tela').innerText);
    /* separação: o dashboard Contratos não mostra a gestão; a aba Locação filtra */
    irTela('contratos'); out.dash = { semAbas: !document.querySelector('#tela .gc-abas'), link: /Gestão → Contratos e serviços recorrentes/.test(document.getElementById('tela').innerText) };
    irTela('gestao'); GC.aba = 'loc'; render(); out.abaLoc = [...document.querySelectorAll('#tela [data-sid="gc-lista"] ~ .card tbody tr')].length;
    /* indicadores */
    GC.aba = 'ind'; GC.indCat = ''; render(); const I = document.getElementById('tela').innerText; out.ind = { equip: /EQUIPAMENTOS CADASTRADOS/i.test(I), loc: /LOCAÇÕES ATIVAS/i.test(I), cumpr: /CUMPRIMENTO DAS VISITAS\s*\n?\s*\d+%/i.test(I), rel: /RELATÓRIOS DE VISITA PENDENTES\s*\n?\s*1\b/i.test(I), exec: !!document.querySelector('#tela [data-sid="gci-exec"]') };
    /* sem escrever: o que foi gravado não pode ser apagado por permissão */
    out.docs = [...window.__SIM.docs.keys()].map(k => k.split('/')[0]).sort().join(',');
    return out; });
  t(r.ficha.valor === 120000 && r.ficha.src === 'ficha', 'valor da ficha manda sobre o automático (' + r.auto.src + ' → ficha)');
  t(r.ficha.meses === 12 && /^mês [67] de 12$/.test(r.ficha.fase), 'mês do contrato: ' + r.ficha.fase);
  t(r.ficha.esperadas === 7, 'visitas mensais esperadas desde o início (6 meses e 3 dias → 7): ' + r.ficha.esperadas);
  t(r.ficha.saldo === Math.max(0, 120000 - r.ficha.fat), 'saldo = valor − faturado no Omie: ' + r.ficha.saldo);
  t(r.ficha.ptc === '99999', 'PTC da ficha');
  t(r.toque, 'ficha preenchida por toque: tipo, situação, reajuste, mês, renovação e periodicidade são opções de marcar');
  t(r.feito && r.feito.every(n => n === 3), 'visita: itens feitos marcados como caixas (3 marcados por visita): ' + JSON.stringify(r.feito));
  t(r.vis.realizadas === 2 && r.vis.atraso === 5 && r.vis.semRel === 1, 'visitas: 2 realizadas, 5 atrasadas, 1 sem relatório: ' + JSON.stringify(r.vis));
  t(r.vis.prox === 'agendada' && r.vis.blobs === 1 && r.vis.relId, 'próxima visita = a agendada; relatório enviado ao armazenamento');
  t(r.anexo.n === 1 && r.anexo.tipo === 'Contrato', 'anexo classificado como Contrato pelo nome do arquivo');
  t(Object.values(r.fichaTxt).every(Boolean) && r.link, 'ficha mostra valor, visitas, anexo, relatório pendente e origem: ' + JSON.stringify(r.fichaTxt));
  t(r.novo && r.novo.cli === 'Cliente Teste' && r.novo.mensal === 2000 && r.novo.status === 'Ativo', 'contrato criado só no painel entra na carteira: ' + JSON.stringify(r.novo));
  t(r.ind.cumpr && r.ind.rel && r.ind.exec, 'indicadores: cumprimento, relatórios pendentes e execução por contrato');
  t(r.locN === 2 && r.eq && r.eq.n === 1 && r.eq.semSerie === 1 && r.eq.sit === 'Locado no cliente' && /OV .* \(Omie\)/.test(r.eq.origem), 'locações do Controle (REN) e equipamento sugerido pela OV do Omie: ' + JSON.stringify(r.eq));
  t(r.eq && r.eq.depois === 0 && r.eq.check && r.eq.busca === 1, 'nº de série preenchido: some o alerta, cadastro marca a série e a busca acha pelo número');
  t(r.dash.semAbas && r.dash.link && r.abaLoc === 2, 'dashboard de contratos separado da gestão; aba Locação lista 2: ' + JSON.stringify(r.dash) + ' ' + r.abaLoc);
  t(r.ind.equip && r.ind.loc, 'indicadores de equipamentos e de locação');
  t(r.antes >= 2, 'equipamentos iguais: sugestões antes de preencher (' + r.antes + ')');
  t(r.rev && r.rev.txt && r.rev.marcados === 1 && r.rev.total === 2 && r.rev.div, 'ao salvar a rotação, pergunta: "Reconheci que… 6M16 … rotação = 1800" — vazio marcado, divergente desmarcado: ' + JSON.stringify(r.rev));
  t(r.depois.m1 === '1800' && /informado agora/.test(r.depois.fonte), 'confirmado: o motor igual recebe a rotação (' + JSON.stringify(r.depois) + ')');
  t(r.depois.m2 === '2100', 'o divergente não marcado não muda sem confirmação');
  t(!r.outraPot && r.mesmoMod, 'mesmo modelo com outra potência não é "igual"; "6 M-16" = "6M16" e a marca não se contradiz');
  t(Object.values(r.redund).every(Boolean), 'ficha sem redundância: o que falta primeiro, o automático depois com o valor à mostra: ' + JSON.stringify(r.redund));
  t(r.bi.clientes > 0 && r.bi.forn >= r.bi.clientes && r.bi.ctrOk && r.bi.kpi, 'base instalada: ' + r.bi.clientes + ' clientes, ' + r.bi.forn + ' fornecimentos; com contrato = contrato ativo de ITM/manutenção');
  t(r.bi.st === 'Oferecido' && Array.isArray(r.bi.of) && r.bi.of.length === 1 && r.bi.chip, 'andamento da oportunidade por toque e alerta na Central de supervisão');
  t(r.docs === 'baseOport,contratos,contratos,ctrAnexos,ctrEquip,ctrEquip,ctrEquip,ctrEquip,ctrVisitas,ctrVisitas,ctrVisitas', 'gravou só nas coleções da gestão: ' + r.docs);
  await p.close();
  /* 3. só leitura: sem botões de edição, aviso de leitura */
  { const q = await abrir(false); const s = await q.evaluate(() => { irTela('gestao'); GC.aba = 'todos'; render(); const id = gcContratos()[0].id; gcFicha(id);
      return { aviso: /só de leitura/.test(document.getElementById('tela').innerText), novo: !!document.querySelector('#tela button[onclick="gcNovo()"]'), editar: /Editar ficha/.test(document.getElementById('m-ctr').innerText) }; });
    t(s.aviso && !s.novo && !s.editar, 'só leitura: aviso e nenhum botão de edição'); await q.close(); }
  ok.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${ok.filter(x => x[0]).length}/${ok.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(ok.every(x => x[0]) && !erros.length ? 0 : 1);
})();
