const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0; const ok=(lab,cond)=>{console.log((cond?'PASS':'FAIL')+' — '+lab);cond?P++:F++;};
  const startMatch=(mode,cpus,tier)=>{
    applyLayout('land2p');phase='p2claim';tour=null;
    m2.mode=mode;m2.set.cpus=cpus;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
    updateP2Ball(3.1);
  };
  const clearBalls=()=>{balls.forEach(b=>{b.sc=true;b.intaken=false;b.proj=false;b.golden=false;b.vx=0;b.vy=0;});};
  // place one free ball toward the OPPONENT gap so the offense path has something to chase (only matters in the non-ease cases)
  const armOffense=(G)=>{clearBalls();const b=balls[0];b.sc=false;b.held=false;b.x=G.ex+220;b.y=FH/2;b.vx=0;b.vy=0;b2.bots[1].load=[];b2.bots[1].x=FW-B2M_WX-120;b2.bots[1].y=FH/2;b2.bots[1].h=Math.PI;b2.bots[0].x=80;b2.bots[0].y=80;};
  // neutralize the random lapse/unstick so we isolate the rubberband decision
  const calm=()=>{const br=cpuH2H[1];br.lapseCd=99;br.lapseT=0;br.escapeT2=0;br.stuckT2=0;br.cyc='gather';br.cycT=0;};
  const setScore=(player,cpu)=>{b2.score[0]=player;b2.score[1]=cpu;}; // slot0 = human, slot1 = CPU
  const run=()=>{calm();cpuBallUpdate(1/60);};
  const easedClearOfGap=(G)=>Math.abs(cpuH2H[1]._ctx-G.ox)>150 && Math.min(cpuH2H[1]._cty,FH-cpuH2H[1]._cty)<120;

  // ── ROOKIE: eases off while the player is NOT yet up ~4 (kids build a comfortable lead) ──
  startMatch('normal',0,0);playerBind[1].tier=0;let G=cpuBallGoals(1);
  armOffense(G);setScore(0,0);run();
  ok('ROOKIE eases off at even score (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj==='ease');
  ok('ROOKIE ease retreats clear of its own gap (does not block the player)',easedClearOfGap(G));
  armOffense(G);setScore(2,0);run(); // player up by 2 (cpuLead -2, still >= -4)
  ok('ROOKIE still eases when player is only up 2',cpuH2H[1].obj==='ease');
  armOffense(G);setScore(6,0);run(); // player up by 6 (cpuLead -6 < -4): ROOKIE plays
  ok('ROOKIE plays offense once the player is comfortably ahead (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj!=='ease');

  // ── VETERAN: eases off when IT goes up by 2+, keeps it back-and-forth ──
  startMatch('normal',0,1);playerBind[1].tier=1;G=cpuBallGoals(1);
  armOffense(G);setScore(0,2);run(); // CPU up by 2 -> ease
  ok('VETERAN eases when it is up by 2 (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj==='ease');
  ok('VETERAN ease retreats clear of its own gap',easedClearOfGap(G));
  armOffense(G);setScore(0,1);run(); // CPU up by only 1 -> plays
  ok('VETERAN plays offense when up by only 1 (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj!=='ease');
  armOffense(G);setScore(3,0);run(); // CPU behind -> plays (pushes to catch up)
  ok('VETERAN plays offense when behind',cpuH2H[1].obj!=='ease');

  // ── FINALIST: no hard ease (left alone pending playtest) even when way ahead ──
  startMatch('normal',0,2);playerBind[1].tier=2;G=cpuBallGoals(1);
  armOffense(G);setScore(0,10);run();
  ok('FINALIST never hard-eases even when far ahead (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj!=='ease');

  // ── CHAMPION: fixed top tier never eases ──
  startMatch('normal',0,4);playerBind[1].tier=4;G=cpuBallGoals(1);
  armOffense(G);setScore(0,10);run();
  ok('CHAMPION never eases (obj='+cpuH2H[1].obj+')',cpuH2H[1].obj!=='ease');

  console.log('--- rubberband: '+P+' pass, '+F+' fail ---');
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
