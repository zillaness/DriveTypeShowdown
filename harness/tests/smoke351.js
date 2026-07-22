// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // seed: a PB + ghost + toggle pref + an orphaned 2P-era key
  startDrive(1);phase='playing';
  for(let i=0;i<30;i++)update(1/60);
  for(const b of balls)b.sc=true;update(1/60);
  cancelNameEntry();
  LS['frcds_ghost:0:1:main1']='{"k":"x","t":1,"samples":[]}';
  LS['frcds_spgon']='0';
  console.log('seeded: best='+Object.keys(best).length+' spghost='+(('frcds_spghost:arcade') in LS)+' orphan='+(('frcds_ghost:0:1:main1') in LS));
  // CLEAR ALL: first tap arms, second wipes (find the click handler path)
  phase='highscores';
  hsClearConfirm=false;
  click(CW-45,22); // arm
  console.log('armed: '+hsClearConfirm);
  click(CW-45,22); // confirm
  console.log('after clear: best='+Object.keys(best).length+' bestNames='+Object.keys(bestNames).length);
  console.log('ghosts purged: sp='+(!(('frcds_spghost:arcade') in LS))+' orphan='+(!(('frcds_ghost:0:1:main1') in LS)));
  console.log('toggle pref survives: '+(LS['frcds_spgon']==='0'));
  console.log('in-memory cache reset: '+(_spgK===null&&spRec.length===0));
  // no stale ghost draws after clear
  startDrive(1);phase='playing';update(1/60);
  ops.length=0;spGhostOn=true;drawSpGhost();
  console.log('no ghost after clear: '+(ops.length===0));
  console.log('done');
})();
`;
global.ctxState={depth:0};global.texts=[];global.ops=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},translate:()=>{ops.push('t');},fillText:()=>{},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:400,height:720,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:400,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
Object.defineProperty(global.localStorage,'length',{get:()=>Object.keys(LS).length,configurable:true});
global.localStorage.key=i=>Object.keys(LS)[i];
// Object.keys(localStorage) in the game iterates the storage object's own keys — proxy it:
global.localStorage=new Proxy(global.localStorage,{ownKeys:()=>Object.keys(LS),getOwnPropertyDescriptor:(t,k)=>(k in LS?{enumerable:true,configurable:true,value:LS[k]}:Object.getOwnPropertyDescriptor(t,k))});
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
