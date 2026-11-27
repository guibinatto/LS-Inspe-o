/* Compara um CSV do Controle de Projetos e Pedidos (exportado da Lista do Teams) com o Controle que o painel já tem,
   e importa só se fizer sentido. Usado pela tarefa agendada que olha a pasta "Para atualizar apresentação".
   Uso: LANG=C.UTF-8 node ferramentas/controle_comparar.js <painel.html> <controle.csv> <saída.html>
   Códigos de saída: 0 = importado e gravado em <saída.html>
                     3 = SEM NOVIDADE (mesmos pedidos que o painel já tem) — nada gravado
                     4 = SUSPEITO (arquivo bem menor ou muito diferente do atual) — nada gravado, avisar
   Regras do "suspeito": menos de 90% dos pedidos atuais continuam iguais, ou o arquivo tem menos linhas que o atual
   menos 5, ou o registro mais recente é mais antigo que o do painel. */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
(async () => {
  const [src, csv, out] = process.argv.slice(2);
  if (!src || !csv || !out) { console.error('uso: controle_comparar.js <painel.html> <controle.csv> <saída.html>'); process.exit(2); }
  const b = await chromium.launch(), p = await b.newPage(), erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(src)); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas, null, { timeout: 60000 });
  const snap = () => p.evaluate(() => {
    const L = M.pedidos || [], ult = L.reduce((m, x) => x.dt && x.dt > m ? x.dt : m, new Date(0));
    return { linhas: L.map(x => [x.ov || '', x.ptc || '', String(x.cli).trim(), Math.round((x.vNum || 0) * 100), x.div, x.resp, x.dt ? x.dt.toISOString().slice(0, 10) : ''].join('|')),
      ult: ult.toISOString().slice(0, 10) }; });
  const a = await snap();
  await p.setInputFiles('#inp-arq', path.resolve(csv));
  await p.waitForFunction(() => [...document.querySelectorAll('#arqs .arq .st')].every(s => !/lendo/.test(s.textContent)), null, { timeout: 60000 });
  console.log(await p.evaluate(() => [...document.querySelectorAll('#arqs .arq')].map(d => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 200)).join('\n')));
  const d = await snap(), A = new Set(a.linhas), B = new Set(d.linhas);
  const iguais = a.linhas.filter(x => B.has(x)).length, novos = d.linhas.filter(x => !A.has(x)), saiu = a.linhas.filter(x => !B.has(x));
  console.log(`antes ${a.linhas.length} pedidos (até ${a.ult}) · arquivo ${d.linhas.length} (até ${d.ult}) · iguais ${iguais} · novos/alterados ${novos.length} · saíram/alterados ${saiu.length}`);
  if (!novos.length && !saiu.length) { console.log('SEM NOVIDADE'); await b.close(); process.exit(3); }
  const susp = [];
  if (a.linhas.length && iguais < a.linhas.length * 0.9) susp.push(`só ${iguais} de ${a.linhas.length} pedidos atuais continuam iguais`);
  if (d.linhas.length < a.linhas.length - 5) susp.push(`o arquivo tem ${d.linhas.length} pedidos, o painel tem ${a.linhas.length}`);
  if (d.ult < a.ult) susp.push(`o registro mais recente do arquivo (${d.ult}) é mais antigo que o do painel (${a.ult})`);
  if (erros.length) susp.push('erro na página: ' + erros.join(' | '));
  if (susp.length) { console.log('SUSPEITO: ' + susp.join('; ')); console.log('SAÍRAM/ALTERADOS:\n' + saiu.join('\n')); await b.close(); process.exit(4); }
  console.log('NOVOS/ALTERADOS:\n' + novos.join('\n'));
  await p.evaluate(() => setRef(''));
  console.log(await p.evaluate(() => { const X = indicadoresPeriodo(PER); return `referência ${fmtData(hoje())} · pedidos oficiais ${fmtBRL(Math.round(X.ped))}`; }));
  const h = await p.evaluate(async () => CAB_LOCAL + await corpoComDados(BRUTO)); fs.writeFileSync(path.resolve(out), '﻿' + h);
  console.log('gravado', out); await b.close();
})();
