/* Apresentação (aba "Apresentação"): prévia no painel, tela cheia, arquivo baixado,
   números iguais aos do motor, filtros respeitados, celular.
   Uso: LANG=C.UTF-8 node testes/apresentacao.js <Painel.html> */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const src = path.resolve(process.argv[2]); const ok = [], falhas = []; const t = (c, m) => (c ? ok : falhas).push(m);
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + src); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  await p.evaluate(() => irTela('apresentacao')); await p.waitForFunction(() => _APRES_HTML.length > 1000);
  await p.waitForTimeout(800);
  const fr = p.frameLocator('#apres-fr');
  const r = await p.evaluate(() => { const X = indicadoresPeriodo(PER); return { ped: fmtCompacto(X.ped), n: fmtN(X.nPed), renders: 0, srcdoc: document.getElementById('apres-fr').srcdoc.length }; });
  const nSec = await fr.locator('section[id]').count(), h1 = await fr.locator('#resultado h2').innerText();
  t(r.srcdoc > 1000 && nSec === 12, `prévia na aba: 12 capítulos (${nSec})`);
  t(h1.includes(r.ped) && h1.includes(r.n + ' pedidos'), `capítulo Resultado com os números do motor (${r.ped}, ${r.n} pedidos)`);
  /* não entra em ciclo de redesenho: o HTML fica estável */
  const estavel = await p.evaluate(async () => { let n = 0; const orig = apresentacaoHTML; window.apresentacaoHTML = function () { n++; return orig.apply(this, arguments); }; await new Promise(r => setTimeout(r, 1500)); window.apresentacaoHTML = orig; return n; });
  t(estavel === 0, 'sem ciclo de redesenho (a apresentação não se refaz sozinha)');
  /* navegação interna */
  await fr.locator('.nav-l a[href="#contratos"]').click(); await p.waitForTimeout(1200);
  t(await fr.locator('.nav-l a.on').innerText() === 'Contratos', 'menu de capítulos leva ao capítulo e marca onde se está');
  /* tela cheia e Esc */
  await p.locator('button', { hasText: 'Tela cheia' }).click(); await p.waitForTimeout(500);
  const aberta = await p.evaluate(() => document.getElementById('apres-view').classList.contains('aberto') && document.querySelector('#apres-view iframe').srcdoc.length > 1000);
  /* Esc com o foco dentro da apresentação (é onde ele fica) */
  await p.frameLocator('#apres-view iframe').locator('body').press('Escape'); await p.waitForTimeout(300);
  const fechouEsc = await p.evaluate(() => !document.getElementById('apres-view').classList.contains('aberto') && !document.body.classList.contains('apres-on') && !document.fullscreenElement);
  t(aberta && fechouEsc, 'tela cheia abre e fecha com Esc (foco dentro da apresentação) e sai do modo tela cheia');
  /* sair da tela cheia pelo navegador também fecha */
  await p.locator('button', { hasText: 'Tela cheia' }).click(); await p.waitForTimeout(400); await p.evaluate(() => document.exitFullscreen && document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
  t(await p.evaluate(() => !document.body.classList.contains('apres-on')), 'sair da tela cheia pelo navegador fecha a apresentação');
  if (await p.evaluate(() => document.body.classList.contains('apres-on'))) await p.evaluate(() => apresFechar());
  /* filtro: só SPV */
  await p.evaluate(() => { EST.div = 'SPV'; aplicar(); }); await p.waitForTimeout(900);
  const spv = await p.evaluate(() => { const X = indicadoresPeriodo(PER); return fmtCompacto(X.ped); });
  const h1s = await p.frameLocator('#apres-fr').locator('#resultado h2').innerText();
  t(h1s.includes(spv), `com o filtro SPV a apresentação mostra só a SPV (${spv})`);
  t(/SPV/.test(await p.frameLocator('#apres-fr').locator('#metodo').innerText()), 'metodologia registra o recorte');
  await p.evaluate(() => { EST.div = ''; aplicar(); }); await p.waitForTimeout(900);
  /* arquivo baixado: autônomo */
  const dl = p.waitForEvent('download'); await p.locator('button', { hasText: 'Baixar apresentação' }).click(); const d = await dl, f = await d.path(), html = fs.readFileSync(f, 'utf8');
  const ext = [...html.matchAll(/<(script|link)[^>]+(src|href)="(https?:[^"]+)"/g)].map(m => m[3]);
  t(/^Apresentacao-Comercial-LS-Fire-\d{4}-\d{2}-\d{2}\.html$/.test(d.suggestedFilename()) && ext.every(u => /fonts\.googleapis/.test(u)), `arquivo único, sem dependência além da fonte opcional (${d.suggestedFilename()})`);
  /* abre sozinho, offline, no celular */
  const out = path.join(path.dirname(f), 'apres-teste.html'); fs.writeFileSync(out, html);
  const q = await b.newPage({ viewport: { width: 390, height: 844 } }); const eq = []; q.on('pageerror', e => eq.push(e.message));
  await q.route(/^https?:/, r => r.abort()); await q.goto('file://' + out); await q.waitForTimeout(600);
  for (const id of ['resultado', 'pulso', 'divisoes', 'contratos', 'agora']) { await q.evaluate(i => document.getElementById(i).scrollIntoView(), id); await q.waitForTimeout(500); }
  const cel = await q.evaluate(() => ({ larg: document.documentElement.scrollWidth, vw: innerWidth, anim: document.querySelectorAll('section.in').length, fim: [...document.querySelectorAll('#resultado .n')].map(n => n.textContent) }));
  t(cel.larg <= cel.vw, 'celular: sem rolagem lateral');
  t(cel.anim >= 5 && eq.length === 0, `sem internet e no celular: abre, anima os capítulos e não dá erro (${cel.anim} capítulos vistos)`);
  t(cel.fim[0] === r.ped, `contador termina no valor exato (${cel.fim[0]})`);
  t(erros.length === 0, 'sem erros de JavaScript no painel' + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));
  console.log(ok.map(m => '✓ ' + m).join('\n')); if (falhas.length) console.log(falhas.map(m => '✗ ' + m).join('\n'));
  console.log(`\n${ok.length}/${ok.length + falhas.length} verificações`); await b.close(); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
