// smoke58 — ball 3v3 (MULTI grid): N-main spawn, CPU brain, scoring, no-NaN, draw, 1v1 fallthrough
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  const finite=o=>!!o&&isFinite(o.x)&&isFinite(o.y)&&isFinite(o.h);
  // deterministic RNG so the CPU-vs-CPU sim is repeatable
  let _sd=12345;Math.random=()=>{_sd=(_sd*1664525+1013904223)>>>0;return _sd/4294967296;};

  function setBase(mode){applyLayout('ball2p');phase='p2claim';tour=null;m2.mode=mode;
    m2.set.tfmt='multi';m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.cpus=0;m2.set.ballN='auto';
    m2.tseats=[null,null,null,null,null,null];m2.tsel=0;m2.name=[null,null,null,null,null,null];m2._gpPrev=[];}
  function gridAllCpu(mode){setBase(mode);for(let i=0;i<6;i++)tankGridSetCpu(i);startP2Ball();}     // 3 CPU vs 3 CPU
  function gridMixed(mode){setBase(mode);tankGridClaimDev({type:'kb'});tankGridClaimDev({type:'gp',gp:0});tankGridClaimDev({type:'gp',gp:1});tankGridSetCpu(3);tankGridSetCpu(4);tankGridSetCpu(5);startP2Ball();} // RED 3 human vs BLUE 3 CPU

  // ── 1. CPU-vs-CPU 3v3 spawn + roster wiring ──
  gridAllCpu('normal');
  ok('phase p2ball + grid active',phase==='p2ball'&&tankGridActive());
  ok('3v3 spawns 6 mains (3 per side)',b2.bots.length===6&&b2Mains(0).length===3&&b2Mains(1).length===3);
  ok('each main has bind/al/seat/ctl',b2.bots.every(b=>typeof b.bind==='number'&&(b.al===0||b.al===1)&&typeof b.seat==='number'&&!!b.ctl));
  ok('binds distinct 0..5',new Set(b2.bots.map(b=>b.bind)).size===6);
  ok('seats 0..2 per side',b2Mains(0).map(b=>b.seat).sort().join('')==='012'&&b2Mains(1).map(b=>b.seat).sort().join('')==='012');
  ok('all CPU → a brain per bind',b2.bots.every(b=>cpuH2H&&cpuH2H[b.bind]));
  ok('getInp routes each CPU main to its own brain',b2.bots.every(b=>getInp(playerBind[b.bind])===cpuH2H[b.bind].inp));
  ok('b2Foes(0) includes the 3 opposing mains',b2Foes(0).filter(x=>b2.bots.indexOf(x)>=0).length===3);
  ok('b2OppMain(redMain) is a BLUE main',(()=>{const o=b2OppMain(b2Mains(0)[0]);return !!o&&o.al===1;})());

  // ── 2. run a long CPU-vs-CPU 3v3 — no NaN, scores sane, scoring happens, no crash ──
  let threw=false;try{updateP2Ball(3.1);for(let i=0;i<2400;i++)updateP2Ball(1/60);}catch(e){threw=true;console.log('   update error:',e.message,e.stack&&e.stack.split('\\n')[1]);}
  ok('3v3 CPU sim runs ~40s without throwing',!threw);
  ok('all 6 bots finite after the sim',b2.bots.every(finite));
  ok('all balls finite',balls.every(b=>isFinite(b.x)&&isFinite(b.y)));
  ok('scores finite + non-negative',isFinite(b2.score[0])&&isFinite(b2.score[1])&&b2.score[0]>=0&&b2.score[1]>=0);
  ok('CPU mains actually score at 3v3 (no own-goal/stuck lockout) — '+b2.score[0]+'-'+b2.score[1],(b2.score[0]+b2.score[1])>0);
  let dThrew=false;try{drawP2Ball();}catch(e){dThrew=true;console.log('   draw error:',e.message);}
  ok('drawP2Ball renders 6 bots without throwing',!dThrew);

  // ── 3. mixed 3v3 (3 human vs 3 CPU): human binds idle, CPUs get brains ──
  gridMixed('normal');
  ok('mixed: 3 human mains + 3 CPU mains',b2.bots.filter(b=>b.ctl.type!=='cpu').length===3&&b2.bots.filter(b=>b.ctl.type==='cpu').length===3);
  ok('mixed: a brain ONLY for each CPU bind',b2.bots.filter(b=>b.ctl.type==='cpu').every(b=>!!cpuH2H[b.bind])&&b2.bots.filter(b=>b.ctl.type!=='cpu').every(b=>!cpuH2H[b.bind]));
  {let t2=false;try{updateP2Ball(3.1);for(let i=0;i<300;i++)updateP2Ball(1/60);}catch(e){t2=true;console.log('   mixed err:',e.message);}
   ok('mixed 3v3 runs without throwing + bots finite',!t2&&b2.bots.every(finite));}

  // ── 4. SHOOTER 3v3 spawns + runs (projectiles + N mains) ──
  gridAllCpu('shooter');
  ok('shooter 3v3: 6 bots',b2.bots.length===6);
  {let t3=false;try{updateP2Ball(3.1);for(let i=0;i<400;i++)updateP2Ball(1/60);}catch(e){t3=true;console.log('   shooter err:',e.message,e.stack&&e.stack.split('\\n')[1]);}
   ok('shooter 3v3 runs without throwing + finite',!t3&&b2.bots.every(finite)&&balls.every(b=>isFinite(b.x)));}

  // ── 5. 1v1 (tfmt=1v1) still spawns EXACTLY 2 mains via the legacy 2-card ──
  applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.tfmt='1v1';m2.tseats=null;
  m2.claim=[{type:'kb'},{type:'cpu',tier:2}];playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  startP2Ball();
  ok('1v1 (tfmt 1v1) still spawns exactly 2 mains, binds 0/1',b2.bots.length===2&&b2.bots[0].bind===0&&b2.bots[1].bind===1&&b2.bots[0].seat===0&&b2.bots[1].seat===0);

  console.log('--- ball 3v3: '+P+' pass, '+F+' fail ---');
})();
`;
global.ctxState={depth:0};global.texts=[];global.rumbles=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},setTransform:()=>{},fillText:()=>{},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,_dpr:1,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1280,innerHeight:720,devicePixelRatio:1,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.location={protocol:'file:'};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:t=>({style:{},addEventListener:()=>{},setAttribute:()=>{},remove:()=>{},focus:()=>{},click:()=>{},value:''}),head:{appendChild:()=>{}},body:{appendChild:()=>{}}};
global.requestAnimationFrame=()=>{};
function mkPad(i){return{connected:false,index:i,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],vibrationActuator:{playEffect:()=>({catch:()=>{}})}};}
global.PADS=[mkPad(0),mkPad(1)];
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
