/* Dados × código do painel.
   O repositório guarda só o CÓDIGO (painel sem dados). Os dados (bases importadas
   e configurações) vivem no painel publicado no claude.ai, que é privado, e numa
   cópia local em dados/ (fora do git, ver .gitignore).

   node ferramentas/dados.js extrair <painel-com-dados.html> <dados.json>
       tira os blocos seed-dados e seed-config de um painel (ex.: o publicado)
   node ferramentas/dados.js injetar <painel-codigo.html> <dados.json> <saida.html>
       monta um painel completo: código do repositório + dados
   node ferramentas/dados.js limpar <painel.html> <saida.html>
       remove os dados (seed vazio), para versionar só o código
   node ferramentas/dados.js resumo <dados.json>
       hash e tamanho de cada bloco (para comparar versões sem ler o conteúdo) */
const fs = require('fs'), crypto = require('crypto');
const RX = id => new RegExp(`(<script id="${id}"[^>]*>)([\\s\\S]*?)(</script>)`);
const ABRE_DADOS = '<script id="seed-dados" type="application/json" data-z="gz">';
function bloco(html, id) { const m = html.match(RX(id)); if (!m) throw new Error(`bloco ${id} não encontrado`); return m; }
function trocar(html, id, abre, corpo) { const m = bloco(html, id); return html.replace(RX(id), () => abre + corpo + '</script>'); }
const hash = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const [cmd, a, b, c] = process.argv.slice(2);
if (cmd === 'extrair') {
  const h = fs.readFileSync(a, 'utf8'), d = bloco(h, 'seed-dados'), cf = bloco(h, 'seed-config');
  const z = /data-z="gz"/.test(d[1]);
  if (!z && d[2].trim().length) throw new Error('seed-dados sem compactação: formato inesperado');
  fs.writeFileSync(b, JSON.stringify({ formato: 1, extraidoEm: new Date().toISOString(), dados: d[2].trim(), config: cf[2].trim() }));
  console.log('extraído', b, 'dados', d[2].trim().length, 'config', cf[2].trim().length, 'hash', hash(d[2].trim()), hash(cf[2].trim()));
} else if (cmd === 'injetar') {
  const h = fs.readFileSync(a, 'utf8'), j = JSON.parse(fs.readFileSync(b, 'utf8'));
  let s = j.dados ? trocar(h, 'seed-dados', ABRE_DADOS, j.dados) : h;
  s = trocar(s, 'seed-config', '<script id="seed-config" type="application/json">', j.config || '{}');
  fs.writeFileSync(c, s); console.log('montado', c, s.length);
} else if (cmd === 'limpar') {
  const h = fs.readFileSync(a, 'utf8');
  let s = trocar(h, 'seed-dados', '<script id="seed-dados" type="application/json">', '');
  s = trocar(s, 'seed-config', '<script id="seed-config" type="application/json">', '{}');
  fs.writeFileSync(b, s); console.log('código sem dados', b, s.length);
} else if (cmd === 'resumo') {
  const j = JSON.parse(fs.readFileSync(a, 'utf8'));
  console.log(JSON.stringify({ dados: { tam: (j.dados || '').length, hash: hash(j.dados) }, config: { tam: (j.config || '').length, hash: hash(j.config) } }));
} else { console.error('uso: extrair | injetar | limpar | resumo (ver cabeçalho)'); process.exit(2); }
