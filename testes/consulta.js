const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1400,height:1000}}); await p.goto('file://'+process.argv[2]); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
 for(const q of ['10118','Camaçari','SC acima de 500 mil','BYD']){ await p.evaluate(()=>irTela('busca')); await p.waitForTimeout(400);
   await p.fill('#pq-q',q); await p.dispatchEvent('#pq-q','input'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
   console.log('== '+q+'\n'+await p.evaluate(()=>{ const r=document.getElementById('pq-res')||document.querySelector('.pq-res')||document.getElementById('tela'); return r.innerText.replace(/\n+/g,' | ').slice(0,400); })); }
 await b.close(); })();
