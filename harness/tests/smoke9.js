// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];
  // timed countdown + OT
  m2.mode='normal';m2.set.layout='shared';m2.set.cpus=0;m2.set.format='timed';m2.set.timeSec=60;m2.set.bestOf=3;m2.set.contact='full';
  p2SeriesStart();startP2Ball();updateP2Ball(3.1);
  b2.t=59.95;updateP2Ball(0.1); // tie 0-0 at expiry
  console.log('OT on tie: sudden='+b2.sudden+' golden present='+balls.some(b=>b.golden&&!b.sc)+' field cleared='+balls.filter(b=>!b.sc&&!b.golden).length);
  const g=balls.find(b=>b.golden);g.lastT=1;g.x=600;g.y=130;g.vy=-700;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  console.log('OT golden: result='+b2.result+' (expect 1) series w='+p2Series.w+' done='+p2Series.done+' round dots ok='+(p2Series.w[1]===1&&p2Series.done===null));
  // ball recycle
  p2Series.round++;startP2Ball();updateP2Ball(3.1);
  const rb=balls[0];rb.lastT=0;rb.x=600;rb.y=130;rb.vy=-700;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  const wasScored=rb.sc;
  for(let i=0;i<100;i++)updateP2Ball(1/60); // 1.67s
  console.log('recycle: scored='+wasScored+' respawned='+(!rb.sc&&Math.abs(rb.x-B2_BALL_STARTS[0].x)<1)+' score kept='+b2.score[0]);
  // race-to-N
  p2QuitMatch(false);m2.set.format='goals';m2.set.goalN=5;p2SeriesStart();startP2Ball();updateP2Ball(3.1);
  b2.score[0]=4;const nb=balls[1];nb.lastT=0;nb.x=600;nb.y=130;nb.vy=-700;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  console.log('race to 5: score='+b2.score[0]+' result='+b2.result+' (expect 5,0)');
  // pin penalty
  p2QuitMatch(false);m2.set.format='timed';m2.set.contact='pin';m2.set.bestOf=1;p2SeriesStart();
  console.log('bestOf 1 → series null: '+(p2Series===null));
  startP2Ball();updateP2Ball(3.1);
  const a=b2.bots[0],c=b2.bots[1];
  a.x=30;a.y=300;c.x=30+RR*2-1;c.y=300; // red pinned on left boundary
  let fired=false;
  for(let i=0;i<200;i++){a.x=30;a.y=300;c.x=30+RR*2-1;c.y=300;updateP2Ball(1/60);if(b2.toast){fired=true;break;}}
  console.log('pin penalty fired: '+fired+' toast='+(b2.toast&&b2.toast.txt));
  const freed=balls.find(b=>b.lastT===0&&!b.sc);
  console.log('free ball to RED, spotted off-wall: '+(freed&&freed.x>40));
  // series across tank
  p2QuitMatch(false);m2.mode='tankfight';m2.set.bestOf=3;m2.set.lives=1;p2SeriesStart();
  startP2Tank();updateP2Tank(3.1);
  tf2.result=0;updateP2Tank(1/60);
  console.log('tank series report: w='+p2Series.w+' (expect 1,0)');
  p2QuitMatch(false);console.log('done');
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
