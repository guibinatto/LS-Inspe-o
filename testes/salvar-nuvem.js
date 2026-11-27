/* Botão "☁ Salvar no Claude" no topo e salvamento automático, com o Claude simulado
   (publish falso que só conta as gravações). Sem window.claude o botão some.
   Uso: LANG=C.UTF-8 node testes/salvar-nuvem.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const arq = 'file://' + path.resolve(process.argv[2]);
  const b = await chromium.launch(), ok = [], t = (c, m) => ok.push([!!c, m]), erros = [];
  const abrir = async (sim, editar) => {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } }); p.on('pageerror', e => erros.push(e.message));
    if (sim) await p.addInitScript(ed => {
      window._pub = []; const A = { publish: async h => { window._pub.push(h.length); } }, U = { canEdit: async () => ed };
      window.claude = { use: async n => n === 'artifact' ? A : n === 'user' ? U : null };
    }, editar);
    await p.goto(arq); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
    await p.waitForTimeout(4600); return p; };
  /* 1) arquivo local, sem Claude: botão escondido */
  let p = await abrir(false);
  t(await p.evaluate(() => document.getElementById('bt-nuvem').hidden), 'sem Claude: botão escondido');
  t(!(await p.evaluate(() => [...document.querySelectorAll('#mais-m button')].some(x => /Salvar no Claude/.test(x.textContent)))), 'saiu do menu ⋯ Mais');
  await p.close();
  /* 2) quem só vê o link: sem botão */
  p = await abrir(true, false);
  t(await p.evaluate(() => document.getElementById('bt-nuvem').hidden), 'só leitura: botão escondido');
  await p.close();
  /* 3) dono: botão visível, "Salvo"; uma alteração deixa pendente; grava sozinho depois de 2 min parado */
  p = await abrir(true, true);
  t(await p.evaluate(() => { const bt = document.getElementById('bt-nuvem'); return !bt.hidden && bt.getBoundingClientRect().width > 0 && /Salvo/.test(bt.textContent); }), 'dono: botão visível no topo, "Salvo no Claude"');
  await p.mouse.click(5, 5);
  const r = await p.evaluate(() => { CFG.testeNuvem = Date.now(); nuvemVigiar();
    const pend = document.getElementById('bt-nuvem').classList.contains('pend'), n0 = window._pub.length;
    NUVEM.ultMud = Date.now() - 60000; NUVEM.ultUso = Date.now() - 60000; nuvemVigiar(); const n1 = window._pub.length;
    return { pend, n0, n1 }; });
  t(r.pend && r.n0 === 0, 'alteração: botão marca "não salvo" e não grava na hora');
  t(r.n1 === 0, 'com menos de 2 minutos parado, ainda não grava');
  await p.evaluate(async () => { NUVEM.ultMud = Date.now() - 130000; NUVEM.ultUso = Date.now() - 40000; nuvemVigiar(); await new Promise(r => setTimeout(r, 1500)); });
  const r2 = await p.evaluate(() => ({ n: window._pub.length, tam: window._pub[0] || 0, txt: document.getElementById('bt-nuvem').textContent }));
  t(r2.n === 1 && r2.tam > 1e6, 'depois de 2 minutos parado, grava sozinho uma vez: ' + r2.n + ' gravação');
  t(/Salvo/.test(r2.txt), 'depois de gravar volta para "Salvo no Claude"');
  await p.evaluate(async () => { NUVEM.ultMud = Date.now() - 300000; NUVEM.ultUso = Date.now() - 300000; nuvemVigiar(); await new Promise(r => setTimeout(r, 300)); });
  t(await p.evaluate(() => window._pub.length) === 1, 'sem alteração nova, não grava de novo');
  await p.evaluate(async () => { await salvarNoClaude(document.getElementById('bt-nuvem')); });
  t(await p.evaluate(() => window._pub.length) === 2, 'um clique no botão grava na hora (sem confirmação dupla)');
  /* 4) sem ninguém mexer na página, nunca grava sozinho (evita gravar em toda abertura) */
  await p.close(); p = await abrir(true, true);
  await p.evaluate(async () => { CFG.testeNuvem2 = 1; nuvemVigiar(); NUVEM.ultMud = Date.now() - 300000; NUVEM.ultUso = 0; nuvemVigiar(); await new Promise(r => setTimeout(r, 500)); });
  t(await p.evaluate(() => window._pub.length) === 0, 'sem interação de alguém, não grava sozinho');
  await p.close();
  /* 5) celular: botão só com o ícone, sem estourar a largura */
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(() => { window._pub = []; const A = { publish: async () => {} }, U = { canEdit: async () => true }; window.claude = { use: async n => n === 'artifact' ? A : n === 'user' ? U : null }; });
  await m.goto(arq); await m.waitForFunction(() => typeof F !== 'undefined' && F.todas); await m.waitForTimeout(4600);
  t(await m.evaluate(() => { const bt = document.getElementById('bt-nuvem'), r = bt.getBoundingClientRect(); return !bt.hidden && r.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth + 1; }), 'celular: botão visível, sem rolagem lateral');
  ok.forEach(([c, x]) => console.log((c ? '✓ ' : '✗ ') + x));
  console.log(`${ok.filter(x => x[0]).length}/${ok.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(ok.every(x => x[0]) && !erros.length ? 0 : 1);
})();
