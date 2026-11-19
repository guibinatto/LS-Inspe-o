/* Gera as duas versões publicáveis a partir do painel:
   <pasta>/painel-ls-fire.html          (artefato do painel: CAB_ART + dados)
   <pasta>/apresentacao-ls-fire.html    (apresentação "Como estamos", modelo Anual, fragmento para artefato)
   <pasta>/apresentacao-futuro-ls-fire.html  (apresentação "Para onde vamos", fragmento para artefato)
   Uso: node ferramentas/publicaveis.js <Painel.html> <pasta> */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const [src, pasta] = process.argv.slice(2); fs.mkdirSync(pasta, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(src)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  const painel = await p.evaluate(async () => CAB_ART + await corpoComDados(BRUTO));
  const apres = await p.evaluate(() => { APRES.modelo = 'anual'; APRES.per = null; APRES.caps = null; return apresGerar({ fragmento: true }); });
  const futuro = await p.evaluate(() => { APRES.modelo = 'futuro'; APRES.per = null; APRES.caps = null; const h = apresGerar({ fragmento: true }); APRES.modelo = 'anual'; return h; });
  if (erros.length) { console.error('ERROS', erros); process.exit(1); }
  fs.writeFileSync(path.join(pasta, 'painel-ls-fire.html'), painel);
  fs.writeFileSync(path.join(pasta, 'apresentacao-ls-fire.html'), apres);
  fs.writeFileSync(path.join(pasta, 'apresentacao-futuro-ls-fire.html'), futuro.replace('<title>Apresentação Comercial LS Fire</title>', '<title>Para onde vamos</title>'));
  console.log('ok', painel.length, apres.length); await b.close();
})();
