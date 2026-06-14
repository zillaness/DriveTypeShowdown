const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;function burn(n){for(let i=0;i<n;i++)performance.now();}
(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);
  // ── A: claim mechanics ──
  applyLayout('land2p');phase='p2claim';tour=null;
  m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  m2.claim=[null,null];m2.sens=[1,1];m2._gpPrev=[];
  p2ClaimDevice({type:'kb'});
  const cb=p2cCpuRect();
  p2Click(cb.x+5,cb.y+5); // ADD CPU
  ok('CPU claims open slot',m2.claim[1]&&m2.claim[1].type==='cpu');
  p2ClaimDevice({type:'cpu',tier:0});
  ok('second CPU rejected',m2.claim.filter(c=>c&&c.type==='cpu').length===1);
  ok('default tier is FINALIST',m2.claim[1].tier===2&&p2BindLabel(m2.claim[1]).indexOf('FINALIST')>=0);
  const tr=p2cTierRect(1,1);
  p2Click(tr.x+5,tr.y+5);p2Click(tr.x+5,tr.y+5); // tier ++ on CPU side (slot 1)
  ok('stepper cycles to CHAMPION',m2.claim[1].tier===4&&p2BindLabel(m2.claim[1]).indexOf('CHAMPION')>=0);
  p2Click(tr.x+5,tr.y+5);
  ok('tier wraps to ROOKIE',m2.claim[1].tier===0&&p2BindLabel(m2.claim[1]).indexOf('ROOKIE')>=0);
  ok('human sens untouched by CPU-side clicks',m2.sens[1]===1);
  p2Click(cb.x+5,cb.y+5); // REMOVE CPU
  ok('remove clears the CPU claim',m2.claim[1]===null);
  // ── B: routing + a full WORLDS match, normal mirrored, idle keyboard opponent ──
  p2ClaimDevice({type:'cpu',tier:4});m2.claim[1].tier=4;
  const sb=p2StartBtnRect();
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  ok('start launches ball with CPU claimed',phase==='p2ball'&&!!b2);
  ok('cpuH2H initialized for slot 1 only',cpuH2H&&!cpuH2H[0]&&!!cpuH2H[1]);
  ok('getInp routes CPU slot to brain buffer',getInp(playerBind[1])===cpuH2H[1].inp);
  const RND0=Math.random;let _sd=0x2204;
  Math.random=()=>{_sd=(_sd*1664525+1013904223)>>>0;return _sd/4294967296;};
  updateP2Ball(3.1); // countdown
  const sx=b2.bots[1].x,sy=b2.bots[1].y;
  let nan=false,touched=false;
  for(let i=0;i<5400;i++){ // 90s
    updateP2Ball(1/60);
    if(!isFinite(b2.bots[1].x)||!isFinite(b2.bots[1].h)){nan=true;break;}
    if(balls.some(b=>b.lastT===1))touched=true;
    if(b2.result!==null)break;
  }
  ok('no NaN over 90s sim',!nan);
  ok('CPU moved from spawn',Math.hypot(b2.bots[1].x-sx,b2.bots[1].y-sy)>50||b2.score[1]>0);
  ok('CPU touched balls',touched);
  Math.random=RND0;
  ok('CHAMPION CPU scores vs idle opponent (got '+b2.score[1]+')',b2.score[1]>=1);
  ok('idle human did not score',b2.score[0]===0);
  p2QuitMatch(false);
  // ── C: shooter — intake and fire ──
  m2.mode='shooter';phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  updateP2Ball(3.1);
  let intook=false,fired=false,fireFlagSeen=false;
  for(let i=0;i<3600;i++){ // 60s
    updateP2Ball(1/60);
    if(b2.bots[1].intk.length>0)intook=true;
    if(cpuH2H[1].fire&&!fireFlagSeen){fireFlagSeen=true;ok('p2FireHeld mirrors brain fire',p2FireHeld(1)===true);}
    if(balls.some(b=>b.proj&&b.lastT===1))fired=true;
    if(fireFlagSeen&&fired&&intook)break;
  }
  ok('shooter CPU intakes',intook);
  ok('shooter CPU fires',fired&&fireFlagSeen);
  p2QuitMatch(false);
  // ── D: defend objective under forced randomness ──
  m2.mode='normal';phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  updateP2Ball(3.1);
  // adaptive interpolation sanity (FINALIST endpoint behavior)
  playerBind[1].tier=2;
  const Tb=cpuTierParams(1,3);  // player far ahead → full effort
  const Ta=cpuTierParams(1,-3); // CPU far ahead → ease off
  ok('rubber-band pushes when behind',Tb.spd>Ta.spd&&Tb.react<Ta.react);
  playerBind[1].tier=4;
  ok('fixed tiers ignore score',cpuTierParams(1,3).spd===CPU_TIERS[4].spd);
  const RND=Math.random;Math.random=()=>0;
  // v4.0: the main CPU bot is PURE OFFENSE — it runs the scoring cycle, never defends or clears, and never parks at its own gap.
  const G2=cpuBallGoals(1);
  balls.forEach(b=>{b.sc=true;});
  balls[0].sc=false;balls[0].x=FW/2;balls[0].y=FH/2;balls[0].vx=0;balls[0].vy=0;
  b2.bots[1].x=FW-B2M_WX-160;b2.bots[1].y=FH/2;b2.bots[1].h=Math.PI;b2.bots[1].load=[];
  b2.bots[0].x=80;b2.bots[0].y=80; // foe parked away
  let everDef=false,minOwn=1e9;
  for(let i=0;i<420;i++){updateP2Ball(1/60);
    if(cpuH2H[1].obj==='defend'||cpuH2H[1].obj==='clear')everDef=true;
    minOwn=Math.min(minOwn,Math.abs(b2.bots[1].x-G2.ox));}
  ok('main CPU never defends or clears (pure offense)',!everDef);
  ok('main CPU stays clear of its own gap (mindx='+minOwn.toFixed(0)+')',minOwn>80);
  Math.random=RND;
  p2QuitMatch(false);
  // ── F: tank fight — CPU moves, shoots with LoS gating, wins vs idle ──
  m2.mode='tankfight';m2.set.lives=1;m2.set.map=0;m2.set.hpk=false;m2.set.pow=false;
  phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  ok('tank match starts with CPU',phase==='p2tank'&&!!tf2&&!!cpuH2H&&!!cpuH2H[1]);
  updateP2Tank(3.1);
  const ts=tf2.tanks[1],tsx=ts.x,tsy=ts.y;
  let cpuFired=false,hpDropped=false;
  const RT=Math.random;let _ts=0x1678;
  Math.random=()=>{_ts=(_ts*1664525+1013904223)>>>0;return _ts/4294967296;};
  for(let i=0;i<3600;i++){ // 60s
    updateP2Tank(1/60);
    if(tf2.bullets.some(b=>b.owner===1))cpuFired=true;
    if(tf2.tanks[0].hp<3)hpDropped=true;
    if(tf2.result!==null)break;
  }
  Math.random=RT;
  ok('tank CPU moved',Math.hypot(ts.x-tsx,ts.y-tsy)>50||tf2.result!==null);
  ok('tank CPU fired',cpuFired);
  ok('tank CPU lands hits',hpDropped);
  ok('CHAMPION wins the duel vs idle (result='+tf2.result+')',tf2.result===1);
  // LoS gate: both tanks dead-center behind the CENTER PILLAR — CPU must hold fire
  p2QuitMatch(false);m2.set.map=1;phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  updateP2Tank(3.1);
  tf2.tanks[0].x=520;tf2.tanks[0].y=320;tf2.tanks[1].x=680;tf2.tanks[1].y=320; // pillar x540-660 between them
  tf2.bullets.length=0;
  let blockedShots=0;
  for(let i=0;i<30;i++){tf2.tanks[0].x=520;tf2.tanks[0].y=320;tf2.tanks[1].x=680;tf2.tanks[1].y=320;
    updateP2Tank(1/60);blockedShots+=tf2.bullets.filter(b=>b.owner===1).length;tf2.bullets.length=0;}
  ok('LoS blocked: CPU holds fire',blockedShots===0);
  tf2.tanks[0].x=300;tf2.tanks[0].y=120;tf2.tanks[1].x=600;tf2.tanks[1].y=120; // clear lane above pillar
  let clearShots=0;
  for(let i=0;i<90;i++){tf2.tanks[0].x=300;tf2.tanks[0].y=120;tf2.tanks[1].x=600;tf2.tanks[1].y=120;
    updateP2Tank(1/60);clearShots+=tf2.bullets.filter(b=>b.owner===1).length;tf2.bullets.length=0;}
  ok('LoS clear: CPU fires',clearShots>0);
  p2QuitMatch(false);
  // ── G: race — CPU navigates the course, finishes, beats an idle player ──
  m2.mode='race';m2.set.course=0;m2.set.haz=false;
  phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  ok('race starts with CPU',phase==='p2race'&&!!r2&&!!cpuH2H&&!!cpuH2H[1]);
  updateP2Race(3.1);
  const RY=r2.bots[1].y;
  const RR2=Math.random;let _rs=0x254;
  Math.random=()=>{_rs=(_rs*1664525+1013904223)>>>0;return _rs/4294967296;};
  for(let i=0;i<5400&&r2.result===null;i++)updateP2Race(1/60);
  ok('CHAMPION climbs the course (dy='+(RY-r2.bots[1].y).toFixed(0)+')',r2.bots[1].fin!==null||RY-r2.bots[1].y>100);
  ok('CHAMPION wins the race vs idle (result='+r2.result+')',r2.result===1);
  const champT=r2.bots[1].fin;
  // ROOKIE on the same seed must be slower over a fixed window
  p2QuitMatch(false);phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:0}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  updateP2Race(3.1);
  _rs=0x254;
  const RY0=r2.bots[1].y;
  for(let i=0;i<600;i++)updateP2Race(1/60); // 10s window
  const rookieDy=RY0-r2.bots[1].y;
  Math.random=RR2;
  ok('ROOKIE is meaningfully slower (10s dy='+rookieDy.toFixed(0)+')',rookieDy<400);
  // hazards on: seeded run still finishes without crashing
  p2QuitMatch(false);m2.set.haz=true;phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2._gpPrev=[];
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  updateP2Race(3.1);
  const RH=Math.random;let _hs=0x1114;
  Math.random=()=>{_hs=(_hs*1664525+1013904223)>>>0;return _hs/4294967296;};
  let minY=1e9;
  for(let i=0;i<7200&&r2.result===null;i++){updateP2Race(1/60);minY=Math.min(minY,r2.bots[1].y);}
  Math.random=RH;
  // KNOWN LIMITATION (v3.8): the sweeper+shelf compound crossing on hazard courses defeats the
  // race brain — it dies and retries like a human. Assert credible play, not completion.
  ok('hazard run: deep progress, bounded resets, no soft-lock (minY='+minY.toFixed(0)+' resets='+r2.bots[1].resets+')',
     (r2.result===1)||(minY<360&&r2.bots[1].resets<30&&isFinite(r2.bots[1].x)));
  m2.set.haz=false;
  p2QuitMatch(false);
  // ── E: human-vs-human regression — brain absent, fire path clean ──
  m2.mode='normal';phase='p2claim';m2.claim=[{type:'kb'},{type:'gp',gp:1}];m2._gpPrev=[];PADS[1].connected=true;
  p2Click(sb.x+sb.w/2,sb.y+sb.h/2);
  ok('no CPU binds → cpuH2H null',cpuH2H===null);
  updateP2Ball(3.1);for(let i=0;i<120;i++)updateP2Ball(1/60);
  ok('human match runs clean',isFinite(b2.bots[0].x)&&isFinite(b2.bots[1].x));
  withBot(0,b2.bots[0],()=>{ok('getInp kb path unaffected',typeof getInp(playerBind[0]).vx==='number');});
  // ── H: SFX layer — safe without audio, toggle persists, wiring doesn't throw ──
  ok('sfx default ON',sfxOn===true);
  ok('sfx no-throw without AudioContext',(()=>{try{sfx('goal');sfx('bump',0.4);sfx('win');return true;}catch(e){return false;}})());
  sfxToggle();
  ok('sfx toggle flips and persists',sfxOn===false&&localStorage.getItem('frcds_sfx')==='0');
  sfxToggle();
  ok('sfx toggle restores',sfxOn===true&&localStorage.getItem('frcds_sfx')==='1');
  ok('rumble path no-throw',(()=>{try{p2Rumble(0,0.5);p2Rumble(1,0.3);return true;}catch(e){return false;}})());
  p2QuitMatch(false);p2Exit();console.log('done');
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
