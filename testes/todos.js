/* Roda todos os testes e FALHA de verdade (código de saída 1) se algum acusar erro.
   Uso: LANG=C.UTF-8 node testes/todos.js            (base de teste + painel completo)
   - base de teste (dados congelados de 26/10, "hoje" fixo em 10/11): regras, totais,
     central, contratos, gráficos — gerada por ferramentas/base-de-teste.py;
   - painel completo (código do repositório + dados de dados/painel-dados.json):
     apresentação, capa, clique em todas as telas, períodos, versão separada.
   Os dados ficam em dados/ (fora do git). */
const { execFileSync, spawnSync } = require('child_process'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), D = path.join(R, 'dados');
const BASE = path.join(D, 'base-de-teste.html'), COMPLETO = path.join(D, 'painel-completo.html');
process.env.LANG = process.env.LANG || 'C.UTF-8';
execFileSync('python3', ['-I', path.join(R, 'ferramentas', 'base-de-teste.py'), BASE], { stdio: 'inherit' });
if (fs.existsSync(path.join(D, 'painel-dados.json')))
  execFileSync('node', [path.join(R, 'ferramentas', 'dados.js'), 'injetar', path.join(R, 'Painel-Executivo-LS-Fire.html'), path.join(D, 'painel-dados.json'), COMPLETO], { stdio: 'inherit' });
const sep = path.join(D, 'versao-separada');
const PLANO = [
  ['regras-criticas', BASE], ['totais', BASE], ['central', BASE], ['contratos', BASE], ['graficos-interface', BASE],
  ['apresentacao', COMPLETO], ['capa', COMPLETO], ['periodos', COMPLETO], ['clica-tudo', COMPLETO],
  ['versao-separada', COMPLETO, sep]];
/* falha = código de saída ≠ 0, ou linhas "FALHA", "✗", "N/M verificações" com N<M,
   "ERROS (n>0)" ou "ERROS JS:" diferente de "nenhum" */
const falhou = out => /^FALHA\b/m.test(out) || /^✗/m.test(out) || /ERROS \((?!0\))\d+\)/.test(out) || /ERROS JS: (?!nenhum)/.test(out)
  || [...out.matchAll(/(\d+)\/(\d+) verificações/g)].some(m => +m[1] < +m[2]) || /fora da coluna|quebra":\[[^\]]/.test(out);
let ruins = [];
for (const [nome, arq, extra] of PLANO) {
  if (!fs.existsSync(arq)) { console.log(`- ${nome}: PULADO (sem ${path.basename(arq)})`); continue; }
  if (nome === 'versao-separada') execFileSync('node', [path.join(R, 'ferramentas', 'separar.js'), arq, extra], { stdio: 'ignore' });
  const t0 = Date.now(), r = spawnSync('node', [path.join(__dirname, nome + '.js'), arq, ...(extra ? [extra] : [])], { encoding: 'utf8', timeout: 15 * 60e3 });
  const out = (r.stdout || '') + (r.stderr || ''), ruim = r.status !== 0 || falhou(out);
  console.log(`${ruim ? '✗' : '✓'} ${nome} (${Math.round((Date.now() - t0) / 1000)} s)`);
  if (ruim) { ruins.push(nome); console.log(out.split('\n').filter(l => /FALHA|✗|ERROS|Error|verificações/.test(l)).slice(0, 12).map(l => '    ' + l.slice(0, 220)).join('\n')); }
}
console.log(ruins.length ? `\n${ruins.length} teste(s) com falha: ${ruins.join(', ')}` : '\nTodos os testes passaram.');
process.exitCode = ruins.length ? 1 : 0;
