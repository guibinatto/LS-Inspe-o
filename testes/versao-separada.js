/* Versão separada (index.html + styles.css + app.js) contra o arquivo único.
   Uso: node testes/versao-separada.js <Painel.html> <pasta versao-separada>
   As CDNs são interceptadas e respondidas com as MESMAS bibliotecas que estão
   embutidas no arquivo único — o teste não depende de internet.
   Rode com LANG=C.UTF-8: sem locale UTF-8 o Chromium sem tela troca nomes de
   arquivo com acento ("Supervisão…xlsx") por "download". */
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const [unico, pasta] = process.argv.slice(2).map(p => path.resolve(p));
const H = fs.readFileSync(unico, 'utf8');
const lib = re => { const m = H.match(re); if (!m) throw new Error('biblioteca não encontrada'); return m[1]; };
/* a cópia embutida da SheetJS escreve o caractere U+FFFD das tabelas de código de página como
   o escape � (o publicador do claude.ai recusa o caractere literal); a CDN entrega o
   literal, e o SRI confere bytes: desfaz o escape para responder com o arquivo exato */
const XLSX_JS = lib(/<script>(\/\*! xlsx\.js[\s\S]*?)<\/script>/).replace(/\\ufffd/g, '�'), CHART_JS = lib(/<script>(\/\*\*\s*\n\s*\* Skipped minification[\s\S]*?)<\/script>/);
const ok = [], falhas = []; const t = (c, m) => (c ? ok : falhas).push(m);

const srv = http.createServer((q, r) => { const f = path.join(pasta, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(pasta) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(f)] + ';charset=utf-8' }); fs.createReadStream(f).pipe(r); });

