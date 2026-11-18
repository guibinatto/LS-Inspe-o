/* Auditoria visual automática: todas as telas × (computador 1400 px, celular 390 px) × (claro, escuro).
   Procura texto sobreposto, texto cortado, contraste abaixo de WCAG AA, "null/NaN/undefined" na tela,
   alvos de toque pequenos no celular, campos sem nome acessível, rolagem lateral e erros de JavaScript.
   Uso: node testes/auditoria-visual.js <painel.html> <pasta-saida> [telas,separadas] (TEMAS=claro,escuro) */
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const [src, out, soTelas] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(), R = [];
  for (const [vw, vh, vn] of [[1400, 1000, 'pc'], [390, 844, 'cel']]) for (const tema of (process.env.TEMAS||'claro,escuro').split(',')) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push('JS: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
    p.on('dialog', d => { errs.push('diálogo: ' + d.message().slice(0, 100)); d.dismiss(); });
    const t0 = Date.now();
    await p.goto('file://' + path.resolve(src)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 90000 });
    const carga = Date.now() - t0;
    await p.evaluate(t => { const h = document.documentElement; if ((h.dataset.t === 'claro') !== (t === 'claro')) trocarTema(); }, tema);
    const telas = await p.evaluate(() => TELAS.map(t => t.id));
    for (const id of telas) {
      if (soTelas && !soTelas.split(',').includes(id)) continue;
      errs.length = 0;
      const ms = await p.evaluate(id => { const t = performance.now(); irTela(id); return Math.round(performance.now() - t); }, id);
      await p.waitForTimeout(id === 'apresentacao' ? 1500 : 700);
      const r = await p.evaluate(({ vn }) => {
        const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const visCad = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; if (x.tagName === 'DETAILS' && !x.open && x !== e) { /* conteúdo de details fechado */ const sm = x.querySelector('summary'); if (sm && !sm.contains(e)) return false; } } return true; };
        const raiz = document.querySelector('main') || document.body;
        const quem = e => { const t = (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50); let c = e; const caminho = []; while (c && c !== document.body && caminho.length < 3) { caminho.unshift(c.tagName.toLowerCase() + (c.className && typeof c.className === 'string' ? '.' + c.className.trim().split(/\s+/)[0] : '')); c = c.parentElement; } return caminho.join('>') + ' «' + t + '»'; };
        /* 1. textos sobrepostos (nós de texto HTML + <text> de SVG) */
        /* área visível: intersecção com todo ancestral que recorta (tabelas com rolagem interna) */
        const recorta = (q, e) => { let l = q.left, t = q.top, r = q.right, bt = q.bottom; for (let x = e.parentElement; x && x !== document.documentElement; x = x.parentElement) { const s = getComputedStyle(x); if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') { const c = x.getBoundingClientRect(); l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); bt = Math.min(bt, c.bottom); } } return r - l > 1 && bt - t > 1 ? { left: l, top: t, right: r, bottom: bt, width: r - l, height: bt - t } : null; };
        const caixas = [];
        const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim().length > 1 ? 1 : 2 });
        let n; while ((n = tw.nextNode())) { const e = n.parentElement; if (!e || e.closest('svg') || e.closest('script,style,option,select,title,.sr-only,[aria-hidden="true"] .faixa-t') ) continue; if (!visCad(e)) continue;
          const rg = document.createRange(); rg.selectNodeContents(n); for (const q0 of rg.getClientRects()) { const q = recorta(q0, e); if (q && q.width > 2 && q.height > 4) caixas.push({ q, e, n }); } }
        document.querySelectorAll('svg text').forEach(e => { if (!visCad(e) || !(e.textContent || '').trim()) return; const q = recorta(e.getBoundingClientRect(), e); if (q && q.width > 2) caixas.push({ q, e, n: e, svg: e.closest('svg') }); });
        const sob = [];
        for (let i = 0; i < caixas.length; i++) for (let j = i + 1; j < caixas.length; j++) {
          const a = caixas[i], c = caixas[j]; if (a.n === c.n) continue; if (a.svg !== c.svg && (a.svg || c.svg)) { /* HTML × SVG: só se o svg não for ícone */ }
          if (a.e.contains(c.e) && a.e !== c.e && getComputedStyle(c.e).position === 'static' && !a.svg) {}
          const x = Math.min(a.q.right, c.q.right) - Math.max(a.q.left, c.q.left), y = Math.min(a.q.bottom, c.q.bottom) - Math.max(a.q.top, c.q.top);
          if (x <= 1 || y <= 2) continue;
          const area = x * y, menor = Math.min(a.q.width * a.q.height, c.q.width * c.q.height);
          if (area / menor < .25) continue;
          /* clipping: se um dos dois está fora da área visível de um pai com overflow, ignora */
          sob.push(quem(a.e) + '  ×  ' + quem(c.e));
          if (sob.length > 40) break; }
        /* 2. texto cortado sem reticências */
        const cort = [];
        raiz.querySelectorAll('*').forEach(e => { if (e.closest('svg') || !e.childElementCount && !(e.textContent || '').trim()) return; if (!vis(e) || !visCad(e)) return; const s = getComputedStyle(e);
          if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && s.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 3 && !e.matches('.faixa,.faixa-t,.tw,.gb-c,canvas') && !e.querySelector('canvas'))
            cort.push(quem(e) + ` (${e.scrollWidth}>${e.clientWidth})`); });
        /* 3. contraste */
        const rgb = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(x => parseFloat(x)); return { r: v[0], g: v[1], b: v[2], a: v[3] == null ? 1 : v[3] }; };
        const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
        const fundo = e => { for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.backgroundImage && s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return null; const c = rgb(s.backgroundColor); if (c && c.a > .9) return c; } return rgb(getComputedStyle(document.body).backgroundColor); };
        const contr = new Map();
        const vistos = new Set();
        caixas.forEach(({ e }) => { if (vistos.has(e) || e.closest('svg')) return; vistos.add(e); const s = getComputedStyle(e), c = rgb(s.color), f = fundo(e); if (!c || !f) return;
          const op = +s.opacity * [...(function* () { for (let x = e.parentElement; x; x = x.parentElement) yield +getComputedStyle(x).opacity; })()].reduce((a, v) => a * v, 1);
          const cc = { r: c.r * c.a * op + f.r * (1 - c.a * op), g: c.g * c.a * op + f.g * (1 - c.a * op), b: c.b * c.a * op + f.b * (1 - c.a * op) };
          const L1 = lum(cc), L2 = lum(f), k = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
          const fs = parseFloat(s.fontSize), grande = fs >= 24 || fs >= 18.6 && +s.fontWeight >= 700, lim = grande ? 3 : 4.5;
          if (k < lim && !e.closest('[disabled],.ok[disabled],button:disabled')) { const chave = s.color + ' sobre ' + `rgb(${f.r},${f.g},${f.b})` + ` ${fs}px`; if (!contr.has(chave)) contr.set(chave, { k: k.toFixed(2), ex: quem(e), n: 0 }); contr.get(chave).n++; } });
        /* 4. textos de erro */
        const txt = raiz.innerText, ruins = [...new Set((txt.match(/[^\n]{0,30}\b(NaN|undefined|Infinity|\[object Object\]|null)\b[^\n]{0,30}/g) || []))].slice(0, 8);
        /* 5. alvos de toque pequenos (celular) e botões sem nome */
        const peq = [], semNome = [];
        document.querySelectorAll('button,a[href],a[onclick],[role=button],select,input').forEach(e => { if (!vis(e) || !visCad(e)) return; const q = e.getBoundingClientRect();
          if (vn === 'cel' && (q.height < 28 || q.width < 28) && !e.closest('table')) peq.push(quem(e) + ` ${Math.round(q.width)}×${Math.round(q.height)}`);
          const nome = (e.getAttribute('aria-label') || e.title || e.textContent || e.value || '').trim(); if (!nome && !e.labels?.length) semNome.push(quem(e)); });
        /* 6. rolagem horizontal da página */
        const larg = document.documentElement.scrollWidth - window.innerWidth;
        const fora = []; if (larg > 2) raiz.querySelectorAll('*').forEach(e => { const q = e.getBoundingClientRect(); if (q.right > window.innerWidth + 2 && vis(e) && !e.closest('.tw,.gb-c,.faixa,.seg,[style*="overflow"]') && fora.length < 6) fora.push(quem(e) + ' right=' + Math.round(q.right)); });
        return { sob: [...new Set(sob)], cort: cort.slice(0, 15), contraste: [...contr.entries()].map(([k, v]) => `${v.k}:1 ×${v.n} ${k} ex ${v.ex}`).slice(0, 15), ruins, peq: peq.slice(0, 15), nPeq: peq.length, semNome: semNome.slice(0, 8), larg, fora, altura: document.documentElement.scrollHeight };
      }, { vn });
      const reg = { id, vn, tema, ms, erros: [...errs], ...r }; R.push(reg);
      if (tema === 'claro') await p.screenshot({ path: path.join(out, `${id}-${vn}.png`), fullPage: true }).catch(() => {});
      console.log(`${id}/${vn}/${tema}: ${ms} ms · sob ${r.sob.length} · cort ${r.cort.length} · contr ${r.contraste.length} · ruins ${r.ruins.length} · peq ${r.nPeq} · larg ${r.larg} · erros ${errs.length}`);
    }
    R.push({ carga, vn, tema });
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'auditoria.json'), JSON.stringify(R, null, 1));
  await b.close();
})();
