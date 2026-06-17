const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  // ── v5.1.159 P5: cross-mode AIRSTRIKE — the RoboRumble cheat now also lands in TANK + BALL, where it STUNS (not kills) ──

  // start a 1v1 tank match (RED human vs BLUE CPU), countdown cleared
  const startTank=()=>{b2=null;bb2=null;applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';
    m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.lives=3;m2.set.map=0;m2.set.hpk=false;m2.set.pow=true;m2.set.tcpus=1;m2.set.tformat='lives';m2.set.tTimeSec=90;m2.set.tallies=0;m2.set.allyTier=1;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:0}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2Tank();updateP2Tank(3.1);};

  // start a 1v1 ball match, countdown cleared
  const startBall=()=>{tf2=null;bb2=null;arcadeMode=false;bouncyMode=false;
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'B',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:0}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);};

  // ── 1. p2AirCtx resolves the active 2P match ──
  startTank(); airStrike=true;
  let cx=p2AirCtx();
  ok('p2AirCtx resolves the live tank match',!!cx&&cx.m===tf2&&cx.bots===tf2.tanks);

  // ── 2. TANK: a telegraphed strike right on a tank STUNS it (no HP loss) and leaves a blast ──
  startTank(); airStrike=true; arcadeMode=false;
  let t=tf2.tanks[0]; t.x=400;t.y=300;t.stunT=0; const hp0=t.hp;
  tf2.air={x:t.x,y:t.y,t:0.01,max:1.3}; tf2.airBlasts=[];
  p2AirstrikeUpdate(0.05); // telegraph elapses -> DETONATE
  ok('TANK: airstrike stuns the caught tank (stunT>0)',t.stunT>0);
  ok('TANK: airstrike deals NO HP damage',t.hp===hp0);
  ok('TANK: detonation spawns a blast ring',tf2.airBlasts.length===1);
  ok('TANK: telegraph is consumed after detonation',tf2.air===null);

  // a tank far outside the radius is untouched
  startTank(); airStrike=true; t=tf2.tanks[0]; let t2=tf2.tanks[1];
  t.x=100;t.y=100;t2.x=FW-100;t2.y=FH-100;t.stunT=0;t2.stunT=0;
  tf2.air={x:t.x,y:t.y,t:0.01,max:1.3}; tf2.airBlasts=[];
  p2AirstrikeUpdate(0.05);
  ok('TANK: only the in-radius tank is stunned',t.stunT>0&&t2.stunT===0);

  // ── 3. TANK: a stunned tank is frozen even with RAMMING off ──
  startTank(); airStrike=false; arcadeMode=false;
  t=tf2.tanks[0]; t.stunT=0.5; t.x=500;t.y=400; const sx=t.x,sy=t.y;
  // feed a movement intent via the per-frame input the loop reads
  for(let f=0;f<6;f++)updateP2Tank(1/60);
  ok('TANK: stun freeze decays the timer with RAMMING off',t.stunT<0.5);
  ok('TANK: a stunned tank holds position with RAMMING off',Math.abs(t.x-sx)<0.5&&Math.abs(t.y-sy)<0.5);

  // ── 4. BALL: a telegraphed strike on a bot STUNS it + leaves a blast ──
  startBall(); airStrike=true; arcadeMode=false;
  let bo=b2.bots[0]; bo.x=500;bo.y=300;bo.stunT=0;
  b2.air={x:bo.x,y:bo.y,t:0.01,max:1.3}; b2.airBlasts=[];
  p2AirstrikeUpdate(0.05);
  ok('BALL: airstrike stuns the caught bot (stunT>0)',bo.stunT>0);
  ok('BALL: detonation spawns a blast ring',b2.airBlasts.length===1);
  ok('BALL: telegraph is consumed after detonation',b2.air===null);

  // ── 5. BALL: a stunned bot is frozen even with RAMMING off ──
  startBall(); airStrike=false; arcadeMode=false;
  bo=b2.bots[0]; bo.stunT=0.5; bo.x=500;bo.y=300; const bx=bo.x,by=bo.y;
  for(let f=0;f<6;f++)updateP2Ball(1/60);
  ok('BALL: stun freeze decays the timer with RAMMING off',bo.stunT<0.5);
  ok('BALL: a stunned bot holds position with RAMMING off',Math.abs(bo.x-bx)<0.5&&Math.abs(bo.y-by)<0.5);

  // ── 6. airStrike OFF clears any pending telegraph + spawns none ──
  startTank(); airStrike=false; tf2.air={x:100,y:100,t:1,max:1.3};
  p2AirstrikeUpdate(0.05);
  ok('airstrike OFF clears a pending telegraph',tf2.air===null);

  // ── 7. with airstrike ON the timer eventually arms a telegraph ──
  startTank(); airStrike=true; tf2.air=null; tf2.airT=0.01;
  p2AirstrikeUpdate(0.05);
  ok('airstrike ON arms a telegraph when the timer elapses',!!tf2.air&&tf2.air.t>0);

  console.log('smoke60: '+P+' pass, '+F+' fail');
  if(F)process.exit(1);
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
