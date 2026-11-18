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
    const r = await p.evaluate(() => { irTela('contratos'); GC.aba = 'gestao'; render(); const T = document.getElementById('tela').innerText;
      return { est: GC.estado, aviso: /disponível só no painel publicado/.test(T), novo: !!document.querySelector('#tela button[onclick="gcNovo()"]'), n: gcContratos().length }; });
    t(r.est === 'indisponivel' && r.aviso && !r.novo, 'arquivo baixado: aviso de "só no painel publicado" e sem botão de novo contrato');
    t(r.n > 0, 'arquivo baixado: lista os contratos automáticos (' + r.n + ')'); await p.close(); }
  /* 2. com banco e permissão de escrita */
  const p = await abrir(true);
  const r = await p.evaluate(async () => {
    const out = {}; irTela('contratos'); GC.aba = 'gestao'; render();
    const L0 = gcContratos(), a = L0.find(x => x.ativo) || L0[0]; out.id = a.id;
    out.auto = { valor: a.valor, src: a.valorSrc, fat: a.fat };
    /* ficha: valor, vigência de 12 meses começando há ~6 meses, visita mensal */
    const R = hoje(), ini = new Date(R.getFullYear(), R.getMonth() - 6, R.getDate() - 3);
    gcEditar(a.id); const f = document.querySelector('#m-form form');
    const set = (n, v) => { const e = f.querySelector(`[name="${n}"]`); e.value = v; };
    set('valorTotal', '120000'); set('ini', isoD(ini)); set('fim', ''); set('meses', '12'); set('periodicidade', 'mensal'); set('respInterno', 'Responsável Teste'); set('reajuste', 'IPCA'); set('ptc', '99999');
    f.requestSubmit(); await new Promise(r => setTimeout(r, 120));
    let x = gcContratos().find(k => k.id === a.id);
    out.ficha = { valor: x.valor, src: x.valorSrc, meses: x.meses, fase: x.fase, esperadas: x.esperadas, realizadas: x.realizadas.length, atraso: x.visAtraso, saldo: x.saldo, fat: x.fat, completo: x.completo, ptc: x.ptc };
    /* duas visitas realizadas (uma com relatório) e uma agendada */
    for (const [d, st, comRel] of [[isoD(new Date(+ini + 5 * 864e5)), 'Realizada', true], [isoD(new Date(+ini + 40 * 864e5)), 'Realizada', false], [isoD(new Date(+R + 10 * 864e5)), 'Agendada', false]]) {
      gcVisita(a.id); const g = document.querySelector('#m-form form');
      g.querySelector('[name=data]').value = d; g.querySelector('[name=status]').value = st; g.querySelector('[name=tecnico]').value = 'Técnico Teste'; g.querySelector('[name=resumo]').value = 'Teste';
      if (comRel) { const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1.4 teste'], 'relatorio.pdf', { type: 'application/pdf' })); g.querySelector('[name=rel]').files = dt.files; }
      g.requestSubmit(); await new Promise(r => setTimeout(r, 150)); }
    x = gcContratos().find(k => k.id === a.id);
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
    /* indicadores */
    GC.aba = 'ind'; render(); const I = document.getElementById('tela').innerText; out.ind = { cumpr: /CUMPRIMENTO DAS VISITAS\s*\n?\s*\d+%/i.test(I), rel: /RELATÓRIOS DE VISITA PENDENTES\s*\n?\s*1\b/i.test(I), exec: !!document.querySelector('#tela [data-sid="gci-exec"]') };
    /* sem escrever: o que foi gravado não pode ser apagado por permissão */
    out.docs = [...window.__SIM.docs.keys()].map(k => k.split('/')[0]).sort().join(',');
    return out; });
  t(r.ficha.valor === 120000 && r.ficha.src === 'ficha', 'valor da ficha manda sobre o automático (' + r.auto.src + ' → ficha)');
  t(r.ficha.meses === 12 && /^mês [67] de 12$/.test(r.ficha.fase), 'mês do contrato: ' + r.ficha.fase);
  t(r.ficha.esperadas === 7, 'visitas mensais esperadas desde o início (6 meses e 3 dias → 7): ' + r.ficha.esperadas);
  t(r.ficha.saldo === Math.max(0, 120000 - r.ficha.fat), 'saldo = valor − faturado no Omie: ' + r.ficha.saldo);
  t(r.ficha.ptc === '99999', 'PTC da ficha');
  t(r.vis.realizadas === 2 && r.vis.atraso === 5 && r.vis.semRel === 1, 'visitas: 2 realizadas, 5 atrasadas, 1 sem relatório: ' + JSON.stringify(r.vis));
  t(r.vis.prox === 'agendada' && r.vis.blobs === 1 && r.vis.relId, 'próxima visita = a agendada; relatório enviado ao armazenamento');
  t(r.anexo.n === 1 && r.anexo.tipo === 'Contrato', 'anexo classificado como Contrato pelo nome do arquivo');
  t(Object.values(r.fichaTxt).every(Boolean) && r.link, 'ficha mostra valor, visitas, anexo, relatório pendente e origem: ' + JSON.stringify(r.fichaTxt));
  t(r.novo && r.novo.cli === 'Cliente Teste' && r.novo.mensal === 2000 && r.novo.status === 'Ativo', 'contrato criado só no painel entra na carteira: ' + JSON.stringify(r.novo));
  t(r.ind.cumpr && r.ind.rel && r.ind.exec, 'indicadores: cumprimento, relatórios pendentes e execução por contrato');
  t(r.docs === 'contratos,contratos,ctrAnexos,ctrVisitas,ctrVisitas,ctrVisitas', 'gravou só nas coleções da gestão: ' + r.docs);
  await p.close();
  /* 3. só leitura: sem botões de edição, aviso de leitura */
  { const q = await abrir(false); const s = await q.evaluate(() => { irTela('contratos'); GC.aba = 'gestao'; render(); const id = gcContratos()[0].id; gcFicha(id);
      return { aviso: /só de leitura/.test(document.getElementById('tela').innerText), novo: !!document.querySelector('#tela button[onclick="gcNovo()"]'), editar: /Editar ficha/.test(document.getElementById('m-ctr').innerText) }; });
    t(s.aviso && !s.novo && !s.editar, 'só leitura: aviso e nenhum botão de edição'); await q.close(); }
  ok.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${ok.filter(x => x[0]).length}/${ok.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(ok.every(x => x[0]) && !erros.length ? 0 : 1);
})();
