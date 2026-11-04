/* Teste exploratório: abre o painel, percorre todas as páginas e clica em cada
   elemento interativo visível (botões, role=button, links com ação, abas, chips,
   barras de gráfico SVG), um por vez, voltando à página antes do próximo clique.
   Registra erros de JavaScript, erros de console, diálogos nativos e cliques que
   não produziram nenhuma mudança visível. */
const {chromium}=require('playwright');
(async()=>{ const [src,limStr]=process.argv.slice(2), LIM=+limStr||40;
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
 const p=await ctx.newPage(); const erros=[], dialogos=[], semEfeito=[]; let atual='';
 p.on('pageerror',e=>erros.push(`[${atual}] ${e.message}`));
 p.on('console',m=>{ if(m.type()==='error'&&!/favicon|Failed to load resource/.test(m.text()))erros.push(`[${atual}] console: ${m.text()}`); });
 p.on('dialog',async d=>{ dialogos.push(`[${atual}] ${d.type()}: ${d.message().slice(0,80)}`); await d.dismiss(); });
 p.on('download',async d=>{ try{ await d.cancel(); }catch(e){} });
 await p.goto('file://'+src); await p.waitForLoadState('networkidle'); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
 const telas=await p.evaluate(()=>TELAS.map(t=>t.id)); let total=0; const porTela={};
 const fecha=async()=>p.evaluate(()=>{ document.querySelectorAll('.modal.aberto').forEach(m=>m.classList.remove('aberto')); try{ if(document.getElementById('rel-view').classList.contains('aberto'))fecharRelatorio(); }catch(e){} const mm=document.getElementById('mais-m'); if(mm)mm.classList.remove('aberto'); });
 for(const t of telas){ atual=t;
   await p.evaluate(x=>irTela(x),t); await p.waitForTimeout(300);
   /* alvos: tudo que tem onclick ou role=button dentro da página, visível */
   const n=await p.evaluate(()=>{ const sel='#tela button, #tela [role=button], #tela a[onclick], #tela .svg-cl, #tela summary';
     const L=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent||e.closest('svg')); L.forEach((e,i)=>e.setAttribute('data-ct',i)); return L.length; });
   const idx=[...Array(n).keys()]; const passo=Math.max(1,Math.ceil(n/LIM)); let feitos=0;
   for(let i=0;i<n;i+=passo){ await p.evaluate(x=>irTela(x),t); await p.waitForTimeout(120);
     await p.evaluate(()=>{ const sel='#tela button, #tela [role=button], #tela a[onclick], #tela .svg-cl, #tela summary'; [...document.querySelectorAll(sel)].filter(e=>e.offsetParent||e.closest('svg')).forEach((e,i)=>e.setAttribute('data-ct',i)); });
     const alvo=p.locator(`[data-ct="${i}"]`).first(); if(!await alvo.count())continue;
     const rot=(await alvo.evaluate(e=>(e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,40))).replace(/\s+/g,' ');
     const antes=await p.evaluate(()=>document.body.innerHTML.length+'|'+document.querySelectorAll('.modal.aberto').length+'|'+(document.getElementById('rel-view')||{}).className+'|'+location.hash);
     const e0=erros.length;
     try{ await alvo.scrollIntoViewIfNeeded({timeout:1500}); await alvo.click({timeout:2500,force:true}); }catch(e){ continue; }
     await p.waitForTimeout(250);
     const depois=await p.evaluate(()=>document.body.innerHTML.length+'|'+document.querySelectorAll('.modal.aberto').length+'|'+(document.getElementById('rel-view')||{}).className+'|'+location.hash);
     if(erros.length>e0)erros[erros.length-1]+=` (ao clicar em "${rot}")`;
     if(antes===depois)semEfeito.push(`[${t}] "${rot}"`);
     await fecha(); feitos++; total++; }
   porTela[t]=`${feitos} de ${n}`; }
 /* topo: anos, divisões, período, atalhos, menu Mais */
 atual='topo';
 for(const sel of ['#seg-ano button','#seg-div button']){ const k=await p.locator(sel).count(); for(let i=0;i<k;i++){ await p.locator(sel).nth(i).click(); await p.waitForTimeout(150); total++; } }
 for(const v of ['dia','semana','u7','mes','tri','ano','ytd','int']){ await p.selectOption('#per-ctl select >> nth=0',v); await p.waitForTimeout(150); total++; }
 for(const v of ['hoje','estaSemana','semAnt','u7','esteMes','mesAnt','esteTri','triAnt','esteAno','anoAnt']){ await p.selectOption('#per-ctl select[title="Atalhos de período"]',v).catch(()=>{}); await p.waitForTimeout(150); total++; }
 const mais=await p.evaluate(()=>[...document.querySelectorAll('#mais-m button')].map(b=>b.textContent.trim()));
 for(let i=0;i<mais.length;i++){ if(/Salvar no Claude/.test(mais[i]))continue; await p.evaluate(()=>{ const a=document.getElementById('aviso'); if(a)a.remove(); });
   await p.click('.mais > button'); await p.waitForTimeout(120); await p.locator('#mais-m button').nth(i).click({force:true}).catch(()=>{}); await p.waitForTimeout(300); await fecha(); total++; }
 console.log('Cliques executados:',total); console.log('Por página:',JSON.stringify(porTela));
 console.log('\nERROS ('+erros.length+'):\n'+(erros.join('\n')||'nenhum'));
 console.log('\nDIÁLOGOS NATIVOS ('+dialogos.length+'):\n'+(dialogos.join('\n')||'nenhum'));
 console.log('\nSEM EFEITO VISÍVEL ('+semEfeito.length+'):\n'+semEfeito.slice(0,40).join('\n'));
 await b.close(); })();
