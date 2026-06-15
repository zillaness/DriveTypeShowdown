const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  // start a 1v1 tank match (RED human vs BLUE CPU) — Phase 1 roster plumbing must stay behavior-identical at 2 tanks
  const startTank=(map,cpuTier,tcpus,tformat,tTimeSec,tallies)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';
    m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.lives=3;m2.set.map=map||0;m2.set.hpk=false;m2.set.pow=true;m2.set.tcpus=tcpus||1;m2.set.tformat=tformat||'lives';m2.set.tTimeSec=tTimeSec||90;m2.set.tallies=tallies||0;m2.set.allyTier=1;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},(cpuTier!=null?{type:'cpu',tier:cpuTier}:{type:'kb'})];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2Tank();updateP2Tank(3.1);}; // grid claim is the v5.1.57 path; these tests drive the legacy roster shim (no m2.tseats) directly

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

  // ── 7. ENEMY TANKS lever: 1 human vs N CPU tanks (Phase 2) ──
  startTank(0,3,3); // 3 enemy CPU tanks
  ok('tcpus=3 → 4 tanks total',tf2.tanks.length===4);
  ok('one player tank on side 0',tf2.tanks.filter(t=>t.side===0).length===1);
  ok('three CPU tanks on side 1',tf2.tanks.filter(t=>t.side===1).length===3);
  ok('player tank is human, enemies are cpu',tf2.tanks[0].ctl.type==='human'&&tf2.tanks.slice(1).every(t=>t.ctl.type==='cpu'));
  // each CPU tank has its OWN brain object (no sharing → they think independently)
  const brains=tf2.tanks.slice(1).map(t=>t.ctl.brain);
  ok('every CPU tank has a brain',brains.every(b=>!!b));
  ok('CPU brains are distinct objects',new Set(brains).size===3);
  // spawn fairness: player LEFT, CPUs RIGHT, distinct Y, in bounds
  ok('player spawns on the LEFT (x=70)',tf2.tanks[0].x===70);
  ok('all CPUs spawn on the RIGHT (x=FW-70)',tf2.tanks.slice(1).every(t=>t.x===FW-70));
  const cys=tf2.tanks.slice(1).map(t=>t.y);
  ok('CPU spawn Ys are distinct',new Set(cys).size===3);
  ok('CPU spawns in bounds',cys.every(y=>y>=RR+12&&y<=FH-RR-12));
  // distinct colors per CPU tank
  ok('CPU tank colors are distinct',new Set(tf2.tanks.slice(1).map(t=>t.col)).size===3);
  ok('player tank wears RED',tf2.tanks[0].col===M2_COLS[0]);

  // ── 8. no friendly fire among multiple CPU tanks ──
  startTank(0,1,3);
  {const c1=tf2.tanks[1],c2=tf2.tanks[2];
   c1.x=900;c1.y=300;c2.x=900;c2.y=300;c1.hp=3;c2.hp=3;c1.inv=0;c2.inv=0;c1.shield=false;c2.shield=false;c1.dead=false;c2.dead=false;
   tf2.bullets.length=0;
   tf2.bullets.push({x:900,y:300,vx:0,vy:0,owner:1,id:9,expl:false,pierce:false,hitSet:null}); // CPU-1 bullet sitting on CPU-2
   const h=c2.hp;updateP2Tank(1/60);
   ok('a CPU bullet does not damage a same-side CPU tank',c2.hp===h);}

  // ── 9. LIVES: last SIDE standing wins with N enemy tanks ──
  startTank(0,1,3);
  tf2.result=null;
  for(let q=1;q<tf2.tanks.length;q++){const t=tf2.tanks[q];t.lives=1;t.hp=1;t.inv=0;t.shield=false;t.dead=false;tf2Damage(q,0);}
  ok('eliminating all 3 CPUs ends the match',tf2.result!==null);
  ok('the surviving side (player, side 0) wins',tf2.result===0);
  ok('player kill count = 3',tf2.tanks[0].kills===3);

  // ── 10. tcpus=1 stays byte-identical to the legacy 1v1 spawn ──
  startTank(0,1,1);
  ok('tcpus=1 → exactly 2 tanks',tf2.tanks.length===2);
  ok('1v1 player spawn unchanged (70, FH/2)',tf2.tanks[0].x===70&&tf2.tanks[0].y===FH/2);
  ok('1v1 CPU spawn unchanged (FW-70, FH/2)',tf2.tanks[1].x===FW-70&&tf2.tanks[1].y===FH/2);

  // ── 11. human vs human: legacy rivals (one each side), ENEMY TANKS lever ignored ──
  startTank(0,null,4); // both kb, tcpus=4 should be ignored
  ok('two humans → exactly 2 tanks (tcpus ignored)',tf2.tanks.length===2);
  ok('humans are rivals on opposite sides',tf2.tanks[0].side===0&&tf2.tanks[1].side===1);
  ok('both tanks are human',tf2.tanks.every(t=>t.ctl.type==='human'));
  ok('side-1 human wears BLUE',tf2.tanks[1].col===M2_COLS[1]);

  // ── 12. settings: tankfight FORMAT lever swaps the lives/time row (Phase 3) ──
  m2.mode='tankfight';m2.set.tformat='lives';
  let tfrows=p2SettingsRows();
  ok('LIVES format → 4 rows (format/lives/bestOf/map; ENEMY/ALLY moved to the claim grid)',tfrows.length===4&&tfrows[0].k==='tformat'&&tfrows[1].k==='lives'&&tfrows[2].k==='bestOf'&&tfrows[3].k==='map');
  m2.set.tformat='timed';tfrows=p2SettingsRows();
  ok('TIMED format → MATCH TIME row replaces LIVES',tfrows[1].k==='tTimeSec'&&tfrows.length===4);
  // settings overflow guard: every row sits above the START button
  {const sb=p2StartBtnRect();let okFit=true;for(let i=0;i<tfrows.length;i++){const rc=p2SetRowRect(i);if(rc.y+rc.h>sb.y)okFit=false;}
   ok('all 4 tankfight rows fit above START',okFit);}

  // ── 13. TIMED is a deathmatch: infinite lives, respawn ignores lives ──
  startTank(0,1,1,'timed',90);
  ok('TIMED match flagged tf2.timed',tf2.timed===true&&tf2.tLimit===90);
  ok('TIMED tanks have infinite lives',tf2.tanks.every(t=>!isFinite(t.lives)));
  {const v=tf2.tanks[1];v.hp=1;v.inv=0;v.shield=false;v.dead=false;tf2.result=null;
   tf2Damage(1,0); // a "lethal" hit in TIMED → respawn, never dead, no result
   ok('TIMED death respawns (not dead) and sets no result',v.dead===false&&tf2.result===null);
   ok('TIMED kill still credits the killer',tf2.tanks[0].kills>=1);}

  // ── 14. TIMED expiry: the side with more kills wins ──
  startTank(0,1,3,'timed',90);
  tf2.tanks[0].kills=5;tf2.tanks[1].kills=1;tf2.tanks[2].kills=1;tf2.tanks[3].kills=1; // RED 5 vs BLUE 3
  tf2.t=tf2.tLimit;tf2.result=null;tf2.sudden=false;
  tf2TimeUp();
  ok('TIMED expiry → most-kills side wins (RED)',tf2.result===0);

  // ── 15. TIMED tie → SUDDEN DEATH, then first kill wins ──
  startTank(0,1,1,'timed',90);
  tf2.tanks[0].kills=2;tf2.tanks[1].kills=2; // dead heat
  tf2.t=tf2.tLimit;tf2.result=null;tf2.sudden=false;
  tf2TimeUp();
  ok('a tie at time-up enters sudden death (no winner yet)',tf2.sudden===true&&tf2.result===null);
  {const v=tf2.tanks[1];v.hp=1;v.inv=0;v.shield=false;v.dead=false;
   tf2Damage(1,0); // RED lands the golden kill
   ok('sudden death: first kill decides the winner (RED)',tf2.result===0);}

  // ── 16. FRIENDLY FIRE toggle gates same-side damage (tank guns) ──
  startTank(0,1,3); // 3 CPU squadmates on side 1
  friendlyFire=true;
  {const b=tf2.tanks[2];b.x=900;b.y=320;b.hp=3;b.inv=0;b.shield=false;b.dead=false;
   tf2.bullets.length=0;tf2.bullets.push({x:900,y:320,vx:0,vy:0,owner:1,id:77,expl:false,pierce:false,hitSet:null}); // tank-1 bullet on squadmate tank-2 (same side)
   const h=b.hp;updateP2Tank(1/60);
   ok('FRIENDLY FIRE on: a same-side bullet damages a squadmate',b.hp===h-1);}
  friendlyFire=false;
  {const b=tf2.tanks[2];b.x=900;b.y=320;b.hp=3;b.inv=0;b.shield=false;b.dead=false;
   tf2.bullets.length=0;tf2.bullets.push({x:900,y:320,vx:0,vy:0,owner:1,id:78,expl:false,pierce:false,hitSet:null});
   const h=b.hp;updateP2Tank(1/60);
   ok('FRIENDLY FIRE off: a same-side bullet is skipped',b.hp===h);}

  // ── 17. ALLY TANKS / 3v3: CPU teammates on the player side + warm/cool per-bot ring shades ──
  startTank(0,2,3,'lives',90,2); // 1 human + 2 CPU allies (side 0) vs 3 CPU enemies (side 1) = 3v3
  ok('3v3 → 6 tanks total',tf2.tanks.length===6);
  ok('player side (0) has 3 tanks',tf2.tanks.filter(t=>t.side===0).length===3);
  ok('enemy side (1) has 3 tanks',tf2.tanks.filter(t=>t.side===1).length===3);
  ok('player keeps the human seat + 2 CPU allies',tf2.tanks[0].ctl.type==='human'&&tf2.tanks.filter(t=>t.side===0&&t.ctl.type==='cpu').length===2);
  ok('every CPU (ally + enemy) has its own brain',tf2.tanks.filter(t=>t.ctl.type==='cpu').every(t=>!!t.ctl.brain));
  ok('ally CPUs inherit P1 drive bind (0)',tf2.tanks.filter(t=>t.side===0&&t.ctl.type==='cpu').every(t=>t.ctl.bind===0));
  ok('ally CPUs target the enemy side',(()=>{const a=tf2.tanks.findIndex(t=>t.side===0&&t.ctl.type==='cpu');return tankFoes(a).every(f=>f.side===1)&&tankFoes(a).length===3;})());
  // warm(red) for side 0, cool(blue) for side 1; each seat a distinct shade
  ok('side 0 wears WARM shades (all from TF2_RED_COLS)',tf2.tanks.filter(t=>t.side===0).every(t=>TF2_RED_COLS.includes(t.col)));
  ok('side 1 wears COOL shades (all from TF2_BLUE_COLS)',tf2.tanks.filter(t=>t.side===1).every(t=>TF2_BLUE_COLS.includes(t.col)));
  ok('per-bot ring shades are distinct within each side',new Set(tf2.tanks.filter(t=>t.side===0).map(t=>t.col)).size===3&&new Set(tf2.tanks.filter(t=>t.side===1).map(t=>t.col)).size===3);
  ok('seat 0 keeps the classic team colors (red/blue)',tf2.tanks[0].col===M2_COLS[0]&&tf2.tanks.find(t=>t.side===1).col===M2_COLS[1]);
  // ally tier comes from allyTier (VETERAN=1), enemy tier from the claim (here 2)
  ok('ally CPU tier = VETERAN(1); enemy CPU tier = claim(2)',tf2.tanks.filter(t=>t.side===0&&t.ctl.type==='cpu').every(t=>t.ctl.tier===1)&&tf2.tanks.filter(t=>t.side===1).every(t=>t.ctl.tier===2));
  // default (tallies=0) stays byte-identical 1v1
  startTank(0,1,1,'lives',90,0);
  ok('tallies=0 → no allies (2 tanks)',tf2.tanks.length===2&&tf2.tanks.filter(t=>t.side===0).length===1);

  // ── v5.1.56: seat model → roster (tankRosterFromSeats) — the spine for the 3v3 claim grid (uneven sides + mixed human/CPU per side) ──
  {const r=tankRosterFromSeats([[{type:'human',bind:0}],[{type:'human',bind:1}]]);
   ok('seats → 1v1 roster',r.length===2&&r[0].side===0&&r[0].type==='human'&&r[1].side===1&&r[1].type==='human');}
  {const r=tankRosterFromSeats([[{type:'human',bind:0},{type:'cpu',bind:0,tier:2}],[{type:'human',bind:1},{type:'human',bind:2}]]);
   ok('mixed: RED 1 human+1 CPU vs BLUE 2 humans (2v2)',r.length===4&&r.filter(x=>x.side===0).length===2&&r.filter(x=>x.side===1).length===2&&r.filter(x=>x.type==='human').length===3&&r.filter(x=>x.type==='cpu').length===1);}
  {const r=tankRosterFromSeats([[{type:'human',bind:0}],[{type:'cpu',bind:1,tier:1},{type:'cpu',bind:1,tier:1},{type:'cpu',bind:1,tier:1}]]);
   ok('uneven 1v3 (1 human vs 3 CPU)',r.filter(x=>x.side===0).length===1&&r.filter(x=>x.side===1).length===3);}
  {const r=tankRosterFromSeats([[{type:'human',bind:0},{type:'human',bind:1},{type:'human',bind:2}],[{type:'cpu',bind:0,tier:3}]]);
   ok('3v1 (3 humans vs 1 CPU), tier preserved',r.filter(x=>x.side===0).length===3&&r.filter(x=>x.side===1).length===1&&r.find(x=>x.side===1).tier===3);}
  {const r=tankRosterFromSeats([[{type:'human',bind:0}],[]]);
   ok('empty side auto-fills one safety CPU',r.filter(x=>x.side===1).length===1&&r.find(x=>x.side===1).type==='cpu');}
  {const r=tankRosterFromSeats([[null,{type:'human',bind:0},null],[{type:'cpu',bind:1,tier:0}]]);
   ok('null/empty seats are skipped',r.filter(x=>x.side===0).length===1&&r[0].type==='human');}
  // tankSeatsFromClaim reproduces the legacy claim (1 human + 1 ally CPU vs 2 enemy CPUs)
  {m2.claim=[{type:'kb'},{type:'cpu',tier:1}];m2.set.tcpus=2;m2.set.tallies=1;m2.set.allyTier=1;
   const seats=tankSeatsFromClaim();
   ok('tankSeatsFromClaim: RED = 1 human + 1 ally CPU',seats[0].length===2&&seats[0][0].type==='human'&&seats[0][1].type==='cpu');
   ok('tankSeatsFromClaim: BLUE = 2 enemy CPUs',seats[1].length===2&&seats[1].every(s=>s.type==='cpu'));}

  // ── v5.1.57: the 6-seat claim GRID drives the roster (3v3 humans + mixed CPU + uneven sides) ──
  {m2.mode='tankfight';tour=null;m2.tseats=[null,null,null,null,null,null];m2.tsel=0;
   tankGridClaimDev({type:'kb'});m2.tsel=1;tankGridSetCpu(1);                                   // RED: 1 human + 1 CPU
   m2.tsel=3;tankGridClaimDev({type:'gp',gp:0});m2.tsel=4;tankGridClaimDev({type:'gp',gp:1});   // BLUE: 2 humans
   ok('grid: RED = 1 human + 1 CPU, BLUE = 2 humans',tankGridSideDesc(0)==='1 human + 1 CPU'&&tankGridSideDesc(1)==='2 humans');
   ok('grid: device dedup — re-claiming the keyboard is a no-op',(m2.tsel=2,tankGridClaimDev({type:'kb'}),tankGridSideCount(0)===2));
   ok('grid: canStart true (both sides filled)',tankGridCanStart()===true);
   startP2Tank();
   ok('grid → 4 tanks (RED 2, BLUE 2)',tf2.tanks.length===4&&tf2.tanks.filter(t=>t.side===0).length===2&&tf2.tanks.filter(t=>t.side===1).length===2);
   ok('grid → 3 human tanks + 1 CPU',tf2.tanks.filter(t=>t.ctl.type!=='cpu').length===3&&tf2.tanks.filter(t=>t.ctl.type==='cpu').length===1);
   ok('grid → each tank binds its own seat index 0-5',new Set(tf2.tanks.map(t=>t.ctl.bind)).size===4&&tf2.tanks.every(t=>t.ctl.bind>=0&&t.ctl.bind<6));}
  {m2.mode='tankfight';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;                       // full 3v3: RED 3 humans, BLUE 3 CPU
   tankGridClaimDev({type:'kb'});tankGridClaimDev({type:'gp',gp:0});tankGridClaimDev({type:'gp',gp:1}); // auto-advance fills RED seats 0,1,2
   tankGridSetCpu(3);tankGridSetCpu(4);tankGridSetCpu(5);
   ok('grid 3v3: RED 3 humans in seats 0-2',tankGridSideCount(0)===3&&[0,1,2].every(i=>m2.tseats[i]&&m2.tseats[i].type==='human'));
   startP2Tank();
   ok('grid → 3v3 builds 6 tanks (3 vs 3)',tf2.tanks.length===6&&tf2.tanks.filter(t=>t.side===0).length===3&&tf2.tanks.filter(t=>t.side===1).length===3);
   ok('grid → 3 humans vs 3 CPU',tf2.tanks.filter(t=>t.ctl.type!=='cpu').length===3&&tf2.tanks.filter(t=>t.ctl.type==='cpu').length===3);
   ok('grid → all 6 tanks have distinct HUD labels',new Set(tf2.tanks.map((t,i)=>tankLabel(i))).size===6);}
  {m2.mode='tankfight';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;                       // uneven 1v3
   tankGridClaimDev({type:'kb'});m2.tsel=3;tankGridSetCpu(3);tankGridSetCpu(4);tankGridSetCpu(5);
   startP2Tank();
   ok('grid → uneven 1v3 (1 human vs 3 CPU)',tf2.tanks.filter(t=>t.side===0).length===1&&tf2.tanks.filter(t=>t.side===1).length===3);
   ok('grid → per-bot cool shades distinct within BLUE',new Set(tf2.tanks.filter(t=>t.side===1).map(t=>t.col)).size===3);
   m2.tseats=null;m2.tsel=0;}
  {m2.mode='tankfight';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;tankGridClaimDev({type:'kb'});m2.tsel=3;tankGridSetCpu(3); // render path doesn't throw (no-op canvas catches undefined access)
   let drew=true;try{drawTankGrid();}catch(e){drew=false;}ok('drawTankGrid renders without throwing',drew);m2.tseats=null;m2.tsel=0;}
  {m2.mode='tankfight';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;tankGridClaimDev({type:'kb'}); // v5.1.58: ◀▶ reaches every drive category, not just classic
   const kinds=new Set();for(let k=0;k<13;k++){tankGridCycleDrive(0,1);kinds.add(m2.tseats[0].drive.kind);}
   ok('grid drive cycler reaches all 3 categories (classic/holo/steer)',kinds.has('main')&&kinds.has('holo')&&kinds.has('steer'));m2.tseats=null;m2.tsel=0;}

  console.log('--- multi-tank (roster + N-tanks + TIMED + friendly-fire + 3v3 allies): '+P+' pass, '+F+' fail ---');
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
