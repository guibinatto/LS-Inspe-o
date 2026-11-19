/* Aba "Verificações": reconhecimento das planilhas do Omie (produtos e fiscal) e regras de cadastro
   com registros sintéticos (sem dados de clientes). Uso: LANG=C.UTF-8 node testes/verificacoes.js <painel.html> */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } }), erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof F !== 'undefined' && F.todas);
  const r = await p.evaluate(() => {
    const ok = [], t = (c, m) => ok.push([!!c, m]);
    /* as duas planilhas novas do conversor são reconhecidas pelos cabeçalhos exatos */
    const CP = ['Código do Produto (cadastro)', 'Descrição', 'NCM', 'Unidade', 'Código da Família', 'Família', 'Tipo do Item', 'Origem da Mercadoria', 'CEST', 'Inativo', 'Data de Inclusão', 'Data de Alteração', 'Incluído por', 'Alterado por', 'Vendido (OVs)'];
    const CF = ['OV (fiscal)', 'Item', 'Código do Produto (cadastro)', 'Descrição do Produto', 'NCM do Item', 'NCM do Cadastro', 'CFOP', 'CST/CSOSN ICMS', 'Alíquota ICMS', 'CST IPI', 'Alíquota IPI', 'CST PIS', 'CST COFINS', 'Categoria do Item', 'Tipo do Item', 'Vendedor', 'Agente de Negócio', 'Cliente (Nome Fantasia)', 'UF do Cliente', 'Data de Inclusão', 'Situação', 'Incluído por (OV)', 'Valor do Item'];
    t(detectar(CP) === 'omieProdutos', 'planilha de produtos → ' + detectar(CP));
    t(detectar(CF) === 'omieFiscal', 'planilha fiscal → ' + detectar(CF));
    const mp = mapear(CP, 'omieProdutos'), mf = mapear(CF, 'omieFiscal');
    t(['codigo', 'descricao', 'ncm', 'unidade', 'codFamilia', 'familia', 'tipoItem', 'inativo', 'incluidoPor', 'alteradoPor', 'vendidoOVs'].every(k => mp[k] !== undefined) && mp.codigo === 0 && mp.descricao === 1 && mp.familia === 5,
      'colunas de produtos: ' + JSON.stringify(mp));
    t(['ov', 'item', 'codProduto', 'descricao', 'ncmItem', 'ncmCad', 'cfop', 'cstIcms', 'cstIpi', 'tipoItem', 'vendedor', 'agente', 'cliente', 'ufCliente', 'dtInc', 'incluidoPor', 'valor'].every(k => mf[k] !== undefined) && mf.incluidoPor === 21 && mf.descricao === 3,
      'colunas fiscais: ' + JSON.stringify(mf));
    t(detectar(['Tabela do Anexo', 'Número do Documento', 'Cliente (Nome Fantasia)', 'Arquivo Anexado', 'Tipo do Arquivo', 'Data do Anexo']) === 'omieAnexos', 'planilha de anexos do Omie reconhecida');
    t(detectar(['ORDEM DE VENDA', 'Total da Nota Fiscal', 'Código da Família', 'Descrição do Produto (completa)', 'Previsão de Faturamento (completa)', 'Situação da OP']) === 'omie', 'itens de venda do Omie continuam como "omie"');
    /* regras do cadastro de produtos, com uma família sintética */
    const hj = hoje(), d = `${String(hj.getDate()).padStart(2, '0')}/${String(hj.getMonth() + 1).padStart(2, '0')}/${hj.getFullYear()}`;
    const P = (codigo, descricao, ncm, extra) => Object.assign({ codigo, descricao, ncm, unidade: 'UN', familia: 'Conjunto Motobomba', codFamilia: 'CMB', tipoItem: '04 - Produto Acabado', inativo: 'N', incluidoPor: 'TESTE' }, extra || {});
    M.omieProdutos = [P('T1', 'CMB LSF D SC 100', '84137080'), P('T2', 'CMB LSF E SC 200', '84137080'), P('T3', 'CMB LSF J MB 3', '84137080'),
      P('T4', 'CMB LSF D SC 300', '85015210'), P('T5', 'Conjunto motobomba diesel ou similar', '8413'),
      P('T6', 'CMB LSF D SC 100', '84137080'), P('T7', 'PARAFUSO M8', '', { familia: '', codFamilia: '', tipoItem: '01 - Matéria Prima' }),
      P('T8', 'CMB LSF X', '84137080', { inativo: 'S' }),
      ...[9, 10, 11, 12].map(i => P('T' + i, 'CMB LSF E MB ' + i, '84137080'))];
    M.omieFiscal = [
      { ov: '900001', item: 1, codProduto: 'T1', descricao: 'CMB LSF D SC 100', ncmItem: '84137090', ncmCad: '84137080', cfop: '6.101', cstIcms: '00', cstIpi: '50', tipoItem: '04 - Produto Acabado', vendedor: 'Teste', agente: 'Não Aplicável', cliente: 'Cliente A', ufCliente: 'SP', dtInc: d },
      { ov: '900002', item: 1, codProduto: 'T2', descricao: 'CMB LSF E SC 200', ncmItem: '84137080', ncmCad: '84137080', cfop: '5.101', cstIcms: '', cstIpi: '', tipoItem: '04 - Produto Acabado', vendedor: 'Teste', agente: '', cliente: 'Cliente B', ufCliente: 'PR', dtInc: d },
      { ov: '900003', item: 1, codProduto: 'T3', descricao: 'CMB LSF J MB 3', ncmItem: '84137080', ncmCad: '84137080', cfop: '5.101', cstIcms: '00', cstIpi: '50', tipoItem: '04 - Produto Acabado', vendedor: 'Teste', agente: 'Agente X', cliente: 'Cliente C', ufCliente: 'SC', dtInc: d }];
    const A = verAplicar(), R = k => A.res.find(x => x.g.k === k), ids = k => R(k).regs.map(y => y.r.x.codigo || (y.r.x.ov + ':' + y.r.x.item)).sort().join(',');
    t(R('pd-ncm').base === 11, 'produto inativo fica fora (11 de 12): base ' + R('pd-ncm').base);
    t(ids('pd-ncm') === 'T5,T7', 'NCM ausente ou com menos de 8 dígitos: ' + ids('pd-ncm'));
    t(ids('pd-ncmfam') === 'T4', 'NCM fora da posição dominante da família (8413): ' + ids('pd-ncmfam'));
    t(/8413/.test(R('pd-ncmfam').regs[0].oque), 'o que corrigir cita a posição da família: ' + R('pd-ncmfam').regs[0].oque);
    t(ids('pd-desc') === 'T5', 'descrição fora do padrão "CMB LSF" da família: ' + ids('pd-desc'));
    t(ids('pd-texto') === 'T5', 'descrição com "ou similar": ' + ids('pd-texto'));
    t(ids('pd-dup') === 'T1,T6', 'mesma descrição em dois códigos: ' + ids('pd-dup'));
    t(ids('pd-fam') === 'T7', 'sem família: ' + ids('pd-fam'));
    t(ids('pd-tipo') === '' && /^Insumo/.test(R('pd-ncm').regs.find(y => y.r.x.codigo === 'T7').oque), 'insumo sem NCM sai uma vez só, em "sem NCM", avisando que trava a NF de compra');
    t(ids('f-ncm') === '900001:1', 'NCM do item × cadastro: ' + ids('f-ncm'));
    t(ids('f-cfop') === '900002:1', 'CFOP 5.xxx para cliente fora de SC: ' + ids('f-cfop'));
    t(ids('f-cst') === '900002:1', 'sem CST do ICMS: ' + ids('f-cst'));
    t(ids('f-ipi') === '900002:1', 'produto acabado sem CST do IPI: ' + ids('f-ipi'));
    t(ids('f-agente') === '900002:1', 'agente em branco ("Não Aplicável" vale como preenchido): ' + ids('f-agente'));
    /* registro que acumula pendências: a visão por registro junta tudo o que corrigir nele */
    const t5 = A.por.find(x => x.r.x.codigo === 'T5');
    t(t5 && t5.pend.length >= 3, 'T5 com várias pendências juntas: ' + (t5 ? t5.pend.map(p => p.g.k).join(',') : 'nenhuma'));
    /* tela: três visões, filtros, clique abre a lista */
    irTela('verificacoes');
    const sids = [...document.querySelectorAll('#tela [data-sid]')].map(e => e.dataset.sid);
    t(sids.includes('ver-kpi') && sids.includes('ver-controle-de-pedidos') && sids.some(s => /^ver-omie-produtos/.test(s)) && sids.some(s => /^ver-omie-impostos/.test(s)), 'seções da tela: ' + sids.join(' '));
    const bt = [...document.querySelectorAll('#tela .ver-it')].find(e => /NCM diferente do usado pela família/.test(e.textContent));
    bt && bt.click();
    const lista = document.body.innerText;
    t(bt && /T4|Produto T4/.test(lista) && /O que corrigir/i.test(lista), 'clique na regra abre a lista com o que corrigir');
    document.querySelectorAll('.modal .fechar, .modal-x, [data-fechar]').forEach(e => e.click());
    verSet('sis', 'Ploomes'); const soP = [...document.querySelectorAll('#tela .sec h3')].map(e => e.textContent);
    t(soP.length && soP.every(x => /^Ploomes/.test(x)), 'filtro Sistema = Ploomes: ' + soP.join(' | '));
    verSet('sis', ''); verSet('vista', 'registros');
    t(/Pendências por registro/.test(document.getElementById('tela').innerText), 'visão por registro');
    verSet('vista', 'pessoas');
    t(/Pendências por responsável/.test(document.getElementById('tela').innerText), 'visão por responsável');
    verSet('vista', 'regras');
    /* sem as bases do Omie, a regra não acusa nada e a seção avisa que aguarda a base */
    M.omieProdutos = []; M.omieFiscal = []; render();
    t(/Aguardando a base do Omie/.test(document.getElementById('tela').innerText), 'sem as bases novas: aviso de aguardando');
    return ok;
  });
  r.forEach(([c, m]) => console.log((c ? '✓ ' : '✗ ') + m));
  console.log(`${r.filter(x => x[0]).length}/${r.length} verificações`);
  console.log('ERROS JS: ' + (erros.length ? erros.join(' | ') : 'nenhum'));
  await b.close(); process.exit(r.every(x => x[0]) && !erros.length ? 0 : 1);
})();
