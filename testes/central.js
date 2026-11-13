const {chromium}=require('playwright'); const fs=require('fs');
const __T=require('fs').mkdtempSync(require('path').join(require('os').tmpdir(),'lsf-teste-')), __FIX=require('path').join(__dirname,'..','dados','fixtures');   /* temporários próprios; planilhas de teste em dados/fixtures (fora do git) */
const src=process.argv[2]; const R=[]; const ok=(n,c,d)=>R.push([c?'OK ':'FALHA',n,d||''].join(' | '));
(async()=>{ const b=await chromium.launch(); const errs=[];
 const p=await b.newPage({viewport:{width:1400,height:1000},acceptDownloads:true}); p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept('Cliente pediu nova data'));
 await p.goto('file://'+src); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
 const telas=await p.evaluate(()=>TELAS.map(t=>t.id)); const e0=errs.length;
 for(const at of ['hoje','estaSemana','semAnt','u7','esteMes','mesAnt','esteTri','triAnt','esteAno','anoAnt']){ await p.evaluate(a=>setAtalho(a),at);
   for(const t of telas){ await p.evaluate(x=>irTela(x),t); await p.waitForTimeout(60); } }
 ok('12 telas × 10 atalhos de período sem erro',errs.length===e0,errs.slice(e0,e0+3).join(';'));
 const per=await p.evaluate(()=>{ const o={}; const t=(k,f)=>{ f(); aplicar(); o[k]=PER.rot+' | '+fmtData(PER.ini)+'–'+fmtData(PER.fimCal); };
   t('semana fim de ano',()=>{EST.ano='2026';EST.per={modo:'semana',data:'2026-12-31'};}); t('semana 1 de 2026',()=>{EST.per={modo:'semana',data:'2026-01-01'};});
   t('tri 4',()=>{EST.ano='2026';EST.per={modo:'tri',tri:3};}); t('u7',()=>{EST.per={modo:'u7'};}); t('dia',()=>{EST.per={modo:'dia',data:'2026-10-27'};});
   EST.ano='2026'; EST.per={modo:'mes',mes:9}; aplicar(); o.prec=periodoPrecedente(PER).rot; o.anoAnt=periodoAnoAnt(PER).rot;
   EST.per={modo:'semana',data:'2026-10-28'}; aplicar(); o.precSem=periodoPrecedente(PER).rot; o.anoSem=periodoAnoAnt(PER).rot;
   EST.per={modo:'ano'}; aplicar(); return o; });
 ok('Semana ISO na virada do ano: S53/2026 = 28/12/2026 a 03/01/2027',/S53\/2026/.test(per['semana fim de ano'])&&/28\/12\/2026–03\/01\/2027/.test(per['semana fim de ano']),per['semana fim de ano']);
 ok('01/01/2026 cai na S01/2026 (29/12/2025 a 04/01/2026)',/S01\/2026/.test(per['semana 1 de 2026'])&&/29\/12\/2025/.test(per['semana 1 de 2026']),per['semana 1 de 2026']);
 ok('Trimestre civil 4º = 01/10 a 31/12',/01\/10\/2026–31\/12\/2026/.test(per['tri 4']),per['tri 4']);
 ok('Últimos 7 dias ≠ semana-calendário',/Últimos 7 dias/.test(per.u7),per.u7);
 ok('Mês parcial compara mesmo trecho do mês anterior e do ano anterior',/set\/2026 até/.test(per.prec)&&/2025/.test(per.anoAnt),per.prec+' / '+per.anoAnt);
 ok('Semana: anterior = semana ISO anterior; ano anterior = mesma semana ISO',/S43\/2026/.test(per.precSem)&&/S44\/2025/.test(per.anoSem),per.precSem+' / '+per.anoSem);
 // indicadores consistentes com o que já era validado
 const ind=await p.evaluate(()=>{ const X=indicadoresPeriodo(PER); return {ped:X.ped,fat:X.fat,conv:X.conv,inter:X.inter,dup:X.dup,hist:X.hasHist,real:realizado().c.total}; });
 ok('Indicadores do período = mesmos pedidos do painel (36.730.682,39) e faturamento',Math.abs(ind.ped-36730682.39)<.02&&Math.abs(ind.ped-ind.real)<.02&&Math.abs(ind.fat-47373343.28)<.02,JSON.stringify(ind));
 ok('Sem histórico: aviso de comparação indisponível com a data de início',await p.evaluate(()=>{ irTela('pipeline'); return document.getElementById('tela').innerText.includes('Comparação histórica indisponível. Acompanhamento iniciado em 26/10/2026'); }));
 // taxa anual recalculada (não média das mensais)
 const tx=await p.evaluate(()=>{ const X=indicadoresPeriodo(PER); let g=0,pp=0; for(let m=0;m<10;m++){ const x=indicadoresPeriodo(Object.assign({},PER,{ini:_d(2026,m,1),fim:menorData(fimMes(2026,m),hoje()),modo:'mes'})); g+=x.gan; pp+=x.per; } return {anual:X.conv,soma:g/(g+pp),g,pp,G:X.gan,P:X.per}; });
 ok('Conversão anual = Σ ganhos ÷ Σ decididos dos meses (numerador/denominador)',Math.abs(tx.anual-tx.soma)<1e-9,JSON.stringify(tx));
 // passo, plano, compromisso, reunião
 const fl=await p.evaluate(async()=>{ const n=F.ab[0]; novoPasso(n.id); const f=document.getElementById('f-form'); f.texto.value='Ligar para confirmar PO'; f.resp.value='Fábio Dalagnolo'; f.prazo.value='2026-10-20'; f.requestSubmit();
   const ps=CFG.passos[CFG.passos.length-1], venc=situacaoPasso(ps), sem=proximaAtividade(n)?true:false;
   passoEditar(ps.id); const f2=document.getElementById('f-form'); f2.prazo.value='2026-11-05'; f2.just.value=''; f2.requestSubmit(); const semJust=ps.prazo;
   passoEditar(ps.id); const f3=document.getElementById('f-form'); f3.prazo.value='2026-11-05'; f3.just.value='cliente em férias'; f3.requestSubmit();
   const v=vendedoresAtivos().find(x=>x==='Fábio Dalagnolo'); EST.ano='2026'; EST.per={modo:'mes',mes:10}; aplicar();
   compEditar(v,'vendedor'); const f4=document.getElementById('f-form'); const nsel=f4.querySelectorAll('input[name=sel]:checked').length; f4.requestSubmit();
   compEditar(v,'supervisao'); const f5=document.getElementById('f-form'); f5.requestSubmit(); const semJ=CFG.comp.filter(c=>c.tipo==='supervisao').length;
   compEditar(v,'supervisao'); const f6=document.getElementById('f-form'); f6.just.value='retirei 2 negócios sem evidência'; f6.querySelectorAll('input[name=sel]:checked')[0].checked=false; f6.requestSubmit();
   const cv=compsDe(v,PER,'vendedor'), cs=compsDe(v,PER,'supervisao');
   reuniaoNova('Reunião individual',v); const f7=document.getElementById('f-form'); f7.requestSubmit(); const r1=CFG.reunioes[CFG.reunioes.length-1];
   planoNovoReuniao(r1.id); const f8=document.getElementById('f-form'); f8.acao.value='Visitar BYD'; f8.prazo.value='2026-10-25'; f8.requestSubmit();
   const a=CFG.plano[CFG.plano.length-1]; planoSet(a.id,'prazo','2026-11-10'); const fj=document.getElementById('f-form'); fj.just.value='cliente pediu'; fj.requestSubmit(); const reprog=(a.hist||[]).filter(h=>h.campo==='prazo').length;
   reuniaoNova('Reunião individual',v); document.getElementById('f-form').requestSubmit(); const r2=CFG.reunioes[CFG.reunioes.length-1]; REU_SEL=r2.id; irTela('reunioes');
   const txt=document.getElementById('tela').innerText;
   return {venc,sem,semJust,prazo:ps.prazo,hist:ps.hist.length,nsel,cv:cv.length,cs:cs.length,semJ,vSup:cs[0]&&cs[0].total<cv[0].total,ant:reuniaoAnterior(r2)&&reuniaoAnterior(r2).id===r1.id,mostra:txt.includes('Visitar BYD'),reprog,ind:r1.ind.length,
     conclAuto:a.status}; });
 ok('Passo vencido aparece como Vencido e conta como próximo passo',fl.venc==='Vencido'&&fl.sem,JSON.stringify(fl));
 ok('Reprogramar passo sem justificativa é recusado; com justificativa registra histórico',fl.semJust==='2026-10-20'&&fl.prazo==='2026-11-05'&&fl.hist>=1);
 ok('Compromisso do vendedor e revisão da supervisão em versões separadas; revisão exige justificativa',fl.cv===1&&fl.cs===1&&fl.semJ===0&&fl.vSup);
 ok('Reunião seguinte mostra compromissos da anterior; reprogramação com justificativa; ação não conclui sozinha',fl.ant&&fl.mostra&&fl.reprog===1&&fl.conclAuto==='Não iniciada'&&fl.ind>5);
 // relatórios prontos
 const rel=[];
 for(const m of ['rA','rB','rC','rD','rE','rF','rG']){ const e1=errs.length;
   const r=await p.evaluate(async m=>{ irTela('relatorios'); RELC.modelo=m; render(); if(m==='rC')document.getElementById('relc-vend').value='Fábio Dalagnolo';
     await relcGerar(); const ps=[...document.querySelectorAll('#rel-view .rel-pag')]; REL_REAL=true; relZoom();
     let fora=0; ps.forEach(pg=>{ const c=pg.querySelector('.rel-conteudo'); if(!c)return; const Rr=c.getBoundingClientRect(); c.querySelectorAll('*').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width>0&&r.right>Rr.right+2)fora++; }); });
     const caps=[...document.querySelectorAll('#rel-view .rel-sum li')].map(x=>x.textContent).join(', '); const tit=(document.querySelector('#rel-view .rel-capa h1')||{}).textContent;
     const per=(document.querySelector('#rel-view .rel-capa p')||{}).textContent; fecharRelatorio(); return {pags:ps.length,fora,caps,tit,per:per.slice(0,90),estado:PER.rot}; },m);
   rel.push(m+': '+r.pags+' pág., '+r.fora+' fora; '+r.tit+' | '+r.per+' | caps: '+r.caps); ok(`Relatório ${m} gerado sem erro e sem nada fora da margem`,errs.length===e1&&r.pags>1&&r.fora===0,r.pags+' págs '+r.estado); }
 // planilha
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.evaluate(()=>{ RELC.modelo='rB'; irTela('relatorios'); relcPlanilha(); })]);
 const pth=__T+'/plan.xlsx'; await dl.saveAs(pth); ok('Planilha de detalhamento (.xlsx) gerada',fs.statSync(pth).size>5000,dl.suggestedFilename());
 // salvar → reabrir mantém registros
 const html=await p.evaluate(async()=>CAB_LOCAL+await corpoComDados(BRUTO)); fs.writeFileSync(__T+'/c.html',html);
 const p2=await b.newPage(); p2.on('pageerror',e=>errs.push('p2 '+e.message)); await p2.evaluate(()=>localStorage.clear()).catch(()=>{});
 await p2.goto('file://'+__T+'/c.html'); await p2.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000});
 const s2=await p2.evaluate(()=>({snaps:CFG.snaps.length,passos:CFG.passos.length,comp:CFG.comp.length,reu:CFG.reunioes.length,plano:(CFG.plano||[]).length}));
 ok('Salvar → reabrir (sem cache do navegador) preserva cargas, passos, compromissos, reuniões e plano',s2.snaps>=1&&s2.passos>=1&&s2.comp>=2&&s2.reu>=2&&s2.plano>=1,JSON.stringify(s2));
 // nova carga de negócios: snapshot e mudanças
 const mud=await p2.evaluate(()=>{ const r=BRUTO.negocios.rows, c=BRUTO.negocios.cols, iV=c.indexOf('Valor'), iP=c.indexOf('Previsão de fechamento/ pedido'), iR=c.indexOf('Responsável'), iE=c.indexOf('Estágio');
   const novo=JSON.parse(JSON.stringify(BRUTO.negocios)); const ab=novo.rows.filter(x=>!x[c.indexOf('Venda Ganha')]);
   ab[0][iV]=(+ab[0][iV]||0)+100000; ab[1][iP]='2027-03-31'; ab[2][iR]='Fábio Dalagnolo'; const rem=novo.rows.splice(novo.rows.indexOf(ab[3]),1);
   BRUTO.negocios=novo; BRUTO._meta=Object.assign({},BRUTO._meta); BRUTO._meta.imp=Object.assign({},BRUTO._meta.imp,{negocios:{em:'2026-10-31T12:00:00.000Z',arq:'teste.xlsx',linhas:novo.rows.length}});
   limparCaches(); construir(); aplicar(); const m=mudancas(snapRefPadrao(PER),PER); const ks={}; m.out.forEach(L=>L.forEach(x=>ks[x.k]=(ks[x.k]||0)+1));
   irTela('pipeline'); return {snaps:CFG.snaps.length,ks,aus:m.aus.length,perdidos:ks.perdido||0,txt:document.getElementById('tela').innerText.toLowerCase().includes('mudanças observadas entre cargas')}; });
 ok('Nova carga vira snapshot; mudanças de valor, previsão e responsável detectadas; ausente não vira perdido',mud.snaps===s2.snaps+1&&mud.ks.valorMais>=1&&(mud.ks.adiado>=1||mud.ks.prevNova>=1)&&mud.ks.resp>=1&&mud.aus===1&&mud.perdidos===0&&mud.txt,JSON.stringify(mud));
 // celular
 for(const w of [390,768]){ const pm=await b.newPage({viewport:{width:w,height:900}}); pm.on('pageerror',e=>errs.push(w+' '+e.message)); await pm.goto('file://'+src); await pm.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000}); const bad=[];
   for(const t of telas){ await pm.evaluate(x=>irTela(x),t); await pm.waitForTimeout(200); const sw=await pm.evaluate(()=>document.documentElement.scrollWidth); if(sw>w+1)bad.push(t+':'+sw); }
   ok(`Celular/tablet ${w}px: todas as telas sem rolagem horizontal`,!bad.length,bad.join(',')); await pm.close(); }
 console.log(R.join('\n')); console.log(rel.join('\n')); console.log('ERROS JS:',errs.length?errs.slice(0,6):'nenhum'); await b.close(); })();
