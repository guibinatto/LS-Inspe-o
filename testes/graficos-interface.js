const {chromium}=require('playwright');
const src=process.argv[2]; const R=[]; const ok=(n,c,d)=>R.push([c?'OK ':'FALHA',n,d==null?'':typeof d==='string'?d:JSON.stringify(d)].join(' | '));
(async()=>{ const b=await chromium.launch(); const errs=[]; const p=await b.newPage({viewport:{width:1400,height:1000}}); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error')errs.push('console: '+m.text()); });
 await p.goto('file://'+src); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
 // cascata reconcilia (fotografia sintética anterior, com mudanças)
 const cs=await p.evaluate(()=>{ const at=snapAtual(), a=JSON.parse(JSON.stringify(at)); a.id='sA'; a.fp='fpA'; a.carga='2026-10-19T10:00:00.000Z';
   const iV=a.campos.indexOf('valor'), iS=a.campos.indexOf('sit'), iP=a.campos.indexOf('prev'); const ab=a.regs.filter(r=>r[iS]==='A');
   ab[0][iV]+=50000; ab[1][iV]-=20000; ab[2][iS]='A'; a.regs.splice(a.regs.indexOf(ab[3]),1); a.regs.push(['999999','CLIENTE QUE SAIU','Fábio Dalagnolo','SEQ',123456,'x',1,'','','A','','']);
   const C=cascataPipeline(a,at,{}); const soma=Object.keys(C.cat).reduce((t,k)=>t+C.s(k),0);
   return {ini:C.ini,fim:C.fim,soma,ajuste:C.ajuste,n:Object.fromEntries(Object.entries(C.cat).map(([k,v])=>[k,v.length])),fecha:Math.abs(C.ini+soma-C.fim)<0.01}; });
 ok('Cascata reconcilia: início + movimentos = fim (ajuste 0) e cada negócio numa única categoria',cs.fecha&&cs.ajuste===0&&cs.n.aumento>=1&&cs.n.reducao>=1&&cs.n.novo===1&&cs.n.saiuCarga===1,cs);
 const cs2=await p.evaluate(()=>{ const at=snapAtual(), a=JSON.parse(JSON.stringify(at)); a.id='sB'; a.fp='fpB'; a.carga='2026-10-19T10:00:00.000Z'; CFG.snaps.push(a); _ADIA=null; irTela('pipeline');
   const ok=!!document.getElementById('gb-g-casc'); CFG.snaps=CFG.snaps.filter(s=>s.id!=='sB'); _ADIA=null; irTela('pipeline'); return {comHist:ok,semHist:!document.getElementById('gb-g-casc')}; });
 ok('Cascata só aparece com duas cargas; sem histórico mostra a indisponibilidade',cs2.comHist&&cs2.semHist,cs2);
 // gráficos: cada figura com título, pergunta, período, unidade, fonte e tabela
 const gf=await p.evaluate(()=>{ const out=[]; ['supervisao','pipeline','resultados','engenharia'].forEach(t=>{ irTela(t); document.querySelectorAll('figure.gb').forEach(f=>{ const id=f.id.slice(3);
     out.push({id,tit:!!f.querySelector('.gb-t b').textContent.trim(),perg:!!f.querySelector('.gb-t span').textContent.trim(),meta:f.querySelector('.gb-m').textContent.trim(),fonte:/Fonte:/.test(f.querySelector('.gb-rod').textContent),tab:!!GTAB[id]&&GTAB[id].tabela&&GTAB[id].tabela.linhas.length>0,svgAria:!!f.querySelector('svg[role=img][aria-label]')||!f.querySelector('svg')}); }); }); return out; });
 ok('Todo gráfico tem título, pergunta, período/unidade, fonte, tabela e nome acessível',gf.length>=10&&gf.every(g=>g.tit&&g.perg&&g.meta&&g.fonte&&g.tab&&g.svgAria),gf.filter(g=>!(g.tit&&g.perg&&g.meta&&g.fonte&&g.tab&&g.svgAria)).map(g=>g.id).join(',')||gf.length+' gráficos');
 // ver tabela, clique abre lista com filtro, teclado
 const it=await p.evaluate(()=>{ irTela('supervisao'); gbTabela('g-sup-ped'); const t=!document.getElementById('gbt-g-sup-ped').hidden&&document.querySelectorAll('#gbt-g-sup-ped tr').length>5;
   document.querySelector('#gb-g-sup-ped .svg-cl').dispatchEvent(new MouseEvent('click',{bubbles:true})); const l=document.querySelector('#sup-lista .drill-cab b').textContent;
   const kb=document.querySelectorAll('.kb')[1]; kb.focus(); kb.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); const l2=document.querySelector('#sup-lista .drill-cab b').textContent;
   HEAT.m='props'; render(); const hp=document.querySelector('#gb-g-heat .gb-t b').textContent; HEAT.m='inter'; render(); return {t,l,l2,hp}; });
 ok('"Ver tabela" mostra os dados; clique na barra e Enter no indicador abrem a lista com o filtro aplicado',it.t&&/^Filtro: pedidos da semana/.test(it.l)&&/^Filtro: negócios abertos sem próximo passo/.test(it.l2),it);
 ok('Mapa de calor alterna atividades / propostas / pedidos sem misturar escalas',/propostas/.test(it.hp),it.hp);
 // ficha do negócio (infográficos)
 const fn=await p.evaluate(()=>{ const n=F.ab.find(x=>propostasTodas().some(p=>p.neg===x)); fichaNegocio(n.id); const m=document.getElementById('m-form'); const r={nos:m.querySelectorAll('.caminho .no').length,tl:!!m.querySelector('svg[aria-label="Linha do tempo do negócio"]'),ev:m.querySelectorAll('svg circle').length,txt:m.innerText.slice(0,80)}; fecharModal('m-form'); return r; });
 ok('Ficha do negócio: caminho oportunidade→proposta→pedido e linha do tempo com eventos reais',fn.nos===3&&fn.tl&&fn.ev>=2,fn);
 // cores fixas de divisão e contraste
 const co=await p.evaluate(()=>({seq:cssVar('--seq'),spv:cssVar('--spv'),ok:cssVar('--ok'),err:cssVar('--err'),corSEQ:CORDIV.SEQ(),corSPV:CORDIV.SPV(),font:getComputedStyle(document.body).fontFamily,num:getComputedStyle(document.body).fontVariantNumeric,anim:Chart.defaults.animation}));
 ok('SEQ/SPV com cores fixas e distintas de verde/vermelho; fonte Arial (padrão LS Fire) com números tabulares; sem animação',co.corSEQ===co.seq&&co.corSPV===co.spv&&![co.ok,co.err].includes(co.seq)&&/^Arial/.test(co.font)&&/tabular/.test(co.num)&&co.anim===false,co);
 // menu recolhível e cabeçalho
 const mn=await p.evaluate(()=>{ recolherMenu(); const w=document.getElementById('rail').getBoundingClientRect().width; recolherMenu(); const w2=document.getElementById('rail').getBoundingClientRect().width;
   return {w,w2,botoesTopo:[...document.querySelectorAll('.topo .acoes > button')].filter(b=>!b.hidden).length   /* o ↻ Ploomes só aparece no claude.ai */,grupos:[...document.querySelectorAll('.nav-bloco')].map(x=>x.textContent)}; });
 ok('Menu recolhível; três grupos; cabeçalho com 2 ações + menu',mn.w<70&&mn.w2>200&&mn.botoesTopo<=2&&mn.grupos.join()==='Rotina,Análise,Apoio',mn);
 // nenhum botão sem ação nas telas
 const bt=await p.evaluate(()=>{ const sem=[]; TELAS.forEach(t=>{ irTela(t.id); document.querySelectorAll('#tela button').forEach(x=>{ if(!x.onclick&&!x.getAttribute('onclick')&&x.type!=='submit')sem.push(t.id+':'+x.textContent.trim().slice(0,20)); }); }); return sem; });
 ok('Nenhum botão sem ação nas telas',!bt.length,bt.slice(0,5));
 // celular: sem rolagem horizontal; gráficos cabem
 for(const [w,h] of [[390,844],[768,1024]]){ const pm=await b.newPage({viewport:{width:w,height:h}}); pm.on('pageerror',e=>errs.push(w+' '+e.message)); await pm.goto('file://'+src); await pm.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
   const bad=[]; for(const t of await pm.evaluate(()=>TELAS.map(x=>x.id))){ await pm.evaluate(x=>irTela(x),t); await pm.waitForTimeout(150); const r=await pm.evaluate(w=>({sw:document.documentElement.scrollWidth,figs:[...document.querySelectorAll('figure.gb')].filter(f=>f.getBoundingClientRect().right>w+1).length}),w); if(r.sw>w+1||r.figs)bad.push(t+':'+r.sw+'/'+r.figs); }
   ok(`${w}px: nenhuma tela com rolagem horizontal e nenhum gráfico vazando`,!bad.length,bad.join(',')); await pm.close(); }
 console.log(R.join('\n')); console.log('ERROS:',errs.length?errs.slice(0,5):'nenhum'); await b.close(); })();
