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
  // ── v5.1.73 P2.1: weight-based loadout DATA + effects (neutral at default → P1 byte-identical) ──
  ok('BB_WEAPONS/BB_ARMOR/BB_RPS exist + sized',Array.isArray(BB_WEAPONS)&&BB_WEAPONS.length>=5&&Array.isArray(BB_ARMOR)&&BB_ARMOR.length>=4&&!!BB_RPS);
  ok('every weapon has id/cls/weight/deal/take',BB_WEAPONS.every(w=>w.id&&w.cls&&typeof w.weight==='number'&&typeof w.deal==='number'&&typeof w.take==='number'));
  ok('every armor has id/rps/weight/take/zone',BB_ARMOR.every(a=>a.id&&a.rps&&typeof a.weight==='number'&&typeof a.take==='number'&&a.zone));
  {const n=bbResolveLoadout(null);
   ok('default loadout is NEUTRAL (weight 0, mults 1, mobMax=MOB)',n.weight===0&&n.speedMul===1&&n.turnMul===1&&n.mobMax===BB.MOB&&n.deal===1&&n.take===1&&n.zone.front===1&&n.zone.side===1&&n.zone.rear===1);
   const h=bbResolveLoadout({weapon:'spinner',armor:'hardplate'});
   ok('heavy loadout: slower + sluggish + bigger mob bar + more deal',h.weight>0&&h.speedMul<1&&h.turnMul<1&&h.mobMax>BB.MOB&&h.deal>1);
   const l=bbResolveLoadout({weapon:'none',armor:'light'});
   ok('light loadout: fragile (take>1) and not slowed',l.take>1&&l.speedMul===1&&l.mobMax===BB.MOB);}
  ok('RPS: flame BEATS hardplate, FOLDS to heatshield',bbRps('thermal','hardplate')>1&&bbRps('thermal','heatshield')<1);
  ok('RPS: kinetic FOLDS to hardplate, SHREDS light',bbRps('kineticSpin','hardplate')<1&&bbRps('kineticSpin','light')>1);
  ok('RPS: neutral classes default to 1',bbRps('none','balanced')===1&&bbRps('control','hardplate')===1);
  {const hl=bbResolveLoadout({weapon:'spinner',armor:'hardplate'});
   ok('heavy bot (full mob) drives slower than default (full mob)',bbSpeed({mob:hl.mobMax,ld:hl})<bbSpeed({mob:BB.MOB}));
   ok('bbSpeed byte-identical for a bot with no loadout',bbSpeed({mob:BB.MOB})===1&&bbSpeed({mob:0})===0);}
  // bbApplyHit applies deal × take × zone × RPS — flame(deal .7) vs hardplate(take .7, rear zone .85, rps 1.5)
  {const atk=Object.assign(mk(),{side:0,ld:bbResolveLoadout({weapon:'flame',armor:'balanced'})});
   const vic=Object.assign(mk(),{side:1,ld:bbResolveLoadout({weapon:'none',armor:'hardplate'})});
   bb2.bots=[atk,vic];bb2.result=null;vic.inv=0;vic.hp=BB.HP;
   bbApplyHit(vic,'rear',20,0);const want=20*0.7*0.7*0.85*1.5;
   ok('bbApplyHit scales by deal×take×zone×RPS (Δhp='+(BB.HP-vic.hp).toFixed(2)+'≈'+want.toFixed(2)+')',Math.abs((BB.HP-vic.hp)-want)<0.01);}
  {const a2=Object.assign(mk(),{side:0,ld:bbResolveLoadout(null)}),v2=Object.assign(mk(),{side:1,ld:bbResolveLoadout(null)});
   bb2.bots=[a2,v2];v2.inv=0;v2.hp=BB.HP;bbApplyHit(v2,'rear',30,0);
   ok('default loadout → RAW damage (P1 unchanged)',v2.hp===BB.HP-30);}
  startBB(0,2);
  ok('spawned bots carry a neutral loadout (mob=MOB, ld present)',bb2.bots.every(b=>!!b.ld&&b.mob===BB.MOB&&b.ld.weapon==='none'&&b.ld.armor==='balanced'));
  // ── v5.1.76 P2.2: weapon FIRE behavior (SPINNER / PISTON / FLAMETHROWER / WEDGE) ──
  const bbBotWith=(weapon,armor,side,bind,cpu)=>{const ld=bbResolveLoadout({weapon:weapon,armor:armor});
    return {x:0,y:0,h:0,side:side|0,col:'#fff',mob:ld.mobMax,hp:BB.HP,inv:0,dead:false,dmgDealt:0,boostT:0,boostCd:0,
      ctl:{bind:bind|0,type:cpu?'cpu':'human',brain:cpu?{inp:{vx:0,vy:0,vr:0},fire:false}:null},ld:ld,spin:0,pistCd:0,pinT:0,burn:0,heat:{},firing:false,_inp:{vx:0,vy:0,vr:0},_vis:null};};
  {const a=bbBotWith('spinner','balanced',0,0,false);playerBind[0]={type:'kb'};
   kbSpaceHeld=true;ok('FIRE: keyboard Space fires the weapon',bbWeaponFiring(a)===true);
   kbSpaceHeld=false;fireBtnPressed=false;ok('FIRE: released = not firing',bbWeaponFiring(a)===false);
   const cpu=bbBotWith('spinner','balanced',0,1,true);cpu.ctl.brain.fire=true;ok('FIRE: CPU fires via brain.fire',bbWeaponFiring(cpu)===true);}
  {const a=bbBotWith('spinner','balanced',0,0,true);a.ctl.brain.fire=true;bb2.bots=[a];bb2.result=null;
   for(let i=0;i<60;i++)bbWeaponPre(1/60);ok('SPINNER spins up to full while firing ('+a.spin.toFixed(2)+')',a.spin>0.95);
   a.ctl.brain.fire=false;for(let i=0;i<60;i++)bbWeaponPre(1/60);ok('SPINNER spins down when released',a.spin<0.05);
   a.spin=1;ok('spun-up SPINNER bites on contact (≈spinDmg, ignores closing speed)',Math.abs(bbContactDmg(a,5)-BB_W.spinDmg)<1e-9);
   a.spin=0;ok('idle SPINNER deals only RAM damage',bbContactDmg(a,5)===5);}
  {const a=bbBotWith('piston','balanced',0,0,true);a.ctl.brain.fire=true;a.x=100;a.y=100;a.h=0;a.pistCd=0;
   const c=bbBotWith('none','balanced',1,1,true);c.x=100+RR*1.5;c.y=100;c.h=0;c.hp=BB.HP;c.inv=0;
   bb2.bots=[a,c];bb2.result=null;bbWeaponPre(1/60);bbWeaponFire(1/60);
   ok('PISTON strikes a foe in its front arc (hp '+BB.HP+'→'+c.hp.toFixed(0)+', cd set)',c.hp<BB.HP&&a.pistCd>0.5);
   const hp1=c.hp;bbWeaponPre(1/60);bbWeaponFire(1/60);ok('PISTON respects its cooldown (no 2nd hit yet)',c.hp===hp1);
   const a2=bbBotWith('piston','balanced',0,0,true);a2.ctl.brain.fire=true;a2.x=100;a2.y=100;a2.h=0;a2.pistCd=0;
   const c2=bbBotWith('none','balanced',1,1,true);c2.x=100;c2.y=100-RR*1.5;c2.hp=BB.HP;c2.inv=0;
   bb2.bots=[a2,c2];bbWeaponPre(1/60);bbWeaponFire(1/60);ok('PISTON misses a foe outside the front arc',c2.hp===BB.HP);}
  {const a=bbBotWith('flame','balanced',0,0,true);a.ctl.brain.fire=true;a.x=100;a.y=100;a.h=0;a.heat={};
   const c=bbBotWith('none','hardplate',1,1,true);c.x=100+RR*1.5;c.y=100;c.hp=BB.HP;c.inv=0;
   bb2.bots=[a,c];bb2.result=null;bbWeaponPre(1/60);bbWeaponFire(0.3);
   ok('FLAME: below dwell does NO damage yet (heat '+(a.heat[1]||0).toFixed(2)+')',c.hp===BB.HP&&a.heat[1]>0&&a.heat[1]<BB_W.flameDwell);
   bbWeaponFire(0.4);ok('FLAME: after heat-up it BURNS (hp '+BB.HP+'→'+c.hp.toFixed(1)+', burn>0)',c.hp<BB.HP&&(c.burn||0)>0);
   c.x=900;bbWeaponFire(1.0);ok('FLAME: heat decays when the foe leaves the cone',a.heat[1]<0.2);
   c.x=100+RR*1.5;c.hp=BB.HP;c.inv=0;c.burn=0;bbApplyHit(c,'front',30,0);ok('kinetic FRONT hit is immune',c.hp===BB.HP);
   c.inv=0;bbApplyFlame(c,30,0);ok('FLAME ignores front armor (burns through)',c.hp<BB.HP);}
  {const a=bbBotWith('wedge','balanced',0,0,true);
   ok('WEDGE softens its own ram damage (control, not damage)',Math.abs(bbContactDmg(a,20)-20*BB_W.wedgeDmg)<1e-9);
   const c=bbBotWith('none','balanced',1,1,true),free=bbBotWith('none','balanced',1,2,true);c.pinT=0.25;free.pinT=0;
   ok('a WEDGE-pinned bot drives slower than a free one',bbSpeed(c)<bbSpeed(free));}
  ok('default-weapon contact damage = raw ram (P1 unchanged)',bbContactDmg(bbBotWith('none','balanced',0,0,true),17)===17);
  {startBB(0,2);for(let i=0;i<4;i++)m2.drive[i]={kind:'main',idx:1,name:'A',c:'#0ff'};
   bb2.bots=[bbBotWith('spinner','balanced',0,0,true),bbBotWith('piston','balanced',1,1,true),bbBotWith('flame','balanced',0,2,true),bbBotWith('wedge','balanced',1,3,true)];
   bb2.bots[2].firing=true;bb2.bots[0].spin=1;bb2.bots[1]._pistFx=0.1;bb2.cd=0;bb2.result=null;
   let dThrew=false;try{drawBB();}catch(e){dThrew=true;console.log('   drawBB weapon err:',e.message);}
   ok('drawBB renders all 4 weapons without throwing',!dThrew);}
  // ── v5.1.77 P2.3: FLAME blow-up + mutual-destruction DRAW + death FX ──
  {const x=bbBotWith('none','balanced',1,1,true);x.hp=BB.HP;x.burn=0;bb2.bots=[bbBotWith('flame','balanced',0,0,true),x];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   bbApplyFlame(x,BB_W.blowUp-2,0);const hpBefore=x.hp;ok('below the blow-up threshold: still alive (burn '+x.burn.toFixed(0)+', hp '+x.hp.toFixed(0)+')',!x.dead);
   bbApplyFlame(x,4,0);ok('crossing the blow-up threshold DETONATES despite '+hpBefore.toFixed(0)+' HP left',x.dead===true&&x.hp===0);
   ok('blow-up spawns an explosion blast + scatter debris',bb2.blasts.length>0&&bb2.deb.length>0);}
  {const b=bbBotWith('none','balanced',0,0,true);b.burn=30;bb2.bots=[b];bb2.result=null;
   for(let i=0;i<60;i++)bbWeaponPre(1/60);ok('the blow-up meter COOLS when not being flamed ('+b.burn.toFixed(0)+'<30)',b.burn<30);}
  {const a=bbBotWith('none','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.x=100;a.y=100;c.x=110;c.y=100;a.hp=10;c.hp=10;bb2.bots=[a,c];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   bbKill(a,1);ok('MUTUAL DESTRUCTION: the blast KOs a near-dead adjacent foe',c.dead===true);
   ok('last bot of each side caught → DRAW',bb2.result==='draw');}
  {const a=bbBotWith('none','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.x=100;a.y=100;c.x=110;c.y=100;a.hp=10;c.hp=BB.HP;bb2.bots=[a,c];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   bbKill(a,1);ok('a HEALTHY bot SURVIVES the blast (only near-dead are caught)',!c.dead&&bb2.result===1);}
  {bb2.bots=[bbBotWith('none','balanced',0,0,true),bbBotWith('none','balanced',1,1,true)];bb2.bots.forEach(b=>b.dead=true);bb2.result=null;
   bbCheckResult(0);ok('bbCheckResult: nobody alive → draw',bb2.result==='draw');}
  {startBB(0,2);bb2.blasts=[{x:300,y:300,t:0.3,r:RR*3}];bb2.deb=[{x:300,y:300,vx:50,vy:-30,r:1,vr:5,t:0.4,sz:4,col:'#f55'}];bb2.result='draw';bb2.cd=0;
   let dThrew=false;try{drawBB();}catch(e){dThrew=true;console.log('   draw/blast err:',e.message);}
   ok('drawBB renders blasts + debris + the DRAW overlay without throwing',!dThrew);}
  // ── v5.1.78 P2.4: per-wheel health → handling faults ──
  const wheels4=()=>[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false}));
  {const v=bbBotWith('none','balanced',0,0,true);v.x=300;v.y=300;v.h=0;v.wheels=wheels4();bb2.bots=[v];bb2.result=null;
   for(let i=0;i<6;i++){v.inv=0;v.mob=BB.MOB;v.hp=BB.HP;bbApplyHit(v,'side',20,null,300,360);} // repeated hits from the RIGHT (fromY>vy)
   ok('per-wheel: a focused SIDE attack kills corner wheel(s)',v.wheels.some(w=>w.dead));
   ok('dead corners are on the struck (right) side',v.wheels[1].dead||v.wheels[3].dead);
   ok('a dead wheel produces a handling fault',!!wheelFault(v));}
  ok('mob still drains normally with wheels present (P1 path intact)',(()=>{const v=bbBotWith('none','balanced',1,1,true);v.wheels=wheels4();v.mob=BB.MOB;v.hp=BB.HP;v.inv=0;bb2.bots=[v];bbApplyHit(v,'side',40,null);return v.mob===BB.MOB-40;})());
  {const t=bbBotWith('none','balanced',0,0,true);t.wheels=[{hp:40,dead:false},{hp:0,dead:true},{hp:40,dead:false},{hp:40,dead:false}]; // FR (right) dead
   m2.drive[0]={kind:'main',idx:DRIVES.findIndex(d=>d.id==='tank'),name:'Tank',c:'#0f0'};
   const wf=wheelFault(t);ok('wheelFault: a dead RIGHT wheel biases right (turn>0), tank family',!!wf&&wf.turn>0&&wf.fam==='tank');
   m2.drive[0]={kind:'holo',idx:0,name:'Mec',c:'#0ff'};ok('wheelFault: a holo/swerve bot DRIFTS instead (fam swerve)',wheelFault(t).fam==='swerve');}
  ok('bbDriveFamily: arcade→tank, steer→steer, holo→swerve',(()=>{m2.drive[0]={kind:'main',idx:DRIVES.findIndex(d=>d.id==='arcade')};const a=bbDriveFamily(0);m2.drive[0]={kind:'steer',idx:0};const s=bbDriveFamily(0);m2.drive[0]={kind:'holo',idx:0};const h=bbDriveFamily(0);return a==='tank'&&s==='steer'&&h==='swerve';})());
  {startBB(0,2);const b=bb2.bots[0];b.wheels=[{hp:40,dead:false},{hp:0,dead:true},{hp:40,dead:false},{hp:0,dead:true}]; // both RIGHT wheels dead
   m2.drive[b.ctl.bind]={kind:'main',idx:DRIVES.findIndex(d=>d.id==='tank'),name:'Tank',c:'#0f0'};
   b.x=300;b.y=300;b.h=0;b.mob=BB.MOB;const h0=b.h;bb2.cd=0;updateBB(1/60);
   ok('a tank with dead RIGHT wheels turn-biases in the match (heading drifts, '+h0.toFixed(2)+'→'+b.h.toFixed(2)+')',b.h!==h0);}
  ok('no dead wheels → no fault (P1 byte-identical)',wheelFault(bbBotWith('none','balanced',0,0,true))===null||(()=>{const v=bbBotWith('none','balanced',0,0,true);v.wheels=wheels4();return wheelFault(v)===null;})());
  {startBB(0,2);bb2.bots[0].wheels=[{hp:40,dead:false},{hp:0,dead:true},{hp:0,dead:true},{hp:40,dead:false}];bb2.cd=0;bb2.result=null;
   let dThrew=false;try{drawBB();}catch(e){dThrew=true;console.log('   wheels draw err:',e.message);}
   ok('drawBB renders dead-wheel marks without throwing',!dThrew);}
  // ── v5.1.79 P2.5: weapon/armor PICKER (grid tap-cyclers) + stat readout + round-trip to the spawned bot ──
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;tankGridSetCpu(0);
   const ld=bbSeatLoadout(0);ok('a BB seat lazily gets a default loadout',ld.weapon==='none'&&ld.armor==='balanced');
   bbCycleField(ld,'weapon',1);ok('cycling WEAPON advances to the next id',ld.weapon===BB_WEAPONS[1].id);
   bbCycleField(ld,'weapon',-1);ok('cycling WEAPON back wraps to RAM ONLY',ld.weapon==='none');
   bbCycleField(ld,'armor',-1);ok('cycling ARMOR backward wraps to the last',ld.armor===BB_ARMOR[BB_ARMOR.length-1].id);
   m2.tseats=null;}
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;tour=null;tankGridSetCpu(0);tankGridSetCpu(3);
   m2.tseats[0].loadout={weapon:'spinner',armor:'hardplate'};m2.tseats[3].loadout={weapon:'flame',armor:'heatshield'};
   startP2BB();const red=bb2.bots.find(b=>b.ctl.bind===0),blue=bb2.bots.find(b=>b.ctl.bind===3);
   ok('grid loadout ROUND-TRIPS to the spawned bot (RED spinner/hardplate)',!!red&&red.ld.weapon==='spinner'&&red.ld.armor==='hardplate');
   ok('grid loadout ROUND-TRIPS (BLUE flame/heatshield)',!!blue&&blue.ld.weapon==='flame'&&blue.ld.armor==='heatshield');
   m2.tseats=null;}
  {const light=bbStatBars({weapon:'none',armor:'light'}),heavy=bbStatBars({weapon:'spinner',armor:'hardplate'});
   ok('stat readout: light build is FASTER than heavy',light.speed>heavy.speed);
   ok('stat readout: heavy/hardplate build is TOUGHER',heavy.tough>light.tough);
   ok('stat readout: spinner build hits HARDER',heavy.dmg>light.dmg);
   ok('stat readout: all four bars in 0..1',[light,heavy].every(s=>[s.speed,s.mob,s.dmg,s.tough].every(v=>v>=0&&v<=1)));}
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;phase='p2claim';tankGridSetCpu(0);tankGridSetCpu(3);m2.tseats[0].loadout={weapon:'spinner',armor:'light'};
   let dThrew=false;try{drawTankGrid();}catch(e){dThrew=true;console.log('   grid draw err:',e.message);}
   ok('drawTankGrid renders BB loadout pickers without throwing',!dThrew);
   // a click on the weapon ◀▶ rects cycles the seat's weapon
   const lr=bbSeatLoadRects(tankCellRect(0));const before=m2.tseats[0].loadout.weapon;tankGridClick(lr.wR.x+10,lr.wR.y+10);
   ok('clicking the seat weapon ▶ cycles its loadout',m2.tseats[0].loadout.weapon!==before);
   m2.tseats=null;}
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
