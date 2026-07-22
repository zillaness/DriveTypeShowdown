// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  const sv=expFeatures;expFeatures=true;

  // ── 1. mode registration + label safety ──
  ok('BALLOON BATTLE is a gated tile (in the merged list, not the classic 5)',M2_MODES_MERGED.some(m=>m.id==='balloon')&&!M2_MODES.some(m=>m.id==='balloon'));
  ok('m2ModeName resolves balloon without crashing the label sites',m2ModeName('balloon')==='BALLOON BATTLE');
  m2.mode='balloon';ok('bbBalloon + bbEngineMode true in balloon',bbBalloon()===true&&bbEngineMode()===true);
  m2.mode='battlebots';ok('bbEngineMode also true for RoboRumble, bbBalloon false',bbEngineMode()===true&&bbBalloon()===false);

  // ── 2. settings branch: elimination, no weapon/armor rows ──
  m2.mode='balloon';{const r=p2SettingsRows();const keys=r.map(x=>x.k);
   ok('balloon settings = TEAM FORMAT + BEST OF + ARENA + LIVES (no bbmode/weapon)',keys.length===4&&keys.includes('tfmt')&&keys.includes('bestOf')&&keys.includes('map')&&keys.includes('bblives')&&!keys.includes('bbmode'));}

  // ── 3. start a balloon match: every bot gets balloons + spikes, no weapon ──
  const startBAL=(map)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='balloon';
    m2.set.bestOf=1;m2.set.map=map||0;m2.set.tfmt='1v1';m2.set.bblives=1;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:2}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2BB();};
  startBAL(0);
  ok('balloon match starts on the bb2 engine (phase p2bb, 2 bots)',phase==='p2bb'&&!!bb2&&bb2.bots.length===2);
  ok('every bot has 3 rear balloons + a spike bank + NO weapon',bb2.bots.every(b=>b.balloons&&b.balloons.length===3&&bbBalloonLive(b)===3&&b.spikeHp===BAL.spikeHp&&b.ld.weapon==='none'));

  // ── 4. bbBalloonLive counts live balloons ──
  {const b=bb2.bots[0];b.balloons[1].pop=true;ok('bbBalloonLive drops as balloons pop',bbBalloonLive(b)===2);b.balloons[1].pop=false;}

  // ── 5. the POP mechanic: front spike + force + reach pops a rear balloon + drains the spike ──
  {const A=bb2.bots[0],C=bb2.bots[1];bbBalloonInit(A);bbBalloonInit(C);
   C.x=300;C.y=300;C.h=0;                                   // victim faces east → its REAR balloons point west
   A.x=300-RR*2.0;A.y=300;A.h=0;                            // attacker just west, facing east into the rear balloons
   A._inp={vx:130,vy:0,vr:0};C._inp={vx:0,vy:0,vr:0};       // hard closing speed (force)
   const live0=bbBalloonLive(C),sp0=A.spikeHp;
   const popped=bbBalloonPop(A,C);
   ok('a forceful front-spike hit pops a rear balloon',popped===true&&bbBalloonLive(C)===live0-1);
   ok('popping drains a front spike',A.spikeHp===sp0-1);}

  // ── 6. no force = no pop (a gentle bump is safe) ──
  {const A=bb2.bots[0],C=bb2.bots[1];bbBalloonInit(A);bbBalloonInit(C);
   C.x=300;C.y=300;C.h=0;A.x=300-RR*2.0;A.y=300;A.h=0;
   A._inp={vx:5,vy:0,vr:0};C._inp={vx:0,vy:0,vr:0};         // barely moving → below popThresh
   ok('a gentle bump does NOT pop a balloon',bbBalloonPop(A,C)===false&&bbBalloonLive(C)===3);}

  // ── 7. facing the wrong way = no pop (must line up your spikes) ──
  {const A=bb2.bots[0],C=bb2.bots[1];bbBalloonInit(A);bbBalloonInit(C);
   C.x=300;C.y=300;C.h=0;A.x=300-RR*2.0;A.y=300;A.h=Math.PI; // A faces AWAY (west)
   A._inp={vx:130,vy:0,vr:0};C._inp={vx:0,vy:0,vr:0};
   ok('spikes pointing away cannot pop',bbBalloonPop(A,C)===false);}

  // ── 8. elimination: last balloon popped → the bot is OUT (bbKill) ──
  {const A=bb2.bots[0],C=bb2.bots[1];bbBalloonInit(A);bbBalloonInit(C);
   C.balloons[0].pop=true;C.balloons[1].pop=true;              // C down to its last balloon
   C.x=300;C.y=300;C.h=0;A.x=300-RR*2.0;A.y=300;A.h=0;A._inp={vx:130,vy:0,vr:0};C._inp={vx:0,vy:0,vr:0};
   C.lives=0;bb2.result=null;
   const dx=A.x-C.x,dy=A.y-C.y,d=Math.hypot(dx,dy)||1;
   bbBalloonContact(A,C,0,1,dx/d,dy/d);
   ok('popping the last balloon eliminates the bot',bbBalloonLive(C)===0&&C.dead===true);}

  // ── 9. render no-throw (mock canvas → the draw must RUN, incl. popped balloons + spikes) ──
  {startBAL(0);bb2.bots[0].balloons[0].pop=true;bb2.bots[0].spikeHp=0; // exercise the popped-X + broken-spike branches
   let threw=false;try{drawBB();}catch(e){threw=true;console.log('   drawBB err:',e.message,e.stack&&e.stack.split('\\n')[1]);}
   ok('drawBB renders balloons + spikes without throwing',!threw);}

  // ── 10. respawn (lives>1) refits fresh balloons + spikes ──
  {startBAL(0);const b=bb2.bots[0];b.balloons.forEach(q=>q.pop=true);b.spikeHp=0;b.dead=true;b.lives=2;b.respawnT=0.001;
   bbModeUpdate(0.02); // ticks the respawn → revive
   ok('a respawned bot gets fresh balloons + spikes',!b.dead&&bbBalloonLive(b)===3&&b.spikeHp===BAL.spikeHp);}

  // ── 11. gate: the tile is hidden when EXPERIMENTAL FEATURES is off ──
  expFeatures=false;ok('gate OFF: BALLOON BATTLE is not in the tile list',!m2Modes().some(m=>m.id==='balloon'));
  expFeatures=true;ok('gate ON: BALLOON BATTLE appears as the 6th tile',m2Modes().some(m=>m.id==='balloon')&&m2Modes().length===5);

  expFeatures=sv;
  console.log('--- balloon battle: '+P+' pass, '+F+' fail ---');
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
