const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  const baseSet=()=>{m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.ballN='auto';};
  const startBall=(mode)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode=mode;baseSet();
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Ball(3.1);};
  const startTank=()=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';baseSet();m2.set.lives=1;m2.set.map=0;m2.set.hpk=false;m2.set.pow=false;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Tank(3.1);};

  // ── EXTRA BALLS: the slider multiplies the balls in play ──
  ballMult=1;startBall('normal');const base=balls.length;
  ballMult=3;startBall('normal');const x3=balls.length;
  ok('EXTRA BALLS: 3x multiplies the ball count (x1='+base+' x3='+x3+')',x3>=base*2.5);
  ballMult=1;

  // ── MACHINE GUN (shooter): big hopper + rapid fire ──
  machineGun=true;startBall('shooter');
  let bo=b2.bots[0];bo.x=FW/2;bo.y=FH/2;bo.h=0;bo.stunT=0;bo.intk=[];
  for(let i=0;i<8&&i<balls.length;i++){const b=balls[i];b.sc=false;b.proj=false;b.held=false;b.intaken=true;b.lastT=0;bo.intk.push(b);}
  ok('MACHINE GUN shooter: hopper holds more than 4 ('+bo.intk.length+')',bo.intk.length>4);
  bo.shootCd=0;kbSpaceHeld=true;updateP2Ball(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN shooter: rapid shootCd after firing ('+bo.shootCd.toFixed(2)+')',bo.shootCd>0&&bo.shootCd<=0.06);
  machineGun=false;

  // ── MACHINE GUN (tank): rapid reload after a shot ──
  machineGun=true;startTank();
  const t=tf2.tanks[0];t.reload=0;t.stunT=0;kbSpaceHeld=true;updateP2Tank(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN tank: rapid reload after firing ('+t.reload.toFixed(2)+')',t.reload>0&&t.reload<=0.06);
  machineGun=false;

  // ── ULTIMATE ASCENT: a 2P-shooter shot ricochets off walls and stays alive (stacks with everything) ──
  frisbeeMode=true;bouncyMode=true;startBall('shooter'); // stack two cheats
  const b=balls.find(x=>!x.sc&&!x.intaken&&!x.proj&&!x.held);
  b.proj=true;b.sc=false;b.intaken=false;b.held=false;b.lastT=0;b.x=FW/2;b.y=b2mGT()-20;b.vx=300;b.vy=0;b._dist=0;
  const park=()=>{b2.bots[0].x=20;b2.bots[0].y=FH-20;b2.bots[1].x=FW-20;b2.bots[1].y=FH-20;};
  park();let alive=0,flips=0,lv=b.vx;
  for(let i=0;i<200&&b.proj;i++){updateP2Ball(1/60);park();alive++;if(Math.sign(b.vx)!==Math.sign(lv)&&b.vx!==0)flips++;lv=b.vx;}
  ok('ULTIMATE ASCENT+BOUNCY: shot ricochets and survives ('+alive+'f, '+flips+' flips, proj='+b.proj+')',alive>=200&&flips>=1);
  frisbeeMode=false;bouncyMode=false;

  // ── PER-MODE tables (v5.1.15): shooter CHAMPION keeps a speed edge; normal CHAMPION stays clamped ──
  startBall('shooter');playerBind[1].tier=3;const sSh=cpuTierParams(1,0).spd;
  startBall('normal');playerBind[1].tier=3;const sNo=cpuTierParams(1,0).spd;
  ok('per-mode: shooter CHAMPION has a speed edge but normal is clamped (shooter '+sSh.toFixed(2)+' > normal '+sNo.toFixed(2)+')',sSh>1.0&&sNo<=1.0);

  console.log('--- cheats: '+P+' pass, '+F+' fail ---');
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
global.navigator={getGamepads:()=>[]};
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
