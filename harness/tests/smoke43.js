const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);
  const startMatch=(mode,cpus,tier)=>{
    applyLayout('land2p');phase='p2claim';tour=null;
    m2.mode=mode;m2.set.cpus=cpus;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
    updateP2Ball(3.1);
  };
  const clearBalls=()=>{balls.forEach(b=>{b.sc=true;b.intaken=false;b.proj=false;b.golden=false;b.vx=0;b.vy=0;});};

  // ── Integration: a ball parked in p1's scoring lane just short of the gap. CHAMPION must drive it THROUGH (pre-fix it stalled at the mouth and scored 0). ──
  startMatch('normal',0,4);
  clearBalls();
  let G=cpuBallGoals(1); // p1 scores on G.ex (the left gap, small x)
  const bb=balls[0];bb.sc=false;bb.x=G.ex+40;bb.y=FH/2;bb.vx=0;bb.vy=0;
  b2.bots[1].x=G.ex+95;b2.bots[1].y=FH/2;b2.bots[1].h=Math.PI; // CHAMPION behind it, on the +x side
  b2.bots[0].x=FW-80;b2.bots[0].y=80; // idle foe parked away
  const sc0=b2.score[1];
  const RND=Math.random;let _s=0x43A;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
  for(let i=0;i<170&&b2.score[1]===sc0;i++)updateP2Ball(1/60);
  Math.random=RND;
  ok('finish (integration): CHAMPION drives a lane ball through its gap (score '+sc0+' -> '+b2.score[1]+')',b2.score[1]>sc0);

  // ── Unit (v4.0 cycle): a loaded bot in SCORE drives its load toward the opponent gap ──
  startMatch('normal',0,4); G=cpuBallGoals(1);
  clearBalls();
  const bo=b2.bots[1];bo.x=G.ex+200;bo.y=FH/2;bo.h=Math.PI;bo.load=[balls[0]];
  balls[0].sc=false;balls[0].held=true;balls[0].heldBy=bo;balls[0].x=bo.x-20;balls[0].y=FH/2;
  cpuH2H[1].cyc='score';cpuH2H[1].cycT=0;cpuH2H[1].lapseCd=99;b2.bots[0].x=80;b2.bots[0].y=80;
  cpuBallUpdate(1/60);
  ok('cycle: a loaded CHAMPION drives toward the opponent gap (vx='+cpuH2H[1].inp.vx.toFixed(0)+' < 0)',cpuH2H[1].inp.vx<0);

  // ── Unit (v4.0 cycle): own-goal-safe — the cycle never aims a target at its own gap ──
  startMatch('normal',0,4); G=cpuBallGoals(1);
  clearBalls();
  const bo2=b2.bots[1];bo2.x=FW-B2M_WX-120;bo2.y=FH/2;bo2.h=Math.PI;bo2.load=[];
  balls[0].sc=false;balls[0].x=FW-B2M_WX-30;balls[0].y=FH/2;balls[0].vx=0;balls[0].vy=0; // a ball sitting at OUR own gap mouth
  cpuH2H[1].cyc='gather';cpuH2H[1].cycT=0;cpuH2H[1].lapseCd=99;b2.bots[0].x=80;b2.bots[0].y=80;
  cpuBallUpdate(1/60);
  ok('own-goal-safe: cycle target is never at our own gap (tx='+cpuH2H[1]._ctx.toFixed(0)+')',Math.abs(cpuH2H[1]._ctx-G.ox)>80);
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
function mkPad(i){return{connected:false,index:i,mapping:'standard',
  buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],
  vibrationActuator:{playEffect:(type,fx)=>{rumbles.push({pad:i,type,fx});return{catch:()=>{}};}}};}
global.PADS=[mkPad(0),mkPad(1)];
global.press=(p,i)=>{PADS[p].buttons[i].pressed=true;};
global.releaseAll=()=>{for(const pd of PADS)for(const b of pd.buttons)b.pressed=false;};
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
