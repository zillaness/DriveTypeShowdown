// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  m2.mode='race';m2.set.course=1;m2.set.haz=true;m2.set.bestOf=1;
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];p2SeriesStart();
  startP2Race();updateP2Race(3.1);
  // determinism: hazard state identical for equal t
  const s1=r2SweepSeg(R2_COURSES[1].haz[0],7.31),s2=r2SweepSeg(R2_COURSES[1].haz[0],7.31);
  const m1=r2HazAt(R2_COURSES[2].haz[0],4.2),m2x=r2HazAt(R2_COURSES[2].haz[0],4.2);
  console.log('deterministic: sweep '+(s1.x2===s2.x2)+' mw '+(m1.x===m2x.x));
  // sweeper hit resets
  const b=r2.bots[0];const hz=R2_COURSES[1].haz[0];
  r2.t=0; const seg=r2SweepSeg(hz,0);
  b.x=(seg.x1+seg.x2)/2;b.y=(seg.y1+seg.y2)/2;
  const r0=b.resets;updateP2Race(1/60);
  console.log('sweeper hit resets: '+(b.resets===r0+1)+' back at start='+(b.y>560));
  // haz off → hazard predicate goes quiet (tested directly; the spot also overlaps a static gate)
  robot={x:(seg.x1+seg.x2)/2,y:(seg.y1+seg.y2)/2,h:0};r2.t=0;
  m2.set.haz=true;const hitOn=r2HitsHaz(0);
  m2.set.haz=false;const hitOff=r2HitsHaz(0);
  console.log('haz predicate: on='+hitOn+' off='+hitOff+' (expect true,false); static obs there='+r2HitsObs());
  m2.set.haz=true;
  // piston run: custom obs collide, OC_OBS does NOT apply
  p2QuitMatch(false);m2.set.course=2;p2SeriesStart();startP2Race();updateP2Race(3.1);
  const c=r2.bots[1];const ob=R2_COURSES[2].obs[2]; // {x:140,y:300,w:240,h:14}
  c.x=ob.x+20;c.y=ob.y+7;const r2c=c.resets;updateP2Race(1/60);
  console.log('piston custom obs resets: '+(c.resets===r2c+1));
  // OC_OBS gate1 spot {x:0,y:510,w:228} is NOT an obstacle on piston run
  c.x=100;c.y=517;const r3=c.resets;updateP2Race(1/60);
  console.log('SP obs absent on custom course: '+(c.resets===r3));
  // piston wall hit at its extreme
  r2.t=R2_COURSES[2].haz[0].per/4; // sin=1 → max offset
  const pw=r2HazAt(R2_COURSES[2].haz[0],r2.t);
  c.x=pw.x+pw.w/2;c.y=pw.y+pw.h/2;const r4=c.resets;updateP2Race(1/60);
  console.log('piston wall hit resets: '+(c.resets===r4+1));
  // course 0 regression: finish works
  p2QuitMatch(false);m2.set.course=0;m2.set.haz=false;p2SeriesStart();startP2Race();updateP2Race(3.1);
  r2.bots[0].x=190;r2.bots[0].y=OC_FINISH_Y-2;updateP2Race(1/60);
  console.log('classic finish: result='+r2.result+' (expect 0)');
  drawP2Race();p2QuitMatch(false);console.log('done');
})();
`;
global.ctxState={depth:0};
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},addEventListener:()=>{},style:{},width:0,height:0};
global.window={addEventListener:()=>{},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message);process.exit(1);}
