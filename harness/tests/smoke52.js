// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  applyLayout('land2p');phase='p2settings';tour=null;m2.mode='normal';m2._dp=0;m2.claim=[null,null];
  const rows=p2SettingsRows();
  const bi=rows.findIndex(r=>r.k==='ballN');
  ok('settings has a ballN option row',bi>=0);
  // gamepad-style cycle: ◀▶ advance/retreat the value with wraparound
  m2.set.ballN='auto';
  p2CycleSet(bi,1); ok('cycle +1 advances ballN auto -> '+m2.set.ballN,m2.set.ballN===rows[bi].vals[1]);
  p2CycleSet(bi,-1);ok('cycle -1 returns to auto ('+m2.set.ballN+')',m2.set.ballN==='auto');
  p2CycleSet(bi,-1);ok('cycle -1 from first wraps to last ('+m2.set.ballN+')',m2.set.ballN===rows[bi].vals[rows[bi].vals.length-1]);
  // v5.1.86: switching TEAM FORMAT defaults the alliance support bots — the MULTI grid IS the 3v3 (cpus→0); 1v1 keeps 2/side
  {const ti=p2SettingsRows().findIndex(r=>r.k==='tfmt');m2.set.tfmt='1v1';m2.set.cpus=2;
   p2CycleSet(ti,1);ok('TEAM FORMAT → MULTI defaults CPU BOTS PER SIDE to 0',m2.set.tfmt==='multi'&&m2.set.cpus===0);
   p2CycleSet(ti,1);ok('TEAM FORMAT → 1v1 restores 2 alliance bots/side',m2.set.tfmt==='1v1'&&m2.set.cpus===2);}
  // dropdown: click the row opens the list of all choices
  setDropdown=null;m2.set.ballN='auto';
  const rc=p2SetRowRect(bi);
  p2Click(rc.x+rc.w/2,rc.y+rc.h/2);
  ok('clicking a row opens its dropdown (setDropdown='+setDropdown+')',setDropdown===bi);
  const dr=p2SetDropRects();
  ok('dropdown lists every choice ('+dr.length+'=='+rows[bi].vals.length+')',dr.length===rows[bi].vals.length);
  // pick a specific choice (8) from the dropdown
  const pick=dr.find(it=>it.val===8);
  p2Click(pick.x+pick.w/2,pick.y+pick.h/2);
  ok('picking a dropdown choice sets the value (ballN='+m2.set.ballN+')',m2.set.ballN===8);
  ok('picking closes the dropdown',setDropdown===null);
  // reopen, then a click outside the list closes it without changing the value
  p2Click(rc.x+rc.w/2,rc.y+rc.h/2); ok('reopened',setDropdown===bi);
  p2Click(CW-20,60);
  ok('click outside closes the dropdown',setDropdown===null);
  ok('outside click did not change the value',m2.set.ballN===8);
  // v5.1.9: ALLIANCE CPU AI button opens the shared CPU-settings screen and returns to 2P settings
  setDropdown=null;phase='p2settings';m2.mode='normal';cpuSettingsReturn=null;
  ok('ALLIANCE CPU AI button shows in ball modes',p2ShowCpuCfg());
  const cb=p2CpuCfgBtnRect();p2Click(cb.x+cb.w/2,cb.y+cb.h/2);
  ok('clicking it opens the CPU-settings screen',phase==='cpuSettings'&&cpuSettingsReturn==='p2settings');
  handleCpuSettingsClick(4+28,8+14); // the Back button
  ok('Back from there returns to 2P MATCH SETTINGS',phase==='p2settings'&&cpuSettingsReturn===null);
  // v5.1.37: ALLIANCE CPU SPEED slider is tied to cpuSpeedMult (the same value as the CPU-AI 'SPEED' slider); range 0.25–3.0, default 100%
  phase='p2settings';m2.mode='normal';
  const srows=p2SettingsRows(),si=srows.findIndex(r=>r.k==='allySpd');
  ok('ALLIANCE CPU SPEED is a slider row',si>=0&&srows[si].slider===true);
  ok('ALLIANCE CPU SPEED is bound to cpuSpeedMult (get/set)',typeof srows[si].get==='function'&&typeof srows[si].set==='function');
  const sg=p2SetSliderGeom(si);
  p2SetSliderVal(si,(sg.x1+sg.x2)/2);ok('drag to mid sets ~mid of 0.25–3.0 into cpuSpeedMult ('+cpuSpeedMult+')',Math.abs(cpuSpeedMult-1.625)<=0.13);
  p2SetSliderVal(si,sg.x1-500);ok('drag past the left clamps to min ('+cpuSpeedMult+')',cpuSpeedMult===0.25);
  p2SetSliderVal(si,sg.x2+500);ok('drag past the right clamps to max ('+cpuSpeedMult+')',cpuSpeedMult===3.0);
  // the slider edits cpuSpeedMult, NOT m2.set.allySpd (the two sliders are the same value)
  cpuSpeedMult=2.0;ok('row.get() reflects cpuSpeedMult live',srows[si].get()===2.0);
  // clicking the row sets the value at the click x (does not open a dropdown)
  setDropdown=null;cpuSpeedMult=1.0;p2Click(sg.x1,p2SetRowRect(si).y+10);
  ok('clicking the slider row sets value and opens no dropdown',cpuSpeedMult===0.25&&setDropdown===null);
  m2.mode='race';ok('button is hidden in non-ball modes',!p2ShowCpuCfg());
  // v5.1.16: RESET DEFAULTS button restores M2_SET_DEFAULTS (+ v5.1.37: cpuSpeedMult back to 100%)
  phase='p2settings';m2.mode='normal';
  cpuSpeedMult=2.5;m2.set.timeSec=180;m2.set.ballN=12;m2.set.cpus=0;
  const xb=p2ResetBtnRect();p2Click(xb.x+xb.w/2,xb.y+xb.h/2);
  ok('RESET DEFAULTS restores cpuSpeedMult(100%)/timeSec/ballN/cpus',cpuSpeedMult===1.0&&m2.set.timeSec===M2_SET_DEFAULTS.timeSec&&m2.set.ballN===M2_SET_DEFAULTS.ballN&&m2.set.cpus===M2_SET_DEFAULTS.cpus);
  // v5.1.33: clicking the ◀ / ▶ glyphs on a row steps the value; the body still opens the dropdown
  phase='p2settings';m2.mode='normal';setDropdown=null;
  {const rws=p2SettingsRows(),ci=rws.findIndex(r=>r.k==='cpus'),rc=p2SetRowRect(ci);m2.set.cpus=0;
   p2Click(rc.x+rc.w-16,rc.y+rc.h/2); ok('▶ click steps the setting up ('+m2.set.cpus+')',m2.set.cpus===1);
   p2Click(rc.x+rc.w-70,rc.y+rc.h/2); ok('◀ click steps the setting down ('+m2.set.cpus+')',m2.set.cpus===0);
   p2Click(rc.x+rc.w/2,rc.y+rc.h/2);  ok('row-body click still opens the dropdown',setDropdown===ci);setDropdown=null;}

  // ── v5.1.92 SPLASH front door: SINGLE PLAYER vs MULTIPLAYER + global SETTINGS ──
  {applyLayout('legacy');phase='splash';paused=false;
   const R=splashRects();
   ok('splashRects sp/mp/set all sit inside the canvas',[R.sp,R.mp,R.set].every(r=>r.x>=0&&r.x+r.w<=CW&&r.y>=0&&r.y+r.h<=CH));
   ok('the three splash zones do not overlap vertically',R.sp.y+R.sp.h<=R.mp.y&&R.mp.y+R.mp.h<=R.set.y);
   let sThrew=false;try{drawSplash();}catch(e){sThrew=true;console.log('   splash draw err:',e.message);}
   ok('drawSplash renders without throwing',!sThrew);
   // SINGLE PLAYER → the portrait drive menu
   phase='splash';click(R.sp.x+R.sp.w/2,R.sp.y+R.sp.h/2);
   ok('clicking SINGLE PLAYER → the portrait menu (legacy layout)',phase==='menu'&&curLayout==='legacy');
   // MULTIPLAYER → landscape head-to-head
   applyLayout('legacy');phase='splash';click(R.mp.x+R.mp.w/2,R.mp.y+R.mp.h/2);
   ok('clicking MULTIPLAYER → p2 head-to-head (landscape)',phase==='p2modes'&&curLayout==='land2p');
   // SETTINGS → global settings, remembering the splash as its origin
   applyLayout('legacy');phase='splash';click(R.set.x+R.set.w/2,R.set.y+R.set.h/2);
   ok('clicking SETTINGS → global settings, origin=splash',phase==='settings'&&settingsReturn==='splash');
   settingsBack();
   ok('Back from settings returns to the SPLASH',phase==='splash');
   // multiplayer Back lands on the splash hub
   applyLayout('legacy');phase='splash';click(R.mp.x+R.mp.w/2,R.mp.y+R.mp.h/2);p2Exit();
   ok('p2Exit returns to the SPLASH hub',phase==='splash');}

  // v5.1.220 MAP GALLERY now serves BOTH modes (was RoboRumble-only)
  {setDropdown=null;m2.mode='battlebots';phase='p2settings';m2.set.map=0;
   const bbTiles=bbMapTiles();
   ok('RoboRumble gallery lists every arena + RANDOM + NEW ('+bbTiles.length+')',bbTiles.length===TF2_MAPS.length+customMaps.length+2&&bbTiles.some(t=>t.map==='rand')&&bbTiles.some(t=>t.map==='new'));
   m2.mode='tankfight';
   const tfTiles=bbMapTiles();
   ok('Tank Fight gallery lists only the 4 base arenas, no RANDOM/hazard ('+tfTiles.length+')',tfTiles.length===4&&!tfTiles.some(t=>t.map==='rand'));
   // Tank Fight MAP row click now opens the full-screen gallery (not a dropdown)
   m2.mode='tankfight';phase='p2settings';setDropdown=null;
   const mi=p2SettingsRows().findIndex(r=>r.k==='map');const mrc=p2SetRowRect(mi);
   p2Click(mrc.x+mrc.w*0.35,mrc.y+mrc.h/2);
   ok('Tank Fight MAP row opens the map gallery (phase='+phase+')',phase==='p2bbmap');
   // picking a tile sets m2.set.map and returns to settings
   const tgt=bbMapTiles().find(t=>t.map===2);
   bbMapPickerClick(tgt.x+tgt.w/2,tgt.y+tgt.h/2);
   ok('picking a gallery tile sets the map + returns to settings',m2.set.map===2&&phase==='p2settings');}

  console.log('--- settings-options: '+P+' pass, '+F+' fail ---');
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
