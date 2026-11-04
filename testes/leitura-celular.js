const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const [src,out]=process.argv.slice(2); const b=await chromium.launch(); const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1400,height:1000}}); const p=await ctx.newPage();
 await p.goto('file://'+src); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
 await p.evaluate(async()=>{ irTela('relatorios'); RELC.modelo='rB'; render(); await relcGerar(); });
 const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>baixarLeitura())]); const f=out+'/leitura.html'; await dl.saveAs(f);
 for(const [nome,scheme] of [['claro','light'],['escuro','dark']]){
   const m=await b.newPage({viewport:{width:390,height:844},colorScheme:scheme}); await m.goto('file://'+f); await m.waitForTimeout(500);
   const r=await m.evaluate(()=>{ const L=c=>{ const v=c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4); return .2126*v[0]+.7152*v[1]+.0722*v[2]; };
     const bg=getComputedStyle(document.body).backgroundColor; let pior=99, ex='';
     document.querySelectorAll('main *').forEach(e=>{ if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return; let el=e, fundo=null; while(el&&!fundo){ const c=getComputedStyle(el).backgroundColor; if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))fundo=c; el=el.parentElement; } fundo=fundo||bg;
       const a=L(getComputedStyle(e).color), z=L(fundo), cr=(Math.max(a,z)+.05)/(Math.min(a,z)+.05); if(cr<pior){ pior=cr; ex=e.tagName+' "'+e.textContent.trim().slice(0,30)+'" '+getComputedStyle(e).color+' sobre '+fundo; } });
     return {bg,corTexto:getComputedStyle(document.body).color,piorContraste:Math.round(pior*100)/100,ex,largura:document.documentElement.scrollWidth}; });
   await m.screenshot({path:out+'/leit-'+nome+'.png'}); console.log(nome,JSON.stringify(r)); await m.close(); }
 await b.close(); })();
