const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+process.argv[2]);await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas);
const D=await p.evaluate(()=>{ EST.div='';EST.vend='';aplicar();
 const R=hoje(), iso=d=>d?isoD(d):null, val=v=>v.valorDet!==undefined?v.valorDet:v.valor, r2=x=>Math.round((x||0)*100)/100;
 const ped=F.todas.filter(v=>v.dt&&v.dt.getFullYear()>=2025&&v.dt<=R).map(v=>({d:iso(v.dt),div:v.div||'',ven:nomeCurto(v.resp)||v.resp||'',cli:String(v.cli||''),v:r2(val(v))}));
 const prop=propostasRecorte().filter(x=>x.dt&&x.dt<=R).map(x=>({d:iso(x.dt),div:x.div||'',ven:nomeCurto(x.resp)||x.resp||'',v:r2(x.val)}));
 const U=fupNegocios(), fuM=new Map(U.fu.map(z=>[z.n,z.d]));
 const PP=previsaoPedidos(F.ab,3), inPrev=new Set(PP.eleg.concat(PP.venc.filter(n=>polDe(n.certeza).entra)));
 const ab=F.ab.map(n=>({cli:String(n.cli||''),div:n.div||'',ven:nomeCurto(n.resp)||n.resp||'',v:r2(n.vNum),sit:polDe(n.certeza).k,p:polDe(n.certeza).p,etapa:String(n.etapa||''),dEst:n.diasEst||0,prev:iso(n.dtPrev),fu:fuM.has(n),dFu:fuM.has(n)?fuM.get(n):null,naPrev:inPrev.has(n),pond:inPrev.has(n)?r2(prevNeg(n)):0}));
 const ini=new Date(2026,6,1);
 const dec=F.neg.filter(n=>n.ganho&&(n.dtVenda||n.dtCri)>=ini).map(n=>({d:iso(n.dtVenda||n.dtCri),div:n.div||'',ven:nomeCurto(n.resp)||n.resp||'',v:r2(n.vNum),g:1,mot:''}))
   .concat(F.perd.filter(n=>(n.dtAtu||n.dtCri)>=ini).map(n=>({d:iso(n.dtAtu||n.dtCri),div:n.div||'',ven:nomeCurto(n.resp)||n.resp||'',v:r2(n.vNum),g:0,mot:motivoPerda(n),cli:String(n.cli||'')})));
 const C=contratosModelo(), V=C.L.filter(c=>c.vigente);
 const X=indicadoresPeriodo(PER)||{};
 return {ref:iso(R),metaSEQ:metaTotalSeq(),metaSPV:metaTotalSpv(),pol:POL().map(q=>({k:q.k,p:q.p,entra:q.entra})),fupLim:U.lim,
   pedOficial:X.ped,ped,prop,ab,dec,ctr:{n:V.length,rec:r2(somar(V,c=>c.receitaMes||0)),renov:C.L.filter(c=>c.renovar).length},
   sf:(()=>{const s=saldoFaturar();return {tot:r2(s.total!=null?s.total:somar(s.L||[],x=>x.v||0))}})(),
   per:PER.rot||PER.nome||'' }; });
fs.writeFileSync(process.argv[3],JSON.stringify(D));
console.log(D.ref,D.metaSEQ,D.metaSPV,D.ped.length,D.prop.length,D.ab.length,D.dec.length,JSON.stringify(D.ctr),JSON.stringify(D.sf),D.pedOficial,JSON.stringify(D.pol));
const s=D.ped.filter(x=>x.d>='2026');console.log('ped26',s.length,s.reduce((a,x)=>a+x.v,0),[...new Set(D.ped.map(x=>x.div))],[...new Set(D.ab.map(x=>x.ven))]);
await b.close();})();
