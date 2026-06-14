const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  // start a 1v1 tank match (RED human vs BLUE CPU) — Phase 1 roster plumbing must stay behavior-identical at 2 tanks
  const startTank=(map,cpuTier)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';
    m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.lives=3;m2.set.map=map||0;m2.set.hpk=false;m2.set.pow=true;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},(cpuTier!=null?{type:'cpu',tier:cpuTier}:{type:'kb'})];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Tank(3.1);};

  // ── 1. roster model: 2 tanks, two sides, control descriptors ──
  startTank(0);
  ok('roster has exactly 2 tanks',tf2.tanks.length===2);
  ok('sides are 0 and 1',tf2.tanks[0].side===0&&tf2.tanks[1].side===1);
  ok('ctl.bind maps to the tank index (legacy 1v1)',tf2.tanks[0].ctl.bind===0&&tf2.tanks[1].ctl.bind===1);
  ok('kills start at 0',tf2.tanks[0].kills===0&&tf2.tanks[1].kills===0);
  ok('dead flags start false',tf2.tanks[0].dead===false&&tf2.tanks[1].dead===false);

  // ── 2. roster helpers resolve to the legacy 1v1 values ──
  ok('tankSide()',tankSide(0)===0&&tankSide(1)===1);
  ok('tankCtl()',tankCtl(0)===tf2.tanks[0].ctl);
  ok('tankFoes(0) = [tank 1]',tankFoes(0).length===1&&tankFoes(0)[0]===tf2.tanks[1]);
  ok('tankFoes(1) = [tank 0]',tankFoes(1).length===1&&tankFoes(1)[0]===tf2.tanks[0]);
  ok('tankNearestFoe(0) = tank 1',tankNearestFoe(0)===tf2.tanks[1]);
  // a dead tank drops out of the foe list
  tf2.tanks[1].dead=true; ok('a dead tank is no longer a foe',tankFoes(0).length===0&&tankNearestFoe(0)===null); tf2.tanks[1].dead=false;

  // ── 3. kill credit + dead flag + LIVES result via tf2CheckResult ──
  startTank(0);
  const a=tf2.tanks[0],b=tf2.tanks[1];
  a.lives=3;b.lives=1;b.hp=1;b.inv=0;b.shield=false;a.kills=0;tf2.result=null;
  tf2Damage(1,0); // RED (side 0) finishes BLUE (side 1, last life)
  ok('killer gets a kill credit',a.kills===1);
  ok('the eliminated tank is flagged dead',b.dead===true);
  ok('LIVES: last side standing wins (result = side 0)',tf2.result===0);

  // a kill that only costs a life (still has lives) does NOT end the match
  startTank(0);
  const a2=tf2.tanks[0],b2t=tf2.tanks[1];
  b2t.lives=3;b2t.hp=1;b2t.inv=0;b2t.shield=false;a2.kills=0;tf2.result=null;
  tf2Damage(1,0);
  ok('a non-final kill still credits the killer',a2.kills===1);
  ok('a non-final kill respawns (not dead) and does not set a result',b2t.dead===false&&tf2.result===null&&b2t.lives===2);

  // ── 4. no friendly fire: a bullet never damages a same-side tank ──
  // (900,320) is a clear pup point on OPEN ARENA — keeps the bullet off the center block so the skip is the only reason it doesn't land
  startTank(0);
  const r1=tf2.tanks[1];
  r1.side=0; // pretend tank 1 is on RED's side (a future teammate)
  r1.x=900;r1.y=320;r1.hp=3;r1.inv=0;r1.dead=false;
  tf2.bullets.length=0;
  tf2.bullets.push({x:900,y:320,vx:0,vy:0,owner:0,id:1,expl:false,pierce:false,hitSet:null}); // RED-owned bullet on top of the RED-side tank
  const hp0=r1.hp;updateP2Tank(1/60);
  ok('a bullet does not hit a SAME-side tank (no friendly fire)',r1.hp===hp0);
  r1.side=1; // restore

  // ── 5. explosion is side-aware (owner side immune, opposite side damaged) ──
  startTank(0);
  const o=tf2.tanks[0],e=tf2.tanks[1];
  o.x=200;o.y=200;o.hp=3;o.inv=0;
  e.x=600;e.y=300;e.hp=3;e.inv=0;e.shield=false;e.dead=false;
  tf2.blasts.length=0;
  tf2Explode(e.x+20,e.y,0); // blast next to the BLUE tank, far from RED owner
  ok('explosion damages the opposite-side tank',e.hp===2);
  ok('explosion leaves the owner-side tank untouched',o.hp===3);
  ok('explosion spawns a blast ring',tf2.blasts.length===1);

  // ── 6. cross-side bullet still lands (sanity: the refactor did not break normal hits) ──
  startTank(0);
  const sx=tf2.tanks[1];sx.x=900;sx.y=320;sx.hp=3;sx.inv=0;sx.shield=false;sx.dead=false;
  tf2.bullets.length=0;
  tf2.bullets.push({x:900,y:320,vx:0,vy:0,owner:0,id:2,expl:false,pierce:false,hitSet:null});
  const ehp=sx.hp;updateP2Tank(1/60);
  ok('a cross-side bullet damages the foe',sx.hp===ehp-1);

  console.log('--- multi-tank (phase 1 roster): '+P+' pass, '+F+' fail ---');
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
function mkPad(i){return{connected:false,index:i,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],vibrationActuator:{playEffect:()=>({catch:()=>{}})}};}
global.PADS=[mkPad(0),mkPad(1)];
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
