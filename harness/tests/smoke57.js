const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};

  // ── 1. mode wiring: BATTLEBOTS is a selectable mode with its own settings ──
  ok('BATTLEBOTS is in M2_MODES',M2_MODES.some(m=>m.id==='battlebots'));
  ok('5 modes now lay out without overflow',(()=>{const last=p2ModeRect(M2_MODES.length-1);return last.x+last.w<=CW+1&&p2ModeRect(0).x>=0;})());
  m2.mode='battlebots';const bbrows=p2SettingsRows();
  ok('battlebots settings = TEAM FORMAT + BEST OF + ARENA + GAME MODE + LIVES + TIME LIMIT',bbrows.length===6&&bbrows[0].k==='tfmt'&&bbrows[1].k==='bestOf'&&bbrows[2].k==='map'&&bbrows[3].k==='bbmode'&&bbrows[4].k==='bblives'&&bbrows[5].k==='bbtime');

  // ── 2. start a 1v1 battlebots match (human vs CPU) ──
  const startBB=(map,cpuTier)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='battlebots';
    m2.set.bestOf=1;m2.set.map=map||0;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:cpuTier!=null?cpuTier:2}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2BB();updateBB(3.1);}; // grid claim is the v5.1.64 path; tests drive the legacy 1v1 roster directly
  startBB(0,2);
  ok('match starts: 2 bots, phase p2bb',phase==='p2bb'&&!!bb2&&bb2.bots.length===2);
  ok('bots have MOBILITY + HP bars full (at their own mobMax / mhp)',bb2.bots.every(b=>b.mob===(b.ld?b.ld.mobMax:BB.MOB)&&b.hp===b.mhp));
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
  ok('full mobility → full speed scale (×BB.spd, RoboRumble runs nimbler)',Math.abs(bbSpeed({mob:BB.MOB})-BB.spd)<1e-9&&BB.spd>1);
  ok('zero mobility → cannot drive (scale 0)',bbSpeed({mob:0})===0);
  ok('low mobility → reduced speed, but a higher floor (mobFloor) softens the loss',bbSpeed({mob:50})>0&&bbSpeed({mob:50})<bbSpeed({mob:BB.MOB})&&bbSpeed({mob:1})>=BB.mobFloor*BB.spd*0.9);

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
  // ── v5.1.202: a RED-side GRID seat shows ITS typed name + RED identity (the HUD read p2Name(bind) → a red seat at index 1 wrongly showed 'BLUE') ──
  {m2.mode='battlebots';tour=null;m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;
   m2.tseats[1]={type:'human',dev:{type:'kb'},tier:0,drive:{kind:'main',idx:0},sens:1,name:'ZIGGY'}; // RED seat 2 (grid index 1), typed name
   tankGridSetCpu(3); // a BLUE opponent so the match is valid
   startP2BB();const me=bb2.bots.find(b=>b.ctl.type!=='cpu');
   ok('grid RED-2 human spawns on the RED side (0), not blue',!!me&&me.side===0);
   ok('grid RED-2 HUD label is the TYPED name, not "BLUE"',!!me&&(me.ctl.name||p2Name(me.ctl.bind))==='ZIGGY');
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
   ok('light loadout: fragile (take>1) and FAST (speedMul>1)',l.take>1&&l.speedMul>1&&l.mobMax===BB.MOB);
   // v5.1.156–157 armor pass: LIGHT speed, HARDPLATE toughness+HP, RUNFLAT, REACTIVE
   ok('LIGHT armor gives a real speed boost',bbResolveLoadout({weapon:'none',armor:'light'}).speedMul>=1.25);
   {const hp=bbResolveLoadout({weapon:'none',armor:'hardplate'});ok('HARDPLATE is tougher (take↓) + a bigger HP pool (hpMul>1)',hp.take<0.7&&hp.hpMul>1.2);}
   ok('RUNFLAT armor exists + flagged; REACTIVE armor exists + flagged',bbResolveLoadout({weapon:'none',armor:'runflat'}).runflat===true&&bbResolveLoadout({weapon:'none',armor:'reactive'}).reactive===true);
   {const rf={ld:bbResolveLoadout({weapon:'none',armor:'runflat'}),mob:0};ok('RUNFLAT: a 0-mobility bot still crawls (not immobilized)',bbSpeed(rf)>0);
    const norm={ld:bbResolveLoadout({weapon:'none',armor:'balanced'}),mob:0};ok('non-runflat: 0 mobility = immobilized',bbSpeed(norm)===0);}}
  ok('RPS: flame BEATS hardplate, FOLDS to heatshield',bbRps('thermal','hardplate')>1&&bbRps('thermal','heatshield')<1);
  ok('RPS: kinetic FOLDS to hardplate, SHREDS light',bbRps('kineticSpin','hardplate')<1&&bbRps('kineticSpin','light')>1);
  ok('RPS: neutral classes default to 1',bbRps('none','balanced')===1&&bbRps('control','hardplate')===1);
  {const hl=bbResolveLoadout({weapon:'spinner',armor:'hardplate'});
   ok('heavy bot (full mob) drives slower than default (full mob)',bbSpeed({mob:hl.mobMax,ld:hl})<bbSpeed({mob:BB.MOB}));
   ok('bbSpeed for a no-loadout bot = the RoboRumble base (×BB.spd), 0 at no mobility',bbSpeed({mob:BB.MOB})===BB.spd&&bbSpeed({mob:0})===0);}
  // bbApplyHit applies deal × take × zone × RPS — flame(deal .7) vs hardplate(take .7, rear zone .85, rps 1.5)
  {const atk=Object.assign(mk(),{side:0,ld:bbResolveLoadout({weapon:'flame',armor:'balanced'})});
   const vic=Object.assign(mk(),{side:1,ld:bbResolveLoadout({weapon:'none',armor:'hardplate'})});
   bb2.bots=[atk,vic];bb2.result=null;vic.inv=0;vic.hp=BB.HP;
   bbApplyHit(vic,'rear',20,0);const want=20*atk.ld.deal*vic.ld.take*vic.ld.zone.rear*bbRps(atk.ld.wcls,vic.ld.arps);
   ok('bbApplyHit scales by deal×take×zone×RPS (Δhp='+(BB.HP-vic.hp).toFixed(2)+'≈'+want.toFixed(2)+')',Math.abs((BB.HP-vic.hp)-want)<0.01);}
  {const a2=Object.assign(mk(),{side:0,ld:bbResolveLoadout(null)}),v2=Object.assign(mk(),{side:1,ld:bbResolveLoadout(null)});
   bb2.bots=[a2,v2];v2.inv=0;v2.hp=BB.HP;bbApplyHit(v2,'rear',30,0);
   ok('default loadout → RAW damage (P1 unchanged)',v2.hp===BB.HP-30);}
  startBB(0,2);
  ok('spawned HUMAN bot stays neutral; CPUs auto-arm (P2.6)',(()=>{const h=bb2.bots.find(b=>b.ctl.type!=='cpu'),c=bb2.bots.find(b=>b.ctl.type==='cpu');return !!h&&h.ld.weapon==='none'&&h.ld.armor==='balanced'&&h.mob===BB.MOB&&!!c&&!!c.ld;})());
  // ── v5.1.76 P2.2: weapon FIRE behavior (SPINNER / PISTON / FLAMETHROWER / WEDGE) ──
  const bbBotWith=(weapon,armor,side,bind,cpu)=>{const ld=bbResolveLoadout({weapon:weapon,armor:armor});
    return {x:0,y:0,h:0,side:side|0,col:'#fff',mob:ld.mobMax,hp:BB.HP,inv:0,dead:false,dmgDealt:0,boostT:0,boostCd:0,
      ctl:{bind:bind|0,type:cpu?'cpu':'human',brain:cpu?{inp:{vx:0,vy:0,vr:0},fire:false}:null},ld:ld,spin:0,pistCd:0,pinT:0,burn:0,outT:0,heat:{},firing:false,_inp:{vx:0,vy:0,vr:0},_vis:null};};
  {const a=bbBotWith('spinner','balanced',0,0,false);playerBind[0]={type:'kb'};
   kbSpaceHeld=true;ok('FIRE: keyboard Space fires the weapon',bbWeaponFiring(a)===true);
   kbSpaceHeld=false;fireBtnPressed=false;ok('FIRE: released = not firing',bbWeaponFiring(a)===false);
   const cpu=bbBotWith('spinner','balanced',0,1,true);cpu.ctl.brain.fire=true;ok('FIRE: CPU fires via brain.fire',bbWeaponFiring(cpu)===true);}
  {const a=bbBotWith('spinner','balanced',0,0,true);a.ctl.brain.fire=true;bb2.bots=[a];bb2.result=null;
   for(let i=0;i<90;i++)bbWeaponPre(1/60);ok('SPINNER spins up to full while firing ('+a.spin.toFixed(2)+', slower ramp now)',a.spin>0.95);
   a.ctl.brain.fire=false;for(let i=0;i<90;i++)bbWeaponPre(1/60);ok('SPINNER spins down when released',a.spin<0.05);
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
  // ── v5.1.211 FLAME human/CPU FORK restored + flame torches DRONES ──
  {const hA=bbBotWith('flame','balanced',0,0,false),cA=bbBotWith('flame','balanced',0,2,true),v=bbBotWith('none','balanced',1,1,true);
   v.hp=BB.HP;v.inv=0;v.burn=0;bb2.bots=[hA,v];bbApplyFlame(v,BB_W.flameDps*0.1,0);const humanBurn=v.burn;
   v.burn=0;v.hp=BB.HP;v.inv=0;bb2.bots=[cA,v];bbApplyFlame(v,BB_W.flameDps*0.1,0);const cpuBurn=v.burn;
   ok('FLAME FORK: a HUMAN flame fills the blow-up meter FASTER than a CPU',humanBurn>cpuBurn*1.5&&cpuBurn>0);
   const fa=bbBotWith('flame','balanced',0,0,true);fa.ctl.brain.fire=true;fa.x=100;fa.y=100;fa.h=0;fa.heat={};
   const drone={x:100+RR*2,y:100,h:0,side:1,owner:null,col:'#fff',dead:false,kind:'medic',hp:BB_W.medicHp,mhp:BB_W.medicHp,hurtFx:0};
   bb2.bots=[fa];bb2.minis=[drone];bb2.result=null;bbWeaponPre(1/60);const dh0=drone.hp;for(let i=0;i<40;i++)bbWeaponFire(1/60);
   ok('FLAME torches an enemy DRONE (pit-bot) caught in its cone',drone.hp<dh0);bb2.minis=[];}
  // ── v5.1.211 PINCER mid-clamp takes MAJORLY reduced damage ──
  {const pv=bbBotWith('pincer','balanced',0,0,true),foe=bbBotWith('none','balanced',1,1,true);
   pv.x=300;pv.y=300;pv.hp=BB.HP;pv.inv=0;bb2.bots=[pv,foe];
   const h0=pv.hp;bbApplyHit(pv,'rear',60,1);const dmgFree=h0-pv.hp;
   pv.hp=BB.HP;pv.inv=0;pv.grab=foe;foe.held=pv;
   const h1=pv.hp;bbApplyHit(pv,'rear',60,1);const dmgClamp=h1-pv.hp;
   ok('PINCER takes MAJORLY reduced damage while clamping a foe',dmgClamp>0&&dmgClamp<dmgFree*0.5);
   pv.grab=null;foe.held=null;}
  // ── v5.1.213 TIER DIFFICULTY: a CPU deals tier-scaled damage to a HUMAN (rookie softer, champ harder); CPU↔CPU is UNSCALED so weapon balance is untouched ──
  {const champ=bbBotWith('none','balanced',0,0,true);champ.ctl.tier=3;champ.x=300;champ.y=300;
   const rook=bbBotWith('none','balanced',0,2,true);rook.ctl.tier=0;rook.x=300;rook.y=300;
   const humV=()=>{const v=bbBotWith('none','balanced',1,1,false);v.x=400;v.y=300;v.hp=BB.HP;v.inv=0;return v;};
   let v=humV();bb2.bots=[champ,v];bb2.result=null;const c0=v.hp;bbApplyHit(v,'rear',100,0);const champDmg=c0-v.hp;
   v=humV();bb2.bots=[rook,v];const r0=v.hp;bbApplyHit(v,'rear',100,0);const rookDmg=r0-v.hp;
   ok('TIER: a CHAMPION CPU hits a HUMAN harder than a ROOKIE CPU (1.10× vs 0.90×)',champDmg>rookDmg&&Math.abs(champDmg/rookDmg-(BB_TIER_DMG[3]/BB_TIER_DMG[0]))<0.02);
   const cv=bbBotWith('none','balanced',1,1,true);cv.x=400;cv.y=300;cv.hp=BB.HP;cv.inv=0;bb2.bots=[champ,cv];const cc0=cv.hp;bbApplyHit(cv,'rear',100,0);const champVsCpu=cc0-cv.hp;
   const cv2=bbBotWith('none','balanced',1,2,true);cv2.x=400;cv2.y=300;cv2.hp=BB.HP;cv2.inv=0;bb2.bots=[rook,cv2];const cr0=cv2.hp;bbApplyHit(cv2,'rear',100,0);const rookVsCpu=cr0-cv2.hp;
   ok('TIER: CPU→CPU damage is UNSCALED (champ == rookie vs a CPU — weapon balance safe)',champVsCpu>0&&Math.abs(champVsCpu-rookVsCpu)<1e-6);}
  {const a=bbBotWith('wedge','balanced',0,0,true);
   ok('WEDGE softens its own ram damage (control, not damage)',Math.abs(bbContactDmg(a,20)-20*BB_W.wedgeDmg)<1e-9);
   const c=bbBotWith('none','balanced',1,1,true),free=bbBotWith('none','balanced',1,2,true);c.pinT=0.25;free.pinT=0;
   ok('a WEDGE-pinned bot drives slower than a free one',bbSpeed(c)<bbSpeed(free));}
  // ── v5.1.95 COMBAT OVERHAUL: HP↑, piston front-pierce, spinner bleed/wall-self-dmg, flame fuel+range, count-out, forward dash ──
  ok('bots have a lot more HP + mobility (v5.1.145: HP 560, MOB 140 — tougher, longer fights)',BB.HP===560&&BB.MOB===140&&BB.HP>250);
  {const v=bbBotWith('none','balanced',1,1,true);v.hp=BB.HP;v.inv=0;v.ld.take=1;v.ld.zone={front:1,side:1,rear:1};v.ld.arps='balanced';
   bb2.bots=[bbBotWith('piston','balanced',0,0,true),v];const hp0=v.hp;
   bbApplyHit(v,'front',40,0,v.x+10,v.y);ok('a plain FRONT hit is still immune (RAM shrugged off)',v.hp===hp0);
   v.inv=0;bbApplyHit(v,'front',40,0,v.x+10,v.y,BB_W.pistFront);ok('PISTON front-pierce CRACKS the armored front',v.hp<hp0&&v.hp>=hp0-40);
   v.inv=0;const hpP=v.hp;bbApplyHit(v,'front',BB_W.spinDmg,0,v.x+10,v.y,BB_W.spinFront);ok('SPINNER pierces the front too (bites a turtling foe)',v.hp<hpP);}
  // ── v5.1.180 FLAME STICKINESS: a HUMAN flamer slows the victim (work out of the cone); CPU flame doesn't (balance) ──
  {startBB(0,2);bb2.cd=0;bb2.result=null;const hf=bbBotWith('flame','balanced',0,0,false),v=bbBotWith('none','balanced',1,1,true);
   v.x=300;v.y=300;v.mob=BB.MOB;v.hp=BB.HP;v.inv=0;v._flameSlowT=0;bb2.bots=[hf,v];
   const spd0=bbSpeed(v);bbApplyFlame(v,5,0);ok('FLAME STICKINESS: a HUMAN flamer slows the victim',(v._flameSlowT||0)>0&&bbSpeed(v)<spd0);
   const cf=bbBotWith('flame','balanced',0,0,true);v._flameSlowT=0;v.hp=BB.HP;bb2.bots=[cf,v];bbApplyFlame(v,5,0);ok('FLAME STICKINESS: a CPU flamer does NOT slow (balance-decoupled)',(v._flameSlowT||0)===0);
   v._flameSlowT=BB_W.flameSlowT;bb2.bots=[v];for(let i=0;i<60;i++)bbWeaponPre(1/60);ok('FLAME STICKINESS: the slow decays once out of the cone',(v._flameSlowT||0)===0);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('spinner','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.ctl.brain.fire=true;a.x=300;a.y=300;a.h=0;a.spin=1;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;c.x=300+RR*1.2;c.y=300;c.hp=BB.HP;c.mob=BB.MOB;c.inv=0;
   bb2.bots=[a,c];updateBB(1/60);ok('SPINNER sheds spin when it bites (slows on every hit)',a.spin<0.95);}
  // ── v5.1.179 SPINNER REACH: a spun-up disc bites 360° BEYOND body contact (out to RR*2+RR*spinReach) ──
  {startBB(0,2);bb2.cd=0;bb2.result=null;bb2.t=5;const a=bbBotWith('spinner','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.x=300;a.y=300;a.h=0;a.spin=1;a.inv=0;c.x=300+RR*2.4;c.y=300;c.hp=BB.HP;c.inv=0;c.mob=BB.MOB;bb2.bots=[a,c];a._spReachCd=null;
   const h0=c.hp;bbSpinReach(1/60);ok('SPINNER REACH: a spun-up disc bites a foe just BEYOND body contact',c.hp<h0);
   const c2=bbBotWith('none','balanced',1,2,true);c2.x=300+RR*4;c2.y=300;c2.hp=BB.HP;c2.inv=0;a._spReachCd=null;bb2.t=10;bb2.bots=[a,c2];
   const h2=c2.hp;bbSpinReach(1/60);ok('SPINNER REACH: a foe out past the disc is untouched',c2.hp===h2);
   a.spin=0;const c3=bbBotWith('none','balanced',1,3,true);c3.x=300+RR*2.4;c3.y=300;c3.hp=BB.HP;c3.inv=0;a._spReachCd=null;bb2.t=15;bb2.bots=[a,c3];
   const h3=c3.hp;bbSpinReach(1/60);ok('SPINNER REACH: an idle disc (not spun up) has no extended reach',c3.hp===h3);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('spinner','balanced',0,0,true);
   a.x=RR;a.y=300;a.h=Math.PI;a.spin=1;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;a.boostT=BOOST.dur;bb2.bots=[a];
   const hp0=a.hp;updateBB(1/60);ok('a spun-up SPINNER that slams a WALL takes self-damage + bleeds spin',a.hp<hp0&&a.spin<1);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('none','balanced',0,0,true);
   a.x=600;a.y=300;a.h=Math.PI/2;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;a.boostT=BOOST.dur;bb2.bots=[a];updateBB(1/60);
   ok('RAM DASH lunges FORWARD along the nose (h=π/2 → +y), not the stick',a._inp.vy>50&&Math.abs(a._inp.vx)<1);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bb2.bots[0],c=bb2.bots[1];
   a.x=100;a.y=100;c.x=1100;c.y=600;a.mob=0;c.mob=0;a.hp=50;c.hp=50;a.outT=0;c.outT=0;a.inv=0;c.inv=0;a.dead=false;c.dead=false;
   a.ld.perk='none';c.ld.perk='none';bb2.minis=[]; // v5.1.161 no medic/harasser drone (a PIT STOP medic would heal the mobility back and prevent the count-out)
   let ended=false;for(let i=0;i<Math.ceil((BB.countOut+0.5)*60)&&!ended;i++){updateBB(1/60);if(bb2.result!==null)ended=true;}
   ok('both-immobilized match ENDS via count-out (no soft-lock)',bb2.result!==null);
   ok('immobilized bots are counted out (KO)',bb2.bots[0].dead&&bb2.bots[1].dead);}
  {const a=bbBotWith('flame','balanced',0,0,true);a.x=100;a.y=100;a.h=0;a.heat={};
   const c=bbBotWith('none','balanced',1,1,true);c.x=100+RR*3.5;c.y=100;c.hp=BB.HP;c.inv=0;c.burn=0;bb2.bots=[a,c];bb2.result=null;
   for(let i=0;i<70;i++){a.firing=true;bbWeaponFire(1/60);}ok('FLAME has more REACH (a foe ~3.5×RR out still burns)',c.hp<BB.HP);}
  // v5.1.161: RECOIL self-damage REMOVED; SPINNER still sheds RPM per bite (re-spin); BUZZSAW holds its speed; WEDGE deflect still stalls a spinner
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('spinner','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.ctl.brain.fire=true;a.x=300;a.y=300;a.h=0;a.spin=1;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;c.x=300+RR*1.2;c.y=300;c.hp=BB.HP;c.mob=BB.MOB;c.inv=0;
   bb2.bots=[a,c];const ahp0=a.hp,sp0=a.spin;updateBB(1/60);ok('a SPINNER no longer self-damages on a bite (recoil removed)',a.hp>=ahp0-0.001);
   ok('a SPINNER still SHEDS RPM on a bite (must re-spin)',a.spin<sp0);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('buzzsaw','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   a.ctl.brain.fire=true;a.x=300;a.y=300;a.h=0;a.spin=1;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;c.x=300+RR*1.2;c.y=300;c.hp=BB.HP;c.mob=BB.MOB;c.inv=0;
   bb2.bots=[a,c];const ahp0=a.hp;updateBB(1/60);ok('a BUZZSAW HOLDS its speed after a bite (no re-spin) + no self-damage',a.spin>=0.999&&a.hp>=ahp0-0.001);}
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bbBotWith('spinner','balanced',0,0,true),w=bbBotWith('wedge','balanced',1,1,true);
   a.ctl.brain.fire=true;a.x=300;a.y=300;a.h=0;a.spin=1;a.mob=BB.MOB;a.hp=BB.HP;a.inv=0;w.x=300+RR*1.2;w.y=300;w.hp=BB.HP;w.mob=BB.MOB;w.inv=0;
   bb2.bots=[a,w];updateBB(1/60);ok('a WEDGE DEFLECTS a spinner — the disc fully stalls',a.spin===0);}
  // count-out gating: only a TRUE stalemate (no mobile foe), never an immobile bot a mobile foe can finish
  {startBB(0,2);bb2.cd=0;bb2.result=null;const a=bb2.bots[0],c=bb2.bots[1];
   a.x=100;a.y=100;a.mob=0;a.hp=BB.HP;a.outT=0;a.inv=0;a.dead=false;c.x=1100;c.y=600;c.mob=BB.MOB;c.hp=BB.HP;c.dead=false;
   for(let i=0;i<60;i++){a.mob=0;c.mob=BB.MOB;updateBB(1/60);}
   ok('an immobilized bot is NOT counted out while a foe can still finish it',(a.outT||0)===0);}
  ok('default-weapon contact damage = raw ram (P1 unchanged)',bbContactDmg(bbBotWith('none','balanced',0,0,true),17)===17);
  {startBB(0,2);for(let i=0;i<4;i++)m2.drive[i]={kind:'main',idx:1,name:'A',c:'#0ff'};
   bb2.bots=[bbBotWith('spinner','balanced',0,0,true),bbBotWith('piston','balanced',1,1,true),bbBotWith('flame','balanced',0,2,true),bbBotWith('wedge','balanced',1,3,true)];
   bb2.bots[2].firing=true;bb2.bots[0].spin=1;bb2.bots[1]._pistFx=0.1;bb2.cd=0;bb2.result=null;
   let dThrew=false;try{drawBB();}catch(e){dThrew=true;console.log('   drawBB weapon err:',e.message);}
   ok('drawBB renders all 4 weapons without throwing',!dThrew);}
  // ── v5.1.77 P2.3: FLAME blow-up + mutual-destruction DRAW + death FX ──
  {const x=bbBotWith('none','balanced',1,1,true);x.hp=BB.HP;x.burn=0;bb2.bots=[bbBotWith('flame','balanced',0,0,false),x];bb2.result=null;bb2.blasts=[];bb2.deb=[]; // v5.1.176 HUMAN flamer (burnBuild full) — the blow-up threshold test uses the human build path
   bbApplyFlame(x,(BB_W.blowUp-2)/BB_W.burnBuild,0);const hpBefore=x.hp;ok('below the blow-up threshold: still alive (burn '+x.burn.toFixed(0)+', hp '+x.hp.toFixed(0)+')',!x.dead); // feed scaled by burnBuild so it lands just UNDER blowUp regardless of the fill rate
   bbApplyFlame(x,4/BB_W.burnBuild,0);ok('crossing the blow-up threshold DETONATES despite '+hpBefore.toFixed(0)+' HP left',x.dead===true&&x.hp===0);
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
   const ld=bbSeatLoadout(0);ok('a BB seat lazily defaults to the DOZER blade (RAM-only no longer a default)',ld.weapon==='wedge'&&ld.armor==='balanced');
   ld.weapon='spinner';bbCycleField(ld,'weapon',1);ok('cycling WEAPON advances to the next pickable (spinner→piston)',ld.weapon===BB_WEAPONS[2].id);
   bbCycleField(ld,'weapon',-1);ok('cycling back returns + the cycler NEVER lands on RAM-ONLY/none',ld.weapon==='spinner'&&ld.weapon!=='none');
   bbCycleField(ld,'armor',-1);ok('cycling ARMOR backward wraps to the last',ld.armor===BB_ARMOR[BB_ARMOR.length-1].id);
   ld.perk='none';bbCycleField(ld,'perk',1);ok('cycling PERK from NONE → the first real perk',ld.perk===BB_PERKS_PICK[1].id&&ld.perk!=='none'); // v5.1.196 NONE is BB_PERKS_PICK[0] (pickable again)
   bbCycleField(ld,'perk',1);ok('cycling PERK forward advances to the next perk',ld.perk===BB_PERKS_PICK[2].id);
   ld.perk=BB_PERKS_PICK[0].id;bbCycleField(ld,'perk',-1);ok('cycling PERK backward from NONE wraps to the LAST perk',ld.perk===BB_PERKS_PICK[BB_PERKS_PICK.length-1].id);
   m2.tseats=null;}
  // ── v5.1.137: 3v3 grid AUTOBUILD-all-CPUs button ──
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;
   m2.tseats[0]={type:'human',dev:{type:'kb'},tier:0,drive:{kind:'main',idx:0},sens:1,name:'P1'}; // a human seat (must be left alone)
   tankGridSetCpu(1);tankGridSetCpu(4);const human0=m2.tseats[0].loadout; // two CPU seats
   ok('bbGridHasCpu detects CPU seats',bbGridHasCpu()===true);
   const n=bbGridAutobuildCpus();
   ok('AUTOBUILD CPUS rolls a loadout for every CPU seat',n===2&&!!m2.tseats[1].loadout&&!!m2.tseats[1].loadout.weapon&&!!m2.tseats[4].loadout);
   ok('AUTOBUILD CPUS leaves the human seat alone',m2.tseats[0].loadout===human0);
   m2.tseats=null;}
  // ── v5.1.136: the 1v1 claim LAYOUT picker now exposes a PERK row + carries it through ──
  {const r=bbClaimLoadRects(0);ok('1v1 claim loadout has a PERK row (◀▶)',!!(r.p&&r.p.l&&r.p.r));
   if(!m2.bbLoadout)m2.bbLoadout=[null,null];m2.bbLoadout[0]=null;const ld=bbClaimEnsure(0);
   ok('a fresh 1v1 claim loadout defaults perk = none',ld.perk==='none');
   bbCycleField(ld,'perk',1);ok('the 1v1 perk cycler equips a real perk',ld.perk!=='none'&&BB_PERKS.some(p=>p.id===ld.perk));
   ok('the chosen 1v1 perk resolves into the loadout',bbResolveLoadout(bbClaimLd(0)).perk===ld.perk);
   m2.bbLoadout=[null,null];}
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
  // ── v5.1.90 BB grid polish: per-seat stat bars + drag-to-copy a loadout between seats ──
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;phase='p2claim';tour=null;
   tankGridSetCpu(0);tankGridSetCpu(1);tankGridSetCpu(3);
   m2.tseats[0].loadout={weapon:'spinner',armor:'hardplate'};m2.tseats[1].loadout={weapon:'none',armor:'balanced'};
   ok('bbCopyLoadout clones weapon+armor onto another seat',bbCopyLoadout(0,1)&&m2.tseats[1].loadout.weapon==='spinner'&&m2.tseats[1].loadout.armor==='hardplate');
   ok('bbCopyLoadout makes a NEW object (seats not aliased)',m2.tseats[1].loadout!==m2.tseats[0].loadout);
   m2.tseats[1].loadout.weapon='flame';ok('editing the copy leaves the source intact',m2.tseats[0].loadout.weapon==='spinner');
   ok('bbCopyLoadout no-ops for the same seat',bbCopyLoadout(0,0)===false);
   ok('bbCopyLoadout no-ops onto an empty seat',bbCopyLoadout(0,2)===false&&!m2.tseats[2]);
   const c=tankCellRect(0),lr=bbSeatLoadRects(c),g=bbSeatGripRect(c);
   ok('bbLoadGripHit true on the loadout-bar body (between the cyclers)',bbLoadGripHit(0,(lr.wR.x+lr.aL.x)/2,g.y+13));
   ok('bbLoadGripHit false on a cycler arrow (tap-cycle preserved)',!bbLoadGripHit(0,lr.wR.x+10,lr.wR.y+10));
   ok('bbLoadGripHit false on an empty seat',!bbLoadGripHit(2,(lr.wR.x+lr.aL.x)/2,g.y+13));
   ok('bbSeatAt maps a point to its cell',bbSeatAt(c.x+10,c.y+10)===0&&bbSeatAt(tankCellRect(4).x+10,tankCellRect(4).y+10)===4);
   const sr=bbSeatStatsRect(c);
   ok('bbSeatStatsRect sits inside the cell, clear of the loadout bar',sr.x>=c.x&&sr.x+sr.w<=g.x&&sr.y>=c.y&&sr.y+sr.h<=c.y+c.h);
   bbLoadDrag={from:0,x:c.x+200,y:c.y+200};let gThrew=false;try{drawTankGrid();}catch(e){gThrew=true;console.log('   grid+drag draw err:',e.message);}bbLoadDrag=null;
   ok('drawTankGrid renders stat bars + an active drag without throwing',!gThrew);
   m2.tseats=null;}
  // ── v5.1.94 ARMORY: drag a weapon/armor chip from the rail onto a seat to equip ──
  {applyLayout('land2p');m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;phase='p2claim';tour=null;tankGridSetCpu(0);
   const chips=bbArmoryChips(),wChips=chips.filter(c=>c.kind==='weapon'),aChips=chips.filter(c=>c.kind==='armor');
   ok('armory rail has every PICKABLE weapon (RAM-only + locked CANNON excluded) + every armor chip',wChips.length===BB_WEAPONS.filter(w=>w.id!=='none'&&(w.id!=='cannon'||cannonWeapon)).length&&!wChips.some(c=>c.id==='none')&&aChips.length===BB_ARMOR.length);
   ok('v5.1.196: armory rail has the PERK group incl. NO PERK',chips.filter(c=>c.kind==='perk').length===BB_PERKS_PICK.length&&chips.some(c=>c.kind==='perk'&&c.id==='none')&&bbArmEquip&&(()=>{m2.tseats=[{loadout:{weapon:'wedge',armor:'balanced'}}];return bbArmEquip(0,'perk','flameproof')&&m2.tseats[0].loadout.perk==='flameproof';})());
   ok('armory chip ids match the real weapon/armor tables',wChips.every(c=>BB_WEAPONS.some(w=>w.id===c.id))&&aChips.every(c=>BB_ARMOR.some(a=>a.id===c.id)));
   ok('armory rail sits inside the canvas, above the seats',chips.every(c=>c.x>=0&&c.x+c.w<=CW&&c.y>=0&&c.y+c.h<=tankCellRect(0).y));
   const sp=wChips.find(c=>c.id==='spinner'),hit=bbArmoryHit(sp.x+sp.w/2,sp.y+sp.h/2);
   ok('bbArmoryHit finds the chip under the point',!!hit&&hit.kind==='weapon'&&hit.id==='spinner');
   ok('bbArmoryHit misses below the rail (over the seats)',bbArmoryHit(sp.x+sp.w/2,tankCellRect(0).y+40)===null);
   m2.tseats[0].loadout={weapon:'none',armor:'balanced'};
   ok('dropping a WEAPON chip equips it',bbArmEquip(0,'weapon','spinner')&&m2.tseats[0].loadout.weapon==='spinner');
   ok('dropping an ARMOR chip equips it',bbArmEquip(0,'armor','hardplate')&&m2.tseats[0].loadout.armor==='hardplate');
   ok('a bogus chip id is rejected',!bbArmEquip(0,'weapon','laser')&&!bbArmEquip(0,'armor','adamantium'));
   ok('dropping on an empty seat no-ops',!bbArmEquip(2,'weapon','spinner')&&!m2.tseats[2]);
   // full drag→drop: grab a chip, drop over seat 0's cell
   bbArmDrag={kind:'weapon',id:'flame',lab:'FLAME',ic:'F',x:sp.x,y:sp.y};
   const dropSeat=bbSeatAt(tankCellRect(0).x+10,tankCellRect(0).y+10);
   ok('drag→drop equips the carried weapon on the seat under the cursor',bbArmEquip(dropSeat,bbArmDrag.kind,bbArmDrag.id)&&m2.tseats[0].loadout.weapon==='flame');
   let aThrew=false;try{drawTankGrid();}catch(e){aThrew=true;console.log('   armory draw err:',e.message);}
   ok('drawTankGrid renders the armory rail + an active chip drag without throwing',!aThrew);
   bbArmDrag=null;m2.tseats=null;}
  // ── v5.1.80 P2.6: CPU auto-arms + uses its weapon (tier-scaled) ──
  {const lo=bbCpuPickLoadout(3);ok('bbCpuPickLoadout returns a valid weapon+armor (armed)',BB_WEAPONS.some(w=>w.id===lo.weapon)&&BB_ARMOR.some(a=>a.id===lo.armor)&&lo.weapon!=='none');}
  {m2.mode='battlebots';m2.set.tfmt='1v1';m2.tseats=null;tour=null;m2.claim=[{type:'kb'},{type:'cpu',tier:3}];playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];
   m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};startP2BB();
   const cpu=bb2.bots.find(b=>b.ctl.type==='cpu'),hum=bb2.bots.find(b=>b.ctl.type!=='cpu');
   ok('P2.6: a CPU with no chosen loadout AUTO-ARMS (weapon ≠ none)',!!cpu&&cpu.ld.weapon!=='none');
   ok('P2.6: the human bot stays neutral (RAM only)',!!hum&&hum.ld.weapon==='none');}
  {m2.mode='battlebots';m2.set.tfmt='multi';m2.tseats=[null,null,null,null,null,null];m2.tsel=0;tour=null;tankGridSetCpu(0);tankGridSetCpu(3);
   m2.tseats[0].loadout={weapon:'wedge',armor:'light'};startP2BB();const seat0=bb2.bots.find(b=>b.ctl.bind===0);
   ok('P2.6: a USER-set CPU loadout is RESPECTED (not auto-overridden)',!!seat0&&seat0.ld.weapon==='wedge'&&seat0.ld.armor==='light');m2.tseats=null;}
  // ── v5.1.82: the 1v1 2-card claim gets the loadout "layout" picker (weapon/armor cyclers + AUTOBUILD) ──
  {m2.mode='battlebots';m2.set.tfmt='1v1';m2.tseats=null;tour=null;phase='p2claim';m2.claim=[{type:'kb'},{type:'cpu',tier:2}];m2.bbLoadout=[null,null];m2.drive=[{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'}];
   let cThrew=false;try{bbDrawClaimLoadout(0,false);bbDrawClaimLoadout(1,true);}catch(e){cThrew=true;console.log('   1v1 loadout draw err:',e.message);}
   ok('1v1 claim loadout draws without throwing (human + CPU card)',!cThrew);
   // v5.1.201 the chosen WEAPON renders on the drive-base preview — must not throw even with bb2=null (claim screen) for EVERY weapon
   {const _sb=bb2;bb2=null;let pvThrew=false;for(const W of BB_WEAPONS){if(W.id==='none')continue;m2.bbLoadout[0]={weapon:W.id,armor:'balanced',perk:'none'};try{bbDrawClaimWeaponPreview(0,300,202,1.3);}catch(e){pvThrew=true;console.log('   weapon-preview err ('+W.id+'):',e.message);}}
    ok('1v1 weapon preview renders on the drive base for every weapon (bb2=null safe)',!pvThrew&&_wpnPreview===false&&bb2===null);bb2=_sb;m2.bbLoadout[0]=null;}
   // v5.1.216 the SAME weapon render on the 3v3 GRID seat — bbDrawWeaponPreview takes a seat loadout directly + is bb2=null safe for every weapon
   {const _sb=bb2;bb2=null;let gThrew=false;for(const W of BB_WEAPONS){if(W.id==='none')continue;try{bbDrawWeaponPreview({weapon:W.id,armor:'balanced'},300,200,0.8);}catch(e){gThrew=true;console.log('   grid-preview err ('+W.id+'):',e.message);}}
    ok('3v3 grid weapon preview renders for every weapon (seat loadout, bb2=null safe)',!gThrew&&_wpnPreview===false&&bb2===null);
    let nThrew=false;try{bbDrawWeaponPreview(null,300,200,0.8);bbDrawWeaponPreview({weapon:'none'},300,200,0.8);}catch(e){nThrew=true;}
    ok('3v3 grid weapon preview is a no-op for an unset / RAM-only seat',!nThrew);bb2=_sb;}
   // v5.1.203 the 1v1 cards get the same drag-drop ARMORY RAIL as the 3v3 grid (drag a chip onto a card)
   {m2.bbLoadout=[null,null];
    ok('1v1 armory rail is ACTIVE on the battlebots 1v1 claim',bb1v1ArmoryOn()===true);
    ok('bb1v1SideAt resolves which CARD is under a point',bb1v1SideAt(p2cCardRect(0).x+280,p2cCardRect(0).y+258)===0&&bb1v1SideAt(p2cCardRect(1).x+280,p2cCardRect(1).y+258)===1&&bb1v1SideAt(CW/2,8)===-1);
    ok('bb1v1Equip sets the card weapon/armor/perk in m2.bbLoadout',bb1v1Equip(0,'weapon','jet')&&bb1v1Equip(0,'armor','hardplate')&&bb1v1Equip(0,'perk','flameproof')&&m2.bbLoadout[0].weapon==='jet'&&m2.bbLoadout[0].armor==='hardplate'&&m2.bbLoadout[0].perk==='flameproof');
    ok('bb1v1Equip rejects an unknown id',!bb1v1Equip(0,'weapon','notareal'));
    // a full drag: grab a chip off the rail, the rail + drop-halos draw, drop on card 1 → equips side 1
    const chip=bbArmoryChips().find(c=>c.kind==='weapon'&&c.id==='spinner');bbArmDrag={kind:chip.kind,id:chip.id,lab:chip.lab,ic:chip.ic,x:chip.x,y:chip.y};
    let aThrew=false;try{bbDrawArmory();}catch(e){aThrew=true;console.log('   1v1 armory draw err:',e.message);}
    ok('1v1 armory rail + drag halos draw without throwing',!aThrew);
    const c1=p2cCardRect(1);if(bb1v1SideAt(c1.x+280,c1.y+258)===1)bb1v1Equip(1,bbArmDrag.kind,bbArmDrag.id);bbArmDrag=null;
    ok('dropping a weapon chip onto card 1 equips that side',!!m2.bbLoadout[1]&&m2.bbLoadout[1].weapon==='spinner');
    m2.bbLoadout=[null,null];}
   const wr=bbClaimLoadRects(0).w.r;p2Click(wr.x+13,wr.y+13);
   ok('clicking the 1v1 card weapon ▶ sets + cycles m2.bbLoadout',!!m2.bbLoadout[0]&&m2.bbLoadout[0].weapon!=='none');
   bbClaimAutobuild(1);
   ok('AUTOBUILD fills a concrete armed loadout',!!m2.bbLoadout[1]&&m2.bbLoadout[1].weapon!=='none'&&BB_WEAPONS.some(w=>w.id===m2.bbLoadout[1].weapon)&&BB_ARMOR.some(a=>a.id===m2.bbLoadout[1].armor));
   m2.bbLoadout=[{weapon:'wedge',armor:'light'},null];
   ok('bbLoadoutForBind reads the 1v1 claim loadout',JSON.stringify(bbLoadoutForBind(0))===JSON.stringify({weapon:'wedge',armor:'light'}));
   m2.claim=[{type:'kb'},{type:'cpu',tier:3}];playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];m2.bbLoadout=[{weapon:'piston',armor:'hardplate'},null];startP2BB();
   const h=bb2.bots.find(b=>b.ctl.type!=='cpu');ok('1v1: a human-picked loadout flows to the spawned bot',!!h&&h.ld.weapon==='piston'&&h.ld.armor==='hardplate');
   const c=bb2.bots.find(b=>b.ctl.type==='cpu');ok('1v1: an un-picked CPU still auto-arms (weapon ≠ none)',!!c&&c.ld.weapon!=='none');
   m2.bbLoadout=[null,null];}
  {const me=bbBotWith('spinner','balanced',0,0,true);me.x=300;me.y=300;me.h=0;
   const foe=bbBotWith('none','balanced',1,1,true);foe.x=300+RR*3;foe.y=300;bb2.bots=[me,foe];bb2.result=null;
   bbCpuUpdate(1/60);ok('CPU SPINNER spins up (brain.fire) when a foe is near',me.ctl.brain.fire===true);
   foe.x=300+RR*30;bbCpuUpdate(1/60);ok('CPU SPINNER stops firing when no foe is near',me.ctl.brain.fire===false);}
  {const me=bbBotWith('flame','balanced',0,0,true);me.x=300;me.y=300;me.h=0;
   const foe=bbBotWith('none','balanced',1,1,true);foe.x=300+RR*1.6;foe.y=300;bb2.bots=[me,foe];bb2.result=null;
   let lit=0;for(let i=0;i<40;i++){bbCpuUpdate(1/60);if(me.ctl.brain.fire)lit++;}ok('CPU FLAMETHROWER torches a foe in its cone',lit>0);
   // v5.1.99 TURRET-AIM: the flame is no longer locked forward — its turret tracks a foe to the REAR and still torches it.
   const behind=bbBotWith('none','balanced',1,2,true);behind.x=300-RR*1.6;behind.y=300;bb2.bots=[me,behind];let lit2=0;for(let i=0;i<20;i++){bbCpuUpdate(1/60);if(me.ctl.brain.fire)lit2++;}ok('CPU FLAME turret FIRES at a foe behind it (was: held fire)',lit2>0);
   me.h=0;bbWeaponPre(1/60);ok('CPU FLAME turret AIMS behind (weaponAng ~ π toward the rear foe)',Math.abs(Math.abs(me.weaponAng)-Math.PI)<0.2);}
  // ── v5.1.99: FLAME TURRET-AIM — a turreted weapon aims independent of the chassis (CPU foe-track / human mouse·stick) ──
  {ok('bbIsTurret: flame is turreted, piston is not',bbIsTurret('flame')===true&&bbIsTurret('piston')===false);
   const me=bbBotWith('flame','balanced',0,0,true);me.x=300;me.y=300;me.h=0; // chassis faces EAST (0)
   const side=bbBotWith('none','balanced',1,1,true);side.x=300;side.y=300-RR*1.6; // foe due NORTH — 90° off the nose, OUTSIDE the chassis front arc
   bb2.bots=[me,side];bb2.result=null;
   ok('bbAimAngle (CPU) points the turret at the SIDE foe (~north, -π/2)',Math.abs(bbAimAngle(me)-(-Math.PI/2))<0.15);
   ok('the chassis FRONT arc does NOT cover the side foe',bbFoeAngOk(me,side,BB_W.flameArc)===false);
   bbWeaponPre(1/60);ok('bbWeaponPre stores weaponAng on the flame bot',Math.abs(me.weaponAng-(-Math.PI/2))<0.15);
   ok('but the TURRET arc DOES cover the side foe',bbFoeArcAt(me,side,BB_W.flameArc,me.weaponAng)===true);
   me.ctl.brain.fire=true;side.hp=BB.HP;side.burn=0;me.heat={};
   for(let i=0;i<60;i++){me.firing=true;bbWeaponPre(1/60);bbWeaponFire(1/60);}
   ok('FLAME turret BURNS a side foe the chassis is NOT facing (hp '+side.hp.toFixed(0)+'<'+BB.HP+')',side.hp<BB.HP);
   const ram=bbBotWith('none','balanced',0,0,true);ram.h=1.2;bb2.bots=[ram];bbWeaponPre(1/60);ok('a NON-turret weapon keeps weaponAng = the chassis heading',Math.abs(ram.weaponAng-1.2)<1e-9);
   const me2=bbBotWith('flame','balanced',0,0,true);me2.x=100;me2.y=100;me2.h=0;me2.ctl.brain.fire=true;me2.heat={};
   const far=bbBotWith('none','balanced',1,1,true);far.x=100+RR*10;far.y=100;far.hp=BB.HP;bb2.bots=[me2,far];
   for(let i=0;i<60;i++){me2.firing=true;bbWeaponPre(1/60);bbWeaponFire(1/60);}ok('FLAME turret still respects RANGE (a foe way out of reach stays unburned)',far.hp===BB.HP);
   const h=bbBotWith('flame','balanced',0,0,false);h.x=200;h.y=200;h.h=0;playerBind[0]={type:'kb'};bb2.bots=[h];
   mouseX=FX+h.x;mouseY=FY+h.y-80;bbWeaponPre(1/60);ok('HUMAN flame turret follows the MOUSE (~north when the cursor is above the bot)',Math.abs(h.weaponAng-(-Math.PI/2))<0.05);
   mouseX=FX+h.x+80;mouseY=FY+h.y;bbWeaponPre(1/60);ok('HUMAN flame turret tracks the mouse to the EAST (~0)',Math.abs(h.weaponAng)<0.05);
   let dThrew=false;try{bbDrawWeapon(h);}catch(e){dThrew=true;console.log('   draw err:',e.message);}ok('bbDrawWeapon renders the turreted flame cone without throwing',!dThrew);}
  // ── v5.1.100: the flame turret is an ARCADE-DRIVE PERK ONLY (swerve/holo aim via the chassis; tank/steer locked forward) ──
  {const sv=bbBotWith('flame','balanced',0,0,true);sv.x=300;sv.y=300;sv.h=0;
   const sf=bbBotWith('none','balanced',1,1,true);sf.x=300;sf.y=300-RR*1.6;bb2.bots=[sv,sf];bb2.result=null; // foe due north (off the nose)
   const sd=m2.drive[0];
   m2.drive[0]={kind:'main',idx:3};bbWeaponPre(1/60);ok('SWERVE flame is NOT turreted — weaponAng stays on the chassis (b.h)',Math.abs(sv.weaponAng-sv.h)<1e-9);
   m2.drive[0]={kind:'main',idx:0};bbWeaponPre(1/60);ok('TANK flame is NOT turreted either — locked forward',Math.abs(sv.weaponAng-sv.h)<1e-9);
   m2.drive[0]={kind:'main',idx:1};bbWeaponPre(1/60);ok('ARCADE flame IS turreted — weaponAng tracks the side foe (~-π/2)',Math.abs(sv.weaponAng-(-Math.PI/2))<0.15);
   m2.drive[0]=sd;}
  // ── v5.1.103: DOZER grab-and-slam — a gripped foe STICKS to the blade front; charging it into a WALL crushes it ──
  {const a=bbBotWith('wedge','balanced',0,0,true);a.x=FW-RR-1;a.y=FH/2;a.h=0;a._inp={vx:SPD,vy:0,vr:0}; // dozer at the RIGHT wall, charging +x
   const c=bbBotWith('spinner','balanced',1,1,true);bb2.bots=[a,c];bb2.result=null;
   a.grab=c;c.held=a;a.grabT=1.0;c.inv=0;const hp0=c.hp;
   bbGrabUpdate(1/60); // glue c to the blade front (past the wall) → obsCheck clamps → SLAM
   ok('DOZER glue+slam: a gripped foe crushed into a wall takes slam damage (hp '+c.hp.toFixed(0)+'<'+hp0.toFixed(0)+')',c.hp<hp0);
   ok('DOZER releases the foe + sets a grab cooldown after a slam',!a.grab&&!c.held&&a.grabCd>0);
   const a2=bbBotWith('wedge','balanced',0,0,true);a2.x=FW/2;a2.y=FH/2;a2.h=0;a2._inp={vx:0,vy:0,vr:0};
   const c2=bbBotWith('spinner','balanced',1,1,true);bb2.bots=[a2,c2];a2.grab=c2;c2.held=a2;a2.grabT=0.02;
   bbGrabUpdate(0.03);ok('DOZER grip RELEASES when the grab timer expires (open space, no wall)',!a2.grab&&!c2.held);
   ok('a GRABBED foe is glued to the dozer blade front (chassis-forward)',(()=>{const a3=bbBotWith('wedge','balanced',0,0,true);a3.x=200;a3.y=200;a3.h=0;const c3=bbBotWith('spinner','balanced',1,1,true);bb2.bots=[a3,c3];a3.grab=c3;c3.held=a3;a3.grabT=1;bbGrabUpdate(1/60);return Math.abs(c3.x-(a3.x+RR*2))<1&&Math.abs(c3.y-a3.y)<1;})());}
  // ── v5.1.104: FLAME line-of-sight — an obstacle between the flamer and the foe BLOCKS the burn (no flaming through walls) ──
  {const fa=bbBotWith('flame','balanced',0,0,true);fa.x=100;fa.y=100;fa.h=0;fa.ctl.brain.fire=true;fa.heat={};
   const fc=bbBotWith('none','balanced',1,1,true);fc.x=100+RR*3;fc.y=100;fc.hp=BB.HP;bb2.bots=[fa,fc];bb2.result=null;
   const savedObs=tfObs;tfObs=[{x:100+RR*1.2,y:70,w:14,h:60}]; // a wall straddling the line between them
   for(let i=0;i<60;i++){fa.firing=true;bbWeaponPre(1/60);bbWeaponFire(1/60);}
   ok('FLAME LOS: an obstacle between the flamer and the foe BLOCKS the burn',fc.hp===BB.HP);
   tfObs=null;fc.hp=BB.HP;fa.heat={};for(let i=0;i<60;i++){fa.firing=true;bbWeaponPre(1/60);bbWeaponFire(1/60);}
   ok('FLAME with a CLEAR line still burns through',fc.hp<BB.HP);tfObs=savedObs;}
  // ── v5.1.106: CPU stuck-detection → UNSTICK (so bots stop jamming on the first obstacle) ──
  {const me=bbBotWith('spinner','balanced',0,0,true);me.x=RR;me.y=RR;me.h=0;
   const foe=bbBotWith('spinner','balanced',1,1,true);foe.x=500;foe.y=500;bb2.bots=[me,foe];bb2.result=null;bb2.t=1;me._lx=me.x;me._ly=me.y;
   let unstuck=false;for(let i=0;i<45;i++){const px=me.x,py=me.y;bbCpuUpdate(1/60);me.x=px;me.y=py;if(me._unstickT>0)unstuck=true;} // hold position → simulate being JAMMED while it tries to move toward the foe
   ok('CPU UNSTICK: a bot jammed in place (tried to move but did not) triggers an unstick maneuver',unstuck);
   const m2b=bbBotWith('spinner','balanced',0,0,true);m2b.x=300;m2b.y=300;const f2=bbBotWith('spinner','balanced',1,1,true);f2.x=400;f2.y=300;bb2.bots=[m2b,f2];m2b._lx=m2b.x;m2b._ly=m2b.y;
   for(let i=0;i<45;i++){m2b._lx=m2b.x-5;m2b._ly=m2b.y;bbCpuUpdate(1/60);} // FREELY moving (5px/frame) → never flags stuck
   ok('CPU UNSTICK: a freely-moving bot is NOT flagged stuck',!(m2b._unstickT>0)&&(m2b._stk||0)<0.2);}
  // ── v5.1.107: BUZZSAW — a FRONT-only spin-up cutter (high dmg in front; the SPINNER is the 360° one) ──
  {const a=bbBotWith('buzzsaw','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.spin=1;
   const front=bbBotWith('none','balanced',1,1,true);front.x=300+RR*2;front.y=300;bb2.bots=[a,front];
   ok('bbSpinBite: a spun-up BUZZSAW bites a foe in its FRONT arc',bbSpinBite(a,front)>0);
   const side=bbBotWith('none','balanced',1,2,true);side.x=300;side.y=300-RR*2; // due north — to the side
   ok('bbSpinBite: BUZZSAW does NOT bite a foe to the SIDE (front-only, unlike the spinner)',bbSpinBite(a,side)===0);
   const sp=bbBotWith('spinner','balanced',0,3,true);sp.x=300;sp.y=300;sp.h=0;sp.spin=1;
   ok('bbSpinBite: a SPINNER bites 360° (the side foe too)',bbSpinBite(sp,side)>0);
   ok('an un-spun BUZZSAW does not bite',(()=>{const u=bbBotWith('buzzsaw','balanced',0,0,true);u.x=300;u.y=300;u.h=0;u.spin=0.2;return bbSpinBite(u,front)===0;})());
   ok('BUZZSAW shares the spinner spin-up ramp',(()=>{const u=bbBotWith('buzzsaw','balanced',0,0,true);u.spin=0;u.ctl.brain.fire=true;bb2.bots=[u];bbWeaponPre(0.5);return u.spin>0;})());
   ok('BUZZSAW is a PICKABLE weapon in the armory + table',BB_WEAPONS.some(w=>w.id==='buzzsaw')&&BB_ARMORY_W.some(w=>w.id==='buzzsaw'));}
  // ── v5.1.109: FLIPPER — RT launcher, flings a front-arc foe BACK + ring-out into walls ──
  {const svd=m2.drive,svm=m2.set.bbmode,svt=m2.set.bbtime;m2.drive=[{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'}];m2.set.bbmode='ko';m2.set.bbtime=0;
   const a=bbBotWith('flipper','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.firing=true;a.pistCd=0;a.ctl.brain.fire=false;
   const c=bbBotWith('none','balanced',1,1,true);c.x=300+RR*1.5;c.y=300;c.hp=BB.HP;c.inv=0;c.ctl.brain.fire=false;c.ctl.brain.inp={vx:0,vy:0,vr:0};const cx0=c.x;bb2.bots=[a,c];bb2.result=null;bb2.cd=0;bb2.t=1;
   bbWeaponFire(1/60);
   ok('PUSHER sets a backward fling (momentum) + direct damage',c._flT>0&&c._flx>0&&c.hp<BB.HP);
   for(let i=0;i<22;i++)updateBB(1/60);
   ok('PUSHER: the foe FLIES backward over time (x '+cx0.toFixed(0)+'→'+c.x.toFixed(0)+')',c.x>cx0+RR*2);
   const a2=bbBotWith('flipper','balanced',0,0,true);a2.x=FW-90;a2.y=FH/2;a2.h=0;a2.firing=true;a2.pistCd=0;a2.ctl.brain.fire=false;a2.mob=0; // facing the RIGHT wall; v5.1.202 mob=0 FREEZES the flinger so its AI drift can't jiggle the collision (was flaky ~2/12 — the drift consumed Math.random differently per RNG offset). It still can't re-fire in the 0.37s window (flipCd 0.85s).
   const c2=bbBotWith('none','balanced',1,1,true);c2.x=FW-70;c2.y=FH/2;c2.hp=BB.HP;c2.inv=0;c2.mob=0;c2.ctl.brain.fire=false;c2.ctl.brain.inp={vx:0,vy:0,vr:0};bb2.bots=[a2,c2];bb2.result=null;tfObs=[];bb2.minis=[];bb2.blasts=[];bb2.deb=[];bb2.fx=[];bb2.cd=0;bb2.t=1; // mob=0 → the CPU brain can't fight the fling (deterministic); clear any leaked entities from prior tests
   bbWeaponFire(1/60);const h0=c2.hp;for(let i=0;i<22;i++){bb2.cd=0;updateBB(1/60);}
   ok('PUSHER RING-OUT: a foe flung into a WALL takes bonus impact damage',c2.hp<=h0-BB_W.flipWallDmg+0.001);
   m2.drive=svd;m2.set.bbmode=svm;m2.set.bbtime=svt;
   ok('FLIPPER is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='flipper')&&BB_ARMORY_W.some(w=>w.id==='flipper'));
   ok('FLIPPER: big push + wall-slam bonus dmg + fast cd (push-focused, low dmg — v5.1.194 tuned)',BB_W.flipKnock>=80&&BB_W.flipFlySpd>=1500&&BB_W.flipWallDmg>=8&&BB_W.flipCd<=1.1);
   ok('PUSHER: flipper is renamed PUSHER in the UI (id stays flipper)',bbWeaponById('flipper').name==='PUSHER'&&BB_ARMORY_W.find(w=>w.id==='flipper').lab==='PUSH');}
  // ── v5.1.110: PINCER — grab + IMMOBILIZE (hold + drain mobility), no slam/damage; a 3v3 role-player ──
  {const a=bbBotWith('pincer','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.firing=true; // v5.1.140: hold the trigger to keep gripping
   const c=bbBotWith('none','balanced',1,1,true);c.mob=BB.MOB;c.hp=BB.HP;bb2.bots=[a,c];bb2.result=null;
   a.grab=c;c.held=a;a.grabT=BB_W.pincerGrabDur;const mob0=c.mob,hp0=c.hp;
   for(let i=0;i<30;i++)bbGrabUpdate(1/60);
   ok('PINCER drains the held foe MOBILITY (immobilize) without big damage',c.mob<mob0&&c.hp===hp0);
   ok('PINCER glues the held foe to its front',Math.abs(c.x-(a.x+RR*2))<1&&!!c.held);
   ok('PINCER is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='pincer')&&BB_ARMORY_W.some(w=>w.id==='pincer'));}
  // ── v5.1.198: PINCER counterplay — held as long as the trigger's down (NO forced timer); the captive can TURN & FIGHT BACK ──
  {startBB(0,2);bb2.cd=0;bb2.result=null;const p=bbBotWith('pincer','balanced',0,0,true);p.x=300;p.y=300;p.h=0;p.firing=true;
   const v=bbBotWith('none','balanced',1,1,true);v.x=320;v.y=300;v.hp=BB.HP;v.inv=0;v.mob=BB.MOB;bb2.bots=[p,v];
   p.grab=v;v.held=p;p.grabT=BB_W.pincerGrabDur;v.firing=false;for(let i=0;i<200;i++){p.firing=true;bbGrabUpdate(1/60);}
   ok('PINCER: holds as long as the trigger is down (no forced release timer)',v.held===p&&p.grab===v);
   // captive facing + firing grinds the captor down (fight back)
   const p2b=bbBotWith('pincer','balanced',0,0,true);p2b.x=300;p2b.y=300;p2b.h=0;p2b.hp=BB.HP;p2b.inv=0;
   const v2=bbBotWith('spinner','balanced',1,1,true);v2.x=334;v2.y=300;v2.h=Math.PI;v2.firing=true;v2.hp=BB.HP; // faces back at the captor
   p2b.grab=v2;v2.held=p2b;p2b.grabT=BB_W.pincerGrabDur;bb2.bots=[p2b,v2];
   const ch0=p2b.hp;for(let i=0;i<20;i++){p2b.firing=true;v2.firing=true;bbGrabUpdate(1/60);}
   ok('PINCER: a held captive facing + firing FIGHTS BACK (grinds the captor)',p2b.hp<ch0);}
  // ── v5.1.199: a clamping PINCER is ANCHORED — external JET/PUSHER push can't shove it off its captive (damage still lands; the counter stays the fight-back + rescue-bash) ──
  {const h=bbBotWith('pincer','balanced',0,0,true);h.x=400;h.y=300;h.h=0;h.firing=true;
   const c=bbBotWith('none','balanced',1,1,true);c.x=434;c.y=300;c.hp=BB.HP;h.grab=c;c.held=h;h.grabT=BB_W.pincerGrabDur;
   const j=bbBotWith('jet','balanced',1,1,true);j.x=350;j.y=300;j.h=0;j.firing=true;j.spin=1;j._jetOver=false; // a jet firing into the holder from the left
   bb2.bots=[h,c,j];bb2.result=null;const hx0=h.x;for(let i=0;i<30;i++)bbJetUpdate(1/60);
   ok('PINCER holding is ANCHORED vs JET push (not shoved off its captive)',Math.abs(h.x-hx0)<1&&h.grab===c);
   // control: the SAME jet DOES shove a pincer that is NOT currently holding (proves the anchor is the holding state)
   const h2=bbBotWith('pincer','balanced',0,0,true);h2.x=400;h2.y=300;h2.h=0; // no grab
   const j2=bbBotWith('jet','balanced',1,1,true);j2.x=350;j2.y=300;j2.h=0;j2.firing=true;j2.spin=1;j2._jetOver=false;
   bb2.bots=[h2,j2];const hx2=h2.x;for(let i=0;i<30;i++)bbJetUpdate(1/60);
   ok('control: a NON-holding pincer IS shoved by the jet',h2.x>hx2+1);
   // PUSHER fling can't fling a holding pincer
   const hp=bbBotWith('pincer','balanced',0,0,true);hp.x=400;hp.y=300;hp.h=0;hp.firing=true;
   const cap=bbBotWith('none','balanced',1,1,true);cap.x=434;cap.y=300;cap.hp=BB.HP;hp.grab=cap;cap.held=hp;hp.grabT=BB_W.pincerGrabDur;
   const fl=bbBotWith('flipper','balanced',1,1,true);fl.x=400-RR*1.5;fl.y=300;fl.h=0;fl.firing=true;fl.pistCd=0;fl.ctl.brain.fire=false;
   bb2.bots=[hp,cap,fl];bb2.result=null;hp._flx=0;hp._flT=0;bbWeaponFire(1/60);
   ok('PINCER holding is ANCHORED vs PUSHER fling (no fly velocity applied)',!(hp._flT>0)&&Math.abs(hp._flx||0)<1&&hp.grab===cap);
   // PISTON hammer-knock can't shove a holding pincer either (the push comes from the weapon strike, not the wheels)
   const ph=bbBotWith('pincer','balanced',0,0,true);ph.x=400;ph.y=300;ph.h=0;ph.firing=true;
   const pcv=bbBotWith('none','balanced',1,1,true);pcv.x=434;pcv.y=300;pcv.hp=BB.HP;ph.grab=pcv;pcv.held=ph;ph.grabT=BB_W.pincerGrabDur;
   const pst=bbBotWith('piston','balanced',1,1,true);pst.x=400-RR*1.2;pst.y=300;pst.h=0;pst.firing=true;pst.pistCd=0;pst.ctl.brain.fire=false;
   bb2.bots=[ph,pcv,pst];bb2.result=null;const phx0=ph.x;bbWeaponFire(1/60);
   ok('PINCER holding is ANCHORED vs PISTON knock (locked on, not shoved off)',Math.abs(ph.x-phx0)<1&&ph.grab===pcv);}
  // ── v5.1.139: PINCER actually CLAMPS on a firing front-arc ram (the trigger path) + lunges + opens ──
  {ok('PINCER has a forward LUNGE while firing',BB_W.pincerLunge>1);
   ok('PINCER clamp arc is wide enough to catch a foe',BB_W.pincerArc>=Math.PI*0.5);
   const sv=m2.set.bbmode;m2.set.bbmode='ko';
   const a=bbBotWith('pincer','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.grabCd=0;
   const c=bbBotWith('none','balanced',1,1,true);c.x=300+RR*1.5;c.y=300;c.h=Math.PI;c.hp=BB.HP;c.inv=0;
   a.ctl.brain.fire=true;a.ctl.brain.inp={vx:0,vy:0,vr:0};
   bb2.bots=[a,c];bb2.result=null;bb2.cd=0;bb2.t=1;updateBB(1/60);
   ok('PINCER grabs + controls a foe on a firing front-arc ram',a.grab===c&&c.held===a);
   // v5.1.144: reach-clamp — a lined-up foe within reach (NOT touching) is grabbed via bbWeaponFire (easier to land)
   const pa=bbBotWith('pincer','balanced',0,0,true);pa.x=300;pa.y=300;pa.h=0;pa.firing=true;pa.grabCd=0;
   const pf=bbBotWith('none','balanced',1,1,true);pf.x=300+RR*2.2;pf.y=300;pf.hp=BB.HP; // ~2.2×RR away → beyond contact (2×RR) but within reach (2.4×RR)
   bb2.bots=[pa,pf];bb2.result=null;bbWeaponFire(1/60);
   ok('PINCER reach-clamp grabs a lined-up foe that is NOT touching',pa.grab===pf&&pf.held===pa);
   ok('PINCER reach is forgiving (arc ≥ ±60° + reach beyond contact)',BB_W.pincerArc>=Math.PI*0.66&&BB_W.pincerReachK>1);
   m2.set.bbmode=sv;}
  // ── v5.1.198: PINCER holds while firing (no forced timer — the fight-back is the counter); wall-slam, teammate rescue ──
  {const h=bbBotWith('pincer','balanced',0,0,true);h.x=300;h.y=300;h.h=0;h.firing=true;
   const c=bbBotWith('none','balanced',1,1,true);c.x=334;c.y=300;c.hp=BB.HP;c.firing=false;h.grab=c;c.held=h;h.grabT=BB_W.pincerGrabDur;
   bb2.bots=[h,c];bb2.result=null;tfObs=[];for(let i=0;i<200;i++){h.firing=true;bbGrabUpdate(1/60);} // ~3.3s — well past any old cap
   ok('PINCER holds indefinitely while firing (no forced timer)',h.grab===c&&c.held===h);
   h.firing=false;bbGrabUpdate(1/60);
   ok('PINCER lets go when the HOLDER stops firing',h.grab===null&&c.held===null);
   // wall-slam: drag the captive into a wall (field edge) → damage
   const h2=bbBotWith('pincer','balanced',0,0,true);h2.x=FW-2;h2.y=300;h2.h=0;h2.firing=true;h2._inp={vx:SPD,vy:0,vr:0};
   const c2=bbBotWith('none','balanced',1,1,true);c2.x=FW-2;c2.y=300;c2.hp=BB.HP;c2.inv=0;h2.grab=c2;c2.held=h2;
   bb2.bots=[h2,c2];bb2.result=null;tfObs=[];const chp=c2.hp;bbGrabUpdate(1/60);
   ok('PINCER slams the captive into a wall for damage',c2.hp<chp);
   // a held bot can still ARM/FIRE its weapon (cannot drive — _inp zeroed in updateBB)
   const hsp=bbBotWith('spinner','balanced',1,1,true);hsp.ctl.brain.fire=true;hsp.spin=0;const cap=bbBotWith('pincer','balanced',0,0,true);cap.firing=true;cap.grab=hsp;hsp.held=cap;
   bb2.bots=[cap,hsp];bbWeaponPre(1/60);
   ok('a PINCER-held bot can still spin up / fire its weapon',hsp.spin>0);
   // RESCUE: a teammate of the captive ramming the captor frees it
   const sv2=m2.set.bbmode;m2.set.bbmode='ko';
   const H=bbBotWith('pincer','balanced',0,0,true);H.x=300;H.y=300;H.h=0;H.firing=true;H.ctl.brain.fire=true;H.ctl.brain.inp={vx:0,vy:0,vr:0};
   const C=bbBotWith('none','balanced',1,1,true);C.x=334;C.y=300;C.hp=BB.HP;H.grab=C;C.held=H;
   const ALLY=bbBotWith('none','balanced',1,2,true);ALLY.x=272;ALLY.y=300;ALLY.ctl.brain.fire=false;
   const svdrv=m2.drive;m2.drive=[{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'}];
   bb2.bots=[H,C,ALLY];bb2.result=null;bb2.cd=0;bb2.t=1;updateBB(1/60);m2.drive=svdrv;
   ok('PINCER lock breaks when a teammate rams the captor (rescue)',H.grab===null&&C.held===null);
   m2.set.bbmode=sv2;}
  // ── v5.1.111: KAMIKAZE — RT self-destruct, a big blast that takes nearby foes with it (3v3) ──
  {const a=bbBotWith('kamikaze','balanced',0,0,true);a.x=300;a.y=300;a.firing=true;
   const c=bbBotWith('none','balanced',1,1,true);c.x=300+RR*2;c.y=300;c.hp=BB.HP;c.inv=0;bb2.bots=[a,c];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   const hp0=c.hp;bbWeaponFire(1/60);
   ok('KAMIKAZE self-destructs (the bot dies on RT)',a.dead===true);
   ok('KAMIKAZE blast leaves a nearby foe DEAD or at very low HP',c.dead||c.hp<=BB.HP*0.2);
   {const ctr=bbBotWith('none','balanced',1,5,true);ctr.x=300;ctr.y=300;ctr.hp=BB.HP;ctr.inv=0;const kk=bbBotWith('kamikaze','balanced',0,4,true);kk.x=300;kk.y=300;kk.firing=true;bb2.bots=[kk,ctr];bb2.result=null;bb2.blasts=[];bb2.deb=[];bbWeaponFire(1/60);ok('KAMIKAZE DESTROYS a foe at the blast center',ctr.dead===true);}
   ok('KAMIKAZE radius is much bigger than before (>=8×RR)',BB_W.kamiRK>=8);
   const far=bbBotWith('none','balanced',1,2,true);far.x=300+RR*20;far.y=300;far.hp=BB.HP;far.inv=0;const b2=bbBotWith('kamikaze','balanced',0,3,true);b2.x=300;b2.y=300;b2.firing=true;bb2.bots=[b2,far];bb2.result=null;bb2.blasts=[];
   bbWeaponFire(1/60);ok('KAMIKAZE does NOT hit a foe outside the blast radius',far.hp===BB.HP);
   ok('KAMIKAZE is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='kamikaze')&&BB_ARMORY_W.some(w=>w.id==='kamikaze'));}
  // ── v5.1.146: DRILL — sustained front-contact grinder, DPS RAMPS the longer it stays on a foe (to a cap) ──
  {ok('DRILL is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='drill')&&BB_ARMORY_W.some(w=>w.id==='drill'));
   const a=bbBotWith('drill','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.firing=true;a.drill={};
   const c=bbBotWith('none','balanced',1,1,true);c.x=300+RR;c.y=300;c.hp=99999;c.inv=0;bb2.bots=[a,c];bb2.result=null;
   const e0=c.hp;bbWeaponFire(1/60);const early=e0-c.hp; // first tick = low dwell = low dmg
   for(let i=0;i<200;i++)bbWeaponFire(1/60); // hold it on the foe → ramp up
   const l0=c.hp;bbWeaponFire(1/60);const late=l0-c.hp; // now near max dwell
   ok('DRILL deals damage on contact while firing',early>0);
   ok('DRILL damage RAMPS the longer it stays on the foe',late>early*1.5);
   ok('DRILL ramps to a LIMIT (dwell caps at drillRampT)',a.drill[1]<=BB_W.drillRampT+1e-9&&late<=(BB_W.drillMax/60)+1e-6);
   // off the foe → the ramp spins back down (no damage out of arc/reach)
   const a2=bbBotWith('drill','balanced',0,0,true);a2.x=300;a2.y=300;a2.h=0;a2.firing=true;a2.drill={};
   const far=bbBotWith('none','balanced',1,1,true);far.x=300+RR*6;far.y=300;far.hp=BB.HP;bb2.bots=[a2,far];bb2.result=null;
   const f0=far.hp;bbWeaponFire(1/60);ok('DRILL does nothing to a foe out of reach',far.hp===f0);
   // v5.1.152: spin-up readout — _drillRamp climbs while grinding, falls when idle (so you can SEE it spin up)
   const dr=bbBotWith('drill','balanced',0,0,true);dr.x=300;dr.y=300;dr.h=0;dr.firing=true;dr.drill={};
   const dt=bbBotWith('none','balanced',1,1,true);dt.x=300+RR;dt.y=300;dt.hp=99999;bb2.bots=[dr,dt];bb2.result=null;
   bbWeaponFire(1/60);const ramp1=dr._drillRamp;for(let i=0;i<60;i++)bbWeaponFire(1/60);const ramp2=dr._drillRamp;
   ok('DRILL ramp readout climbs as you keep it on the foe',ramp2>ramp1&&dr._drillFx>0&&ramp2<=1.0001);
   dr.firing=false;for(let i=0;i<200;i++)bbWeaponFire(1/60);
   ok('DRILL ramp readout falls back + glow turns OFF when idle',dr._drillRamp<0.05&&!(dr._drillFx>0));
   // v5.1.210 BORE-DASH: drill ON + dash → PIERCE through a foe (no shove-apart separation) for bore damage; resets the bit's ramp
   {startBB(0,2);bb2.cd=0;bb2.result=null;const bo=bbBotWith('drill','balanced',0,0,true),vt=bbBotWith('none','balanced',1,1,true);
    bo.ctl.brain.fire=true;bo.x=300;bo.y=300;bo.h=0;bo.boostT=BOOST.dur;bo.drill={1:BB_W.drillRampT};bo._drillSpin=1;bo.hp=BB.HP;bo.mob=6;bo.inv=0; // low mob → the dash barely creeps, so it stays IN contact for the bore this frame
    vt.x=300+RR;vt.y=300;vt.hp=BB.HP;vt.mob=BB.MOB;vt.inv=0;bb2.bots=[bo,vt];
    const vh0=vt.hp,sep0=Math.hypot(bo.x-vt.x,bo.y-vt.y);updateBB(1/60);
    ok('DRILL BORE-DASH damages the foe it pierces',vt.hp<vh0);
    ok('DRILL BORE-DASH phases THROUGH (no shove-apart separation past body contact)',Math.hypot(bo.x-vt.x,bo.y-vt.y)<RR*2);
    ok('DRILL BORE-DASH resets the bit ramp (must re-grind after)',(bo.drill[1]||0)<0.1);
    // a drill NOT dashing (boost on cooldown) just bumps — the overlap shoves the two apart, no pierce
    const b2=bbBotWith('drill','balanced',0,0,true),v2=bbBotWith('none','balanced',1,1,true);
    b2.ctl.brain.fire=true;b2.x=300;b2.y=300;b2.h=0;b2.boostT=0;b2.boostCd=1;b2.drill={};b2._drillSpin=1;b2.hp=BB.HP;b2.mob=BB.MOB;b2.inv=0;
    v2.x=300+RR*1.2;v2.y=300;v2.hp=BB.HP;v2.mob=BB.MOB;v2.inv=0;bb2.bots=[b2,v2];const sepN0=Math.hypot(b2.x-v2.x,b2.y-v2.y);updateBB(1/60);
    ok('DRILL with no dash does NOT phase — the overlap separates the bots',Math.hypot(b2.x-v2.x,b2.y-v2.y)>sepN0);}}
  // ── v5.1.202: REPAIR DISH — PASSIVE = AoE attack-buff field (off while healing); ACTIVE = HOLD trigger to HEAL (right-stick targets, no stick → MOST-NEEDY); heal range == buff AoE (the AoE is the heal-range gauge) ──
  {ok('REPAIR is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='repair')&&BB_ARMORY_W.some(w=>w.id==='repair'));
   // PASSIVE buff: a repair bot NOT firing buffs a nearby ally; FIRING (healing) turns the buff OFF
   const pb=bbBotWith('repair','balanced',0,0,true);pb.x=300;pb.y=300;pb.h=0;pb.firing=false;pb.spin=0;
   const al2=bbBotWith('spinner','balanced',0,2,true);al2.x=300+RR*1.5;al2.y=300;al2._repairBuffT=0;bb2.bots=[pb,al2];
   for(let i=0;i<3;i++){pb.firing=false;bbWeaponFire(1/60);}
   ok('REPAIR PASSIVE buff: a non-firing dish buffs a nearby ally',(al2._repairBuffT||0)>0);
   al2._repairBuffT=0;for(let i=0;i<3;i++){pb.firing=true;bbWeaponFire(1/60);}
   ok('REPAIR buff turns OFF while healing (firing) — no buff applied',(al2._repairBuffT||0)===0);
   const vic=bbBotWith('none','balanced',1,1,true);vic.x=400;vic.y=400;vic.hp=BB.HP;vic.inv=0;const atk=bbBotWith('spinner','balanced',0,2,true);atk._repairBuffT=0;bb2.bots=[vic,atk];
   bbApplyHit(vic,'rear',100,1,400,410);const d1=BB.HP-vic.hp;vic.hp=BB.HP;vic.inv=0;atk._repairBuffT=1;bbApplyHit(vic,'rear',100,1,400,410);const d2=BB.HP-vic.hp;
   ok('REPAIR buff amplifies an ally\\'s damage',d2>d1);
   // ACTIVE heal: requires HOLDING the trigger (firing). Firing=true heals HP/tires/wheels; firing=false does NOT heal.
   const md=bbBotWith('repair','balanced',0,0,true);md.x=300;md.y=300;md.h=0;md.firing=true;
   const ally=bbBotWith('none','balanced',0,2,true);ally.x=300+RR;ally.y=300;ally.hp=200;ally.mhp=BB.HP;ally.mob=20;ally.wheels=[{hp:0,dead:true},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];
   bb2.bots=[md,ally];bb2.result=null;const ahp0=ally.hp,amob0=ally.mob;for(let i=0;i<60;i++){md.firing=true;bbWeaponFire(1/60);}
   ok('REPAIR ACTIVE (hold trigger) heals a hurt ally HP',ally.hp>ahp0&&md._repairTgt===ally);
   ok('REPAIR ACTIVE restores allied mobility (tires)',ally.mob>amob0);
   ok('REPAIR ACTIVE re-welds a dead wheel',ally.wheels[0].dead===false&&ally.wheels[0].hp>0);
   ok('REPAIR does not over-heal past max HP',ally.hp<=ally.mhp+1e-6);
   const nf=bbBotWith('repair','balanced',0,0,true);nf.x=300;nf.y=300;nf.h=0;nf.firing=false;
   const al3=bbBotWith('none','balanced',0,2,true);al3.x=300+RR;al3.y=300;al3.hp=200;al3.mhp=BB.HP;bb2.bots=[nf,al3];bb2.result=null;
   const a30=al3.hp;for(let i=0;i<30;i++){nf.firing=false;bbWeaponFire(1/60);}
   ok('REPAIR does NOT heal without the trigger held (heal is ACTIVE)',al3.hp===a30&&!nf._repairTgt);
   // dish spins only while healing (trigger held); idle decays
   const sp=bbBotWith('repair','balanced',0,0,true);sp.spin=0;sp.ctl.brain.fire=true;bb2.bots=[sp];for(let i=0;i<60;i++){sp.firing=true;bbWeaponPre(1/60);}
   ok('REPAIR dish spins UP while the heal trigger is held',sp.spin>=0.5);
   // no right-stick input → heal the MOST-NEEDY ally (bigger HP deficit wins, even if farther)
   const mn=bbBotWith('repair','balanced',0,0,true);mn.x=120;mn.y=300;mn.h=0;mn.firing=true;mn.ctl.brain.fire=true; // CPU → bbRepairAim null (no stick)
   const near=bbBotWith('none','balanced',0,2,true);near.x=120+RR*2;near.y=300;near.hp=BB.HP-30;near.mhp=BB.HP;near.mob=BB.MOB; // close, lightly hurt
   const needy=bbBotWith('none','balanced',0,2,true);needy.x=120+RR*6;needy.y=300;needy.hp=120;needy.mhp=BB.HP;needy.mob=BB.MOB; // farther, badly hurt
   bb2.bots=[mn,near,needy];bb2.result=null;mn.firing=true;bbWeaponFire(1/60);
   ok('REPAIR with no stick input heals the MOST-NEEDY ally (not the nearest)',mn._repairTgt===needy);
   // heal range == buff AoE (the AoE circle is the heal-range gauge): equal radii, support-from-range but still at risk (~75% of the old reach)
   ok('REPAIR heal range EQUALS the buff AoE (the AoE is the heal-range gauge)',Math.abs((1+BB_W.repairReachK)-BB_W.repairBuffRK)<0.5&&BB_W.repairReachK>=10);
   const lr=bbBotWith('repair','balanced',0,0,true);lr.x=120;lr.y=300;lr.h=0;lr.firing=true;
   const far=bbBotWith('none','balanced',0,2,true);far.x=120+RR*9;far.y=300;far.hp=200;far.mhp=BB.HP;far.mob=BB.MOB;bb2.bots=[lr,far];bb2.result=null; // ~9×RR — supports from range (within the shrunk reach)
   const fh0=far.hp;for(let i=0;i<30;i++){lr.firing=true;bbWeaponFire(1/60);}
   ok('REPAIR heals an ally from range (within the shrunk reach)',far.hp>fh0);
   ok('REPAIR attack buff is a meaningful but softer multiplier (>1, ≤2)',BB_W.repairDmgBuff>1&&BB_W.repairDmgBuff<=2);
   // v5.1.207 LIFE-STEAL: with NO ally to heal, holding the trigger DRAINS the nearest enemy + weakly self-heals; with an ally to heal it does NOT drain
   {const me=bbBotWith('repair','balanced',0,0,true);me.x=300;me.y=300;me.h=0;me.firing=true;me.hp=300;me.mhp=BB.HP;
    const foe=bbBotWith('none','balanced',1,1,true);foe.x=300+RR*4;foe.y=300;foe.hp=BB.HP;bb2.bots=[me,foe];bb2.result=null;
    const fh=foe.hp,mh=me.hp;for(let i=0;i<30;i++){me.firing=true;bbWeaponFire(1/60);}
    ok('REPAIR LIFE-STEAL: no ally → drains the enemy AND self-heals (weak)',foe.hp<fh&&me.hp>mh&&me._repairDrain===true&&me._repairTgt===foe);
    // drain is WEAK — far less than the heal rate (so it stays a support, loses 1v1s)
    ok('REPAIR life-steal DPS is weak (< the heal-per-sec, < raw weapon DPS)',BB_W.repairLifeDps<BB_W.repairHps&&BB_W.repairLifeDps<=35);
    ok('REPAIR has an anti-kite move-slow while healing/life-stealing (mirrors the flame slow)',BB_W.repairMoveMul<1&&BB_W.repairMoveMul>=0.3);
    // with a hurt ally present, the dish HEALS (green) and does NOT drain
    const ally=bbBotWith('none','balanced',0,2,true);ally.x=320;ally.y=300;ally.hp=200;ally.mhp=BB.HP;ally.mob=BB.MOB;
    const foe2=bbBotWith('none','balanced',1,1,true);foe2.x=300+RR*4;foe2.y=300;foe2.hp=BB.HP;
    const me2=bbBotWith('repair','balanced',0,0,true);me2.x=300;me2.y=300;me2.h=0;me2.firing=true;bb2.bots=[me2,ally,foe2];bb2.result=null;
    const f2=foe2.hp;for(let i=0;i<20;i++){me2.firing=true;bbWeaponFire(1/60);}
    ok('REPAIR prefers HEALING over draining (no drain while an ally needs heal)',me2._repairTgt===ally&&!me2._repairDrain&&foe2.hp===f2);}}
  // ── v5.1.112: PERKS (3rd loadout slot) — data + effects (Parting Gift, Flameproof) ──
  {ok('bbResolveLoadout carries the PERK slot',bbResolveLoadout({weapon:'spinner',armor:'balanced',perk:'flameproof'}).perk==='flameproof');
   ok('a default loadout has no perk',bbResolveLoadout(null).perk==='none');
   const fp=bbBotWith('none','balanced',1,1,true);fp.ld.perk='flameproof';fp.hp=BB.HP;fp.burn=0;bb2.bots=[bbBotWith('flame','balanced',0,0,true),fp];bb2.result=null;
   bbApplyFlame(fp,50,0);ok('FLAMEPROOF perk: a bot takes NO flame damage',fp.hp===BB.HP&&(fp.burn||0)===0);
   const np=bbBotWith('none','balanced',1,1,true);np.hp=BB.HP;np.burn=0;bb2.bots=[bbBotWith('flame','balanced',0,0,true),np];bbApplyFlame(np,50,0);ok('a NON-flameproof bot DOES take flame damage',np.hp<BB.HP);
   const pg=bbBotWith('none','balanced',0,0,true);pg.ld.perk='partinggift';pg.x=300;pg.y=300;pg.hp=10;
   const en=bbBotWith('none','balanced',1,1,true);en.x=300+RR*2;en.y=300;en.hp=BB.HP;en.inv=0;bb2.bots=[pg,en];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   const ehp0=en.hp;bbKill(pg,null);ok('PARTING GIFT perk: dying triggers a blast that damages a nearby ENEMY',en.hp<ehp0);
   ok('bbArmEquip can set the perk slot',(()=>{m2.tseats=[{loadout:{weapon:'wedge',armor:'balanced'}}];return bbArmEquip(0,'perk','partinggift')&&m2.tseats[0].loadout.perk==='partinggift';})());
   ok('CPU loadout includes a perk field',!!bbCpuPickLoadout(3).perk);}
  // ── v5.1.155: NONE removed as a pickable perk + new perks VAMPIRE / SPARE TIRE / PIT STOP ──
  {ok('NO PERK is a pickable perk again (neutral option)',BB_PERKS_PICK.some(p=>p.id==='none')&&BB_PERKS_PICK[0].id==='none');
   ok('CPUs always roll a real (non-NONE) perk',(()=>{for(let i=0;i<200;i++)if(bbCpuPickLoadout(2).perk==='none')return false;return true;})());
   ok('hover-tip: every weapon/armor/perk has a description',BB_ARMORY_W.concat(BB_ARMORY_A,BB_PERKS_PICK).every(c=>BB_DESC[c.id]&&BB_DESC[c.id].length>5)&&bbDescFull('perk','laststand').indexOf('INVULNERABLE')>=0); // v5.1.196
   ok('new perks exist: VAMPIRE, SPARE TIRE, PIT STOP',['vampire','sparetire','pitstop'].every(id=>BB_PERKS_PICK.some(p=>p.id===id)));
   // VAMPIRE: destroying an enemy heals the killer
   const vk=bbBotWith('none','balanced',0,0,true);vk.ld.perk='vampire';vk.hp=200;vk.mhp=BB.HP;vk.x=300;vk.y=300;
   const vv=bbBotWith('none','balanced',1,1,true);vv.x=320;vv.y=300;vv.hp=10;bb2.bots=[vk,vv];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   const vhp0=vk.hp;bbKill(vv,0);ok('VAMPIRE: destroying an enemy heals the killer',vk.hp>vhp0);
   // SPARE TIRE: the first wheel to die is re-welded once
   const st=bbBotWith('none','balanced',0,0,true);st.ld.perk='sparetire';st.wheels=[{hp:5,dead:false},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];st._spareUsed=false;
   bbWheelDamage(st,100,null,null);ok('SPARE TIRE: the first wheel survives (re-welded) once',st.wheels.every(w=>!w.dead)&&st._spareUsed===true);
   bbWheelDamage(st,100,null,null);ok('SPARE TIRE: the SECOND wheel to break is lost (spare spent)',st.wheels.some(w=>w.dead));
   // PIT STOP: v5.1.208 deploys a MEDIC drone that restores MOBILITY (tires/wheels) ONLY — NOT HP
   const ps=bbBotWith('none','balanced',0,0,true);ps.ld.perk='pitstop';ps.x=400;ps.y=400;ps.hp=BB.HP;ps.mhp=BB.HP;
   const ally=bbBotWith('none','balanced',0,0,true);ally.ld.perk='none';ally.x=420;ally.y=400;ally.hp=150;ally.mhp=BB.HP;ally.mob=10;ally.wheels=[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false}));ally.wheels[0].dead=true;ally.wheels[0].hp=0;
   const en=bbBotWith('none','balanced',1,1,true);en.dead=true;
   bb2.bots=[ps,ally,en];bb2.result=null;bb2.cd=0;bb2.minis=bbMiniSpawn();
   ok('PIT STOP deploys a MEDIC drone (owner-linked, same side)',bb2.minis.length===1&&bb2.minis[0].kind==='medic'&&bb2.minis[0].owner===ps&&bb2.minis[0].side===0);
   const h0=ally.hp,mob0=ally.mob;for(let i=0;i<160;i++)bbMiniUpdate(1/60); // drive the medic directly (no CPU wander) → it seeks + patches the hurt ally
   ok('PIT STOP medic restores ally MOBILITY (tires)',ally.mob>mob0);
   ok('PIT STOP medic does NOT heal HP (only mobility/tires)',ally.hp===h0);
   ok('PIT STOP medic re-welds a dead ally wheel',!ally.wheels[0].dead);
   // v5.1.208 a DASHING enemy can grind the drone down (no weapon needed)
   const m=bb2.minis[0];m.hp=m.mhp;const dh=m.hp;const dasher=bbBotWith('none','balanced',1,1,true);dasher.x=m.x;dasher.y=m.y;dasher.boostT=0.2;dasher.dead=false;bb2.bots=[ps,ally,dasher];
   for(let i=0;i<20;i++){dasher.boostT=0.2;dasher.x=m.x;dasher.y=m.y;bbMiniUpdate(1/60);}
   ok('a DASHING enemy damages the drone (no weapon)',m.hp<dh);}
  // ── v5.1.181 NEW PERKS: ADRENALINE / PAINKILLER / LAST STAND ──
  {ok('new perks exist: ADRENALINE, PAINKILLER, LAST STAND',['adrenaline','painkiller','laststand'].every(id=>BB_PERKS_PICK.some(p=>p.id===id)));
   const ad=bbBotWith('none','balanced',0,0,true);ad.ld.perk='adrenaline';ad.mhp=BB.HP;
   ad.hp=BB.HP;const full=bbAdrenaline(ad);ad.hp=BB.HP*0.05;const low=bbAdrenaline(ad);
   ok('ADRENALINE: full HP = no bonus (×1)',Math.abs(full-1)<1e-9);
   ok('ADRENALINE: near death deals much MORE (×>1.5)',low>1.5&&low<=1+BB_W.adrenalineMax+1e-9);
   const pk=bbBotWith('none','balanced',1,1,true);pk.ld.perk='painkiller';pk.mob=0;pk._painUsed=true;pk._painT=BB_W.painkillerDelay;
   const sFast=bbSpeed(pk);pk._painT=0;const sSlow=bbSpeed(pk);
   ok('PAINKILLER: full speed during the grace window even at 0 mobility',sFast>0);
   ok('PAINKILLER: once the grace ends, 0 mobility immobilizes as normal',sSlow===0&&sFast>sSlow);
   startBB(0,2);bb2.cd=0;bb2.result=null;const ls=bbBotWith('none','balanced',0,0,true);ls.ld.perk='laststand';ls.x=300;ls.y=300;ls.hp=10;ls.inv=0;
   const foe=bbBotWith('none','balanced',1,1,true);foe.hp=BB.HP;bb2.bots=[ls,foe];
   bbKill(ls,1);ok('LAST STAND: a would-be KO instead grants a window (not dead)',!ls.dead&&(ls._lastStandT||0)>0&&ls._lastStandUsed===true);
   const lhp=ls.hp;bbApplyHit(ls,'rear',200,1,ls.x+10,ls.y);ok('LAST STAND: INVULNERABLE during the window',ls.hp===lhp&&!ls.dead);
   ls._lastStandT=0.01;bb2.bots=[ls,foe];bbWeaponPre(1/60);ok('LAST STAND: when the window expires, the bot finally dies',ls.dead===true);
   // v5.1.219 WIN during LAST STAND: killing the LAST enemy lets you survive the kill's chain reaction → you WIN (only a deliberate PARTING GIFT death-bomb takes you out → draw)
   {startBB(0,2);bb2.cd=0;bb2.result=null;const me=bbBotWith('none','balanced',0,0,true);me.ld.perk='laststand';me.x=300;me.y=300;me.hp=1;me._lastStandT=5;me._lastStandUsed=true;me.dead=false;me.lives=0;
    const enemy=bbBotWith('none','balanced',1,1,true);enemy.x=312;enemy.y=300;enemy.hp=BB.HP;enemy.dead=false;enemy.lives=0;
    bb2.bots=[me,enemy];bb2.result=null;bbKill(enemy,0); // I (last stand, hp1) destroy the last enemy in melee; the normal death chain must NOT finish me
    ok('LAST STAND: killing the last enemy mid-window → I survive the chain and WIN',me.dead===false&&bb2.result===0);
    const me2=bbBotWith('none','balanced',0,0,true);me2.ld.perk='laststand';me2.x=300;me2.y=300;me2.hp=1;me2._lastStandT=5;me2._lastStandUsed=true;me2.dead=false;me2.lives=0;
    const pg=bbBotWith('none','balanced',1,1,true);pg.ld.perk='partinggift';pg.x=312;pg.y=300;pg.hp=BB.HP;pg.dead=false;pg.lives=0;
    bb2.bots=[me2,pg];bb2.result=null;bbKill(pg,0); // the last enemy had PARTING GIFT → its death-bomb still takes me out → DRAW
    ok('LAST STAND: but a PARTING GIFT death-bomb still takes me out → DRAW',me2.dead===true&&bb2.result==='draw');}}
  // ── v5.1.181 HEATSHIELD: flamethrower-proof + general damage reduction ──
  {const hs=bbBotWith('none','heatshield',1,1,true);hs.x=300;hs.y=300;hs.h=0;hs.inv=0;hs.hp=BB.HP;hs.burn=0;
   bbApplyFlame(hs,60,0);ok('HEATSHIELD: flamethrower-PROOF (no flame damage or burn)',hs.hp===BB.HP&&(hs.burn||0)===0);
   hs.inv=0;const bal=bbBotWith('none','balanced',1,2,true);bal.x=300;bal.y=300;bal.h=0;bal.inv=0;bal.hp=BB.HP;
   bbApplyHit(hs,'rear',100,null,hs.x,hs.y+10);bbApplyHit(bal,'rear',100,null,bal.x,bal.y+10);
   ok('HEATSHIELD: general damage reduction vs kinetic (takes less than balanced)',(BB.HP-hs.hp)<(BB.HP-bal.hp)&&hs.hp<BB.HP);}
  // ── v5.1.157: REACTIVE armor — first hit on each zone zaps the attacker (limited charges) ──
  {const rv=bbBotWith('none','reactive',1,1,true);rv.x=300;rv.y=300;rv.h=0;rv.inv=0;rv.hp=BB.HP;
   const atk=bbBotWith('none','balanced',0,0,true);atk.x=200;atk.y=300;atk.hp=BB.HP;atk.inv=0;bb2.bots=[atk,rv];bb2.result=null;
   const a0=atk.hp;bbApplyHit(rv,'rear',30,0,atk.x,atk.y);
   ok('REACTIVE: the first hit on a zone ZAPS the attacker',atk.hp<=a0-BB_W.reactDmg+0.001);
   rv.inv=0;const a1=atk.hp;bbApplyHit(rv,'rear',30,0,atk.x,atk.y);
   ok('REACTIVE: that zone charge is SPENT (no second zap from the same side)',atk.hp===a1);}
  // ── v5.1.114: P5 DRIVE SYNERGY — TANK-family drive shoves harder ──
  {ok('P5: TANK-family drive has a push buff (>1)',BB_W.tankPush>1);
   ok('bbDriveFamily maps the main TANK drive to the tank family',(()=>{const sd=m2.drive[0];m2.drive[0]={kind:'main',idx:0};const r=bbDriveFamily(0);m2.drive[0]=sd;return r==='tank';})());
   ok('bbDriveFamily maps SWERVE to the swerve family (no push buff)',(()=>{const sd=m2.drive[0];m2.drive[0]={kind:'main',idx:3};const r=bbDriveFamily(0);m2.drive[0]=sd;return r==='swerve';})());}
  // ── v5.1.115: P6 BOT-NAME EASTER EGGS — Optimus/Bumblebee (steering HEAL), Original Sin (tank+blade invuln wheels) ──
  {ok('bbNameEgg detects the three eggs',bbNameEgg({ctl:{name:'Optimus Prime',bind:0}})==='optimus'&&bbNameEgg({ctl:{name:'bumblebee',bind:0}})==='bumblebee'&&bbNameEgg({ctl:{name:'Original Sin',bind:0}})==='originalsin');
   const sd=m2.drive[0];
   m2.drive[0]={kind:'steer',idx:0};const op=bbBotWith('none','balanced',0,0,true);op.ctl.name='Optimus Prime';op.hp=100;bb2.bots=[op];bb2.result=null;bb2.cd=0;bb2.t=1;
   ok('OPTIMUS + STEERING drive activates the egg buff',bbEggActive(op)==='optimus');
   const hp0=op.hp;updateBB(0.5);ok('OPTIMUS + steering HEALS over time (hp '+hp0+'→'+op.hp.toFixed(0)+')',op.hp>hp0);
   m2.drive[0]={kind:'main',idx:0};const op2=bbBotWith('none','balanced',0,0,true);op2.ctl.name='Optimus Prime';ok('OPTIMUS on a NON-steering drive = paint only, NO buff',bbEggActive(op2)===null&&bbNameEgg(op2)==='optimus');
   const os=bbBotWith('wedge','balanced',0,0,true);os.ctl.name='Original Sin';os.wheels=[{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];
   bbWheelDamage(os,100,null,null);ok('ORIGINAL SIN (tank+blade): wheels are INVULNERABLE',os.wheels.every(w=>!w.dead&&w.hp===40));
   {const sdA=m2.drive[0];m2.drive[0]={kind:'main',idx:1};const osA=bbBotWith('wedge','balanced',0,0,true);osA.ctl.name='Original Sin';ok('ORIGINAL SIN buff also triggers on ARCADE drive (tank family), not just tank',bbEggActive(osA)==='originalsin');m2.drive[0]=sdA;} // v5.1.227 Sam: tank OR arcade
   os.inv=0;os.hp=BB.HP;os.burn=0;os._lastStandT=0;bbApplyHit(os,'rear',200,null,os.x+50,os.y);const osLoss=BB.HP-os.hp; // v5.1.225 buff = invuln wheels + HALF damage taken
   const ref=bbBotWith('wedge','balanced',0,0,true);ref.ctl.name='RANDO';ref.inv=0;ref.hp=BB.HP;ref._lastStandT=0;bbApplyHit(ref,'rear',200,null,ref.x+50,ref.y);const refLoss=BB.HP-ref.hp; // identical bot, no egg = full damage
   ok('ORIGINAL SIN takes GREATLY REDUCED (~½) kinetic damage',osLoss>0&&refLoss>0&&Math.abs(osLoss-refLoss*0.5)<refLoss*0.12);
   os.hp=BB.HP;os.burn=0;bbApplyFlame(os,20,null);const osF=BB.HP-os.hp;ref.hp=BB.HP;ref.burn=0;bbApplyFlame(ref,20,null);const refF=BB.HP-ref.hp;
   ok('ORIGINAL SIN takes ~½ flame damage too (not immune)',osF>0&&refF>0&&Math.abs(osF-refF*0.5)<refF*0.15);
   ok('a NON-egg bot still takes FULL kinetic damage',refLoss>0);
   const os2=bbBotWith('wedge','balanced',0,0,true);os2.ctl.name='RANDO';os2.wheels=[{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];
   bbWheelDamage(os2,100,null,null);ok('a normal bot DOES take wheel damage',os2.wheels.some(w=>w.dead||w.hp<40));m2.drive[0]=sd;}
  // ── v5.1.221: P6 egg FULL LIVERY (full-body paint replaces the old two-tone ring) ──
  {ok('BB_LIVERY defines a full paint job for all three eggs',!!(BB_LIVERY.optimus&&BB_LIVERY.bumblebee&&BB_LIVERY.originalsin));
   ok('ORIGINAL SIN livery runs 4 wheels even in tank drive + black/silver body (Sam spec)',BB_LIVERY.originalsin.wheels4===true&&BB_LIVERY.optimus.wheels4!==true&&!!BB_LIVERY.originalsin.body&&!!BB_LIVERY.originalsin.stroke);
   ok('BUMBLEBEE livery has racing stripes; OPTIMUS has a two-tone split',BB_LIVERY.bumblebee.stripe===true&&!!BB_LIVERY.optimus.body2);
   ok('ORIGINAL SIN 4-wheel look uses the H-strafer omni-wheel renderer',typeof drawOmniWhl==='function');}
  // ── v5.1.116: P7 combat cheat — MOVE OR DIE (stand still → bleed HP) ──
  {const sv=moveOrDie;moveOrDie=true;const b=bbBotWith('none','balanced',0,0,true);b.x=400;b.y=400;b.hp=BB.HP;b.mob=BB.MOB;b._modX=400;b._modY=400;
   const foe=bbBotWith('none','balanced',1,1,true);foe.dead=true;bb2.bots=[b,foe];bb2.result=null;bb2.cd=0;bb2.t=1;
   const hp0=b.hp;for(let i=0;i<40;i++){bb2.cd=0;updateBB(1/60);}ok('MOVE OR DIE cheat: a stationary bot BLEEDS HP',b.hp<hp0);
   moveOrDie=false;const b2=bbBotWith('none','balanced',0,0,true);b2.x=400;b2.y=400;b2.hp=BB.HP;b2.mob=BB.MOB;b2._modX=400;b2._modY=400;bb2.bots=[b2,Object.assign(bbBotWith('none','balanced',1,1,true),{dead:true})];bb2.result=null;
   for(let i=0;i<40;i++){bb2.cd=0;updateBB(1/60);}ok('MOVE OR DIE off: a stationary bot is unharmed',b2.hp===BB.HP);moveOrDie=sv;}
  // ── v5.1.117: P4 MINIBOTS — the MINIBOT perk deploys a harasser (shove + pin, no HP; retires with its deployer) ──
  {ok('MINIBOT is a perk',BB_PERKS.some(p=>p.id==='minibot'));
   ok('CPU perk roll can deploy a minibot',(()=>{for(let i=0;i<400;i++)if(bbCpuPickLoadout(2).perk==='minibot')return true;return false;})());
   const o1=bbBotWith('wedge','balanced',0,0,true);o1.ld.perk='minibot';o1.x=200;o1.y=200;
   const o2=bbBotWith('wedge','balanced',1,1,true);o2.ld.perk='none';o2.x=400;o2.y=400;
   bb2.bots=[o1,o2];bb2.result=null;bb2.minis=bbMiniSpawn();
   ok('only the MINIBOT-perk bot deploys a minibot (one, same side, owner linked)',bb2.minis.length===1&&bb2.minis[0].side===0&&bb2.minis[0].owner===o1);
   ok('the minibot is SMALLER than a main bot',bbMiniRR()<RR);
   // HARASS: a minibot in contact shoves + pins an opponent, deals NO HP damage
   const own=bbBotWith('wedge','balanced',0,0,true);own.ld.perk='minibot';own.dead=false;
   const en=bbBotWith('wedge','balanced',1,1,true);en.x=300;en.y=300;en.hp=BB.HP;en.mob=BB.MOB;en.pinT=0;
   bb2.bots=[en];bb2.result=null;bb2.minis=[{x:285,y:300,h:0,side:0,owner:own,col:'#fff',dead:false}];
   const ehp0=en.hp;bbMiniUpdate(1/60);
   ok('minibot HARASSES: shoves the opponent (it moves) + pins it, NO HP damage',en.hp===ehp0&&(en.x!==300||en.y!==300)&&en.pinT>0);
   // a minibot does NOT harass a same-side bot
   const ally=bbBotWith('wedge','balanced',0,3,true);ally.x=300;ally.y=300;ally.pinT=0;ally.hp=BB.HP;
   bb2.bots=[ally];bb2.minis=[{x:285,y:300,h:0,side:0,owner:own,col:'#fff',dead:false}];bbMiniUpdate(1/60);
   ok('minibot does NOT pin a same-side bot',ally.pinT===0&&ally.hp===BB.HP);
   // retires when its deployer is KO'd
   own.dead=true;bb2.bots=[];bb2.minis=[{x:0,y:0,h:0,side:0,owner:own,col:'#fff',dead:false}];bbMiniUpdate(1/60);
   ok('minibot RETIRES when its deployer is gone',bb2.minis[0].dead===true);}
  // ── v5.1.118: P7 combat cheats — UNLIMITED RESOURCES (no cooldowns) + MEGABOTS (giant HP + crushing ram) ──
  {ok('UNLIMITED RESRC is a cheat',CHEATS.some(c=>c.name==='UNLIMITED RESRC'));
   ok('MEGABOTS is a cheat',CHEATS.some(c=>c.name==='MEGABOTS'));
   const sv1=bbUnlimited;bbUnlimited=true;
   const pz=bbBotWith('piston','balanced',0,0,true);pz.pistCd=BB_W.pistCd;pz.grabCd=1;
   const sp=bbBotWith('spinner','balanced',1,1,true);sp.spin=0;
   bb2.bots=[pz,sp];bb2.result=null;bbWeaponPre(1/60);
   ok('UNLIMITED RESOURCES zeroes weapon cooldowns',pz.pistCd===0&&pz.grabCd===0);
   ok('UNLIMITED RESOURCES keeps the disc fully spun-up',sp.spin===1);
   bbUnlimited=sv1;
   const mega=bbBotWith('none','balanced',0,0,true);mega.mega=true;const norm=bbBotWith('none','balanced',0,0,true);
   ok('MEGABOTS deal MORE ram damage',bbContactDmg(mega,20)>bbContactDmg(norm,20)&&Math.abs(bbContactDmg(mega,20)-20*BB_W.megaDmg)<1e-6);
   ok('MEGABOTS HP multiplier is >1',BB_W.megaHp>1);
   const svm=megaBots;megaBots=true;startBB(0,2);
   ok('MEGABOTS spawn with a giant HP pool (hp=mhp, scaled ≥megaHp×base)',bb2.bots.every(b=>b.hp===b.mhp&&b.mega===true&&b.mhp>=BB.HP*BB_W.megaHp*0.85));
   megaBots=svm;}
  // ── v5.1.119: P7 combat cheats — AIRSTRIKE (arena bombs) + ANIME SWORD (front-arc slash) ──
  {ok('AIRSTRIKE is a cheat',CHEATS.some(c=>c.name==='AIRSTRIKE'));
   ok('ANIME SWORD is a cheat',CHEATS.some(c=>c.name==='ANIME SWORD'));
   const sva=airStrike;airStrike=true;
   const ab=bbBotWith('none','balanced',0,0,true);ab.x=300;ab.y=300;ab.hp=BB.HP;ab.inv=0;
   bb2.bots=[ab];bb2.result=null;bb2.blasts=[];bb2.airPending=null;bb2.airT=0.02;const ahp0=ab.hp,nbl0=bb2.blasts.length;
   bbAirstrikeUpdate(0.05); // timer fires → a WAVE of TELEGRAPHS appears (no damage yet)
   ok('AIRSTRIKE telegraphs a WAVE first (airWave pending crosshairs, no blast/damage yet)',bb2.airPending&&bb2.airPending.length===BB_W.airWave&&bb2.blasts.length===nbl0&&ab.hp===ahp0);
   bbAirstrikeUpdate(BB_W.airTele+0.6); // telegraphs expire (incl. the stagger) → the whole wave DETONATES
   ok('AIRSTRIKE then detonates the whole wave (blasts appear + the bot under the on-action bomb is damaged)',bb2.airPending.length===0&&bb2.blasts.length>nbl0&&ab.hp<ahp0);
   ok('AIRSTRIKE resets its timer after a strike',bb2.airT>0);
   airStrike=false;const ab2=bbBotWith('none','balanced',0,0,true);ab2.hp=BB.HP;bb2.bots=[ab2];bb2.blasts=[];bb2.airPending=null;bb2.airT=0.02;bbAirstrikeUpdate(0.05);
   ok('AIRSTRIKE off: no telegraph, no bombs, no damage',!bb2.airPending&&bb2.blasts.length===0&&ab2.hp===BB.HP);airStrike=sva;
   const svs=animeSword;animeSword=2; // v5.1.212 EVERYONE mode: CPUs auto-slash on the timer
   const sw=bbBotWith('none','balanced',0,0,true);sw.x=300;sw.y=300;sw.h=0;sw.swordCd=0;
   const front=bbBotWith('none','balanced',1,1,true);front.x=300+RR+10;front.y=300;front.h=0;front.hp=BB.HP;front.inv=0;
   const back=bbBotWith('none','balanced',1,2,true);back.x=300-RR-10;back.y=300;back.h=0;back.hp=BB.HP;back.inv=0;
   bb2.bots=[sw,front,back];bb2.result=null;bb2.swordCut=null;const fhp0=front.hp,bhp0=back.hp;bbSwordUpdate(1/60);
   ok('ANIME SWORD (EVERYONE) — a CPU slashes a foe in the FRONT arc (damage + FX)',front.hp<fhp0&&sw._swordFx>0);
   ok('ANIME SWORD spares a foe BEHIND (outside the front arc)',back.hp===bhp0);
   ok('ANIME SWORD goes on cooldown after a swing',sw.swordCd>0);
   // v5.1.212 MECHA MODE: YOU-only gates CPUs out; the human slashes on a DASH; a human sword-KO fires the cut-in
   animeSword=1;const cpu2=bbBotWith('none','balanced',0,0,true);cpu2.x=300;cpu2.y=300;cpu2.h=0;cpu2.swordCd=0;cpu2._swordDashed=false;
   const ftgt=bbBotWith('none','balanced',1,1,true);ftgt.x=300+RR+10;ftgt.y=300;ftgt.hp=BB.HP;ftgt.inv=0;
   bb2.bots=[cpu2,ftgt];bb2.result=null;const fh1=ftgt.hp;bbSwordUpdate(1/60);
   ok('MECHA YOU-mode: a CPU does NOT get the sword',ftgt.hp===fh1&&!bbIsMecha(cpu2));
   const hu=bbBotWith('none','balanced',0,0,false);hu.x=300;hu.y=300;hu.h=0;hu._swordDashed=false;hu.boostT=BOOST.dur;hu._iaiT=0;
   const ht=bbBotWith('none','balanced',1,1,true);ht.x=900;ht.y=300;ht.hp=BB.HP;ht.inv=0; // far away — won't be in the slash this frame
   bb2.bots=[hu,ht];bb2.result=null;bb2.swordCut=null;bbSwordUpdate(1/60);
   ok('MECHA iai: a DASH starts the wind-up PAUSE (no slash yet, boost cancelled)',(hu._iaiT||0)>0&&!(hu._swordFx>0)&&hu.boostT===0&&bbIsMecha(hu));
   const hx0=hu.x;for(let i=0;i<18;i++)bbSwordUpdate(1/60); // wind-up elapses → BLINK forward + slash fx
   ok('MECHA iai: after the pause the mecha BLINKS forward + the slash fires',hu.x>hx0+RR&&hu._swordFx>0&&(hu._iaiT||0)<=0);
   // the iai slash is a CLEAN ONE-HIT-KILL (lethal) — tested directly on a foe squarely in the front arc
   const hk=bbBotWith('none','balanced',0,0,false);hk.x=300;hk.y=300;hk.h=0;
   const dyn=bbBotWith('none','hardplate',1,1,true);dyn.x=300+RR*1.5;dyn.y=300;dyn.hp=BB.HP;dyn.inv=0; // even a HARDPLATE foe is cleanly cut
   bb2.bots=[hk,dyn];bb2.result=null;bb2.swordCut=null;bbSwordSlash(hk,0,true);
   ok('MECHA iai: a clean lethal slash ONE-HIT-KILLS (even hardplate) + fires the cut-in',dyn.dead&&!!bb2.swordCut);
   bb2.swordCut=null;animeSword=svs;}
  // ── v5.1.215: cannon cheats SPLIT — UNLOCK CANNON (plain weapon) vs EXPLOSIVE SHELLS (modifier) + MACHINE GUN full-auto + BOUNCY ricochet ──
  {const svc=cannonWeapon,sve=explosiveShells,svm=machineGun,svb=bouncyMode;cannonWeapon=false;explosiveShells=false;machineGun=0;bouncyMode=false;
   const inCycler=()=>{const ld={weapon:'spinner',armor:'balanced',perk:'none'},seen={};for(let i=0;i<14;i++){bbCycleField(ld,'weapon',1);seen[ld.weapon]=1;}return !!seen.cannon;};
   const inRail=()=>bbArmoryChips().some(c=>c.kind==='weapon'&&c.id==='cannon');
   ok('CANNON hidden from cycler + rail with no UNLOCK CANNON',!inCycler()&&!inRail());
   explosiveShells=true;
   ok('EXPLOSIVE SHELLS does NOT unlock the cannon (it is only a shell modifier)',!inCycler()&&!inRail());
   explosiveShells=false;cannonWeapon=true;
   ok('UNLOCK CANNON adds the cannon to BOTH the cycler and the drag-drop rail',inCycler()&&inRail());
   cannonWeapon=false;
   const fire=(expl,mg)=>{explosiveShells=expl;machineGun=mg;const a=bbBotWith('cannon','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.firing=true;a.cannonCd=0;bb2.bots=[a];bb2.shells=[];bb2.result=null;bbWeaponFire(1/60);return {s:bb2.shells[0],cd:a.cannonCd};};
   let r=fire(false,0);ok('PLAIN cannon shell is DIRECT-HIT (expl=0)',!!r.s&&!(r.s.expl>0));
   r=fire(true,0);ok('EXPLOSIVE SHELLS makes the cannon shell EXPLOSIVE (expl>0)',!!r.s&&r.s.expl>0);
   const norm=fire(false,0).cd,mgcd=fire(false,2).cd;
   ok('MACHINE GUN shortens the cannon reload to cannonMgCd (full-auto)',mgcd<norm&&Math.abs(mgcd-BB_W.cannonMgCd)<1e-9);
   explosiveShells=false;machineGun=0;bouncyMode=true; // BOUNCY: a plain shell ricochets off an arena wall instead of dying
   const sh={x:FW-1,y:300,vx:600,vy:0,t:2,owner:0,side:0,dmg:50,kn:0,expl:0};bb2.bots=[];bb2.shells=[sh];bb2.result=null;bbShellsUpdate(1/60);
   ok('BOUNCY: a plain cannon shell RICOCHETS off a wall (vx flips, not dead, bnc=1)',!sh.dead&&sh.vx<0&&sh.bnc===1);
   bouncyMode=false;const sh2={x:FW-1,y:300,vx:600,vy:0,t:2,owner:0,side:0,dmg:50,kn:0,expl:0};bb2.shells=[sh2];bbShellsUpdate(1/60);
   ok('no BOUNCY: a shell that leaves the arena dies',sh2.dead);
   cannonWeapon=svc;explosiveShells=sve;machineGun=svm;bouncyMode=svb;}
  // ── v5.1.174: AIM ASSIST (a smidge of magnetism) + RUMBLE toggle ──
  {const sa=aimAssist;aimAssist=true;
   const me=bbBotWith('flame','balanced',0,0,true);me.x=300;me.y=300;
   const fo=bbBotWith('none','balanced',1,1,true);fo.x=300+RR*4;fo.y=300-RR*0.5;bb2.bots=[me,fo];
   const fang=Math.atan2(fo.y-me.y,fo.x-me.x),adj=bbAimAssistTurret(me,0);
   ok('AIM ASSIST: turret aim is pulled TOWARD a foe within the cone',adj!==0&&Math.abs(adj-fang)<Math.abs(0-fang));
   aimAssist=false;ok('AIM ASSIST off: turret aim is unchanged',bbAimAssistTurret(me,0)===0);
   const fa=bbBotWith('none','balanced',1,2,true);fa.x=300;fa.y=300-RR*4;bb2.bots=[me,fa];aimAssist=true; // a foe 90° to the SIDE is OUTSIDE the assist cone
   ok('AIM ASSIST: a foe outside the cone is NOT snapped to',bbAimAssistTurret(me,0)===0);
   ok('AIM ASSIST toggles + persists intent',(()=>{const b4=aimAssist;toggleAimAssist();const r=aimAssist!==b4;toggleAimAssist();return r&&aimAssist===b4;})());
   ok('RUMBLE toggles',(()=>{const b4=rumbleOn;toggleRumble();const r=rumbleOn!==b4;toggleRumble();return r&&rumbleOn===b4;})());
   aimAssist=sa;}
  // ── v5.1.175: CANNON — the tank-fight cannon as a PICKABLE weapon (RT fires shells at range; turreted aim) ──
  {const svc=cannonWeapon; // v5.1.188 CANNON is CHEAT-GATED: hidden from the armory/cycler/CPU pool until the UNLOCK CANNON cheat is on
   cannonWeapon=false;ok('CANNON hidden from the armory rail until unlocked',!bbArmoryChips().some(c=>c.kind==='weapon'&&c.id==='cannon'));
   {const ld={weapon:'spinner',armor:'balanced',perk:'none'};let hit=false;for(let i=0;i<BB_WEAPONS.length+3;i++){bbCycleField(ld,'weapon',1);if(ld.weapon==='cannon')hit=true;}ok('CANNON skipped by the weapon cycler until unlocked',!hit);} // cycler never lands on cannon (filtered list)
   cannonWeapon=true;ok('UNLOCK CANNON cheat reveals it in the armory rail',bbArmoryChips().some(c=>c.kind==='weapon'&&c.id==='cannon'));
   cannonWeapon=svc;
   ok('CANNON exists in the weapon table + is a TURRET',BB_WEAPONS.some(w=>w.id==='cannon')&&bbIsTurret('cannon')===true);
   const cn=bbBotWith('cannon','balanced',0,0,true);cn.x=200;cn.y=300;cn.h=0;cn.ctl.brain.fire=true;cn.cannonCd=0;
   const tg=bbBotWith('wedge','balanced',1,1,true);tg.x=340;tg.y=300;tg.hp=BB.HP;tg.inv=0;
   bb2.bots=[cn,tg];bb2.result=null;bb2.shells=[];
   bbWeaponPre(1/60);bbWeaponFire(1/60);
   ok('CANNON fires a shell on RT',(bb2.shells||[]).length>0);
   const h0=tg.hp;for(let i=0;i<90;i++){bbWeaponPre(1/60);bbShellsUpdate(1/60);}
   ok('CANNON shell travels + damages a foe at range',tg.hp<h0);
   const cn2=bbBotWith('cannon','balanced',0,0,true);cn2.x=200;cn2.y=300;cn2.ctl.brain.fire=false;cn2.cannonCd=0;bb2.bots=[cn2,tg];bb2.shells=[];
   bbWeaponPre(1/60);bbWeaponFire(1/60);ok('CANNON holds fire when RT is up',(bb2.shells||[]).length===0);}
  // ── v5.1.189 CANNON EXPLOSIVE ROUNDS: shells detonate in an AoE (like the tank explosive powerup) ──
  {startBB(0,2);bb2.cd=0;bb2.result=null;const sh=bbBotWith('cannon','balanced',0,0,true);sh.x=100;sh.y=100;
   const t1=bbBotWith('none','balanced',1,1,true);t1.x=400;t1.y=300;t1.hp=BB.HP;t1.inv=0;
   const t2=bbBotWith('none','balanced',1,2,true);t2.x=400+RR*2;t2.y=300;t2.hp=BB.HP;t2.inv=0; // a nearby foe, inside the blast radius
   bb2.bots=[sh,t1,t2];bb2.shells=[{x:400,y:300,vx:0,vy:0,t:1,owner:0,side:0,dmg:BB_W.cannonDmg,kn:0,expl:BB_W.cannonBlastR}];
   const h1=t1.hp,h2=t2.hp;bbShellsUpdate(1/60);
   ok('CANNON explosive round: AoE damages the direct target',t1.hp<h1);
   ok('CANNON explosive round: AoE ALSO hits a nearby foe (blast radius)',t2.hp<h2);}
  // ── v5.1.182 JET ENGINE: a fast-spin-up FORWARD thrust cone — pushes foes away (stronger close) + upfront damage ──
  {ok('JET is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='jet')&&BB_ARMORY_W.some(w=>w.id==='jet'));
   startBB(0,2);bb2.cd=0;bb2.result=null;const jt=bbBotWith('jet','balanced',0,0,true),c=bbBotWith('none','balanced',1,1,true);
   jt.x=300;jt.y=300;jt.h=0;jt.firing=true;jt.spin=1;c.x=300+RR*3;c.y=300;c.hp=BB.HP;c.inv=0;c.mob=BB.MOB;bb2.bots=[jt,c];
   const cx0=c.x,h0=c.hp;bbJetUpdate(1/60);
   ok('JET: pushes a foe in the forward cone AWAY',c.x>cx0);
   ok('JET: deals direct trickle damage',c.hp<h0);
   {const wc=bbBotWith('none','balanced',1,3,true);wc.x=FW-RR-1;wc.y=300;wc.hp=BB.HP;wc.inv=0;wc.mob=BB.MOB;const jw=bbBotWith('jet','balanced',0,4,true);jw.x=FW-RR-RR*3;jw.y=300;jw.h=0;jw.spin=1;jw.firing=true;bb2.bots=[jw,wc];
    const wh=wc.hp;for(let i=0;i<20;i++)bbJetUpdate(1/60);ok('JET: shoving a foe INTO a wall deals SLAM damage',wc.hp<wh);}
   const bb3=bbBotWith('none','balanced',1,2,true);bb3.x=300-RR*3;bb3.y=300;bb3.hp=BB.HP;bb3.inv=0;bb3.mob=BB.MOB;bb2.bots=[jt,bb3];
   const bx0=bb3.x,bh0=bb3.hp;bbJetUpdate(1/60);ok('JET: a foe BEHIND (outside the forward cone) is untouched',bb3.x===bx0&&bb3.hp===bh0);
   jt.spin=0;jt.ctl.brain.fire=true;bb2.bots=[jt,c];bbWeaponPre(1/60);ok('JET: spin-up is short but NOT instant (one tick < jetMin)',jt.spin>0&&jt.spin<BB_W.jetMin);
   // v5.1.192 OVERHEAT: sustained thrust overheats → engine cuts (spin drops) until cooled
   {const oj=bbBotWith('jet','balanced',0,0,true);oj.ctl.brain.fire=true;oj._jetHeat=0;oj._jetOver=false;oj.spin=1;bb2.bots=[oj,c];
    for(let i=0;i<700&&!oj._jetOver;i++)bbWeaponPre(1/60);ok('JET: sustained thrust OVERHEATS',oj._jetOver===true&&(oj._jetHeat||0)>=1);
    for(let i=0;i<10;i++)bbWeaponPre(1/60);ok('JET: while overheated the engine cuts (spin falls)',oj.spin<0.5);
    oj.ctl.brain.fire=false;for(let i=0;i<300;i++)bbWeaponPre(1/60);ok('JET: it cools back down + clears the overheat',oj._jetOver===false&&(oj._jetHeat||0)<=BB_W.jetHeatReset+0.01);}}
  // ── v5.1.184 SLAM-INTO-BOT: a flung (pusher) / pushed (jet) bot crashing into ANOTHER bot hurts BOTH (3v3) ──
  {startBB(0,2);bb2.cd=0;bb2.result=null;const svdrv=m2.drive;m2.drive=[{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'}];
   const F=bbBotWith('flipper','balanced',0,0,true);F.x=100;F.y=100;
   const e1=bbBotWith('none','balanced',1,1,true);e1.x=400;e1.y=300;e1.hp=BB.HP;e1.inv=0;e1.mob=BB.MOB;e1._flT=0.3;e1._flung=0;e1._flx=0;e1._fly=0;e1._botSlamCd=0;
   const e2=bbBotWith('none','balanced',1,2,true);e2.x=400+RR;e2.y=300;e2.hp=BB.HP;e2.inv=0;e2.mob=BB.MOB;e2._botSlamCd=0;
   bb2.bots=[F,e1,e2];bb2.t=1;const h1=e1.hp,h2=e2.hp;updateBB(1/60);m2.drive=svdrv;
   ok('SLAM-INTO-BOT: a flung bot crashing into another bot damages BOTH',e1.hp<h1&&e2.hp<h2);}
  // ── v5.1.186 PERKS in the 3v3 GRID: cycle (mouse + gamepad), drop a chip, carry to the match ──
  {const svm=m2.mode,svf=m2.set.tfmt;m2.mode='battlebots';m2.set.tfmt='multi';tankGridInit();
   m2.tseats[0]={type:'human',dev:{type:'gp',gp:0},tier:1,drive:{kind:'main',idx:1,name:'a',c:'#f00'},sens:1,name:'P'};
   const ld=bbSeatLoadout(0);ld.perk='none';
   bbCycleField(ld,'perk',1);ok('grid: perk cycler advances from NONE to a real perk',ld.perk!=='none'&&BB_PERKS_PICK.some(p=>p.id===ld.perk));
   const p1=ld.perk;bbCycleField(ld,'perk',1);ok('grid: perk cycler steps to the next perk',ld.perk!==p1);
   bbArmEquip(0,'perk','vampire');ok('grid: dropping a PERK chip on a seat sets it',bbSeatLoadout(0).perk==='vampire');
   ok('grid: the seat PERK carries into the match loadout',tankGridActive()&&bbLoadoutForBind(0)&&bbLoadoutForBind(0).perk==='vampire'&&bbResolveLoadout(bbLoadoutForBind(0)).perk==='vampire');
   bbSeatLoadout(0).perk='vampire';const sgb=gpBtnsAll,sgp=gpPrevAll,sga=gpAxesAll,sgn=gpNavLast;
   gpBtnsAll=[[]];gpPrevAll=[[]];gpAxesAll=[{lx:0,ly:0}];gpBtnsAll[0][0]=true;gpNavLast=-1e9;tankGridGpNav();
   ok('grid GAMEPAD: A cycles the PERK (pad players can pick perks too)',bbSeatLoadout(0).perk!=='vampire'&&BB_PERKS_PICK.some(p=>p.id===bbSeatLoadout(0).perk));
   gpBtnsAll=sgb;gpPrevAll=sgp;gpAxesAll=sga;gpNavLast=sgn;m2.mode=svm;m2.set.tfmt=svf;}
  // ── v5.1.120: P3 ARENA HAZARDS — the DANGER ZONE map (acid pit + saw blades) + map-select includes it ──
  {const hazMap=TF2_MAPS.find(m=>m.id==='hazard');
   ok('a HAZARD arena (DANGER ZONE) exists with a pit + saws',!!hazMap&&hazMap.haz.some(h=>h.type==='pit')&&hazMap.haz.some(h=>h.type==='saw'));
   ok('ARENA map-select includes every map (incl. the hazard arena)',(()=>{m2.mode='battlebots';const r=p2SettingsRows().find(r=>r.k==='map');return r&&TF2_MAPS.every((m,i)=>r.vals.indexOf(i)>=0)&&r.vals.indexOf(TF2_MAPS.indexOf(hazMap))>=0;})());
   const pit=hazMap.haz.find(h=>h.type==='pit');
   const inPit=bbBotWith('none','balanced',0,0,true);inPit.x=pit.x+pit.w/2;inPit.y=pit.y+pit.h/2;inPit.hp=BB.HP;inPit.inv=0;
   const safe=bbBotWith('none','balanced',1,1,true);safe.x=80;safe.y=80;safe.hp=BB.HP;safe.inv=0;
   bb2.bots=[inPit,safe];bb2.map=hazMap;bb2.t=0;bb2.result=null;
   const ip0=inPit.hp,sf0=safe.hp;bbHazardUpdate(0.2);
   ok('ACID PIT drains HP from a bot standing in it',inPit.hp<ip0);
   ok('a bot OUTSIDE the hazards is unharmed',safe.hp===sf0);
   // a bot sitting on a saw's current position takes contact damage
   const saw=hazMap.haz.find(h=>h.type==='saw');bb2.t=0;const sp=bbHazPos(saw,0);
   const onSaw=bbBotWith('none','balanced',0,0,true);onSaw.x=sp.x;onSaw.y=sp.y;onSaw.hp=BB.HP;onSaw.inv=0;
   bb2.bots=[onSaw];const os0=onSaw.hp;bbHazardUpdate(1/60);
   ok('a SAW BLADE bites a bot it touches',onSaw.hp<os0);
   // an obstacle-free / hazard-free map runs the hazard pass as a no-op
   const flat=bbBotWith('none','balanced',0,0,true);flat.hp=BB.HP;bb2.bots=[flat];bb2.map=TF2_MAPS[0];bbHazardUpdate(0.2);
   ok('a non-hazard arena takes no hazard damage',flat.hp===BB.HP);
   // v5.1.133 P7: ARENA TRAPS cheat overlays the DANGER ZONE hazards onto ANY map
   ok('ARENA TRAPS is a cheat',CHEATS.some(c=>c.name==='ARENA TRAPS'));
   const svtr=arenaTraps;arenaTraps=true;
   ok('ARENA TRAPS makes a plain map report hazards',(()=>{bb2.map=TF2_MAPS[0];return bbHazards().some(h=>h.type==='pit')&&bbHazards().some(h=>h.type==='saw');})());
   const pitH=bbHazards().find(h=>h.type==='pit');
   const trapped=bbBotWith('none','balanced',0,0,true);trapped.x=pitH.x+pitH.w/2;trapped.y=pitH.y+pitH.h/2;trapped.hp=BB.HP;trapped.inv=0;
   bb2.bots=[trapped];bb2.map=TF2_MAPS[0];bb2.t=0;bbHazardUpdate(0.2);
   ok('ARENA TRAPS: the pit drains HP even on a plain arena',trapped.hp<BB.HP);
   arenaTraps=svtr;}
   // v5.1.148 P7: HAZARD MASTER — mouse-operated crusher strike
   {ok('HAZARD MASTER is a cheat',CHEATS.some(c=>c.name==='HAZARD MASTER'));
    const svh=hazardMaster;hazardMaster=true;
    const t=bbBotWith('none','balanced',0,0,true);t.x=400;t.y=400;t.hp=BB.HP;t.inv=0;
    const far=bbBotWith('none','balanced',1,1,true);far.x=900;far.y=200;far.hp=BB.HP;
    bb2.bots=[t,far];bb2.result=null;bb2.cd=0;bb2.hazCd=0;bb2.blasts=[];
    const hp0=t.hp,fired=bbHazardStrike(400,400);
    ok('HAZARD MASTER strike fires + damages bots in the blast radius',fired===true&&t.hp<hp0&&bb2.blasts.length>0);
    ok('HAZARD MASTER strike spares a bot outside the radius',far.hp===BB.HP);
    ok('HAZARD MASTER strike goes on cooldown (no instant re-fire)',bb2.hazCd>0&&bbHazardStrike(400,400)===false);
    bb2.cd=3;bb2.hazCd=0;ok('HAZARD MASTER strike is blocked during the countdown',bbHazardStrike(400,400)===false);
    hazardMaster=svh;}
   // v5.1.134 polish: RANDOM arena option
   {m2.mode='battlebots';const mr=p2SettingsRows().find(r=>r.k==='map');
    ok('ARENA selector offers RANDOM',mr&&mr.vals.indexOf('rand')>=0&&/RANDOM/i.test(mr.show('rand')));
    const svm=m2.set.map;m2.set.map='rand';const i=bbMapIdx();
    ok('RANDOM resolves to a valid map index without overwriting the setting',typeof i==='number'&&TF2_MAPS[i]&&m2.set.map==='rand');
    m2.set.map=svm;}
   // v5.1.147: the dedicated MAP-PICKER screen
   {const tiles=bbMapTiles();
    ok('map picker = one tile per built-in arena + custom maps + RANDOM + NEW',tiles.length===TF2_MAPS.length+customMaps.length+2&&tiles.some(t=>t.map==='rand')&&tiles[tiles.length-1].map==='new');
    ok('map-picker tiles stay on-screen',tiles.every(t=>t.x>=0&&t.y>=0&&t.x+t.w<=CW+1&&t.y+t.h<=CH+1));
    const svp=phase,svm2=m2.set.map;
    phase='p2bbmap';const t0=tiles[0];bbMapPickerClick(t0.x+t0.w/2,t0.y+t0.h/2);
    ok('clicking a map tile selects that arena + returns to settings',m2.set.map===t0.map&&phase==='p2settings');
    phase='p2bbmap';const tr=tiles.find(t=>t.map==='rand');bbMapPickerClick(tr.x+tr.w/2,tr.y+tr.h/2);
    ok('clicking the RANDOM tile sets ARENA = rand',m2.set.map==='rand'&&phase==='p2settings');
    phase='p2bbmap';bbMapPickerClick(20,20);
    ok('BACK from the map picker returns to settings',phase==='p2settings');
    phase=svp;m2.set.map=svm2;}
  // ── v5.1.121: P9 GAME MODES framework + SUMO (ring-out) ──
  {ok('GAME MODE includes KO + SUMO',BB_MODES.some(m=>m.id==='ko')&&BB_MODES.some(m=>m.id==='sumo'));
   const svmode=m2.set.bbmode;m2.set.bbmode='sumo';
   const inRing=bbBotWith('none','balanced',0,0,true);inRing.x=FW/2;inRing.y=FH/2;inRing.hp=BB.HP;
   const out=bbBotWith('none','balanced',1,1,true);out.x=FW/2+BB_RING+40;out.y=FH/2;out.hp=BB.HP;
   bb2.bots=[inRing,out];bb2.result=null;bb2.blasts=[];bb2.map=TF2_MAPS[0];bbModeUpdate(1/60);
   ok('SUMO: a bot shoved OUT of the ring is rung out',out.dead===true&&inRing.dead===false);
   ok('SUMO: last bot in the ring wins the round',bb2.result===0);
   // a bot inside the ring is safe
   m2.set.bbmode='sumo';const safe2=bbBotWith('none','balanced',0,0,true);safe2.x=FW/2+50;safe2.y=FH/2;safe2.hp=BB.HP;
   const foe2=bbBotWith('none','balanced',1,1,true);foe2.x=FW/2-50;foe2.y=FH/2;foe2.hp=BB.HP;
   bb2.bots=[safe2,foe2];bb2.result=null;bbModeUpdate(1/60);
   ok('SUMO: bots inside the ring are safe (no premature result)',safe2.dead===false&&foe2.dead===false&&bb2.result===null);
   // DOMINATION (v5.1.187: THREE capture points, persistent ownership)
   ok('GAME MODE includes DOMINATION',BB_MODES.some(m=>m.id==='domination'));
   ok('DOMINATION has 3 control points',bbDomPts().length===3);
   m2.set.bbmode='domination';bb2.map=TF2_MAPS[0];const P=bbDomPts();
   const dz=bbBotWith('none','balanced',0,0,true);dz.x=P[0].x;dz.y=P[0].y;
   bb2.bots=[dz];bb2.result=null;bb2.dom=null;bb2.domOwn=null;bbModeUpdate(1.0);
   ok('DOMINATION: capturing a point ALONE banks time + claims ownership',bb2.dom[0]>0&&bb2.dom[1]===0&&bb2.domOwn[0]===0);
   dz.x=10;dz.y=10;const sc0=bb2.dom[0];bbModeUpdate(1.0);
   ok('DOMINATION: an OWNED point keeps scoring after you leave (persists)',bb2.dom[0]>sc0&&bb2.domOwn[0]===0);
   bb2.domOwn=[-1,-1,-1];bb2.dom=[0,0];const da=bbBotWith('none','balanced',0,0,true);da.x=P[1].x;da.y=P[1].y;const db=bbBotWith('none','balanced',1,1,true);db.x=P[1].x;db.y=P[1].y;
   bb2.bots=[da,db];bb2.result=null;bbModeUpdate(1.0);
   ok('DOMINATION: a CONTESTED neutral point stays neutral (no score)',bb2.domOwn[1]===-1&&bb2.dom[0]===0&&bb2.dom[1]===0);
   dz.x=P[0].x;dz.y=P[0].y;bb2.bots=[dz];bb2.domOwn=[-1,-1,-1];bb2.dom=[BB_DOM_TARGET-0.01,0];bb2.result=null;bbModeUpdate(0.5);
   ok('DOMINATION: reaching the target WINS the round',bb2.result===0);
   // KOTH (moving hill — majority holds)
   ok('GAME MODE includes KOTH',BB_MODES.some(m=>m.id==='koth'));
   m2.set.bbmode='koth';
   const kme=bbBotWith('none','balanced',0,0,true);kme.x=FW/2;kme.y=FH/2;
   bb2.bots=[kme];bb2.result=null;bb2.koth=null;bb2.map=TF2_MAPS[0];bbModeUpdate(0.1);
   ok('KOTH: a side alone on the hill banks time',bb2.koth.score[0]>0&&bb2.koth.score[1]===0);
   const ka=bbBotWith('none','balanced',0,0,true);ka.x=FW/2;ka.y=FH/2;const kb=bbBotWith('none','balanced',1,1,true);kb.x=FW/2;kb.y=FH/2;
   bb2.bots=[ka,kb];bb2.koth={x:FW/2,y:FH/2,active:true,t:BB_KOTH_HOLD,score:[0,0]};bb2.result=null;bbModeUpdate(0.1);
   ok('KOTH: an evenly contested hill banks nothing',bb2.koth.score[0]===0&&bb2.koth.score[1]===0);
   bb2.bots=[kme];kme.x=FW/2;kme.y=FH/2;bb2.koth={x:FW/2,y:FH/2,active:true,t:BB_KOTH_HOLD,score:[BB_KOTH_TARGET-0.01,0]};bb2.result=null;bbModeUpdate(0.1);
   ok('KOTH: reaching the target wins',bb2.result===0);
   // the hill DESPAWNS (a gap with no scoring), then re-appears elsewhere
   bb2.bots=[kme];kme.x=FW/2;kme.y=FH/2;bb2.koth={x:FW/2,y:FH/2,active:false,t:0.05,score:[2,0]};bb2.result=null;const ks0=bb2.koth.score[0];const ox=bb2.koth.x;bbModeUpdate(0.1);
   ok('KOTH: no scoring during the despawn gap, then a new hill appears',bb2.koth.score[0]===ks0&&bb2.koth.active===true);
   // CTF (capture the flag)
   ok('GAME MODE includes CTF',BB_MODES.some(m=>m.id==='ctf'));
   m2.set.bbmode='ctf';
   const thief=bbBotWith('none','balanced',1,1,true);thief.x=90;thief.y=FH/2; // enemy on side-0's flag base
   bb2.bots=[thief];bb2.flags=bbCtfFlags();bb2.ctf=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('CTF: an enemy touching your flag steals it',bb2.flags[0].carrier===thief&&bb2.flags[0].home===false);
   const cap=bbBotWith('none','balanced',1,1,true);cap.x=FW-90;cap.y=FH/2; // side-1 carrier at its own base
   const fl=bbCtfFlags();fl[0].carrier=cap;fl[0].home=false;fl[0].x=cap.x;fl[0].y=cap.y;
   bb2.bots=[cap];bb2.flags=fl;bb2.ctf=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('CTF: carrying the enemy flag to your base (own flag home) scores',bb2.ctf[1]===1&&bb2.flags[0].home===true);
   const dead=bbBotWith('none','balanced',1,1,true);dead.x=400;dead.y=300;dead.dead=true;
   const fl2=bbCtfFlags();fl2[0].carrier=dead;fl2[0].home=false;fl2[0].x=400;fl2[0].y=300;
   bb2.bots=[dead];bb2.flags=fl2;bb2.ctf=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('CTF: a carrier dying RETURNS the flag HOME (v5.1.215 small-map fix, was drop-loose)',fl2[0].carrier===null&&fl2[0].home===true&&fl2[0].x===fl2[0].hx&&fl2[0].y===fl2[0].hy);
   {const regrab=bbBotWith('none','balanced',1,3,true);regrab.x=fl2[0].hx;regrab.y=fl2[0].hy;bb2.bots=[regrab];bb2.result=null;bbModeUpdate(0.05); // v5.1.218 the returned flag is grabbable again → the match keeps flowing (the despawn bug would have left nothing to grab)
    ok('CTF: after returning home the flag can be RE-GRABBED (no despawn — match keeps flowing)',fl2[0].carrier===regrab&&fl2[0].home===false);}
   const ret=bbBotWith('none','balanced',0,2,true);ret.x=400;ret.y=300; // own (side 0) bot on its dropped flag
   const fl3=bbCtfFlags();fl3[0].carrier=null;fl3[0].home=false;fl3[0].x=400;fl3[0].y=300;
   bb2.bots=[ret];bb2.flags=fl3;bb2.ctf=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('CTF: own side returns a dropped flag home',fl3[0].home===true&&fl3[0].x===fl3[0].hx);
   const win=bbBotWith('none','balanced',1,1,true);win.x=FW-90;win.y=FH/2;
   const fl4=bbCtfFlags();fl4[0].carrier=win;fl4[0].home=false;fl4[0].x=win.x;fl4[0].y=win.y;
   bb2.bots=[win];bb2.flags=fl4;bb2.ctf=[0,BB_CTF_TARGET-1];bb2.result=null;bbModeUpdate(0.05);
   ok('CTF: reaching the capture target wins',bb2.result===1);
   // PUSH-BALL (soccer)
   ok('GAME MODE includes PUSH-BALL',BB_MODES.some(m=>m.id==='pushball'));
   m2.set.bbmode='pushball';
   const pusher=bbBotWith('none','balanced',0,0,true);pusher.x=300;pusher.y=FH/2;pusher._inp={vx:SPD,vy:0,vr:0};
   bb2.bots=[pusher];bb2.pball={x:320,y:FH/2,vx:0,vy:0};bb2.pscore=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('PUSH-BALL: a bot shoves the ball away from it',bb2.pball.vx>0);
   bb2.bots=[];bb2.pball={x:20,y:FH/2,vx:0,vy:0};bb2.pscore=[0,0];bb2.result=null;bbModeUpdate(0.05);
   ok('PUSH-BALL: ball in the LEFT goal scores for side 1 + resets to center',bb2.pscore[1]===1&&Math.abs(bb2.pball.x-FW/2)<1);
   bb2.bots=[];bb2.pball={x:20,y:FH/2,vx:0,vy:0};bb2.pscore=[0,BB_PB_TARGET-1];bb2.result=null;bbModeUpdate(0.05);
   ok('PUSH-BALL: reaching the goal target wins',bb2.result===1);
   // v5.1.226 configurable GOALS TO WIN + soccer-ball render
   {const sg=m2.set.bbgoals;m2.set.bbgoals=2;
    bb2.bots=[];bb2.pball={x:20,y:FH/2,vx:0,vy:0};bb2.pscore=[0,1];bb2.result=null;bbModeUpdate(0.05);
    ok('PUSH-BALL: GOALS TO WIN=2 ends the match at 2 goals',bb2.result===1&&bbPbTarget()===2);
    m2.set.bbgoals=sg;}
   ok('bbDrawSoccerBall renders without throwing',(()=>{try{bbDrawSoccerBall(100,100,24,1.2);return true;}catch(e){return false;}})());
   {const svM=m2.mode;m2.mode='battlebots';m2.set.bbmode='pushball';const hasG=p2SettingsRows().some(r=>r.k==='bbgoals');m2.set.bbmode='ko';const noG=p2SettingsRows().some(r=>r.k==='bbgoals');m2.set.bbmode='pushball';m2.mode=svM;
    ok('GOALS TO WIN row shows for PUSH-BALL only',hasG===true&&noG===false);}
   // v5.1.222 ball PHYSICS: spawn clear of obstacles + reflect off them (was phasing through + spawning inside a center pillar)
   {const savO=tfObs;tfObs=[{x:FW/2-60,y:FH/2-90,w:120,h:180}]; // a center pillar like the 'pillar' arena
    const pbS={x:0,y:0,vx:0,vy:0};bbBallSpawn(pbS,FW/2,FH/2);
    ok('PUSH-BALL: ball spawns CLEAR of a center pillar (not inside the obstacle)',bbBallClear(pbS.x,pbS.y,BB_PB_R));
    const pbE={x:FW/2,y:FH/2,vx:0,vy:0};bbBallObs(pbE,BB_PB_R);const O=tfObs[0]; // a ball overlapping the pillar centre
    ok('PUSH-BALL: a ball overlapping an obstacle is ejected out of it',!(pbE.x>O.x&&pbE.x<O.x+O.w&&pbE.y>O.y&&pbE.y<O.y+O.h));
    const pbR={x:(FW/2-60)-BB_PB_R+8,y:FH/2,vx:150,vy:0};bbBallObs(pbR,BB_PB_R); // pressed into the left face, moving INTO it
    ok('PUSH-BALL: a ball is REFLECTED (bounces back) off an obstacle face',pbR.vx<0);
    tfObs=savO;}
   // v5.1.223 FLAVORED weapon × ball interactions (each weapon hits the ball its own way)
   {const savW=tfObs;tfObs=[];bb2.result=null;bb2.pscore=[0,0];bb2.shells=[];
    const spn=bbBotWith('spinner','balanced',0,0,true);spn.x=300;spn.y=FH/2;spn.h=0;spn.spin=1;spn._inp={vx:0,vy:0,vr:0};
    bb2.bots=[spn];bb2.pball={x:300+(RR+BB_PB_R),y:FH/2,vx:0,vy:0};bbModeUpdate(0.02);
    ok('PUSH-BALL: a spun-up SPINNER flings the ball off at an ANGLE',bb2.pball.vx>0&&Math.abs(bb2.pball.vy)>20);
    // PINCER clamps + carries the ball, then is knocked loose by another bot
    bb2.result=null;bb2.pscore=[0,0];
    const pc=bbBotWith('pincer','balanced',0,0,true);pc.x=300;pc.y=FH/2;pc.h=0;pc.firing=true;pc.grab=null;pc.held=null;pc._inp={vx:0,vy:0,vr:0};
    bb2.bots=[pc];bb2.pball={x:300+(RR+BB_PB_R+RR*0.4),y:FH/2,vx:0,vy:0};bbModeUpdate(0.02);
    ok('PUSH-BALL: a firing PINCER clamps onto the ball',bb2.pball.heldBy===pc);
    bbModeUpdate(0.02);ok('PUSH-BALL: the carried ball rides the pincer front',Math.abs(bb2.pball.x-(pc.x+(RR+BB_PB_R-2)))<1.5);
    const knk=bbBotWith('none','balanced',1,1,true);knk.x=bb2.pball.x;knk.y=bb2.pball.y;bb2.bots=[pc,knk];bbModeUpdate(0.02);
    ok('PUSH-BALL: another bot KNOCKS the ball loose from the pincer',bb2.pball.heldBy===null);
    // CANNON shell shoves the ball at range
    bb2.result=null;bb2.pscore=[0,0];bb2.bots=[];
    bb2.pball={x:FW/2,y:FH/2,vx:0,vy:0};bb2.shells=[{x:FW/2-BB_PB_R,y:FH/2,vx:400,vy:0,owner:0,side:0,expl:0,dead:false}];bbModeUpdate(0.02);
    ok('PUSH-BALL: a CANNON shell shoves the ball + is consumed',bb2.pball.vx>0&&bb2.shells[0].dead);
    // v5.1.225 KAMIKAZE rockets the ball away from the detonation (direction = which side you blow up on)
    bb2.result=null;bb2.pscore=[0,0];
    const km=bbBotWith('kamikaze','balanced',0,0,true);km.x=FW/2-40;km.y=FH/2;km.ctl.brain.fire=true;
    bb2.bots=[km];bb2.pball={x:FW/2,y:FH/2,vx:0,vy:0};bbWeaponPre(1/60);bbWeaponFire(1/60);
    ok('PUSH-BALL: a KAMIKAZE blast rockets the ball away from the detonation',bb2.pball.vx>0&&bb2.pball.heldBy==null);
    // v5.1.225 FRIENDLY FIRE: kamikaze spares your own alliance when FF is off, can hit them when on
    {const svFF=friendlyFire;friendlyFire=false;
     const kf=bbBotWith('kamikaze','balanced',0,0,true);kf.x=300;kf.y=300;kf.ctl.brain.fire=true;
     const ally=bbBotWith('none','balanced',0,1,true);ally.x=312;ally.y=300;ally.hp=BB.HP;
     const enemy=bbBotWith('none','balanced',1,2,true);enemy.x=320;enemy.y=300;enemy.hp=BB.HP;
     bb2.bots=[kf,ally,enemy];bb2.pball=null;bbWeaponPre(1/60);bbWeaponFire(1/60);
     ok('FRIENDLY FIRE off: KAMIKAZE spares a same-side ally (hits the enemy)',ally.hp===BB.HP&&enemy.hp<BB.HP);
     friendlyFire=true;
     const kf2=bbBotWith('kamikaze','balanced',0,0,true);kf2.x=300;kf2.y=300;kf2.ctl.brain.fire=true;
     const ally2=bbBotWith('none','balanced',0,1,true);ally2.x=312;ally2.y=300;ally2.hp=BB.HP;
     bb2.bots=[kf2,ally2];bbWeaponPre(1/60);bbWeaponFire(1/60);
     ok('FRIENDLY FIRE on: KAMIKAZE can hit a same-side ally',ally2.hp<BB.HP);
     friendlyFire=svFF;}
    tfObs=savW;}
   // STOCK (limited lives + respawn)
   ok('GAME MODE includes STOCK',BB_MODES.some(m=>m.id==='stock'));
   m2.set.bbmode='stock';
   const sb=bbBotWith('none','balanced',0,0,true);sb.lives=2;sb.dead=true;sb.hp=0;sb.respawnT=null;sb.mhp=BB.HP;sb._sx=70;sb._sy=FH/2;sb._sh=0;
   bb2.bots=[sb];bb2.result=null;bbModeUpdate(0.05);
   ok('STOCK: a downed bot with lives starts a respawn timer',sb.dead===true&&sb.respawnT>0);
   bbModeUpdate(BB_STOCK_DELAY);
   ok('STOCK: it respawns — alive, HP restored, a life spent',sb.dead===false&&sb.hp===BB.HP&&sb.lives===1);
   const sa=bbBotWith('none','balanced',0,0,true);sa.dead=false;sa.lives=1;const se=bbBotWith('none','balanced',1,1,true);se.dead=true;se.lives=0;
   bb2.bots=[sa,se];bb2.result=null;bbCheckResult(0);
   ok('STOCK: a side with no living bots AND no lives loses',bb2.result===0);
   const sa2=bbBotWith('none','balanced',0,0,true);sa2.dead=false;const se2=bbBotWith('none','balanced',1,1,true);se2.dead=true;se2.lives=1;
   bb2.bots=[sa2,se2];bb2.result=null;bbCheckResult(0);
   ok('STOCK: no premature win while a foe can still respawn',bb2.result===null);
   m2.set.bbmode='stock';m2.set.bblives=3;startBB(0,2);
   ok('STOCK: bots spawn with the LIVES setting (3 lives = 2 respawns)',bb2.bots.every(b=>b.lives===2));
   // v5.1.149: generalized LIVES / RESPAWN + TIME LIMIT, per-mode defaults
   {ok('KO defaults to 1 life (no respawn)',bbModeDef('ko').lives===1&&bbModeDef('ko').time===0);
    ok('CTF defaults to infinite lives + a time limit',bbModeDef('ctf').lives==='inf'&&bbModeDef('ctf').time>0);
    ok('KOTH defaults to infinite lives + a time limit',bbModeDef('koth').lives==='inf'&&bbModeDef('koth').time>0);
    bbApplyModeDefaults('ctf');ok('selecting a mode applies its lives + time defaults',m2.set.bblives==='inf'&&m2.set.bbtime>0);
    // v5.1.217 NO ENDLESS MATCHES: infinite respawns ⟹ a timer; no timer ⟹ finite lives
    m2.set.bblives='inf';m2.set.bbtime=0;bbEnforceLivesTime('bblives');
    ok('RESPAWN RULE: infinite lives + no timer → a timer is auto-added',m2.set.bblives==='inf'&&m2.set.bbtime>0);
    m2.set.bblives='inf';m2.set.bbtime=0;bbEnforceLivesTime('bbtime');
    ok('RESPAWN RULE: turning the timer OFF under infinite lives → lives snap finite',m2.set.bblives!=='inf'&&(m2.set.bbtime|0)===0);
    m2.set.bblives=3;m2.set.bbtime=0;bbEnforceLivesTime('bblives');
    ok('RESPAWN RULE: finite lives + no timer stays allowed (last-standing)',m2.set.bblives===3&&(m2.set.bbtime|0)===0);
    m2.set.bblives='inf';m2.set.bbtime=180;bbEnforceLivesTime('bbtime');
    ok('RESPAWN RULE: infinite lives WITH a timer stays allowed (most-kills)',m2.set.bblives==='inf'&&m2.set.bbtime===180);
    m2.set.bblives='inf';ok('bbLivesResolve: INFINITE → Infinity respawns',bbLivesResolve()===Infinity);
    m2.set.bblives=1;ok('bbLivesResolve: 1 life → 0 respawns',bbLivesResolve()===0);
    // infinite lives → a downed bot respawns
    m2.set.bbmode='ctf';m2.set.bbtime=0;const r=bbBotWith('none','balanced',0,0,true);r.lives=Infinity;r.dead=true;r.hp=0;r.respawnT=null;r.mhp=BB.HP;r._sx=70;r._sy=FH/2;r._sh=0;
    bb2.bots=[r];bb2.result=null;bbModeUpdate(BB_STOCK_DELAY+0.05);
    ok('INFINITE lives: a downed bot respawns + stays infinite',r.dead===false&&r.lives===Infinity);
    // time limit: when the clock runs out, the objective leader wins
    m2.set.bbmode='ctf';m2.set.bbtime=120;const a=bbBotWith('none','balanced',0,0,true),b=bbBotWith('none','balanced',1,1,true);
    bb2.bots=[a,b];bb2.ctf=[2,1];bb2.result=null;bb2.t=120.1;bbModeUpdate(0.02);
    ok('TIME LIMIT: at time-up the objective leader wins (CTF 2–1 → side 0)',bb2.result===0);
    m2.set.bbmode=svmode;m2.set.bblives=1;m2.set.bbtime=0;}
   // VIP (assassinate the enemy VIP)
   ok('GAME MODE includes VIP',BB_MODES.some(m=>m.id==='vip'));
   m2.set.bbmode='vip';
   {const v0=bbBotWith('none','balanced',0,0,true),g0=bbBotWith('none','balanced',0,2,true),v1=bbBotWith('none','balanced',1,1,true),g1=bbBotWith('none','balanced',1,3,true);
    v0.vip=true;v1.vip=true;v0.x=100;g0.x=140;v1.x=900;g1.x=940;[v0,g0,v1,g1].forEach(b=>{b.y=300;b.hp=BB.HP;b.inv=0;});
    bb2.bots=[v0,g0,v1,g1];bb2.result=null;bb2.blasts=[];bbKill(g1,0);
    ok('VIP: killing only a GRUNT does NOT end the match',bb2.result===null);
    const v0b=bbBotWith('none','balanced',0,0,true),g0b=bbBotWith('none','balanced',0,2,true),v1b=bbBotWith('none','balanced',1,1,true),g1b=bbBotWith('none','balanced',1,3,true);
    v0b.vip=true;v1b.vip=true;v0b.x=100;g0b.x=140;v1b.x=900;g1b.x=940;[v0b,g0b,v1b,g1b].forEach(b=>{b.y=300;b.hp=BB.HP;b.inv=0;});
    bb2.bots=[v0b,g0b,v1b,g1b];bb2.result=null;bb2.blasts=[];bbKill(v1b,0);
    ok('VIP: destroying the enemy VIP wins even with their grunts alive',bb2.result===0&&g1b.dead===false);}
   // v5.1.126 P9: CPU mode-awareness (hunt VIP / hold the DOMINATION point / avoid SUMO ring-out)
   {m2.set.bbmode='vip';
    const me=bbBotWith('none','balanced',1,1,true);me.x=300;me.y=300;me.h=0;
    const grunt=bbBotWith('none','balanced',0,2,true);grunt.x=300;grunt.y=360;grunt.vip=false; // closer
    const vipFoe=bbBotWith('none','balanced',0,0,true);vipFoe.x=520;vipFoe.y=300;vipFoe.vip=true; // farther
    bb2.bots=[me,grunt,vipFoe];bb2.result=null;bbCpuUpdate(1/60);
    ok('VIP: a CPU HUNTS the enemy VIP even when a grunt is closer',me._foe===vipFoe);
    m2.set.bbmode='domination';me._foe=null;
    const dme=bbBotWith('none','balanced',1,1,true);dme.x=100;dme.y=100;dme.h=0; // far from the center zone
    const dfoe=bbBotWith('none','balanced',0,0,true);dfoe.x=140;dfoe.y=100;
    bb2.bots=[dme,dfoe];bb2.result=null;bbCpuUpdate(1/60);
    ok('DOMINATION: a CPU drives toward the nearest control point',dme.ctl.brain.inp.vx>0&&dme.ctl.brain.inp.vy>0);
    m2.set.bbmode='koth';
    const kc=bbBotWith('none','balanced',1,1,true);kc.x=100;kc.y=100;kc.h=0;const kf=bbBotWith('none','balanced',0,0,true);kf.x=140;kf.y=100;
    bb2.bots=[kc,kf];bb2.koth={x:FW/2,y:FH/2,active:true,t:BB_KOTH_HOLD,score:[0,0]};bb2.result=null;bbCpuUpdate(1/60);
    ok('KOTH: a CPU off the hill drives toward it',kc.ctl.brain.inp.vx>0&&kc.ctl.brain.inp.vy>0);
    m2.set.bbmode='ctf';
    const ctfc=bbBotWith('none','balanced',0,0,true);ctfc.x=300;ctfc.y=300;ctfc.h=0; // side 0 → wants enemy flag (side 1) at the EAST base
    const ctff=bbBotWith('none','balanced',1,1,true);ctff.x=100;ctff.y=300; // a foe to the WEST (so plain chase would go -x)
    bb2.flags=bbCtfFlags();bb2.bots=[ctfc,ctff];bb2.result=null;bbCpuUpdate(1/60);
    ok('CTF: a CPU heads for the enemy flag (not just the nearest foe)',ctfc.ctl.brain.inp.vx>0);
    m2.set.bbmode='pushball';
    const pbc=bbBotWith('none','balanced',0,0,true);pbc.x=300;pbc.y=FH/2;pbc.h=0; // side 0 attacks the RIGHT goal
    const pbf=bbBotWith('none','balanced',1,1,true);pbf.x=100;pbf.y=FH/2; // foe to the WEST
    bb2.pball={x:600,y:FH/2,vx:0,vy:0};bb2.bots=[pbc,pbf];bb2.result=null;bbCpuUpdate(1/60);
    ok('PUSH-BALL: a CPU positions behind the ball to push it goalward',pbc.ctl.brain.inp.vx>0);
    // v5.1.227 the PUSH-BALL CPU now FIRES its weapon to drive the ball goalward (not just a body shove)
    const pbw=bbBotWith('flipper','balanced',0,0,true);pbw.x=560;pbw.y=FH/2;pbw.h=0; // a PUSHER lined up behind the ball, facing the enemy goal
    const pbe=bbBotWith('none','balanced',1,1,true);pbe.x=60;pbe.y=60; // a live foe far away
    bb2.pball={x:600,y:FH/2,vx:0,vy:0};bb2.bots=[pbw,pbe];bb2.result=null;bbCpuUpdate(1/60);
    ok('PUSH-BALL CPU fires its weapon when lined up behind the ball',pbw.ctl.brain.fire===true);
    m2.set.bbmode='sumo';
    const sme=bbBotWith('none','balanced',1,1,true);sme.x=FW/2;sme.y=FH/2-BB_RING*0.9;sme.h=0; // near the top ring edge
    const sfoe=bbBotWith('none','balanced',0,0,true);sfoe.x=FW/2;sfoe.y=FH/2-BB_RING*0.9-40;
    bb2.bots=[sme,sfoe];bb2.result=null;bbCpuUpdate(1/60);
    ok('SUMO: a CPU near the edge pulls back toward the center',sme.ctl.brain.inp.vy>0);
    // v5.1.127: the in-match HUD hint is mode-specific
    m2.set.bbmode='ko';const hKo=bbModeHint();m2.set.bbmode='sumo';const hSumo=bbModeHint();m2.set.bbmode='domination';const hDom=bbModeHint();m2.set.bbmode='vip';const hVip=bbModeHint();
    m2.set.bbmode='koth';const hKoth=bbModeHint();m2.set.bbmode='ctf';const hCtf=bbModeHint();m2.set.bbmode='pushball';const hPb=bbModeHint();
    ok('each GAME MODE shows its own objective hint',/SUMO/.test(hSumo)&&/DOMINATION/.test(hDom)&&/VIP/.test(hVip)&&/KOTH/.test(hKoth)&&/CTF/.test(hCtf)&&/PUSH-BALL/.test(hPb)&&hKo!==hSumo&&hSumo!==hDom&&hDom!==hVip&&hKoth!==hDom&&hCtf!==hKoth&&hPb!==hCtf);
    m2.set.bbmode=svmode;}
  }
  // v5.1.228 in-match SENSITIVITY adjust now works for ALL 3v3 seats (was capped at 2 players)
  {const svPB=playerBind,svSens=m2.sens,svG=gpBtnsAll,svT=m2.tseats;
   m2.tseats=[{},{},{},{},{},{}];playerBind=[0,1,2,3,4,5].map(g=>({type:'gp',gp:g}));m2.sens=[1,1,1,1,1,1];
   gpBtnsAll=[0,1,2,3,4,5].map(()=>[]);_p2SensPrev=[];gpBtnsAll[4][5]=true;p2SensAdjust(0.016);
   ok('3v3 in-match: a back seat (p4) RAISES its sensitivity via RB (was unreachable)',m2.sens[4]>1);
   gpBtnsAll=[0,1,2,3,4,5].map(()=>[]);_p2SensPrev=[];gpBtnsAll[5][4]=true;p2SensAdjust(0.016);
   ok('3v3 in-match: a back seat (p5) LOWERS its sensitivity via LB',m2.sens[5]<1);
   ok('p2SeatSide maps 3v3 seats (0–2 RED, 3–5 BLUE)',p2SeatSide(1)===0&&p2SeatSide(4)===1);
   playerBind=svPB;m2.sens=svSens;gpBtnsAll=svG;m2.tseats=svT;}
  // v5.1.229 CONTROLLER-ONLY 3v3 grid setup: D-pad navigates without claiming; FACE claims; BACK drops CPUs
  {const svT=m2.tseats,svG=gpBtnsAll,svP=m2._gpPrev,svGP=gpPrevAll,svSel=m2.tsel,svM=m2.mode;m2.mode='battlebots';
   m2.tseats=[null,null,null,null,null,null];m2.tsel=0;m2._gpPrev=[];gpPrevAll=[];
   gpBtnsAll=[[]];gpBtnsAll[0][15]=true;tankGridGpPoll(); // D-pad RIGHT
   ok('GRID pad: the D-pad does NOT claim a seat (cursor navigation is safe)',!m2.tseats[0]);
   m2._gpPrev=[];gpBtnsAll=[[]];gpBtnsAll[0][0]=true;tankGridGpPoll(); // A on the selected empty seat
   ok('GRID pad: a FACE button joins the selected empty seat as a player',!!(m2.tseats[0]&&m2.tseats[0].type==='human'&&m2.tseats[0].dev&&m2.tseats[0].dev.gp===0));
   gpPrevAll=[];gpBtnsAll=[[]];gpBtnsAll[0][8]=true;tankGridGpNav(); // BACK by the pad that owns seat 0
   ok('GRID pad: BACK drops a CPU into the next open seat (controller-only AI opponents)',m2.tseats.some(s=>s&&s.type==='cpu'));
   m2.tseats=svT;gpBtnsAll=svG;m2._gpPrev=svP;gpPrevAll=svGP;m2.tsel=svSel;m2.mode=svM;}
  // v5.1.230 ABSOLUTE-HEADING default couples to the drive frame (field-centric → ON, bot-centric → OFF; user can still override)
  {const svAH=absHeading,svHC=holoCentric,svD=m2.drive;m2.drive=[null,null,null,null,null,null];
   absHeading=false;p2cSetDrive(0,0,3);ok('FIELD-CENTRIC swerve auto-ENABLES absolute heading',absHeading===true);
   p2cSetDrive(0,0,2);ok('BOT-CENTRIC swerve auto-DISABLES absolute heading',absHeading===false);
   absHeading=true;p2cSetDrive(0,0,0);ok('TANK drive FORCES absolute heading OFF (v5.1.261 — broken together)',absHeading===false);
   absHeading=true;p2cSetDrive(0,0,1);ok('ARCADE drive leaves absolute heading unchanged (no coupling, override preserved)',absHeading===true);
   holoCentric=false;absHeadingCouple(holoCentric);ok('switching the holo frame to BOT-CENTRIC turns absHeading off',absHeading===false);
   holoCentric=true;absHeadingCouple(holoCentric);ok('switching the holo frame to FIELD-CENTRIC turns absHeading on',absHeading===true);
   ok('driveFieldCentric: fieldSwerve=true, botSwerve=false, tank=false (forced off), arcade=null',driveFieldCentric({kind:'main',idx:3})===true&&driveFieldCentric({kind:'main',idx:2})===false&&driveFieldCentric({kind:'main',idx:0})===false&&driveFieldCentric({kind:'main',idx:1})===null);
   absHeading=svAH;holoCentric=svHC;m2.drive=svD;}
  // v5.1.231 egg unlocks now feed the ACHIEVEMENTS screen (were on an orphan bb_egg_* key)
  {ok('both egg achievements exist in ACH_DEFS',ACH_DEFS.some(a=>a.id==='autobots')&&ACH_DEFS.some(a=>a.id==='unoriginalsin'));
   delete achUnlocked.autobots;delete achUnlocked.unoriginalsin;
   bbEggUnlock('bumblebee');ok('fielding OPTIMUS/BUMBLEBEE unlocks the "Autobots" achievement',!!achUnlocked.autobots);
   bbEggUnlock('originalsin');ok('fielding ORIGINAL SIN unlocks the "Unoriginal Sin" achievement',!!achUnlocked.unoriginalsin);}
  // v5.1.232 custom PAINT color picker (F2c)
  {ok('PAINT_JOBS[0] = team default (no override) + a real palette',PAINT_JOBS[0]===null&&PAINT_JOBS.length>=6&&!!PAINT_JOBS[1].body&&!!PAINT_JOBS[1].accent);
   const pld={weapon:'wedge',armor:'balanced'};bbCyclePaint(pld,1);ok('bbCyclePaint advances the seat paint index',pld.paint===1);
   bbCyclePaint(pld,-1);ok('bbCyclePaint wraps back to 0 (team default)',pld.paint===0);
   for(let k=0;k<PAINT_JOBS.length;k++)bbCyclePaint(pld,1);ok('a full lap of the palette returns to the start',pld.paint===0);}
  // v5.1.233 CUSTOM MAP EDITOR — create → draw → save → resolve → gallery
  {const svMap=m2.set.map,svCM=customMaps.slice(),svPhase=phase;applyLayout('land2p');m2.mode='battlebots';
   mapEditNew();ok('mapEditNew opens the editor (blank)',phase==='p2mapedit'&&!!mapEd&&mapEd.obs.length===0);
   const r=mapEdRect();
   mapEd.tool='wall';mapEditDown(r.x+r.w*0.2,r.y+r.h*0.2);mapEditMove(r.x+r.w*0.5,r.y+r.h*0.5);mapEditUp();
   ok('drag-to-draw adds a WALL obstacle',mapEd.obs.length===1&&mapEd.obs[0].w>14&&mapEd.obs[0].h>14);
   mapEd.tool='saw';mapEditDown(r.x+r.w*0.6,r.y+r.h*0.5);ok('SAW tool places a saw hazard',mapEd.haz.some(h=>h.type==='saw'));
   mapEd.tool='pickup';mapEditDown(r.x+r.w*0.7,r.y+r.h*0.3);ok('PICKUP tool places a pickup',mapEd.pup.length===1);
   mapEd.tool='pit';mapEditDown(r.x+r.w*0.3,r.y+r.h*0.6);mapEditMove(r.x+r.w*0.45,r.y+r.h*0.78);mapEditUp();ok('drag-to-draw adds a PIT hazard',mapEd.haz.some(h=>h.type==='pit'));
   mapEd.tool='erase';const pup=mapEd.pup[0];mapEditDown(r.x+pup.x*r.sc,r.y+pup.y*r.sc);ok('ERASE removes the element under the cursor',mapEd.pup.length===0);
   mapEd.name='TEST ARENA';const nBefore=customMaps.length;mapEditSave();
   ok('SAVE pushes the map to customMaps + selects it + returns to the gallery',customMaps.length===nBefore+1&&typeof m2.set.map==='string'&&phase==='p2bbmap');
   const savedId=m2.set.map;ok('bbMapObj resolves the saved CUSTOM map',bbMapObj()&&bbMapObj().id===savedId&&bbMapObj().obs.length>=1);
   ok('the gallery lists the custom map + a NEW MAP tile',bbMapTiles().some(t=>t.map===savedId)&&bbMapTiles().some(t=>t.map==='new'));
   mapEditLoad(customMapById(savedId));ok('mapEditLoad opens an existing map for editing',phase==='p2mapedit'&&mapEd.id===savedId&&mapEd.obs.length>=1);
   customMaps.length=0;for(const m of svCM)customMaps.push(m);saveCustomMaps();m2.set.map=svMap;phase=svPhase;mapEd=null;}
  // v5.1.234 EXPORT / IMPORT share codes
  {const m={name:'SHARE TEST',obs:[{x:100,y:100,w:80,h:40}],haz:[{type:'saw',cx:300,cy:200,axis:'y',amp:140,spd:1.5}],pup:[{x:400,y:120}]};
   const code=mapToCode(m);ok('mapToCode makes a DSMAP1 share code',typeof code==='string'&&code.indexOf('DSMAP1:')===0);
   const back=mapFromCode(code);ok('mapFromCode round-trips the arena',!!back&&back.name==='SHARE TEST'&&back.obs.length===1&&back.haz.length===1&&back.pup.length===1&&back.obs[0].w===80);
   ok('mapFromCode rejects garbage',mapFromCode('not a code')===null&&mapFromCode('DSMAP1:@@@')===null);
   const svPrompt=window.prompt,svCM=customMaps.slice(),svMap=m2.set.map;window.prompt=()=>code;const n0=customMaps.length;mapImport();
   ok('mapImport adds the pasted map to customMaps + selects it',customMaps.length===n0+1&&typeof m2.set.map==='string');
   window.prompt=svPrompt;customMaps.length=0;for(const c of svCM)customMaps.push(c);saveCustomMaps();m2.set.map=svMap;}
  // v5.1.235 editor UNDO
  {const svPhase=phase;applyLayout('land2p');m2.mode='battlebots';mapEditNew();const r=mapEdRect();
   mapEd.tool='wall';mapEditDown(r.x+r.w*0.2,r.y+r.h*0.2);mapEditMove(r.x+r.w*0.4,r.y+r.h*0.4);mapEditUp();
   mapEd.tool='pickup';mapEditDown(r.x+r.w*0.6,r.y+r.h*0.3);
   ok('editor has 1 wall + 1 pickup before undo',mapEd.obs.length===1&&mapEd.pup.length===1);
   mapEditUndo();ok('UNDO removes the last action (the pickup)',mapEd.obs.length===1&&mapEd.pup.length===0);
   mapEditUndo();ok('UNDO again removes the wall',mapEd.obs.length===0);
   mapEditUndo();ok('UNDO past the start is a safe no-op',mapEd.obs.length===0&&mapEd.pup.length===0);
   mapEd=null;phase=svPhase;}
  // v5.1.236 TOURNAMENT T4 — open-pick map vote (countdown → auto-random)
  {const svPhase=phase,svMap=m2.set.map;m2.mode='battlebots';let got=null;
   startMapVote(15,(m)=>{got=m;});
   ok('startMapVote opens the vote + arms the timer',phase==='p2mapvote'&&!!mapVote&&mapVoteRemain()>14&&mapVoteRemain()<=15);
   const cand=mapVoteCandidates();ok('vote candidates = concrete arenas only (no rand/new/vote)',cand.length===TF2_MAPS.length+customMaps.length&&!cand.includes('rand')&&!cand.includes('new'));
   mapVotePick(cand[1]);ok('tapping an arena resolves the vote once with that map',got===cand[1]&&mapVote===null);
   startMapVote(15,(m)=>{got=m;});mapVote.endT=(typeof performance!=='undefined'?performance.now():0)-1;ok('the countdown expires (remain hits 0)',mapVoteRemain()===0);
   got=null;mapVoteAutoRandom();ok('timeout auto-randomizes to a concrete arena',(typeof got==='number'||typeof got==='string')&&mapVote===null);
   startMapVote(15);mapVotePick(2);ok('default onDone selects the arena + returns to the gallery',m2.set.map===2&&phase==='p2bbmap');
   phase=svPhase;m2.set.map=svMap;mapVote=null;}
  // v5.1.245 Original Sin: invulnerable wheels = never immobilized (mob drained to 0 still drives)
  {const _eg=bbEggActive;bbEggActive=()=>'originalsin';
   const sin={mob:0,ld:{mobMax:BB.MOB,weapon:'wedge'},ctl:{bind:0}};const spSin=bbSpeed(sin);bbEggActive=_eg;
   ok('ORIGINAL SIN drives at full speed even at mob=0 (never stuck)',spSin>0);
   ok('a normal bot at mob=0 IS frozen (control: drain still immobilizes others)',bbSpeed({mob:0,ld:{mobMax:BB.MOB}})===0);}
  // v5.1.247 custom PAINT carries into the in-match loadout (was stripped by bbResolveLoadout → never rendered in game)
  ok('bbResolveLoadout preserves the custom PAINT index',bbResolveLoadout({weapon:'spinner',armor:'light',paint:3}).paint===3);
  ok('no-paint loadout resolves to paint 0 (team/drive default)',bbResolveLoadout({weapon:'spinner',armor:'light'}).paint===0);
  // v5.1.248 independent ACCENT color (body skin + separate accent)
  {const p=bbPaintFor({weapon:'spinner',armor:'light',paint:1,accent:3});
   ok('bbPaintFor: BODY from PAINT_JOBS, ACCENT from ACCENT_COLS',!!p&&p.body===PAINT_JOBS[1].body&&p.accent===ACCENT_COLS[3]&&p.stroke===ACCENT_COLS[3]);
   ok('accent 0 = the body skin default accent',bbPaintFor({paint:1,accent:0}).accent===PAINT_JOBS[1].accent);
   ok('accent-only (no body) = neutral dark body + chosen accent',(()=>{const q=bbPaintFor({paint:0,accent:5});return !!q&&q.accent===ACCENT_COLS[5]&&q.body==='#191922';})());
   ok('no body + no accent = null (team default)',bbPaintFor({paint:0,accent:0})===null);
   const l2={accent:0};bbCycleAccent(l2,1);ok('bbCycleAccent advances the accent index',l2.accent===1);
   ok('bbResolveLoadout preserves ACCENT into the match',bbResolveLoadout({weapon:'spinner',armor:'light',accent:4}).accent===4);}
  // v5.1.249 the 1v1 RoboRumble loadout persists across sessions
  {const sv=m2.bbLoadout;m2.bbLoadout=[{weapon:'spinner',armor:'light',perk:'vampire',paint:2,accent:5},null];saveBBLoadout();
   m2.bbLoadout=[null,null]; // simulate the menu-entry reset
   const r=loadBBLoadout();
   ok('1v1 loadout round-trips through localStorage (weapon/armor/perk/paint/accent)',!!r[0]&&r[0].weapon==='spinner'&&r[0].armor==='light'&&r[0].perk==='vampire'&&r[0].paint===2&&r[0].accent===5);
   ok('loadBBLoadout always returns a length-2 array',Array.isArray(r)&&r.length===2);m2.bbLoadout=sv;}
  // v5.1.250 6-player FREE-FOR-ALL — last faction standing / most HP; 2-side still resolves (regression)
  {const svbb=bb2,svm=m2.mode;m2.mode='battlebots';m2.set=m2.set||{};m2.set.bbmode='ko';
   bb2={result:null,ffa:true,bots:[]};for(let i=0;i<6;i++)bb2.bots.push({side:i,dead:false,lives:1,hp:100,ctl:{name:'CPU '+(i+1)},col:'#fff'});
   bbCheckResult();ok('FFA: 6 factions alive → match continues (no result)',bb2.result===null);
   for(let i=0;i<5;i++){bb2.bots[i].dead=true;bb2.bots[i].lives=0;}
   bbCheckResult();ok('FFA: LAST bot standing wins (side 5)',bb2.result===5&&bbFFAWinner()===bb2.bots[5]);
   bb2={result:null,ffa:true,bots:[{side:0,dead:false,lives:0,hp:40,ctl:{name:'A'}},{side:1,dead:false,lives:0,hp:90,ctl:{name:'B'}},{side:2,dead:true,lives:0,hp:0,ctl:{name:'C'}}]};
   ok('FFA timed: most surviving HP wins',bbTimeUpResult()===1);
   bb2={result:null,ffa:false,bots:[{side:0,dead:true,lives:0,hp:0},{side:1,dead:false,lives:1,hp:50}]};
   bbCheckResult();ok('2-side regression: one side out → the other wins',bb2.result===1);
   // v5.1.269 INFINITE-LIVES TIMED DEATHMATCH → most KILLS wins (leftover HP is meaningless when nobody's eliminated)
   bb2={result:null,ffa:false,bots:[{side:0,dead:false,lives:Infinity,hp:10,kills:3},{side:1,dead:false,lives:Infinity,hp:99,kills:5}]};
   ok('inf-lives timed: MOST KILLS wins despite LESS HP (side 1)',bbTimeUpResult()===1);
   ok('bbInfLives detects infinite respawns',bbInfLives()===true);
   ok('bbSideKills sums per-side kills',bbSideKills(0)===3&&bbSideKills(1)===5);
   bb2.bots[0].kills=6;ok('inf-lives timed: flips to the new kill leader (side 0)',bbTimeUpResult()===0);
   bb2={result:null,ffa:false,bots:[{side:0,dead:false,lives:5,hp:80,kills:1},{side:1,dead:false,lives:5,hp:30,kills:9}]};
   ok('FINITE-lives timed still decides by surviving HP (side 0), not kills',bbTimeUpResult()===0);
   bb2={result:null,ffa:true,bots:[{side:0,dead:false,lives:Infinity,hp:99,kills:1,ctl:{name:'A'}},{side:1,dead:true,lives:Infinity,hp:0,kills:4,ctl:{name:'B'}},{side:2,dead:false,lives:Infinity,hp:50,kills:2,ctl:{name:'C'}}]};
   ok('FFA inf-lives timed: most KILLS wins (side 1, even momentarily dead)',bbTimeUpResult()===1);
   bb2=svbb;m2.mode=svm;}
  // v5.1.270 FFA HUD layout — every faction gets a visible status panel (the row=[0,0]/side===0 layout left sides 2-5 at NaN y, i.e. INVISIBLE — only 2 of 6 showed)
  {const svbb=bb2;bb2={ffa:true,bots:[]};for(let i=0;i<6;i++)bb2.bots.push({side:i});
   const sl=[];for(let i=0;i<6;i++)sl.push(bbHudSlot(i));
   ok('FFA HUD: all 6 panels have FINITE x/y (was NaN for sides 2-5)',sl.every(s=>isFinite(s.x)&&isFinite(s.y)));
   const lefts=sl.filter(s=>s.x===10),rights=sl.filter(s=>s.x!==10);
   ok('FFA HUD: 3 panels in the LEFT column, 3 in the RIGHT',lefts.length===3&&rights.length===3);
   ok('FFA HUD: LEFT-column y values are all distinct (no overlap)',new Set(lefts.map(s=>s.y)).size===3);
   ok('FFA HUD: RIGHT-column y values are all distinct (no overlap)',new Set(rights.map(s=>s.y)).size===3);
   bb2={ffa:false,bots:[{side:0},{side:0},{side:1}]};
   ok('2-side HUD regression: side 0 stacks LEFT (y 16,58), side 1 goes RIGHT',bbHudSlot(0).x===10&&bbHudSlot(0).y===16&&bbHudSlot(1).x===10&&bbHudSlot(1).y===58&&bbHudSlot(2).x!==10&&bbHudSlot(2).y===16);
   bb2=svbb;}
  // v5.1.270 FFA INTEGRATION — a real 6-player free-for-all (1 human + empty seats CPU-filled) must START and RENDER without crashing.
  // Was: tankGridApply left the synthetic-fill binds' m2.drive = null, and p2DriveCtx did m2.drive[p].kind → drawBB() threw on the first frame.
  {const sv={mode:m2.mode,tfmt:m2.set.tfmt,bbmode:m2.set.bbmode,bestOf:m2.set.bestOf,map:m2.set.map,bblives:m2.set.bblives,tseats:m2.tseats,claim:m2.claim,drive:m2.drive.slice(),sens:m2.sens.slice(),bb:bb2,ph:phase,pb:playerBind.slice()};
   applyLayout('land2p');phase='p2claim';tour=null;m2.mode='battlebots';m2.set.tfmt='ffa';m2.set.bbmode='ko';m2.set.bestOf=1;m2.set.map=0;m2.set.bblives=1;
   m2.drive=[null,null];m2.sens=[1,1]; // a FRESH 2-slot drive array — the bug surfaces because FFA fills binds 2-5 whose drive is null/undefined
   m2.tseats=[{type:'human',dev:{type:'kb'},tier:1,drive:{kind:'main',idx:3,name:'FCS',c:'#0ff'},sens:1,name:'ME'},null,null,null,null,null];
   m2.claim=[{type:'kb'},null];playerBind[0]={type:'kb'};m2._gpPrev=[];
   startP2BB();
   ok('FFA starts with the full 6-bot field',phase==='p2bb'&&!!bb2&&bb2.bots.length===6);
   ok('FFA every filled bind has a (non-null) drive — null was the p2DriveCtx render crash',bb2.bots.every(b=>!!m2.drive[b.ctl.bind]));
   ok('FFA binds are all DISTINCT (no two bots sharing one drive/input)',new Set(bb2.bots.map(b=>b.ctl.bind)).size===6);
   ok('FFA seat 0 is the HUMAN, the other 5 are CPUs',bb2.bots[0].ctl.type==='human'&&bb2.bots.slice(1).every(b=>b.ctl.type==='cpu'));
   ok('FFA RENDER: drawBB() runs without throwing (the null-drive crash site)',(()=>{try{updateBB(3.1);for(let i=0;i<30;i++)updateBB(1/30);drawBB();return true;}catch(e){console.log('   drawBB threw: '+e.message);return false;}})());
   bb2=sv.bb;phase=sv.ph;m2.mode=sv.mode;m2.set.tfmt=sv.tfmt;m2.set.bbmode=sv.bbmode;m2.set.bestOf=sv.bestOf;m2.set.map=sv.map;m2.set.bblives=sv.bblives;m2.tseats=sv.tseats;m2.claim=sv.claim;m2.drive=sv.drive;m2.sens=sv.sens;playerBind=sv.pb;}
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
