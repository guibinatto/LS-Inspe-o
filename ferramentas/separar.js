#!/usr/bin/env node
/* Gera a versão em arquivos separados do Painel Executivo a partir do arquivo
   único (que continua sendo a fonte e a versão para distribuir/abrir offline).

   Uso:  node ferramentas/separar.js [Painel.html] [pasta-de-saída]
   Saída: index.html (estrutura + bases embutidas), styles.css, app.js

   - Chart.js 4.4.1 e SheetJS 0.18.5 passam a vir de CDN (cdnjs, com jsDelivr de
     reserva) em vez de embutidos — as mesmas versões do arquivo único.
   - As bases (seed-dados / seed-config) ficam no index.html: são dados, e o
     "↓ Salvar" regrava justamente esses dois blocos.
   - Os <script> da aplicação são concatenados na mesma ordem em app.js. Scripts
     clássicos compartilham o escopo global, então o comportamento é o mesmo. */
const fs = require('fs'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '..', 'dados', 'painel-completo.html');
const out = process.argv[3] || path.join(__dirname, '..', 'versao-separada');
let h = fs.readFileSync(src, 'utf8').replace(/^﻿/, '');

const CDN = {
  xlsx: ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
         'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX'],
  chart: ['https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
          'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'Chart'],
};
const tagCDN = ([a, b, g]) => `<script src="${a}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>\n` +
  `<script>window.${g}||document.write('<script src="${b}" crossorigin="anonymous"><\\/script>')</script>`;

/* separa a página em blocos de nível superior: <script>…</script>, <style>…</style> e o resto.
   O fechamento é procurado literalmente: dentro do JS, "</script>" sempre aparece escapado. */
function blocos(s) {
  const L = []; let i = 0;
  const re = /<(script|style)(\s[^>]*)?>/gi; let m;
  while ((m = re.exec(s))) {
    const fim = s.indexOf(`</${m[1].toLowerCase()}>`, re.lastIndex);
    if (fim < 0) throw new Error('bloco sem fechamento em ' + m.index);
    if (m.index > i) L.push({ t: 'html', s: s.slice(i, m.index) });
    L.push({ t: m[1].toLowerCase(), attrs: m[2] || '', corpo: s.slice(re.lastIndex, fim), s: s.slice(m.index, fim + m[1].length + 3) });
    i = re.lastIndex = fim + m[1].length + 3;
  }
  L.push({ t: 'html', s: s.slice(i) }); return L;
}

const B = blocos(h), css = [], js = [], html = [];
let pos = 'head', jsInserido = false, nLib = 0;
for (const b of B) {
  if (b.t === 'html') { if (/<body[\s>]/i.test(b.s)) pos = 'body'; html.push(b.s); continue; }
  if (b.t === 'style') { css.push(b.corpo.trim()); if (css.length === 1) html.push('<link rel="stylesheet" href="styles.css">'); continue; }
  /* script */
  if (/^\s*\/\*!\s*xlsx\.js/.test(b.corpo)) { html.push(tagCDN(CDN.xlsx)); nLib++; continue; }
  if (/^\s*\/\*!\s*\n?\s*\*\s*Chart\.js v/.test(b.corpo)) { html.push(tagCDN(CDN.chart)); nLib++; continue; }
  if (/\bid=["']seed-/.test(b.attrs) || /type=["']application\/json/.test(b.attrs)) { html.push(b.s); continue; }
  if (pos === 'head') { html.push(b.s); continue; }   /* script de cabeçalho (ex.: tema) fica onde está */
  js.push(b.corpo.replace(/^\n+|\s+$/g, ''));
  if (!jsInserido) { html.push('<script src="app.js"></script>'); jsInserido = true; }
}
if (nLib !== 2) throw new Error(`esperava 2 bibliotecas embutidas (SheetJS e Chart.js), achei ${nLib}`);
if (!js.length || !css.length) throw new Error('não achei CSS ou JS da aplicação');

/* index.html: remove linhas em branco que sobram onde estavam os blocos */
const idx = html.join('').replace('<link rel="stylesheet" href="styles.css">', '')
  .replace('<!--LSF-INICIO-->', '<!--LSF-INICIO-->\n<link rel="stylesheet" href="styles.css">').replace(/\n{3,}/g, '\n\n');
const cab = '/* Painel Executivo LS Fire — gerado por ferramentas/separar.js a partir de ' + path.basename(src) + '.\n   Não edite aqui: altere o arquivo único e gere de novo. */\n';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), idx);
fs.writeFileSync(path.join(out, 'styles.css'), cab + css.join('\n\n') + '\n');
fs.writeFileSync(path.join(out, 'app.js'), cab + js.join('\n\n/* ------------------------------------------------------------ */\n\n') + '\n');
const kb = f => (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB';
console.log(`ok → ${out}\n  index.html ${kb('index.html')} · styles.css ${kb('styles.css')} · app.js ${kb('app.js')} · ${js.length} scripts unidos`);
