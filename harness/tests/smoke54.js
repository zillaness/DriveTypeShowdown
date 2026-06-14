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
  machineGun=2;startBall('shooter');
  let bo=b2.bots[0];bo.x=FW/2;bo.y=FH/2;bo.h=0;bo.stunT=0;bo.intk=[];
  for(let i=0;i<8&&i<balls.length;i++){const b=balls[i];b.sc=false;b.proj=false;b.held=false;b.intaken=true;b.lastT=0;bo.intk.push(b);}
  ok('MACHINE GUN shooter: hopper holds more than 4 ('+bo.intk.length+')',bo.intk.length>4);
  bo.shootCd=0;kbSpaceHeld=true;updateP2Ball(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN shooter: rapid shootCd after firing ('+bo.shootCd.toFixed(2)+')',bo.shootCd>0&&bo.shootCd<=0.06);
  machineGun=0;

  // ── MACHINE GUN (tank): rapid reload after a shot ──
  machineGun=2;startTank();
  const t=tf2.tanks[0];t.reload=0;t.stunT=0;kbSpaceHeld=true;updateP2Tank(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN tank: rapid reload after firing ('+t.reload.toFixed(2)+')',t.reload>0&&t.reload<=0.06);
  machineGun=0;

  // ── v5.1.17 crash regression: MACHINE GUN's big hopper (>4) must not crash the shooter MAG readout (repeat() negative count) ──
  machineGun=2;startBall('shooter');
  {const bw=b2.bots[0];bw.intk=[];for(let i=0;i<9&&i<balls.length;i++){balls[i].intaken=true;bw.intk.push(balls[i]);}
   let drew=true;try{drawP2Ball();}catch(e){drew=false;}
   ok('big MACHINE GUN hopper does not crash the shooter HUD render',drew===true);}
  machineGun=0;

  // ── MACHINE GUN tri-state (v5.1.17): OFF/YOU/BOTH — YOU gives only the human side full-auto ──
  m2.claim=[{type:'kb'},{type:'cpu',tier:1}];
  machineGun=1;ok('MACHINE GUN YOU: human side on, CPU side off',mgOn(0)===true&&mgOn(1)===false);
  machineGun=2;ok('MACHINE GUN BOTH: both sides on',mgOn(0)===true&&mgOn(1)===true);
  machineGun=0;ok('MACHINE GUN OFF: neither side',mgOn(0)===false&&mgOn(1)===false);

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

  // ── MULTIBALL: each goal spawns 2 more balls, capped ──
  startBall('normal');multiBall=true;
  {const n0=balls.length;const bb=balls.find(b=>!b.sc)||balls[0];b2Credit(bb,0);
   ok('MULTIBALL: a goal spawns +2 balls ('+n0+'→'+balls.length+')',balls.length===n0+2);}
  multiBall=false;

  // ── STICKY PLOW: the cheat gives human main bots CHAMPION-grade sticky carriers ──
  startBall('normal');
  ok('STICKY PLOW off: no human carriers',b2StickyCarriers().filter(c=>!(m2.claim[c.al]&&m2.claim[c.al].type==='cpu')).length===0);
  stickyPlow=true;
  {const cs=b2StickyCarriers();ok('STICKY PLOW on: human bot is a cap-5 carrier',cs.length>=1&&cs.every(c=>c.cap===CARRY_CAP[3]));}
  stickyPlow=false;

  // ── NO-CLIP: overlapping main bots don't separate ──
  startBall('normal');
  const A=b2.bots[0],B=b2.bots[1];
  const setOverlap=()=>{A.x=600;A.y=320;B.x=600+RR;B.y=320;cpuH2H&&cpuH2H.forEach&&0;};
  noClip=true;setOverlap();updateP2Ball(1/60);const dNo=Math.hypot(A.x-B.x,A.y-B.y);
  ok('NO-CLIP: overlapping bots stay overlapped (d='+dNo.toFixed(0)+')',dNo<RR*2);
  noClip=false;setOverlap();updateP2Ball(1/60);const dYes=Math.hypot(A.x-B.x,A.y-B.y);
  ok('NO-CLIP off: overlapping bots separate (d='+dYes.toFixed(0)+')',dYes>dNo);
  noClip=false;

  // ── ICE / DRIFT momentum: builds + glides; human-only ──
  iceMode=true;
  {const bot={x:0,y:0,h:0,vx:0,vy:0};applyMomentum(bot,{vx:120,vy:0},1/60,'ice');const v1=bot.vx;applyMomentum(bot,{vx:0,vy:0},1/60,'ice');
   ok('ICE: velocity builds then glides after input stops (v1='+v1.toFixed(0)+'→'+bot.vx.toFixed(0)+')',v1>0&&bot.vx>v1*0.5);}
  startBall('normal');playerBind[0]={type:'kb'};playerBind[1]={type:'cpu',tier:1};
  ok('ICE applies to the human bot, not the CPU',momModeFor(b2.bots[0],0)==='ice'&&momModeFor(b2.bots[1],1)===null);
  iceMode=false;driftMode=true;
  ok('DRIFT selected for the human bot',momModeFor(b2.bots[0],0)==='drift');
  driftMode=false;ok('no momentum when both cheats off',momModeFor(b2.bots[0],0)===null);

  // ── BALL SIZE cheat scales the live ball radius (clamped 4..18) ──
  {const bs=CHEATS.find(c=>c.name==='BALL SIZE');
   bs.set(2);ok('BALL SIZE 2× grows BR (='+BR+', ≤18)',BR>9&&BR<=18);
   bs.set(0.5);ok('BALL SIZE 0.5× shrinks BR (='+BR+', ≥4)',BR<9&&BR>=4);
   bs.set(1);ok('BALL SIZE 1× restores BR=9',BR===9);}

  // ── ROBOT SIZE cheat scales RR live + recomputes the plow geometry (clamped) ──
  {const rs=CHEATS.find(c=>c.name==='ROBOT SIZE');const tx0=SC_TX;
   rs.set(1.5);ok('ROBOT SIZE 1.5× grows RR (='+RR.toFixed(0)+') + plow',RR>17&&RR<=26&&SC_TX>tx0);
   rs.set(0.5);ok('ROBOT SIZE 0.5× shrinks RR (='+RR.toFixed(0)+', ≥8)',RR<17&&RR>=8);
   rs.set(1);ok('ROBOT SIZE 1× restores RR=17 + plow',RR===17&&Math.abs(SC_TX-tx0)<0.01);}

  // ── BALL POWER-UPS cheat: SPEED pickup grants a boost on contact ──
  startBall('normal');ballPups=true;
  b2.pups=[{x:600,y:320,type:{id:'speed',icon:'»',col:'#40c4ff'},age:0}];b2.bots[0].x=600;b2.bots[0].y=320;b2.bots[0].speedT=0;
  b2PupTick(1/60);
  ok('BALL POWER-UPS: SPEED pickup boosts the bot + is consumed',b2.bots[0].speedT===8&&b2.pups.length===0);
  ballPups=false;b2PupTick(1/60);ok('BALL POWER-UPS off: pickups cleared',b2.pups.length===0);

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
