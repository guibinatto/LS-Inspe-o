const {chromium}=require('playwright');
(async()=>{ const [src,out]=process.argv.slice(2); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1400,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+src); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
 const res=[];
 for(const m of ['rA','rB','rC','rD','rE','rF','rG']){
   const info=await p.evaluate(async m=>{ irTela('relatorios'); RELC.modelo=m; render(); if(m==='rC')document.getElementById('relc-vend').value='Fábio Dalagnolo'; await relcGerar(); REL_REAL=true; relZoom();
     const ps=[...document.querySelectorAll('#rel-view .rel-pag')]; let fora=0, altas=0, menor=99;
     ps.forEach(pg=>{ if(pg.classList.contains('alta'))altas++; const c=pg.querySelector('.rel-conteudo'); if(!c)return; const R=c.getBoundingClientRect(); c.querySelectorAll('*').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width>0&&r.right>R.right+2)fora++; if(e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){ const f=parseFloat(getComputedStyle(e).fontSize); if(f&&f<menor)menor=f; } }); });
     return {n:ps.length,fora,altas,menor,rep:document.querySelectorAll('#rel-view thead').length}; },m);
   const pg=await p.$$('#rel-view .rel-pag'); const idx=[1,Math.floor(pg.length/2)];
   for(const i of idx) if(pg[i]) await pg[i].screenshot({path:`${out}/${m}-pag${i+1}.png`});
   res.push(`${m}: ${info.n} págs · ${info.fora} elementos fora da margem · ${info.altas} folhas altas · menor fonte ${info.menor}px · ${info.rep} cabeçalhos de tabela`);
   await p.evaluate(()=>fecharRelatorio()); }
 // celular: leitura fluida e telas
 const pm=await b.newPage({viewport:{width:390,height:844}}); await pm.goto('file://'+src); await pm.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
 for(const t of ['supervisao','reunioes','relatorios']){ await pm.evaluate(x=>irTela(x),t); await pm.waitForTimeout(500); await pm.screenshot({path:`${out}/celular-${t}.png`}); }
 console.log(res.join('\n')); console.log('ERRS',errs); await b.close(); })();
