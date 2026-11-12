/* Capa da apresentação: o título nunca corta palavra nem sai da coluna (6 modelos × 7 larguras, fonte larga no pior caso).
   Uso: node testes/capa.js <Painel.html> */
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+process.argv[2]);await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
const r=[];
for(const mod of ['anual','tri','mes','sem','prev','livre']){const html=await p.evaluate(m=>{APRES.modelo=m;APRES.per=null;APRES.caps=null;return apresGerar({})},mod);
 const q=await b.newPage();await q.setContent(html);
 /* fonte larga no lugar da Arial Black (pior caso) */
 await q.addStyleTag({content:'.capa h1{font-family:"DejaVu Sans",sans-serif!important;font-weight:900!important;letter-spacing:.04em!important}'});
 for(const w of [360,390,768,1024,1366,2000,2560]){await q.setViewportSize({width:w,height:900});await q.waitForTimeout(80);
  const x=await q.evaluate(()=>{const h=document.querySelector('.capa h1'),c=document.querySelector('.capa-t');
    const words=[];const tw=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){const re=/\S+/g;let m;while(m=re.exec(n.data)){const rg=document.createRange();rg.setStart(n,m.index);rg.setEnd(n,m.index+m[0].length);words.push({w:m[0],lines:new Set([...rg.getClientRects()].map(r=>Math.round(r.top))).size,right:rg.getBoundingClientRect().right})}}
    const cr=c.getBoundingClientRect().right;return {quebra:words.filter(w=>w.lines>1).map(w=>w.w),fora:words.filter(w=>w.right>cr+1).map(w=>w.w),fs:getComputedStyle(h).fontSize,doc:document.documentElement.scrollWidth>innerWidth}});
  if(x.quebra.length||x.fora.length||x.doc)r.push(mod+' '+w+' '+JSON.stringify(x));}
 await q.close();}
console.log(r.length?r.join('\n'):'capa ok em 6 modelos × 7 larguras');await b.close();})();
