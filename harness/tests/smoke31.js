// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // 1. mirrored is the default
  console.log('default layout: '+m2.set.layout+' (expect mirrored); settings vals[0]='+p2SettingsRowsFor());
  function p2SettingsRowsFor(){const sm=m2.mode;m2.mode='normal';const v=p2SettingsRows().find(r=>r.k==='layout').vals[0];m2.mode=sm;return v;}
  // 2. mirrored field: no SP zone labels; shared still has them
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];
  m2.mode='normal';m2.set.cpus=0;m2.set.bestOf=1;p2SeriesStart();
  startP2Ball();updateP2Ball(3.1);
  texts.length=0;drawP2Ball();
  const mirTxt=texts.join('|');
  console.log('mirrored hides SP zones: scoringZone='+(mirTxt.indexOf('SCORING ZONE')===-1)+' pushFrom='+(mirTxt.indexOf('PUSH FROM HERE')===-1)+' hasDefends='+(mirTxt.indexOf('RED DEFENDS')!==-1));
  p2QuitMatch(false);m2.set.layout='shared';startP2Ball();updateP2Ball(3.1);
  texts.length=0;drawP2Ball();
  console.log('shared keeps SP zones: '+(texts.join('|').indexOf('SCORING ZONE')!==-1));
  p2QuitMatch(false);m2.set.layout='mirrored';
  // 3. gamepad nav: simulate a pad on p2modes
  phase='p2modes';applyLayout('land2p');tour=null;
  PAD.connected=true;
  // v5.1 spatial nav: the 4 mode cards are one row, the tournament bar sits below them
  p2GpIdx=0;p2GpPhase=phase;
  press(15);updateGamepad();release();updateGamepad(); // dpad RIGHT → next mode card (idx 1)
  console.log('gp move right: idx='+p2GpIdx+' (expect 1)');
  press(14);updateGamepad();release();updateGamepad(); // LEFT → back to 0
  console.log('gp move left: idx='+p2GpIdx+' (expect 0)');
  press(0);updateGamepad();release();updateGamepad();  // A on mode card 0 → match settings (v5.0 merged flow)
  console.log('gp activate: phase='+phase+' (expect p2settings) mode='+m2.mode);
  press(1);updateGamepad();release();updateGamepad();  // B → back
  console.log('gp back: phase='+phase+' (expect p2modes)');
  // tournament bar reachable by pressing DOWN from a mode card (items: 4 cards + tour bar + back = 6)
  phase='p2modes';p2GpIdx=0;p2GpPhase=phase;
  press(13);updateGamepad();release();updateGamepad(); // DOWN from mode 0 → tournament bar (idx 4)
  console.log('gp down reaches tournament bar: idx='+p2GpIdx+' (expect 4)');
  press(0);updateGamepad();release();updateGamepad();
  console.log('gp activate tournament: phase='+phase+' (expect p2tnames)');
  p2Back();
  // 4. claim: pad button claims; START launches when both claimed
  m2.mode='normal';phase='p2claim';m2.claim=[null,null];m2._gpPrev=[];
  press(0);updateGamepad();p2ClaimGp();release();updateGamepad();
  console.log('pad claimed a side: '+(m2.claim[0]&&m2.claim[0].type==='gp'));
  m2.claim[1]={type:'kb'};
  press(9);updateGamepad();release();updateGamepad();
  console.log('pad START launches: phase='+phase+' (expect p2ball)');
  // result screen: A presses CONTINUE/rematch via nav cursor
  b2.result=0;b2.repd=true;
  p2GpPhase='';press(0);updateGamepad();release();updateGamepad();
  console.log('result A = rematch: result cleared='+(b2.result===null)+' phase='+phase);
  p2Overlays(); // cursor highlight path runs
  p2QuitMatch(false);p2Exit();console.log('done');
})();
`;
global.ctxState={depth:0};
global.texts=[];
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    fillText:(t)=>{texts.push(String(t));},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,
  addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:canvas.width||1280,height:canvas.height||720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=400);})()};
global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
global.PAD={connected:false,buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],index:0,mapping:'standard'};
global.press=i=>{PAD.buttons[i].pressed=true;};
global.release=()=>{for(const b of PAD.buttons)b.pressed=false;};
const NAV={getGamepads:()=>PAD.connected?[PAD]:[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
