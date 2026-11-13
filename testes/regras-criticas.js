const {chromium}=require('playwright'); const fs=require('fs'); const {execSync}=require('child_process');
const __T=require('fs').mkdtempSync(require('path').join(require('os').tmpdir(),'lsf-teste-')), __FIX=require('path').join(__dirname,'..','dados','fixtures');   /* temporários próprios; planilhas de teste em dados/fixtures (fora do git) */
const src=process.argv[2]; const R=[]; const ok=(n,c,d)=>R.push([c?'OK ':'FALHA',n,d==null?'':typeof d==='string'?d:JSON.stringify(d)].join(' | '));
(async()=>{ const b=await chromium.launch(); const errs=[];
 const ctx=await b.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
 const abre=async(url)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto(url); await p.waitForFunction(()=>typeof F!=='undefined'&&F.todas,null,{timeout:60000}); return p; };
 let p=await abre('file://'+src);
 // dedup
 const dd=await p.evaluate(()=>{ const a=dedupInter(M.interacoes).out.length; CFG.dedupModo='nenhuma'; const b=dedupInter(M.interacoes).out.length; CFG.dedupModo='identicas';
   const g=agrupa(dedupInter(M.interacoes).out,i=>[i.nCli,isoD(i.dt),norm(i.tipo||''),norm(String(i.descricao||'')).slice(0,80)].join('|')); const mesmaChaveAntiga=[...g.values()].filter(x=>x.length>1).length;
   return {a,b,susp:suspeitasInter(M.interacoes).length,mesmaChaveAntiga,motivo:dedupInter(M.interacoes).rem[0].motivo}; });
 ok('Deduplicação só por linha idêntica (675 de 2.619); modo "não remover" devolve 2.619; motivo consultável',dd.a===675&&dd.b===2619&&/idêntica/.test(dd.motivo),dd);
 // passo sem prazo / follow-up do negócio
 const pa=await p.evaluate(()=>{ const s1=situacaoPasso({status:'Concluído',prazo:'',concluido:'2026-10-01'}), s2=situacaoPasso({status:'Concluído',prazo:'2026-10-05',concluido:''}), s3=situacaoPasso({status:'Concluído',prazo:'2026-10-05',concluido:'2026-10-04T10:00'});
   const n=F.ab.find(n=>!ultimaInterNeg(n)&&ultimaInter(n)); return {s1,s2,s3,pend:n?pendenciasNeg(n).join(' · '):null,cli:n?n.cli:null}; });
 ok('Passo concluído sem prazo ou sem data = "prazo não avaliável"',/não avaliável/.test(pa.s1)&&/não avaliável/.test(pa.s2)&&pa.s3==='Concluído no prazo',pa);
 ok('Interação genérica com a conta não comprova acompanhamento do negócio',pa.pend&&/sem interação no negócio \(conta:/.test(pa.pend),pa.pend);
 // filtros: plano/passos por pessoa na tela, no relatório individual e na planilha
 await p.evaluate(()=>{ CFG.plano.push({id:'tA',acao:'AÇÃO DO FÁBIO',resp:'Fábio Dalagnolo',prazo:'2026-11-03',status:'Não iniciada',hist:[]},{id:'tB',acao:'AÇÃO DO GUILHERME',resp:'Guilherme Binatto',prazo:'2026-11-04',status:'Não iniciada',hist:[]}); centralGuardar(); });
 const tl=await p.evaluate(()=>{ EST.vend='Fábio Dalagnolo'; aplicar(); irTela('reunioes'); const t=[...document.querySelectorAll('#tela textarea')].map(x=>x.value).join('|')+document.getElementById('tela').innerText; irTela('supervisao'); const s=document.getElementById('tela').innerText; EST.vend=''; aplicar(); return {plF:t.includes('AÇÃO DO FÁBIO'),plG:t.includes('AÇÃO DO GUILHERME'),supG:s.includes('AÇÃO DO GUILHERME'),supF:s.includes('AÇÃO DO FÁBIO')}; });
 ok('Com vendedor escolhido, plano e Central mostram só as ações dele',tl.plF&&!tl.plG&&tl.supF&&!tl.supG,tl);
 const rc=await p.evaluate(async()=>{ irTela('relatorios'); RELC.modelo='rC'; render(); document.getElementById('relc-vend').value='Fábio Dalagnolo'; await relcGerar(); const t=document.querySelector('#rel-view .rel-folhas').innerText; fecharRelatorio(); return {f:t.includes('AÇÃO DO FÁBIO'),g:t.includes('AÇÃO DO GUILHERME'),vend:EST.vend}; });
 ok('Relatório individual não traz ações de outra pessoa; filtros voltam ao estado anterior',rc.f&&!rc.g&&rc.vend==='',rc);
 const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>{ irTela('relatorios'); RELC.modelo='rB'; render(); document.getElementById('relc-vend').value='Fábio Dalagnolo'; relcPlanilha(); })]);
 await dl.saveAs(__T+'/fab.xlsx');
 const pl=execSync(`python3 -I -c "import openpyxl;wb=openpyxl.load_workbook('${__T}/fab.xlsx');ws=wb['Plano de ação'];print('|'.join(str(r[4]) for r in ws.iter_rows(min_row=2,values_only=True)));ws=wb['Pedidos'];print(set(r[3] for r in ws.iter_rows(min_row=2,values_only=True)))"`).toString();
 ok('Planilha com vendedor: plano e pedidos só da pessoa (mesmo contexto da tela)',/AÇÃO DO FÁBIO/.test(pl)&&!/GUILHERME/.test(pl)&&/(\{'Fábio Dalagnolo'\}|set\(\))/.test(pl),pl.trim());
 // seções vazias e nomes amigáveis
 const sv=await p.evaluate(async()=>{ irTela('relatorios'); RELC.modelo='rB'; render(); const lab=[...document.querySelectorAll('.relc-pers label')].map(l=>l.textContent.trim());
   document.querySelectorAll('.relc-sec').forEach(c=>c.checked=false); let gerou=false; const g0=document.querySelector('#rel-view.aberto'); await relcGerar(); gerou=!!document.querySelector('#rel-view.aberto');
   const msg=(document.getElementById('aviso')||{}).textContent||''; return {lab,gerou,msg}; });
 ok('Nenhuma seção marcada: não gera e avisa; rótulos sem IDs internos',!sv.gerou&&/Nenhuma seção/.test(sv.msg)&&!sv.lab.some(x=>/^(sup|atv|pipe|res|reu)-/.test(x)),sv);
 // período específico no relatório
 const pe=await p.evaluate(async()=>{ irTela('relatorios'); RELC.modelo='rE'; render(); const s=document.getElementById('relc-per'); s.value='esp'; s.dispatchEvent(new Event('change'));
   document.getElementById('relc-emodo').value='mes'; document.getElementById('relc-ed1').value='2026-08-10'; await relcGerar(); const c=document.querySelector('#rel-view .rel-capa p').innerText; fecharRelatorio(); return c; });
 ok('Relatório com período específico (agosto/2026)',/ago\/2026/.test(pe),pe.slice(0,60));
 // posição no encerramento sem e com fotografia
 const fo=await p.evaluate(()=>{ setAtalho('mesAnt'); const a=indicadoresPeriodo(PER);
   const at=snapAtual(), fake=JSON.parse(JSON.stringify(at)); fake.id='sTeste'; fake.fp='fpTeste'; fake.carga='2026-09-30T12:00:00.000Z'; fake.regs=fake.regs.slice(0,50); CFG.snaps.push(fake);
   const b=indicadoresPeriodo(PER); CFG.snaps=CFG.snaps.filter(s=>s.id!=='sTeste'); _ADIA=null; return {semFoto:a.abN,msg:a.fotoMsg,comFoto:b.abN,fotoCarga:b.foto&&b.foto.carga,def:b.defasagem,atual:F.ab.length}; });
 ok('Período encerrado sem fotografia: posição indisponível (não usa a de hoje)',fo.semFoto==null&&/Sem fotografia/.test(fo.msg),fo.msg);
 ok('Com fotografia de 30/09: posição vem dela (não da carga posterior)',fo.comFoto!=null&&fo.comFoto!==fo.atual&&/2026-09-30/.test(fo.fotoCarga)&&fo.def===0,fo);
 // fechamento: registrar, comparar, retificar, regerar
 const fe=await p.evaluate(async()=>{ setAtalho('mesAnt'); irTela('relatorios'); fechamentoRegistrar(); document.getElementById('f-form').requestSubmit(); const f=CFG.fechamentos[CFG.fechamentos.length-1];
   fechamentoAbrir(f.id,1); const cmp=document.getElementById('fech-ver').innerText; const iguais=(cmp.match(/igual/g)||[]).length;
   fechamentoRegistrar(f.id); const ff=document.getElementById('f-form'); ff.requestSubmit(); const semJust=CFG.fechamentos.length; ff.just.value='pedido lançado após o fechamento'; ff.requestSubmit();
   const r=CFG.fechamentos[CFG.fechamentos.length-1]; await fechamentoRegerar(f.id); const cap=document.querySelector('#rel-view .rel-folhas').innerText.includes('regerado a partir do fechamento'); fecharRelatorio();
   return {ped:f.ind.ped,parcial:f.parcial,nPed:f.registros.pedidos.length,iguais,semJust,total:CFG.fechamentos.length,ret:r.retifica===f.id,cap,regras:f.regras.versao,foto:f.fontes.fotografia}; });
 ok('Fechamento de setembro guarda indicadores, pedidos e regras; comparação sem diferenças',fe.ped>7e6&&!fe.parcial&&fe.nPed>0&&fe.iguais>10,fe);
 ok('Retificação exige justificativa, preserva o original e regerar traz os valores congelados',fe.semJust===1&&fe.total===2&&fe.ret&&fe.cap,fe);
 // metas: método declarado = cálculo; calendário configurável
 const me=await p.evaluate(()=>{ const P={ini:_d(2026,1,9),fim:_d(2026,1,15),fimCal:_d(2026,1,15),modo:'semana'}; CFG.rateioDias='uteis';
   const a=diasUteis(_d(2026,1,1),_d(2026,1,28)); CFG.calendario={usarFacultativos:true}; _FER_K=''; const b=diasUteis(_d(2026,1,1),_d(2026,1,28));
   const m1=metaPedidos(P); CFG.calendario={usarFacultativos:false}; const m2=metaPedidos(P); const MA=metasDoAno(2026), anual=(num(MA.seq)||0)+(num(MA.spv)||0);
   const esp=anual/12*diasUteis(P.ini,P.fim)/diasUteis(_d(2026,1,1),_d(2026,1,28)); CFG.rateioDias=undefined; return {a,b,m1:m1.valor,m2:m2.valor,esp,met:m2.metodo}; });
 ok('Rateio por dias úteis: o cálculo segue o método declarado; pontos facultativos são opcionais',me.a===20&&me.b===18&&Math.abs(me.m2-me.esp)<1&&me.m1!==me.m2&&/dias úteis/.test(me.met),me);
 // persistência: versão, conflito, exclusão, validação, falha de gravação
 const ps=await p.evaluate(()=>{ const a=CFG.plano.find(x=>x.id==='tA'); planoSet('tA','status','Em andamento'); const v1=a.ver;
   const ext=JSON.parse(JSON.stringify(a)); ext.status='Concluída'; ext.atualizado='2099-01-01T00:00:00.000Z'; ext.ver=99;
   const velho=JSON.parse(JSON.stringify(a)); velho.status='Cancelada'; velho.atualizado='2000-01-01T00:00:00.000Z';
   const r1=mesclar('plano',CFG.plano,[ext],'teste'); const novo=r1.lista.find(x=>x.id==='tA').status; const r2=mesclar('plano',CFG.plano,[velho],'teste'); const mantido=r2.lista.find(x=>x.id==='tA').status;
   planoTira('tB'); const r3=mesclar('plano',CFG.plano,[{id:'tB',acao:'volta?'}],'teste'); const voltou=r3.lista.some(x=>x.id==='tB');
   const r4=mesclar('passos',[], [{id:'x'},{id:'y',neg:'1',texto:'t',status:'Aberto'}],'teste');
   const orig=Storage.prototype.setItem; Storage.prototype.setItem=function(){ throw new DOMException('cheio','QuotaExceededError'); }; _AVISO_GRAV=false; centralGuardar(); Storage.prototype.setItem=orig; const av=document.getElementById('aviso').textContent;
   return {v1,novo,mantido,conflitos:CFG.conflitos.length,voltou,inval:r4.invalidos,validos:r4.lista.length,av}; });
 ok('Edição sobe a versão; vale a atualização mais recente; o conflito fica registrado',ps.v1>=1&&ps.novo==='Concluída'&&ps.mantido==='Em andamento'&&ps.conflitos>=2,ps);
 ok('Exclusão não "ressuscita" ao juntar; registro inválido é recusado; falha de gravação avisa',!ps.voltou&&ps.inval===1&&ps.validos===1&&/Não consegui gravar/.test(ps.av),ps);
 // JSON antigo (v1, sem versão) e reabertura do arquivo salvo
 const js=await p.evaluate(()=>{ const antigo={versao:1,passos:[{id:'pOld',neg:String(F.ab[0].id),cli:'X',texto:'passo antigo',status:'Aberto',prazo:'2026-10-01'}],plano:[{id:'aOld',acao:'ação antiga',status:'Não iniciada'}],fotos:[{id:'fOld',em:'2026-10-01T00:00:00Z',rot:'set/2026',v:{ped:1}}]};
   const fr=new File([JSON.stringify(antigo)],'a.json'); centralImportar(fr); return new Promise(r=>setTimeout(()=>r({p:CFG.passos.some(x=>x.id==='pOld'),a:CFG.plano.some(x=>x.id==='aOld'),f:CFG.fotos.some(x=>x.id==='fOld'),av:document.getElementById('aviso').textContent}),300)); });
 ok('JSON antigo (sem versão) é incorporado e validado',js.p&&js.a&&js.f&&/novo/.test(js.av),js);
 const html=await p.evaluate(async()=>CAB_LOCAL+await corpoComDados(BRUTO)); fs.writeFileSync(__T+'/e.html',html);
 const p2=await abre('file://'+__T+'/e.html');
 const re=await p2.evaluate(()=>({fe:CFG.fechamentos.length,ret:CFG.fechamentos.some(f=>f.retifica),conf:CFG.conflitos.length,exc:CFG.excluidos.length,ver:(CFG.plano.find(x=>x.id==='tA')||{}).ver}));
 ok('Reabrir o arquivo salvo preserva fechamentos, retificação, conflitos, exclusões e versões',re.fe>=2&&re.ret&&re.conf>=2&&re.exc>=1&&re.ver>=1,re);
 // base vazia, ausente, zero, negativo
 const bv=await p2.evaluate(()=>{ const n=[num('-1.234,56'),num(''),num('0'),fmtInd(null,'qtd'),fmtInd(0,'qtd')]; Object.keys(BRUTO).forEach(k=>{ if(k!=='_meta')delete BRUTO[k]; }); construir(); aplicar(); const e=[];
   TELAS.forEach(t=>{ try{ irTela(t.id); }catch(x){ e.push(t.id+': '+x.message); } }); return {n,e,ind:indicadoresPeriodo(PER)&&indicadoresPeriodo(PER).novas}; });
 ok('Base vazia: todas as telas abrem; ausente ≠ zero; negativo preservado',!bv.e.length&&bv.n[0]===-1234.56&&bv.n[1]===null&&bv.n[2]===0&&/sem base/.test(bv.n[3])&&bv.n[4]==='0',bv);
 console.log(R.join('\n')); console.log('ERROS JS:',errs.length?errs.slice(0,5):'nenhum'); await b.close(); })();
