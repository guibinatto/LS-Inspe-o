const {chromium}=require('playwright'); const fs=require('fs');
const src=process.argv[2]; const R=[]; const ok=(n,c,d)=>{R.push([c?'OK ':'FALHA',n,d||''].join(' | '));};
(async()=>{ const b=await chromium.launch(); const errs=[];
 const abre=async(url,vp)=>{ const p=await b.newPage({viewport:vp||{width:1400,height:1000}}); p.on('pageerror',e=>errs.push(url.slice(-20)+': '+e.message));
   await p.goto(url); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000}); return p; };
 const p=await abre('file://'+src);
 const t=await p.evaluate(()=>({ped:realizado().c.total,reg:realizado().c.registros,fat:faturamentoRealizado().total,cart:saldoFaturar().valor,nf:somar(M.notas,n=>n.vNum),
   r25:refAno(2025).total,f25:somar(CFG.fatOficial['2025'].valores,x=>x||0),cartN:M.carteira.length,nfN:M.notas.length,div:divergenciasCarteiraNF().length}));
 const near=(a,b)=>Math.abs(a-b)<0.02;
 ok('Pedidos 2026 = comparativo 36.730.682,39',near(t.ped,36730682.39),t.ped);
 ok('Conciliação: oficial − soma dos pedidos explicada',near(t.ped-t.reg,36730682.39-t.reg),(t.ped-t.reg).toFixed(2));
 ok('Faturamento 2026 = 47.373.343,28',near(t.fat,47373343.28),t.fat);
 ok('Carteira 30/10 = 31.561.097,75 (53 pedidos)',near(t.cart,31561097.75)&&t.cartN===53,t.cart+' / '+t.cartN);
 ok('NFs outubro = 6.271.562,79 (22 notas)',near(t.nf,6271562.79)&&t.nfN===22,t.nf+' / '+t.nfN);
 ok('Pedidos 2025 = 31.554.769,80',near(t.r25,31554769.8),t.r25);
 ok('Faturamento 2025 = 32.450.135,03',near(t.f25,32450135.03),t.f25);
 ok('Divergência AGEO 500127 carteira × NF detectada',t.div===1,t.div);
 // telas × períodos × filtros
 const telas=await p.evaluate(()=>TELAS.map(t=>t.id)); const e0=errs.length;
 for(const per of [['modo','ano'],['modo','mes'],['modo','ytd'],['modo','int']]){ await p.evaluate(pp=>setPer(pp[0],pp[1]),per);
   for(const tl of telas){ await p.evaluate(x=>irTela(x),tl); await p.waitForTimeout(120); } }
 await p.evaluate(()=>setPer('modo','ano'));
 for(const f of ['SEQ','SPV']){ await p.evaluate(d=>{EST.div=d;aplicar();},f); for(const tl of telas){ await p.evaluate(x=>irTela(x),tl); await p.waitForTimeout(100);} }
 await p.evaluate(()=>{EST.div='';EST.vend=(CFG.metas[0]||{}).vend;aplicar();}); for(const tl of telas){ await p.evaluate(x=>irTela(x),tl); await p.waitForTimeout(100);}
 const fv=await p.evaluate(()=>({fr:faturamentoRealizado().aplicavel,c:realizado().c.aplicavel}));
 await p.evaluate(()=>{EST.vend='';aplicar();});
 ok('Todas as telas × 4 modos de período × SEQ/SPV/vendedor sem erro',errs.length===e0,errs.slice(e0).join(';'));
 ok('Com filtro de vendedor, totais oficiais não se aplicam',!fv.fr&&!fv.c,JSON.stringify(fv));
 for(const a of ['2024','2025']){ await p.evaluate(a=>{EST.ano=a;aplicar();},a); for(const tl of telas){ await p.evaluate(x=>irTela(x),tl); await p.waitForTimeout(100);} }
 const f25=await p.evaluate(()=>faturamentoRealizado().total); await p.evaluate(()=>{EST.ano='2026';aplicar();});
 ok('Ano 2025: faturamento do ano fechado = 32.450.135,03',near(f25,32450135.03),f25);
 ok('Anos 2024/2025 sem erro',errs.length===e0,errs.slice(e0).join(';'));
 // referência
 const r15=await p.evaluate(()=>{setRef('2026-10-15'); const x={ped:realizado().c.total,fat:faturamentoRealizado().total,m:realizado().c.meses.slice(-1)[0].motivo}; setRef(''); x.vol=realizado().c.total; return x;});
 ok('Ref 15/10: outubro sai da planilha (posterior) e usa registros até 15/10',r15.ped<36730682&&/mês em curso/.test(r15.m)&&near(r15.vol,36730682.39),JSON.stringify(r15));
 ok('Ref 15/10: faturamento de outubro = notas até 15/10',r15.fat<47373343&&r15.fat>41101780,r15.fat);
 // plano + salvar → reabrir
 await p.evaluate(()=>{irTela('executiva');planoNovo(0);CFG.plano[CFG.plano.length-1].resp='Teste';CFG.plano[CFG.plano.length-1].prazo='2026-11-02';planoGuardar();setCrit('metaRisco',80);});
 const html=await p.evaluate(async()=>CAB_LOCAL+await corpoComDados(BRUTO)); fs.mkdirSync('/tmp/lsval/t',{recursive:true}); fs.writeFileSync('/tmp/lsval/t/salvo.html',html);
 const p2=await abre('file:///tmp/lsval/t/salvo.html');
 const s2=await p2.evaluate(()=>({pl:(CFG.plano||[]).map(a=>a.resp+'|'+a.prazo+'|'+a.origem),crit:CRIT().metaRisco,ref:CFG.dataRefSalva,ped:realizado().c.total,fat:faturamentoRealizado().total,nf:M.notas.length}));
 ok('Salvar → reabrir: plano (origem, responsável, prazo), critérios, dados e referência',s2.pl.some(x=>x.startsWith('Teste|2026-11-02|'))&&s2.crit===80&&s2.ref==='2026-10-30'&&near(s2.ped,36730682.39)&&s2.nf===22,JSON.stringify(s2));
 await p2.close();
 // reimportação idempotente
 await p.setInputFiles('#inp-arq','/tmp/lsin/b/fatmensal.xlsx'); await p.waitForTimeout(2500);
 const nN=await p.evaluate(()=>M.notas.length); ok('Reimportar o mesmo mês de NF não duplica',nN===22,nN);
 // bases vazias
 const p3=await abre('file://'+src); const e1=errs.length;
 await p3.evaluate(()=>{ Object.keys(BRUTO).forEach(k=>{ if(k!=='_meta')delete BRUTO[k]; }); CFG.fatOficial={}; construir(); aplicar(); });
 for(const tl of telas){ await p3.evaluate(x=>irTela(x),tl); await p3.waitForTimeout(100);} 
 ok('Bases vazias: todas as telas abrem sem erro',errs.length===e1,errs.slice(e1).join(';')); await p3.close();
 // mobile
 for(const w of [390,768]){ const pm=await abre('file://'+src,{width:w,height:900}); const bad=[];
   for(const tl of telas){ await pm.evaluate(x=>irTela(x),tl); await pm.waitForTimeout(250); const sw=await pm.evaluate(()=>document.documentElement.scrollWidth); if(sw>w+1)bad.push(tl+':'+sw); }
   ok(`Largura ${w}px sem rolagem horizontal da página`,!bad.length,bad.join(',')); await pm.close(); }
 console.log(R.join('\n')); console.log('ERROS JS:',errs.length?errs.slice(0,5):'nenhum'); await b.close(); })();
