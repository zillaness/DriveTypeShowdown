const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  const start=(tier)=>{
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.cpus=0;m2.set.ballN=12;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'H',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'C',c:'#0ff'};m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Ball(3.1);
    playerBind[1].tier=tier; // ensure capacity tier
    balls.forEach(b=>{b.sc=true;b.held=false;b.heldBy=null;});
    b2.bots[0].x=FW-60;b2.bots[0].y=60;b2.bots[1].load=[];b2.bots[0].load=[];
  };
  const freeBall=(i,x,y)=>{const b=balls[i];b.sc=false;b.intaken=false;b.proj=false;b.held=false;b.heldBy=null;b.x=x;b.y=y;b.vx=0;b.vy=0;return b;};

  // CAPTURE: CHAMPION plow drives into a free ball -> held
  start(3);let bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  const cb=freeBall(0,bo.x-(RR+BR),FH/2);
  b2Sticky(1/60);
  ok('capture: front-contact ball becomes held',cb.held===true&&bo.load.length===1);

  // CAPACITY by tier: CHAMPION caps at 5 (nested cluster fits within the plow arms), ROOKIE at 2
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<8;i++)freeBall(i,bo.x-(RR+BR),FH/2-8+i*2);
  for(let f=0;f<30;f++)b2Sticky(1/60);
  ok('capacity: CHAMPION holds at most 5 ('+bo.load.length+')',bo.load.length===5);
  start(0);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<8;i++)freeBall(i,bo.x-(RR+BR),FH/2-8+i*2);
  for(let f=0;f<30;f++)b2Sticky(1/60);
  ok('capacity: ROOKIE holds at most 2 ('+bo.load.length+')',bo.load.length===2);

  // CARRY: held ball follows the bot
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  const carry=freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60);
  bo.x=360;b2Sticky(1/60);
  ok('carry: held ball stays in front of moved bot (x~'+carry.x.toFixed(0)+')',Math.abs(carry.x-(360-(RR+BR+2)))<3&&carry.held);

  // RELEASE-SCORE: drive a held ball through the opponent (left) gap
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60); // capture away from gap
  const s0=b2.score[1];
  bo.x=130;b2Sticky(1/60); // drive to gap: carry puts the ball past the plane -> score
  ok('release-score: load drives through opponent gap and scores',b2.score[1]===s0+1&&bo.load.length===0);

  // STRIP — HIT-LOCATION model (v4.2). A bump to the BOT BODY (rear/side, away from the front balls):
  // a loose ROOKIE plow drops a ball; a CHAMPION plow ignores it.
  let _s=12345;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
  start(0);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60);const r0=bo.load.length;
  b2.bots[0].x=bo.x+RR*2;b2.bots[0].y=bo.y;b2.bots[0]._inp={vx:0,vy:0,vr:0}; // contact at the bot's REAR (balls are out front)
  b2Sticky(1/60);
  ok('body bump (loose plow / ROOKIE): knocks the ball loose ('+r0+'->'+bo.load.length+')',r0===1&&bo.load.length===0);

  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<3;i++)freeBall(i,bo.x-(RR+BR)-i*0.1,FH/2-20+i*20);
  for(let f=0;f<10;f++)b2Sticky(1/60);const champHad=bo.load.length;
  b2.bots[0].x=bo.x;b2.bots[0].y=bo.y+RR*2;b2.bots[0].h=0;b2.bots[0]._inp={vx:0,vy:0,vr:0};
  let minLoad=champHad; // sustained side body contact; track the lowest the load reaches (a bump knocks one loose; refill is separate)
  for(let f=0;f<30;f++){b2Sticky(1/60);minLoad=Math.min(minLoad,bo.load.length);}
  ok('body bump (CHAMPION too): v5.0 flatten dislodges a carried ball at all tiers (min '+minLoad+' < '+champHad+')',champHad>=2&&minLoad<champHad);

  // STEAL: hitting the carried ball transfers it to the stealer (along the stealer's heading), any tier.
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<3;i++)freeBall(i,bo.x-(RR+BR)-i*0.1,FH/2-20+i*20);
  for(let f=0;f<10;f++)b2Sticky(1/60);const champHad2=bo.load.length;
  const held0=balls.filter(b=>b.held).map(b=>b);
  // stealer approaches the front ball head-on, facing +x (heading 0) so a steal sends the ball +x
  b2.bots[0].x=bo.x-(RR+BR-1)-(RR+BR);b2.bots[0].y=FH/2;b2.bots[0].h=0;b2.bots[0]._inp={vx:0,vy:0,vr:0};
  b2Sticky(1/60);
  const stolen=held0.find(b=>!b.held);
  ok('steal (CHAMPION): a ball-hit removes one from the load ('+champHad2+'->'+bo.load.length+')',champHad2>=2&&bo.load.length===champHad2-1);
  ok('steal direction: the taken ball heads toward the stealer (vx>0)',!!stolen&&stolen.vx>40);

  // v5.1: a plow driven in hard STEALS a ball to the stealer (it no longer scatters the whole load away)
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<3;i++)freeBall(i,bo.x-(RR+BR)-i*0.1,FH/2-20+i*20);
  for(let f=0;f<10;f++)b2Sticky(1/60);const had=bo.load.length;
  b2.bots[0].x=bo.x-(RR+BR-1)-(RR+BR);b2.bots[0].y=FH/2;b2.bots[0].h=0;b2.bots[0]._inp={vx:SPD,vy:0,vr:0}; // driving plow-first into the load
  b2Sticky(1/60);
  ok('hard plow hit steals one (no scatter): '+had+'->'+bo.load.length,had>=2&&bo.load.length===had-1);

  // NO FRIENDLY FIRE: same-alliance contact does not strip
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60);const before=bo.load.length;
  b2.cpus=[{x:bo.x+RR*2,y:bo.y,h:0,al:1,role:'guard',roleT:2}]; // friendly (al===1)
  b2Sticky(1/60);
  ok('no friendly fire: teammate contact does not strip',bo.load.length===before&&before===1);
  b2.cpus=[];

  // v5.1 DEFENSE: an opponent pressed against a CHAMPION carrier suppresses capture and bleeds the whole load (no instant re-grab)
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  for(let i=0;i<3;i++)freeBall(i,bo.x-(RR+BR),FH/2-18+i*18);
  for(let f=0;f<6;f++)b2Sticky(1/60);const champFull=bo.load.length;
  const foe=b2.bots[0];let lo=champFull;
  for(let f=0;f<40;f++){foe.x=bo.x-(RR*2);foe.y=FH/2;foe.h=0;foe._inp={vx:SPD,vy:0,vr:0}; // human plow pressed in, facing the load
    b2Sticky(1/60);
    for(const b of balls){if(b.sc||b.held||b.intaken||b.proj){if(b._grabCd>0)b._grabCd=0;continue;}if(b._grabCd>0)b._grabCd-=1/60;b.x+=b.vx/60;b.y+=b.vy/60;b.vx*=0.87;b.vy*=0.87;}
    lo=Math.min(lo,bo.load.length);}
  ok('defense: a pressed-in opponent bleeds the CHAMPION load to empty ('+champFull+'->'+lo+')',champFull===3&&lo===0);
  // capture-immunity: a just-stripped ball cannot be re-grabbed for a moment
  start(3);bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};
  const cb2=freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60);
  cb2.held=false;cb2.heldBy=null;bo.load.length=0;cb2._grabCd=0.55; // strip it loose in place (emulates b2Release)
  b2Sticky(1/60); // same spot, but immunity must block re-grab
  ok('capture-immunity: a freshly stripped ball is not instantly re-grabbed',cb2.held===false&&bo.load.length===0);

  // HUMAN main bot does NOT capture
  start(3);m2.claim[1].type='kb';bo=b2.bots[1];bo.x=400;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:0,vy:0,vr:0};bo.load=[];
  freeBall(0,bo.x-(RR+BR),FH/2);b2Sticky(1/60);
  ok('human main bot has no sticky plow',bo.load.length===0);

  // MOVEMENT DROP (v5.1): CHAMPION holds perfectly while driving unbumped; lower tiers leak the carry while moving
  let _sd=999;Math.random=()=>{_sd=(_sd*1664525+1013904223)>>>0;return _sd/4294967296;};
  start(3);bo=b2.bots[1];bo.x=600;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:-SPD,vy:0,vr:0}; // mid-field, driving (no opponent, no gap nearby)
  for(let i=0;i<3;i++)freeBall(i,bo.x-(RR+BR),FH/2-18+i*18);
  for(let f=0;f<5;f++)b2Sticky(1/60);const champLoad=bo.load.length;
  let champMin=champLoad;for(let f=0;f<240;f++){b2Sticky(1/60);champMin=Math.min(champMin,bo.load.length);}
  ok('move-drop: CHAMPION holds perfectly while driving unbumped (min '+champMin+'='+champLoad+')',champLoad===3&&champMin===3);
  start(0);bo=b2.bots[1];bo.x=600;bo.y=FH/2;bo.h=Math.PI;bo._inp={vx:-SPD,vy:0,vr:0};
  freeBall(0,bo.x-(RR+BR),FH/2);for(let f=0;f<3;f++)b2Sticky(1/60);
  let rookieDropped=false;for(let f=0;f<1500;f++){b2Sticky(1/60);if(bo.load.length===0){rookieDropped=true;break;}}
  ok('move-drop: ROOKIE leaks the carry while driving',rookieDropped);

  // v5.1.22: SHOOTER shove — the main CPU bot out-muscles alliance bots (tier-scaled); CHAMPION barely budges, ROOKIE near-even
  const shoveDisp=(tier)=>{
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='shooter';m2.set.cpus=1;m2.set.bestOf=1;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.contact='full';m2.set.ballN=6;
    m2.drive[0]={kind:'main',idx:2,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:2,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Ball(3.1);
    const champ=b2.bots[1],ally=b2.cpus[0];
    champ.x=600;champ.y=320;ally.x=600+RR;ally.y=320;cpuH2H[1].inp={vx:0,vy:0,vr:0};
    const cx0=champ.x;b2CpuUpdate(1/60);return Math.abs(champ.x-cx0);
  };
  const rookieShove=shoveDisp(0),champShove=shoveDisp(3);
  ok('shove: CHAMPION main bot barely moves vs an alliance bot ('+champShove.toFixed(1)+'px)',champShove<4);
  ok('shove: CHAMPION resists far more than ROOKIE ('+champShove.toFixed(1)+' < '+rookieShove.toFixed(1)+')',champShove<rookieShove*0.6);

  console.log('--- smoke45: '+P+' pass, '+F+' fail ---');
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
