const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const T=(id,x,y)=>({identifier:id,clientX:x,clientY:y});
  const ts=t=>canvas._touchstart({preventDefault:()=>{},changedTouches:[t]});
  const tm=t=>canvas._touchmove({preventDefault:()=>{},changedTouches:[t]});
  const te=t=>canvas._touchend({preventDefault:()=>{},changedTouches:[t]});
  m2.drive[0]={kind:'main',idx:1,name:'Arcade',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'Arcade',c:'#0ff'};
  m2.sens=[1,1];m2.mode='shooter';m2.set.layout='shared';m2.set.cpus=0;m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
  applyLayout('land2p');phase='p2claim';m2.claim=[null,null];m2._gpPrev=[];
  // tap-to-claim both halves
  ts(T(1,320,504));te(T(1,320,504));ts(T(2,960,504));te(T(2,960,504));
  console.log('tap claim: red='+(m2.claim[0]&&m2.claim[0].type)+' blue='+(m2.claim[1]&&m2.claim[1].type)+' (expect touchL,touchR)');
  console.log('dedupe: re-tap left keeps slots: '+(ts(T(3,320,504)),te(T(3,320,504)),m2.claim[1]&&m2.claim[1].type==='touchR'));
  playerBind=[{type:'touchL'},{type:'touchR'}];
  startP2Ball();updateP2Ball(3.1);
  // stick: anchor left half, drag up → red gets forward input; blue unaffected
  ts(T(4,300,500));tm(T(4,300,500-JR));
  let i0,i1;
  withBot(0,b2.bots[0],()=>{i0=getInp(playerBind[0]);});
  withBot(1,b2.bots[1],()=>{i1=getInp(playerBind[1]);});
  console.log('touchL stick drives red: |v|='+(Math.hypot(i0.vx,i0.vy)>50)+' blue idle='+(Math.hypot(i1.vx,i1.vy)<1));
  // fire button: touch fire rect for side 1 → blue p2FireHeld
  const fr=p2FireRect(1);
  ts(T(5,fr.x+10,fr.y+10));
  console.log('fire: blue held='+p2FireHeld(1)+' red held='+p2FireHeld(0));
  te(T(5,fr.x+10,fr.y+10));
  console.log('fire release: blue held='+p2FireHeld(1));
  // fire rect touch must NOT spawn a stick (right zone stays inactive for driving)
  console.log('fire tap did not anchor a stick: '+(joys.R.active===false));
  // shooter actually shoots from touch fire: give red a ball, hold fire
  const sb=balls.find(x=>!x.sc);sb.intaken=true;sb.lastT=0;
  const bo=b2.bots[0];bo.intk.push(sb);bo.x=600;bo.y=300;bo.h=-Math.PI/2;bo.shootCd=0;
  const fl=p2FireRect(0);ts(T(6,fl.x+10,fl.y+10));
  updateP2Ball(1/60);
  console.log('touch fire shoots: proj='+sb.proj);
  te(T(6,fl.x+10,fl.y+10));te(T(4,300,448));
  // tap routing on menus: p2modes card tap → p2settings (v5.0 merged the drive step into the setup screen)
  p2QuitMatch(false);phase='p2modes';
  const r=p2ModeRect(2);ts(T(7,r.x+10,r.y+10));te(T(7,r.x+10,r.y+10));
  console.log('menu tap routes: phase='+phase+' (expect p2settings) mode='+m2.mode);
  // result tap: finish a race, tap CONTINUE region (nav rematch btn)
  phase='p2modes';tour=null;m2.mode='race';m2.set.course=0;m2.set.haz=false;playerBind=[{type:'kb'},{type:'kb'}];p2SeriesStart();
  startP2Race();updateP2Race(3.1);
  r2.bots[0].x=330;r2.bots[0].y=OC_FINISH_Y-2;updateP2Race(1/60);
  ts(T(8,CW/2,FY+FH/2+34+20));te(T(8,CW/2,FY+FH/2+34+20));
  console.log('result tap rematches: new race running='+(r2.result===null&&r2.t===0));
  // portrait overlay path runs without error
  window.innerWidth=400;window.innerHeight=800;
  p2Overlays();
  console.log('portrait overlay drawn ok (no crash)');
  window.innerWidth=1400;window.innerHeight=800;
  p2QuitMatch(false);console.log('done');
})();
`;
global.ctxState={depth:0};
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,
  addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:canvas.width||1280,height:canvas.height||720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
