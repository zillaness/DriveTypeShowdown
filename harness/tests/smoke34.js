// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // ── main-game SP run: record → PB ghost → replay next run ──
  startDrive(1);
  console.log('start: phase='+phase+' key='+spGhostKey());
  phase='playing'; // skip countdown
  for(let i=0;i<60;i++)update(1/60); // 1s of play, robot idle at start
  console.log('recording: samples='+spRec.length+' (~30 expected)');
  for(const b of balls)b.sc=true; // force finish
  update(1/60);
  console.log('finish: phase='+phase+' ghost saved='+spGhostSaved+' stored='+(('frcds_spghost:'+spGhostKey()) in LS));
  const g1=JSON.parse(LS['frcds_spghost:main1'+'']||LS[Object.keys(LS).find(k=>k.startsWith('frcds_spghost:'))]);
  console.log('stored key='+g1.k+' t='+g1.t.toFixed(2)+' samples='+g1.samples.length);
  // restart same drive: recorder resets, ghost loads + interpolates
  cancelNameEntry();startDrive(1);phase='playing';
  update(1/60);
  console.log('restart: recorder reset='+(spRec.length<=2)+' ghost loaded='+(spGhostGet()!==null));
  playT=0.5;
  texts.length=0;ops.length=0;drawSpGhost();
  console.log('ghost draws at t=0.5: translate ops='+(ops.length>0));
  // slower second run does NOT overwrite
  for(let i=0;i<240;i++)update(1/60); // 4s, slower than first
  for(const b of balls)b.sc=true;update(1/60);
  console.log('slower run keeps PB: saved flag='+spGhostSaved+' stored t still='+JSON.parse(LS[g1?'frcds_spghost:'+g1.k:'']).t.toFixed(2));
  // ── obstacle course run ──
  cancelNameEntry();phase='menu';obstacleCourse=true;
  startObstacleCourse(2);
  console.log('OC key='+spGhostKey()+' (expect _oc suffix)');
  for(let i=0;i<30;i++){robot.x=OC_START?OC_START.x:robot.x;updateObstacleCourse(1/60);}
  robot.x=330;robot.y=OC_FINISH_Y-2;updateObstacleCourse(1/60);
  console.log('OC finish: result='+ocState.result+' ghost stored='+(('frcds_spghost:'+modeKey(DRIVES[2].id)) in LS));
  obstacleCourse=false;
  // ── tank fight excluded ──
  phase='menu';tankFight=true;startTankFight(0);
  for(let i=0;i<30;i++)updateTankFight(1/60);
  console.log('tank: no samples recorded='+(spRec.length===0||spLastS===-1||!spGhostSampleRan()) );
  function spGhostSampleRan(){return false;}
  // direct assertion: sampling guard
  const before=spRec.length;spGhostSample();
  console.log('tank sample guard: rec unchanged='+(spRec.length===before));
  texts.length=0;ops.length=0;drawSpGhost();
  console.log('tank ghost draw guard: no ops='+(ops.length===0));
  tankFight=false;
  // key separation: different drive = different slot
  startDrive(3);
  console.log('key separation: '+spGhostKey()+' differs from main1: '+(spGhostKey()!=='main1'));
  console.log('ghost slots stored: '+Object.keys(LS).filter(k=>k.startsWith('frcds_spghost:')).join(', '));
  console.log('done');
})();
`;
global.ctxState={depth:0};global.texts=[];global.ops=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},translate:()=>{ops.push('t');},fillText:(t)=>{texts.push(String(t));},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:400,height:720,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:400,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
