const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};

  // ── 1. mode wiring: BATTLEBOTS is a selectable mode with its own settings ──
  ok('BATTLEBOTS is in M2_MODES',M2_MODES.some(m=>m.id==='battlebots'));
  ok('5 modes now lay out without overflow',(()=>{const last=p2ModeRect(M2_MODES.length-1);return last.x+last.w<=CW+1&&p2ModeRect(0).x>=0;})());
  m2.mode='battlebots';const bbrows=p2SettingsRows();
  ok('battlebots settings = TEAM FORMAT + BEST OF + ARENA',bbrows.length===3&&bbrows[0].k==='tfmt'&&bbrows[1].k==='bestOf'&&bbrows[2].k==='map');

  // ── 2. start a 1v1 battlebots match (human vs CPU) ──
  const startBB=(map,cpuTier)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='battlebots';
    m2.set.bestOf=1;m2.set.map=map||0;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:cpuTier!=null?cpuTier:2}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2BB();updateBB(3.1);}; // grid claim is the v5.1.64 path; tests drive the legacy 1v1 roster directly
  startBB(0,2);
  ok('match starts: 2 bots, phase p2bb',phase==='p2bb'&&!!bb2&&bb2.bots.length===2);
  ok('bots have MOBILITY + HP bars full',bb2.bots.every(b=>b.mob===BB.MOB&&b.hp===BB.HP));
  ok('sides 0/1, player human + CPU enemy',bb2.bots[0].side===0&&bb2.bots[1].side===1&&bb2.bots[0].ctl.type==='human'&&bb2.bots[1].ctl.type==='cpu');
  ok('CPU bot has a brain',!!bb2.bots[1].ctl.brain);
  ok('warm/cool seat shades',bb2.bots[0].col===M2_COLS[0]&&bb2.bots[1].col===M2_COLS[1]);

  // ── 3. directional armor: hit-location classification by the victim's heading ──
  const v={x:300,y:300,h:0}; // facing +x (east)
  ok('contact from the FRONT (east) = front',bbHitLoc(v,400,300)==='front');
  ok('contact from the REAR (west) = rear',bbHitLoc(v,200,300)==='rear');
  ok('contact from the SIDE (north) = side',bbHitLoc(v,300,180)==='side');

  // ── 4. damage model: front immune, rear→HP, side→mobility then spillover ──
  const mk=()=>({x:0,y:0,h:0,mob:BB.MOB,hp:BB.HP,inv:0,dead:false,side:0});
  bb2.bots=[mk(),Object.assign(mk(),{side:1})]; bb2.result=null;
  {const t=bb2.bots[0];bbApplyHit(t,'front',40,1);ok('FRONT hit deals no damage',t.mob===BB.MOB&&t.hp===BB.HP);}
  {const t=bb2.bots[0];t.inv=0;bbApplyHit(t,'rear',30,1);ok('REAR hit takes HP directly',t.hp===BB.HP-30&&t.mob===BB.MOB);}
  {const t=bb2.bots[0];t.inv=0;t.mob=BB.MOB;t.hp=BB.HP;bbApplyHit(t,'side',40,1);ok('SIDE hit drains MOBILITY, not HP',t.mob===BB.MOB-40&&t.hp===BB.HP);}
  // spillover: side hit bigger than remaining mobility bleeds into HP
  {const t=bb2.bots[0];t.inv=0;t.mob=10;t.hp=BB.HP;bbApplyHit(t,'side',30,1);ok('SIDE spillover: mobility→0 then HP takes the rest',t.mob===0&&t.hp===BB.HP-20);}
  // fully immobilized → further side hits are pure HP
  {const t=bb2.bots[0];t.inv=0;t.mob=0;t.hp=50;bbApplyHit(t,'side',15,1);ok('SIDE hit while IMMOBILE = pure HP',t.hp===35);}

  // ── 5. speed scales with mobility; 0 mobility = immobilized ──
  ok('full mobility → full speed scale',Math.abs(bbSpeed({mob:BB.MOB})-1)<1e-9);
  ok('zero mobility → cannot drive (scale 0)',bbSpeed({mob:0})===0);
  ok('low mobility → reduced speed',bbSpeed({mob:50})>0&&bbSpeed({mob:50})<1);

  // ── 6. KO ends the match (last side standing) ──
  bb2.bots=[mk(),Object.assign(mk(),{side:1})];bb2.result=null;
  {const t=bb2.bots[1];t.hp=20;t.mob=0;t.inv=0;bbApplyHit(t,'rear',25,0);
   ok('lethal hit flags the bot dead',t.dead===true&&t.hp===0);
   ok('KO sets the result to the surviving side (0)',bb2.result===0);}

  // ── 7. friendly fire is irrelevant: same-side bots never trade (different sides only) ──
  // (BattleBots P1 only damages cross-side in updateBB; bbApplyHit dmg credit is cross-side)
  bb2.bots=[mk(),Object.assign(mk(),{side:0})];bb2.bots[0].dmgDealt=0;bb2.result=null;
  bbApplyHit(bb2.bots[1],'rear',20,0); // owner 0 hits same-side 1 → no damage credit
  ok('same-side hit gives no damage credit',(bb2.bots[0].dmgDealt||0)===0);

  // ── 7b. RAM/DASH (always-on, LT/Shift): a burst that engages + cools down ──
  startBB(0,2);{const b=bb2.bots[0];kbBoostHeld=true;updateBB(1/60);
   ok('RAM dash engages on Shift/LT',b.boostT>0&&b.boostCd>0);
   kbBoostHeld=false;const cd=b.boostCd;for(let i=0;i<6;i++)updateBB(1/60);
   ok('dash is on cooldown (no re-trigger while cooling)',b.boostCd<cd&&b.boostCd>0);}

  // ── 8. draw does not throw (no-op canvas) ──
  startBB(0,2);let threw=false;try{drawBB();}catch(e){threw=true;console.log('   drawBB error:',e.message);}
  ok('drawBB() renders without throwing',!threw);

  // ── v5.1.64: BattleBots 3v3 via the 6-seat claim grid (rumble) ──
  {m2.mode='battlebots';tour=null;m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;
   tankGridClaimDev({type:'kb'});tankGridClaimDev({type:'gp',gp:0});tankGridClaimDev({type:'gp',gp:1}); // RED seats 0,1,2
   tankGridSetCpu(3);tankGridSetCpu(4);tankGridSetCpu(5);                                            // BLUE seats 3,4,5
   startP2BB();
   ok('grid → BattleBots 3v3 builds 6 bots (3 vs 3)',bb2.bots.length===6&&bb2.bots.filter(b=>b.side===0).length===3&&bb2.bots.filter(b=>b.side===1).length===3);
   ok('grid BB: 3 human bots + 3 CPU (each CPU has a brain)',bb2.bots.filter(b=>b.ctl.type!=='cpu').length===3&&bb2.bots.filter(b=>b.ctl.type==='cpu'&&b.ctl.brain).length===3);
   ok('grid BB: per-bot distinct shades + names',new Set(bb2.bots.map(b=>b.col)).size===6&&new Set(bb2.bots.map(b=>b.ctl.name||p2Name(b.ctl.bind))).size===6);
   updateBB(3.2);for(let i=0;i<30;i++)updateBB(1/60);
   ok('grid BB 3v3 runs without throwing + result still open',phase==='p2bb'&&bb2.result===null);
   m2.tseats=null;m2.tsel=0;}

  // v5.1.67: CPU vs CPU sim — both claim cards CPU → one CPU per side (legacy 1v1)
  {m2.mode='battlebots';tour=null;m2.tseats=null;m2.set.tfmt='1v1';m2.set.map=0;
   m2.claim=[{type:'cpu',tier:1},{type:'cpu',tier:2}];playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];
   m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
   startP2BB();
   ok('BB CPU-vs-CPU: 2 bots, one per side, both CPU',bb2.bots.length===2&&bb2.bots.filter(b=>b.side===0).length===1&&bb2.bots.filter(b=>b.side===1).length===1&&bb2.bots.every(b=>b.ctl.type==='cpu'));
   m2.tseats=null;m2.tsel=0;}
  console.log('--- battlebots P1: '+P+' pass, '+F+' fail ---');
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
