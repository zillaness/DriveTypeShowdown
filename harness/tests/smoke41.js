const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);
  const startMatch=(mode,cpus,tier)=>{
    applyLayout('land2p');phase='p2claim';tour=null;
    m2.mode=mode;m2.set.cpus=cpus;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
    updateP2Ball(3.1);
  };
  const clearBalls=()=>{balls.forEach(b=>{b.sc=true;b.intaken=false;b.proj=false;b.golden=false;b.vx=0;b.vy=0;});};
  // a shot travelling +x (toward larger x) at 300px/s
  const mkShot=(x,y)=>{const b=balls[0];b.sc=false;b.intaken=false;b.golden=false;b.proj=true;b.x=x;b.y=y;b.vx=300;b.vy=0;b._dist=0;b.lastT=-1;return b;};

  startMatch('shooter',0,4);
  // park both bots out of the way; we hand-place per test
  b2.bots[0].x=80;b2.bots[0].y=80;b2.bots[0].h=0;b2.bots[0].intk=[];b2.bots[0]._inp={vx:0,vy:0};
  b2.bots[1].x=FW-80;b2.bots[1].y=FH-80;b2.bots[1].h=0;b2.bots[1].intk=[];b2.bots[1]._inp={vx:0,vy:0};
  b2.cpus=[];

  // 1) PARKED block -> dead stop. Bot faces +x (h=0) so its FRONT is +x; hit its BACK by approaching from -x is awkward,
  //    so face the bot AWAY (h=PI) => front is -x, the +x shot strikes its back/side => block path, not catch.
  clearBalls();
  b2.bots[0].x=400;b2.bots[0].y=300;b2.bots[0].h=0;b2.bots[0].intk=[];b2.bots[0]._inp={vx:0,vy:0}; // front faces +x; shot hits the -x BACK -> block, not catch
  let b=mkShot(400-(RR+BR-3),300); // overlapping, just inside the body on the -x (back) side
  let res=b2ProjBlock(b);
  ok('parked block: resolves + demotes projectile',res===true&&b.proj===false);
  ok('parked block: ball dead-stops (|v|~0, was 300) (|v|='+Math.hypot(b.vx,b.vy).toFixed(1)+')',Math.hypot(b.vx,b.vy)<1);

  // 2) MOVING blocker -> ball carries (push scales with blocker speed)
  clearBalls();
  b2.bots[0].x=400;b2.bots[0].y=300;b2.bots[0].h=0;b2.bots[0].intk=[];b2.bots[0]._inp={vx:-260,vy:0}; // front +x; -x back hit -> block
  b=mkShot(400-(RR+BR-3),300);
  res=b2ProjBlock(b);
  ok('moving block: ball gets a push (|v|='+Math.hypot(b.vx,b.vy).toFixed(0)+' > 0)',res===true&&b.proj===false&&Math.hypot(b.vx,b.vy)>50);
  ok('moving block: push points away from blocker (-x) (vx='+b.vx.toFixed(0)+')',b.vx<0);

  // 3) FRONT face + magazine room -> CATCH
  clearBalls();
  b2.bots[0].x=400;b2.bots[0].y=300;b2.bots[0].h=0;b2.bots[0].intk=[];b2.bots[0]._inp={vx:0,vy:0}; // front faces +x
  b=mkShot(400+(RR+BR-3),300); // strikes the +x front face
  const mag0=b2.bots[0].intk.length;
  res=b2ProjBlock(b);
  ok('front catch: intaken, added to magazine, not a projectile',res===true&&b.intaken===true&&b.proj===false&&b2.bots[0].intk.length===mag0+1&&b2.bots[0].intk.includes(b));

  // 4) FRONT face but magazine FULL (4) -> block, NOT catch
  clearBalls();
  b2.bots[0].x=400;b2.bots[0].y=300;b2.bots[0].h=0;b2.bots[0].intk=[{},{},{},{}];b2.bots[0]._inp={vx:0,vy:0};
  b=mkShot(400+(RR+BR-3),300);
  res=b2ProjBlock(b);
  ok('full magazine: front hit blocks instead of catching',res===true&&b.intaken!==true&&b.proj===false&&b2.bots[0].intk.length===4);

  // 5) ALLIANCE CPU blocks (no intk, no _inp) -> dead-stop block, never catches
  clearBalls();
  b2.bots[0].x=80;b2.bots[0].y=80;b2.bots[1].x=FW-80;b2.bots[1].y=FH-80;
  b2.cpus=[{al:0,x:500,y:300,h:0,role:'disrupt',roleT:999}];
  b=mkShot(500-(RR+BR-3),300);
  res=b2ProjBlock(b);
  ok('alliance CPU: blocks + dead-stops, never catches (|v|='+Math.hypot(b.vx,b.vy).toFixed(1)+')',res===true&&b.proj===false&&b.intaken!==true&&Math.hypot(b.vx,b.vy)<1);
  ok('alliance CPU block credits the CPU alliance (lastT='+b.lastT+')',b.lastT===0);
  b2.cpus=[];

  // 6) freshly fired shot does NOT self-collide: spawn sits at RR+14 (31) > RR+BR (26)
  clearBalls();
  b2.bots[0].x=400;b2.bots[0].y=300;b2.bots[0].h=0;b2.bots[0].intk=[];b2.bots[0]._inp={vx:0,vy:0};
  b2.bots[1].x=80;b2.bots[1].y=80;
  b=mkShot(400+(RR+14),300); // exactly the fire-spawn offset ahead of the shooter
  res=b2ProjBlock(b);
  ok('no self-collision at fire spawn (RR+14='+(RR+14)+' > RR+BR='+(RR+BR)+')',res===false&&b.proj===true);
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
