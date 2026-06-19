const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // bracket math: 6 entrants → P=8, 2 byes
  tour={names:['Ava','Ben','Cy','Dee','Eli','Fay'],drv:[null,null,null,null,null,null],policy:'closed',seedMode:'rand',mode:'tankfight',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  const wb1=tour.M.filter(m=>m.br==='W'&&m.rd===1);
  console.log('P=8: WB R1 matches='+wb1.length+' total matches='+tour.M.length+' (expect 4, 13ish)');
  const byeAuto=tour.M.filter(m=>m.w!==null).length;
  console.log('byes auto-resolved: '+byeAuto+' matches pre-resolved');
  // play it out: always side 0 (red) wins; walk matches via tourNext
  let guard=0,played=0;
  while(tour.champ===null&&guard++<40){
    const m=tourNext();
    if(!m)break;
    tour.cur=m;tour.curE=tourEntrants(m);
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#fff'};m2.drive[1]={kind:'main',idx:2,name:'B',c:'#fff'};
    tourMatchEnd(0);played++;
  }
  console.log('tournament completes: champ='+(tour.champ!==null?tour.names[tour.champ]:'NONE')+' matches played='+played+' gf games='+tour.gf.n);
  // every non-bye match resolved, losers got a second life (double elim: champion's path)
  const unresolved=tour.M.filter(m=>m.w===null).length;
  console.log('all matches resolved: '+(unresolved===0));
  // closed policy locked drives at first play
  console.log('closed policy locked drives: '+tour.drv.filter(d=>d).length+' entrants locked');
  // a loser dropped to LB and PLAYED there (double-elim property): find an entrant who lost in WB then appears as winner in an L match
  const lostWB=new Set(tour.M.filter(m=>m.br==='W'&&m.l>=0).map(m=>m.l));
  const wonLB=new Set(tour.M.filter(m=>m.br==='L'&&m.w>=0).map(m=>m.w));
  const secondLife=[...lostWB].some(e=>wonLB.has(e));
  console.log('double-elim second life exists: '+secondLife);
  // GF no-reset: champ decided at 2 wins regardless of source bracket
  console.log('GF Bo3 no reset: gf wins='+tour.gf.w+' champ side reached 2: '+(tour.gf.w[0]===2||tour.gf.w[1]===2));
  // 16 and 4 entrant builds sane
  for(const n of [4,16]){
    tour={names:Array.from({length:n},(_,i)=>'P'+i),drv:[],policy:'open',seedMode:'rand',mode:'race',buf:'',seeds:[],M:[],qi:0};
    tourBuild();
    let g=0,pl=0;
    while(tour.champ===null&&g++<80){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(pl++%3===0?1:0);}
    console.log('N='+n+': matches='+tour.M.length+' champ='+(tour.champ!==null)+' played='+pl);
  }
  // qualifier seeding order: fastest first
  tour={names:['Slow','Fast','Mid','Skip'],drv:[],policy:'open',seedMode:'qual',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tour.seeds=[30.0,10.0,20.0,Infinity];
  tourBuild();
  const wb=tour.M.filter(m=>m.br==='W'&&m.rd===1);
  const top=tourRes(wb[0].a);
  console.log('qualifier seeding: seed1='+tour.names[top]+' (expect Fast); seed1 plays '+tour.names[tourRes(wb[0].b)]+' (expect Skip, the worst seed)');
  // solo qualifier run wiring
  tour.qi=0;tour.mode='race';m2.set.course=0;m2.set.haz=false; // v5.1.244 race qualifier stays a solo time-trial
  tourStartQualRun();
  console.log('qual run: solo='+r2.solo+' bind any='+(playerBind[0].type==='any')+' phase='+phase);
  updateP2Race(3.1);
  r2.bots[0].x=330;r2.bots[0].y=OC_FINISH_Y-2;updateP2Race(1/60);
  console.log('solo finish: result='+r2.result+' fin set='+(r2.bots[0].fin!==null));
  tourQualDone(r2.bots[0].fin);
  console.log('after qual 1: qi='+tour.qi+' seed recorded='+tour.seeds[0].toFixed(2)+' phase='+phase+' mode restored='+m2.mode);
  drawTourQual();
  // registration typing
  tour.buf='';phase='p2tnames';
  for(const ch of 'Sam')keydownSim(ch);
  keydownSim('Enter');
  console.log('typed name committed: '+(tour.names.includes('Sam')));
  drawTourNames();
  tour.M=[];tourBuild===null;
  // v5.1.244 mode-aware qualifier metric (1v1 vs CPU): per-mode score, lower seed value = better, losses seed below wins
  tour={mode:'normal',seeds:[],qi:0};b2={result:0,score:[3,1]};
  if(tourQualMetric()!==-3||!/WON · 3 goals/.test(tourQualDisplay()))throw new Error('ball qual metric wrong: '+tourQualMetric()+' / '+tourQualDisplay());
  b2=null;tour={mode:'battlebots'};bb2={result:0,bots:[{side:0,dmgDealt:200},{side:1,dmgDealt:50}]};
  if(tourQualMetric()!==-200)throw new Error('bb qual metric wrong: '+tourQualMetric());
  bb2=null;tour={mode:'tankfight'};m2.set.tformat='lives';tf2={result:1,tanks:[{side:0,lives:1,kills:0},{side:1,lives:3,kills:4}]};
  if(!(tourQualMetric()>0))throw new Error('a LOSS must seed worse than any win, got '+tourQualMetric());
  tf2=null;console.log('mode-aware qualifier metrics OK (ball/bb/tank)');
  console.log('done');
})();
function keydownSim(k){window._kd({key:k,preventDefault:()=>{}});}
`;
global.ctxState={depth:0};
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},addEventListener:()=>{},style:{},width:0,height:0};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:(ev,fn)=>{if(ev==='keydown')window._kd=fn;},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
