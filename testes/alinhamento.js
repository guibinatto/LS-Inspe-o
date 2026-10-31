const {chromium}=require('playwright');
(async()=>{ const [src,out,w]=process.argv.slice(2); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:+w||1400,height:1000}});
 await p.goto('file://'+src); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
 for(const t of ['supervisao','atividades','reunioes','executiva','resultados','pipeline','propostas','desempenho','engenharia','carteira','clientes','relatorios','dados']){
   await p.evaluate(x=>{ irTela(x); if(x==='desempenho'){EST.ficha='Fábio Dalagnolo';render();} const a=document.getElementById('aviso'); if(a)a.remove(); },t); await p.waitForTimeout(400);
   await p.screenshot({path:`${out}/a-${w}-${t}.png`,fullPage:true}); }
 /* detector: botões/rodapés que quebram linha ou ficam fora do alinhamento do contêiner */
 const r=await p.evaluate(()=>{ const out=[]; TELAS.forEach(t=>{ irTela(t.id);
   document.querySelectorAll('.gb-rod,.pl-bar,.exec-cab,.drill-cab').forEach(el=>{ const bs=[...el.querySelectorAll('button')].filter(b=>b.offsetParent); if(bs.length<2)return; const tops=new Set(bs.map(b=>Math.round(b.getBoundingClientRect().top))); if(tops.size>1)out.push(t.id+' '+el.className+': botões em '+tops.size+' linhas'); });
   document.querySelectorAll('.gb-rod').forEach(el=>{ const bs=[...el.querySelectorAll('button')].filter(b=>b.offsetParent); if(!bs.length)return; const R=el.getBoundingClientRect(), last=bs[bs.length-1].getBoundingClientRect(); if(R.right-last.right>4)out.push(t.id+' gb-rod '+(el.closest('figure')||{}).id+': botões não alinhados à direita ('+Math.round(R.right-last.right)+'px)'); });
   document.querySelectorAll('.lst-int li .so-tela').forEach(el=>{ const bs=[...el.querySelectorAll('button')]; if(bs.length>1&&Math.abs(bs[0].getBoundingClientRect().top-bs[1].getBoundingClientRect().top)>2)out.push(t.id+' lista de intervenção: botões empilhados'); });
   document.querySelectorAll('table').forEach(tb=>{ tb.querySelectorAll('td').forEach(td=>{ const bs=[...td.querySelectorAll('button')]; if(bs.length>1&&Math.abs(bs[0].getBoundingClientRect().top-bs[bs.length-1].getBoundingClientRect().top)>2)out.push(t.id+' tabela: botões quebrando linha na célula'); }); });
 }); return [...new Set(out)]; });
 console.log(r.join('\n')); await b.close(); })();
