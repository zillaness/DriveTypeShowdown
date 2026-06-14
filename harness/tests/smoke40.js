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

  // ── A: speed couples to the opponent's sensitivity and is CAPPED at the player's drive speed (v5.1) ──
  startMatch('normal',0,4); // CHAMPION at slot 1
  clearBalls();
  balls[0].sc=false;balls[0].x=B2M_WX+100;balls[0].y=120;balls[0].vx=0;balls[0].vy=0;
  b2.bots[1].x=FW-B2M_WX-100;b2.bots[1].y=FH-120;b2.bots[1].h=0;
  const setup=()=>{cpuH2H[1].obj='intake';cpuH2H[1].tgt=balls[0];cpuH2H[1].objT=5;cpuH2H[1].orb=undefined;cpuH2H[1].commit=false;};
  const faceBall=()=>{b2.bots[1].h=Math.atan2(balls[0].y-b2.bots[1].y,balls[0].x-b2.bots[1].x);}; // face target so heading-locked motion runs at full speed (isolates the cap)
  setup();faceBall();m2.sens[0]=1.0;cpuBallUpdate(1/60);const s1=Math.hypot(cpuH2H[1].inp.vx,cpuH2H[1].inp.vy);
  setup();faceBall();m2.sens[0]=2.0;cpuBallUpdate(1/60);const s2=Math.hypot(cpuH2H[1].inp.vx,cpuH2H[1].inp.vy);
  ok('ball speed scales ~2x with opponent sens (s1='+s1.toFixed(0)+' s2='+s2.toFixed(0)+')',s2>s1*1.9&&s2<s1*2.1);
  ok('CHAMPION is clamped to the player drive speed (cpu='+s2.toFixed(0)+' ~= player='+(SPD*2).toFixed(0)+')',s2>SPD*2*0.92&&s2<=SPD*2*1.03); // v5.1.8: the top-tier speed edge was removed — no CPU outruns the player
  // turn rate couples to sens (bot faces east, target up-left -> large heading error so the turn saturates at the sens-scaled cap)
  b2.bots[1].h=0;setup();m2.sens[0]=2.0;cpuBallUpdate(1/60);const r2=Math.abs(cpuH2H[1].inp.vr);
  b2.bots[1].h=0;setup();m2.sens[0]=1.0;cpuBallUpdate(1/60);const r1=Math.abs(cpuH2H[1].inp.vr);
  ok('turn rate also couples to sens (r1='+r1.toFixed(2)+' r2='+r2.toFixed(2)+')',r2>r1*1.5);

  // ── A2: drive kinematics — tank/arcade move only along their heading (no strafe); swerve can strafe (v5.1) ──
  startMatch('normal',0,4);
  clearBalls();
  balls[0].sc=false;balls[0].x=B2M_WX+100;balls[0].y=FH/2;balls[0].vx=0;balls[0].vy=0;
  b2.bots[1].x=balls[0].x;b2.bots[1].y=FH/2+200;b2.bots[1].h=0; // facing east, target straight north -> 90 deg abeam
  const latFrac=()=>{const bo=b2.bots[1],ch=Math.cos(bo.h),sh=Math.sin(bo.h),ip=cpuH2H[1].inp;return Math.abs(-sh*ip.vx+ch*ip.vy)/(Math.hypot(ip.vx,ip.vy)||1);};
  m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'}; // arcade
  cpuH2H[1].obj='intake';cpuH2H[1].tgt=balls[0];cpuH2H[1].objT=5;cpuBallUpdate(1/60);const latArc=latFrac();
  m2.drive[1]={kind:'main',idx:2,name:'S',c:'#fa0'}; // bot-centric swerve
  cpuH2H[1].obj='intake';cpuH2H[1].tgt=balls[0];cpuH2H[1].objT=5;cpuBallUpdate(1/60);const latSw=latFrac();
  ok('kinematics: arcade drives along its heading, no strafe (lat='+latArc.toFixed(2)+')',latArc<0.05);
  ok('kinematics: swerve can strafe sideways (lat='+latSw.toFixed(2)+')',latSw>0.7);

  // ── B: intake denial — sharp CPU contests the ball the foe is about to grab, even if a closer free ball exists ──
  startMatch('shooter',0,4);
  clearBalls();
  const cpuX=FW-B2M_WX-300;
  b2.bots[1].x=cpuX;b2.bots[1].y=FH/2;b2.bots[1].intk=[];
  b2.bots[0].x=cpuX-295;b2.bots[0].y=FH/2; // the foe, near bN but >120 (not 'contested')
  const bN=balls[0],bC=balls[1];
  bN.sc=false;bN.x=cpuX-160;bN.y=FH/2;bN.vx=0;bN.vy=0; // 160 from CPU, 135 from foe -> denial -90, not contested
  bC.sc=false;bC.x=cpuX-100;bC.y=FH/2;bC.vx=0;bC.vy=0; // 100 from CPU, 195 from foe -> no denial
  cpuH2H[1].objT=0;cpuH2H[1].tgt=null;cpuH2H[1].obj='push';
  const RND=Math.random;let _s=0x40A;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
  cpuBallUpdate(1/60);
  Math.random=RND;
  ok('intake denial: targets the foe-side ball over the closer one',cpuH2H[1].tgt===bN);

  // ── C: shot-block tracking — sharp defender's gap-mouth y follows the shooting foe's side ──
  startMatch('shooter',0,4);
  const trackY=(foeY)=>{
    clearBalls();
    const G=cpuBallGoals(1);
    b2.bots[0].x=B2M_WX+260;b2.bots[0].y=foeY;b2.bots[0].intk=[balls[0]]; // foe holds intake (shooterThreat)
    b2.bots[1].x=G.ox+(1===0?42:-42);b2.bots[1].y=FH/2;
    balls[1].sc=false;balls[1].x=G.ox-200;balls[1].y=foeY;balls[1].vx=0;balls[1].vy=0;
    cpuH2H[1].obj='defend';cpuH2H[1].tgt=balls[1];cpuH2H[1].objT=5;
    cpuBallUpdate(1/60);
    // step toward the computed target a few frames and read the bot's settled y (apply heading too, as the real movement path does)
    for(let i=0;i<60;i++){cpuH2H[1].objT=5;cpuH2H[1].obj='defend';cpuH2H[1].tgt=balls[1];cpuBallUpdate(1/60);const ip=cpuH2H[1].inp;b2.bots[1].h+=ip.vr/60;b2.bots[1].x+=ip.vx/60;b2.bots[1].y+=ip.vy/60;}
    return b2.bots[1].y;
  };
  const yTop=trackY(b2mGT()+20), yBot=trackY(b2mGB()-20);
  ok('shot-block: defender tracks the shooter side (top->y='+yTop.toFixed(0)+' bot->y='+yBot.toFixed(0)+')',yBot>yTop+30);

  // ── D: anti-double-team — CPU avoids a ball a same-alliance teammate is already sitting on ──
  startMatch('normal',0,4);
  clearBalls();
  b2.bots[1].x=FW-B2M_WX-200;b2.bots[1].y=FH/2;
  const bX=balls[0],bY=balls[1];
  bX.sc=false;bX.x=b2.bots[1].x-90;bX.y=FH/2;bX.vx=0;bX.vy=0;  // closer to CPU
  bY.sc=false;bY.x=b2.bots[1].x-170;bY.y=FH/2-40;bY.vx=0;bY.vy=0; // farther
  b2.cpus=[{al:1,x:bX.x,y:bX.y,h:0,role:'guard',roleT:999}]; // teammate sitting on bX
  cpuH2H[1].objT=0;cpuH2H[1].tgt=null;cpuH2H[1].obj='push';
  let _s2=0x40B;const RND2=Math.random;Math.random=()=>{_s2=(_s2*1664525+1013904223)>>>0;return _s2/4294967296;};
  cpuBallUpdate(1/60);
  Math.random=RND2;
  ok('anti-double-team: skips the ball the teammate is on, takes the other',cpuH2H[1].tgt===bY);
  b2.cpus=[];

  // ── E: alliance directed scoring + own-goal guard ──
  startMatch('normal',0,4);
  clearBalls();
  // red disrupt bot (al=0) scores on the RIGHT gap (ex). Open-field ball -> push toward right (+x).
  const Gred=cpuBallGoals(0);
  const ball=balls[0];ball.sc=false;ball.x=FW/2;ball.y=FH/2;ball.vx=0;ball.vy=0;
  b2.cpus=[{al:0,x:FW/2-RR-BR-10,y:FH/2,h:0,role:'disrupt',roleT:999}]; // behind-able to push right
  for(let i=0;i<40;i++)b2CpuUpdate(1/60);
  ok('directed scoring: open-field ball pushed toward opponent gap (ball.vx='+ball.vx.toFixed(0)+', ex side='+(Gred.ex>FW/2?'right':'left')+')',(Gred.ex>FW/2?ball.vx>0:ball.vx<0));
  // own-goal guard: ball near red's OWN gap (left) must be shoved toward midfield, not into the own gap
  clearBalls();b2.cpus=[];
  const Gred2=cpuBallGoals(0);
  const ball2=balls[0];ball2.sc=false;ball2.x=Gred2.ox+70;ball2.y=FH/2;ball2.vx=0;ball2.vy=0; // near own (left) gap
  b2.cpus=[{al:0,x:Gred2.ox+70-(RR+BR+10),y:FH/2,h:0,role:'disrupt',roleT:999}]; // between own gap and ball
  const ox0=ball2.x;
  for(let i=0;i<40;i++)b2CpuUpdate(1/60);
  ok('own-goal guard: ball near own gap pushed toward midfield, not into own gap (dx='+(ball2.x-ox0).toFixed(0)+')',(Gred2.ox<FW/2?ball2.x>=ox0:ball2.x<=ox0));
  b2.cpus=[];
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