(async () => {
  await new Promise(ok => srv.listen(0, ok)); const URL = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch(); const pedidos = [];
  async function abrir(alvo, w = 1400) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, acceptDownloads: true }); const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) erros.push(m.text()); });
    await ctx.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|cdn\.sheetjs\.com/, r => { pedidos.push(r.request().url());
      const u = r.request().url(); r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: /xlsx/.test(u) ? XLSX_JS : /chart/i.test(u) ? CHART_JS : '' }); });
    await p.goto(alvo); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 30000 }); return { p, ctx, erros };
  }
  const resumo = async p => p.evaluate(async () => { const R = {};
    for (const x of TELAS.map(t => t.id)) { irTela(x); await new Promise(r => setTimeout(r, 150));
      R[x] = Object.keys(CHARTS).length + 'c/' + document.querySelectorAll('#tela figure.gb').length + 's/' + document.querySelectorAll('#tela table').length + 't/' + document.querySelectorAll('#tela .kpi').length + 'k'; }
    return { telas: R, cor: getComputedStyle(document.querySelector('.btn')).backgroundColor, fonte: getComputedStyle(document.body).fontFamily }; });

  const A = await abrir('file://' + unico), ra = await resumo(A.p);
  const S = await abrir(URL), rs = await resumo(S.p);
  t(pedidos.some(u => /chart\.umd/.test(u)) && pedidos.some(u => /xlsx\.full/.test(u)), 'Chart.js e SheetJS pedidos à CDN');
  t(!pedidos.some(u => /cdnjs/.test(u)), 'reserva (cdnjs) não acionada quando a CDN principal responde; bibliotecas aceitas pela verificação de integridade (SRI)');
  t(await S.p.evaluate(() => !!window.Chart && Chart.version === '4.4.1' && !!window.XLSX && XLSX.version === '0.20.3'), 'versões das bibliotecas iguais às do arquivo único');
  t(await S.p.evaluate(() => [...document.styleSheets].some(s => s.href && /styles\.css$/.test(s.href)) && document.querySelectorAll('style').length === 0), 'CSS vem só de styles.css');
  t(JSON.stringify(ra.telas) === JSON.stringify(rs.telas), 'todas as telas desenham o mesmo (gráficos, SVG, tabelas, KPIs)' + (JSON.stringify(ra.telas) === JSON.stringify(rs.telas) ? '' : `\n   único ${JSON.stringify(ra.telas)}\n   separ ${JSON.stringify(rs.telas)}`));
  t(ra.cor === rs.cor && ra.fonte === rs.fonte, `mesmo visual (botão ${rs.cor})`);
  t(S.erros.length === 0, 'sem erros de JavaScript na versão separada' + (S.erros.length ? ': ' + S.erros.slice(0, 3).join(' | ') : ''));
  t(A.erros.length === 0, 'sem erros de JavaScript no arquivo único' + (A.erros.length ? ': ' + A.erros.slice(0, 3).join(' | ') : ''));

  /* exportação Excel com indicador de carregamento */
  for (const [nome, P] of [['único', A.p], ['separada', S.p]]) {
    await P.evaluate(() => { irTela('relatorios'); }); await P.waitForTimeout(300);
    const bt = P.locator('button', { hasText: 'Planilha de detalhamento' }).first();
    const dl = P.waitForEvent('download', { timeout: 30000 });
    await bt.click(); const girou = await bt.evaluate(e => e.classList.contains('carregando') && e.disabled && getComputedStyle(e, '::before').animationName === 'giro');
    const d = await dl; await P.waitForFunction(b => !document.querySelector('.carregando'), null, { timeout: 30000 });
    const f = await d.path(), tam = fs.statSync(f).size, cab = fs.readFileSync(f).slice(0, 2).toString();
    t(girou, `[${nome}] botão mostra o giro e fica bloqueado durante a exportação`);
    t(/\.xlsx$/.test(d.suggestedFilename()) && cab === 'PK' && tam > 5000, `[${nome}] planilha .xlsx válida (${(tam / 1024).toFixed(0)} KB · ${d.suggestedFilename()} · ${JSON.stringify(cab)})`);
    t(await P.evaluate(() => !document.querySelector('.carregando, [aria-busy]')), `[${nome}] botão volta ao normal depois`);
  }
  /* Excel da consulta */
  await S.p.evaluate(() => irTela('busca')); await S.p.fill('#pq-q', 'BYD'); await S.p.keyboard.press('Enter'); await S.p.waitForTimeout(500);
  { const dl = S.p.waitForEvent('download'); await S.p.locator('button', { hasText: '↓ Excel' }).first().click(); const d = await dl; t(/\.xlsx$/.test(d.suggestedFilename()), 'Excel da consulta baixa na versão separada'); }

  /* arquivos baixados levam o CSS da folha externa */
  t(await S.p.evaluate(() => { const c = cssPagina(); return c.length > 50000 && /\.btn/.test(c) && /--lar/.test(c); }), 'relatórios baixados levam o CSS de styles.css');
  t(await A.p.evaluate(() => cssPagina().length > 50000), 'relatórios baixados levam o CSS (arquivo único)');
  /* "↓ Salvar" na versão separada: continua apontando para styles.css/app.js, sem duplicar bibliotecas */
  const sv = await S.p.evaluate(async () => CAB_LOCAL + await corpoComDados(BRUTO));
  t(/href="styles\.css"/.test(sv) && /src="app\.js"/.test(sv) && (sv.match(/chart\.umd\.min\.js/g) || []).length <= 2 && !/<style>/.test(sv), '"↓ Salvar" gera um index.html que usa styles.css e app.js');

  /* celular: tabela com rolagem lateral, página sem rolagem lateral */
  const M = await abrir(URL, 390);
  const cel = await M.p.evaluate(async () => { const R = []; for (const x of ['executiva', 'resultados', 'pipeline', 'carteira']) { irTela(x); await new Promise(r => setTimeout(r, 200));
    const T = [...document.querySelectorAll('#tela table')].filter(e => e.offsetParent);
    R.push({ x, pag: document.documentElement.scrollWidth <= innerWidth, todasEmTw: T.every(e => e.closest('.tw')), rolam: T.filter(e => e.closest('.tw').scrollWidth > e.closest('.tw').clientWidth).length, n: T.length,
      fixa: T.length ? getComputedStyle(T[0].querySelector('td,th')).position : '' }); } return R; });
  for (const c of cel) { t(c.pag, `[celular ${c.x}] página não rola para o lado`); t(c.todasEmTw && c.rolam === c.n, `[celular ${c.x}] ${c.n} tabela(s) com rolagem lateral própria`); if (c.n) t(c.fixa === 'sticky', `[celular ${c.x}] primeira coluna fixa ao rolar`); }
  t(M.erros.length === 0, 'sem erros no celular');

  console.log(ok.map(m => '✓ ' + m).join('\n')); if (falhas.length) console.log(falhas.map(m => '✗ ' + m).join('\n'));
  console.log(`\n${ok.length}/${ok.length + falhas.length} verificações`);
  await b.close(); srv.close(); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
