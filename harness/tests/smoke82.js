const fs=require('fs');
let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  m2.mode='normal';m2.set.layout='mirrored';m2.set.cpus=2;
  m2.drive[0]={kind:'main',idx:1,name:'Arcade',c:'#0ff'};
  m2.drive[1]={kind:'main',idx:1,name:'Arcade',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];
  startP2Ball();
  console.log('spawns: red x='+b2.bots[0].x+' (left) blue x='+b2.bots[1].x+' (right) facing: red h='+b2.bots[0].h+' blue h='+b2.bots[1].h.toFixed(2));
  updateP2Ball(3.1);
  // own-goal: red-touched ball through LEFT gap (red's own goal) credits BLUE
  const b=balls.find(x=>!x.sc);b.lastT=0;b.x=140;b.y=FH/2;b.vx=-700;b.vy=0;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  console.log('own-goal left: blue='+b2.score[1]+' red='+b2.score[0]+' (expect 1-0)');
  // right gap credits red
  const b2b=balls.find(x=>!x.sc);b2b.lastT=1;b2b.x=FW-140;b2b.y=FH/2;b2b.vx=700;b2b.vy=0;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  console.log('right gap: red='+b2.score[0]+' (expect 1)');
  // walls reject off-gap (y=100 is outside 245..385): both directions
  const b4=balls.find(x=>!x.sc);b4.x=300;b4.y=100;b4.vx=-300;b4.vy=0;
  for(let i=0;i<40;i++)updateP2Ball(1/60);
  const leftBounced=!b4.sc&&b4.x>B2M_WX;
  b4.vx=300;b4.vy=0;
  for(let i=0;i<160;i++)updateP2Ball(1/60);
  console.log('off-gap walls reject: left='+leftBounced+' right='+(!b4.sc&&b4.x<FW-B2M_WX));
  // no top wall in mirrored: ball can sit at y=60 across x=600 (former WALL_Y=112 band) freely
  const b5=balls.find(x=>!x.sc);b5.x=600;b5.y=120;b5.vx=0;b5.vy=-700;
  for(let i=0;i<50;i++)updateP2Ball(1/60);
  console.log('no SP top wall: ball reached y='+b5.y.toFixed(0)+' (expect ~9 = boundary, not 112-stop) sc='+b5.sc+' (x=600 is inside the old shared gap — sc must stay false)');
  // guards hover at goal mouths (role pinned to avoid churn)
  const g0=b2.cpus.find(c=>c.al===0),g1=b2.cpus.find(c=>c.al===1);
  g0.role='guard';g0.roleT=999;g1.role='guard';g1.roleT=999;
  for(let i=0;i<300;i++)updateP2Ball(1/60);
  console.log('red guard near left goal: x='+g0.x.toFixed(0)+' (expect ~154)');
  console.log('blue guard near right goal: x='+g1.x.toFixed(0)+' (expect ~1046)');
  console.log('cpus in bounds: '+b2.cpus.every(c=>c.x>=RR&&c.x<=FW-RR&&c.y>=RR&&c.y<=FH-RR));
  // shooter mirrored: red shoots RIGHT goal → red point; red shoots own LEFT goal → blue point
  p2QuitMatch(false);
  m2.mode='shooter';m2.set.cpus=0;
  startP2Ball();updateP2Ball(3.1);
  let sb=balls.find(x=>!x.sc);sb.intaken=true;sb.lastT=0;
  let bo=b2.bots[0];bo.intk.push(sb);bo.x=FW-B2M_WX-80;bo.y=FH/2;bo.h=0;bo.shootCd=0;
  b2.bots[1].x=80;b2.bots[1].y=80; // v3.10.1: park the idle defender out of the shot lane — shots now collide with robot bodies (smoke41 owns blocking); this case isolates far-goal scoring
  kbSpaceHeld=true;updateP2Ball(1/60);kbSpaceHeld=false;
  for(let i=0;i<40;i++)updateP2Ball(1/60);
  console.log('shooter far goal: red='+b2.score[0]+' (expect 1)');
  sb=balls.find(x=>!x.sc&&!x.intaken&&!x.proj);sb.intaken=true;sb.lastT=0;
  bo.intk.push(sb);bo.x=B2M_WX+80;bo.y=FH/2;bo.h=Math.PI;bo.shootCd=0;
  kbSpaceHeld=true;updateP2Ball(1/60);kbSpaceHeld=false;
  for(let i=0;i<40;i++)updateP2Ball(1/60);
  console.log('shooter own goal: blue credited='+b2.score[1]+' (expect 1)');
  // shared regression untouched
  p2QuitMatch(false);m2.set.layout='shared';m2.mode='normal';
  startP2Ball();updateP2Ball(3.1);
  const rb=balls.find(x=>!x.sc);rb.lastT=0;rb.x=600;rb.y=130;rb.vy=-300;
  for(let i=0;i<30;i++)updateP2Ball(1/60);
  console.log('shared regression: red goal='+b2.score[0]+' (expect 1)');
  drawP2Ball();p2QuitMatch(false);console.log('done');
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
