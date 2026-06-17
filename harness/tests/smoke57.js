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
   const ld=bbSeatLoadout(0);ok('a BB seat lazily defaults to the DOZER blade (RAM-only no longer a default)',ld.weapon==='wedge'&&ld.armor==='balanced');
   ld.weapon='spinner';bbCycleField(ld,'weapon',1);ok('cycling WEAPON advances to the next pickable (spinner→piston)',ld.weapon===BB_WEAPONS[2].id);
   bbCycleField(ld,'weapon',-1);ok('cycling back returns + the cycler NEVER lands on RAM-ONLY/none',ld.weapon==='spinner'&&ld.weapon!=='none');
   bbCycleField(ld,'armor',-1);ok('cycling ARMOR backward wraps to the last',ld.armor===BB_ARMOR[BB_ARMOR.length-1].id);
   ld.perk='none';bbCycleField(ld,'perk',1);ok('cycling PERK from unset → the first real perk (never NONE)',ld.perk===BB_PERKS_PICK[0].id&&ld.perk!=='none');
   bbCycleField(ld,'perk',1);ok('cycling PERK forward advances to the next real perk',ld.perk===BB_PERKS_PICK[1].id);
   ld.perk=BB_PERKS_PICK[0].id;bbCycleField(ld,'perk',-1);ok('cycling PERK backward from the first wraps to the LAST real perk (never NONE)',ld.perk===BB_PERKS_PICK[BB_PERKS_PICK.length-1].id);
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
   ok('armory rail has every PICKABLE weapon (RAM-only dropped) + every armor chip',wChips.length===BB_WEAPONS.filter(w=>w.id!=='none').length&&!wChips.some(c=>c.id==='none')&&aChips.length===BB_ARMOR.length);
   ok('v5.1.113: armory rail has the PERK group (pickable perks, NONE excluded)',chips.filter(c=>c.kind==='perk').length===BB_PERKS_PICK.length&&!chips.some(c=>c.kind==='perk'&&c.id==='none')&&bbArmEquip&&(()=>{m2.tseats=[{loadout:{weapon:'wedge',armor:'balanced'}}];return bbArmEquip(0,'perk','flameproof')&&m2.tseats[0].loadout.perk==='flameproof';})());
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
   const a2=bbBotWith('flipper','balanced',0,0,true);a2.x=FW-90;a2.y=FH/2;a2.h=0;a2.firing=true;a2.pistCd=0;a2.ctl.brain.fire=false; // facing the RIGHT wall
   const c2=bbBotWith('none','balanced',1,1,true);c2.x=FW-70;c2.y=FH/2;c2.hp=BB.HP;c2.inv=0;c2.mob=0;c2.ctl.brain.fire=false;c2.ctl.brain.inp={vx:0,vy:0,vr:0};bb2.bots=[a2,c2];bb2.result=null;tfObs=[];bb2.cd=0;bb2.t=1; // mob=0 → the CPU brain can't fight the fling (deterministic); the fling momentum is mobility-independent
   bbWeaponFire(1/60);const h0=c2.hp;for(let i=0;i<22;i++){bb2.cd=0;updateBB(1/60);}
   ok('PUSHER RING-OUT: a foe flung into a WALL takes bonus impact damage',c2.hp<=h0-BB_W.flipWallDmg+0.001);
   m2.drive=svd;m2.set.bbmode=svm;m2.set.bbtime=svt;
   ok('FLIPPER is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='flipper')&&BB_ARMORY_W.some(w=>w.id==='flipper'));
   ok('FLIPPER: big push + wall-slam bonus dmg + fast cd (v5.1.170 push-focused, low dmg)',BB_W.flipKnock>=80&&BB_W.flipFlySpd>=1500&&BB_W.flipWallDmg>=25&&BB_W.flipCd<=1.1);
   ok('PUSHER: flipper is renamed PUSHER in the UI (id stays flipper)',bbWeaponById('flipper').name==='PUSHER'&&BB_ARMORY_W.find(w=>w.id==='flipper').lab==='PUSH');}
  // ── v5.1.110: PINCER — grab + IMMOBILIZE (hold + drain mobility), no slam/damage; a 3v3 role-player ──
  {const a=bbBotWith('pincer','balanced',0,0,true);a.x=300;a.y=300;a.h=0;a.firing=true; // v5.1.140: hold the trigger to keep gripping
   const c=bbBotWith('none','balanced',1,1,true);c.mob=BB.MOB;c.hp=BB.HP;bb2.bots=[a,c];bb2.result=null;
   a.grab=c;c.held=a;a.grabT=BB_W.pincerGrabDur;const mob0=c.mob,hp0=c.hp;
   for(let i=0;i<30;i++)bbGrabUpdate(1/60);
   ok('PINCER drains the held foe MOBILITY (immobilize) without big damage',c.mob<mob0&&c.hp===hp0);
   ok('PINCER glues the held foe to its front',Math.abs(c.x-(a.x+RR*2))<1&&!!c.held);
   ok('PINCER is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='pincer')&&BB_ARMORY_W.some(w=>w.id==='pincer'));}
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
  // ── v5.1.140: PINCER is an UNBREAKABLE clamp — hold to grip, wall-slam, held bot can't drive but can fire, only a teammate frees it ──
  {const h=bbBotWith('pincer','balanced',0,0,true);h.x=300;h.y=300;h.h=0;h.firing=true;
   const c=bbBotWith('none','balanced',1,1,true);c.x=334;c.y=300;c.hp=BB.HP;h.grab=c;c.held=h;h.grabT=BB_W.pincerGrabDur;
   bb2.bots=[h,c];bb2.result=null;tfObs=[];for(let i=0;i<200;i++)bbGrabUpdate(1/60); // ~3.3s, well past pincerGrabDur
   ok('PINCER holds indefinitely while the holder keeps firing (no auto-release)',h.grab===c&&c.held===h);
   h.firing=false;bbGrabUpdate(1/60);
   ok('PINCER lets go when the HOLDER stops firing (captive still cannot self-release)',h.grab===null&&c.held===null);
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
   ok('DRILL ramp readout falls back + glow turns OFF when idle',dr._drillRamp<0.05&&!(dr._drillFx>0));}
  // ── v5.1.154: REPAIR TORCH — heals an ALLY (HP + mobility + wheels) in front; only chip damage to enemies ──
  {ok('REPAIR TORCH is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='repair')&&BB_ARMORY_W.some(w=>w.id==='repair'));
   const medic=bbBotWith('repair','balanced',0,0,true);medic.x=300;medic.y=300;medic.h=0;medic.firing=true;
   const ally=bbBotWith('none','balanced',0,2,true);ally.x=300+RR;ally.y=300;ally.hp=200;ally.mhp=BB.HP;ally.mob=20;ally.wheels=[{hp:0,dead:true},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];
   bb2.bots=[medic,ally];bb2.result=null;const ahp0=ally.hp,amob0=ally.mob;for(let i=0;i<60;i++)bbWeaponFire(1/60);
   ok('REPAIR heals an ally HP',ally.hp>ahp0);
   ok('REPAIR restores allied mobility (tires)',ally.mob>amob0);
   ok('REPAIR re-welds a dead wheel',ally.wheels[0].dead===false&&ally.wheels[0].hp>0);
   ok('REPAIR does not over-heal past max HP',ally.hp<=ally.mhp+1e-6);
   const enemy=bbBotWith('none','balanced',1,1,true);enemy.x=300+RR;enemy.y=300;enemy.hp=BB.HP;enemy.inv=0;
   const med2=bbBotWith('repair','balanced',0,0,true);med2.x=300;med2.y=300;med2.h=0;med2.firing=true;
   bb2.bots=[med2,enemy];const ehp0=enemy.hp;for(let i=0;i<10;i++)bbWeaponFire(1/60);
   ok('REPAIR does only CHIP damage to an enemy',enemy.hp<ehp0&&enemy.hp>ehp0-30);}
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
  {ok('NONE is not a pickable perk anymore',!BB_PERKS_PICK.some(p=>p.id==='none')&&BB_PERKS.some(p=>p.id==='none'));
   ok('CPUs always roll a real (non-NONE) perk',(()=>{for(let i=0;i<200;i++)if(bbCpuPickLoadout(2).perk==='none')return false;return true;})());
   ok('new perks exist: VAMPIRE, SPARE TIRE, PIT STOP',['vampire','sparetire','pitstop'].every(id=>BB_PERKS_PICK.some(p=>p.id===id)));
   // VAMPIRE: destroying an enemy heals the killer
   const vk=bbBotWith('none','balanced',0,0,true);vk.ld.perk='vampire';vk.hp=200;vk.mhp=BB.HP;vk.x=300;vk.y=300;
   const vv=bbBotWith('none','balanced',1,1,true);vv.x=320;vv.y=300;vv.hp=10;bb2.bots=[vk,vv];bb2.result=null;bb2.blasts=[];bb2.deb=[];
   const vhp0=vk.hp;bbKill(vv,0);ok('VAMPIRE: destroying an enemy heals the killer',vk.hp>vhp0);
   // SPARE TIRE: the first wheel to die is re-welded once
   const st=bbBotWith('none','balanced',0,0,true);st.ld.perk='sparetire';st.wheels=[{hp:5,dead:false},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];st._spareUsed=false;
   bbWheelDamage(st,100,null,null);ok('SPARE TIRE: the first wheel survives (re-welded) once',st.wheels.every(w=>!w.dead)&&st._spareUsed===true);
   bbWheelDamage(st,100,null,null);ok('SPARE TIRE: the SECOND wheel to break is lost (spare spent)',st.wheels.some(w=>w.dead));
   // PIT STOP: v5.1.161 deploys a MEDIC drone that patches an ally's HP + mobility + wheels
   const ps=bbBotWith('none','balanced',0,0,true);ps.ld.perk='pitstop';ps.x=400;ps.y=400;ps.hp=BB.HP;ps.mhp=BB.HP;
   const ally=bbBotWith('none','balanced',0,0,true);ally.ld.perk='none';ally.x=420;ally.y=400;ally.hp=150;ally.mhp=BB.HP;ally.mob=10;ally.wheels=[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false}));ally.wheels[0].dead=true;ally.wheels[0].hp=0;
   const en=bbBotWith('none','balanced',1,1,true);en.dead=true;
   bb2.bots=[ps,ally,en];bb2.result=null;bb2.cd=0;bb2.minis=bbMiniSpawn();
   ok('PIT STOP deploys a MEDIC drone (owner-linked, same side)',bb2.minis.length===1&&bb2.minis[0].kind==='medic'&&bb2.minis[0].owner===ps&&bb2.minis[0].side===0);
   const h0=ally.hp,mob0=ally.mob;for(let i=0;i<160;i++)bbMiniUpdate(1/60); // drive the medic directly (no CPU wander) → it seeks + patches the hurt ally
   ok('PIT STOP medic heals a damaged ally (HP + mobility climb)',ally.hp>h0&&ally.mob>mob0);
   ok('PIT STOP medic re-welds a dead ally wheel',!ally.wheels[0].dead);}
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
   const os2=bbBotWith('wedge','balanced',0,0,true);os2.ctl.name='RANDO';os2.wheels=[{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false},{hp:40,dead:false}];
   bbWheelDamage(os2,100,null,null);ok('a normal bot DOES take wheel damage',os2.wheels.some(w=>w.dead||w.hp<40));m2.drive[0]=sd;}
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
   bbAirstrikeUpdate(0.05); // timer fires → a TELEGRAPH appears (no damage yet)
   ok('AIRSTRIKE telegraphs first (pending crosshair, no blast/damage yet)',!!bb2.airPending&&bb2.blasts.length===nbl0&&ab.hp===ahp0);
   bbAirstrikeUpdate(BB_W.airTele+0.05); // telegraph expires → DETONATE
   ok('AIRSTRIKE then detonates (blast appears + damages a bot under it)',bb2.airPending===null&&bb2.blasts.length>nbl0&&ab.hp<ahp0);
   ok('AIRSTRIKE resets its timer after a strike',bb2.airT>0);
   airStrike=false;const ab2=bbBotWith('none','balanced',0,0,true);ab2.hp=BB.HP;bb2.bots=[ab2];bb2.blasts=[];bb2.airPending=null;bb2.airT=0.02;bbAirstrikeUpdate(0.05);
   ok('AIRSTRIKE off: no telegraph, no bombs, no damage',!bb2.airPending&&bb2.blasts.length===0&&ab2.hp===BB.HP);airStrike=sva;
   const svs=animeSword;animeSword=true;
   const sw=bbBotWith('none','balanced',0,0,true);sw.x=300;sw.y=300;sw.h=0;sw.swordCd=0;
   const front=bbBotWith('none','balanced',1,1,true);front.x=300+RR+10;front.y=300;front.h=0;front.hp=BB.HP;front.inv=0;
   const back=bbBotWith('none','balanced',1,2,true);back.x=300-RR-10;back.y=300;back.h=0;back.hp=BB.HP;back.inv=0;
   bb2.bots=[sw,front,back];bb2.result=null;const fhp0=front.hp,bhp0=back.hp;bbSwordUpdate(1/60);
   ok('ANIME SWORD slashes a foe in the FRONT arc (damage + FX)',front.hp<fhp0&&sw._swordFx>0);
   ok('ANIME SWORD spares a foe BEHIND (outside the front arc)',back.hp===bhp0);
   ok('ANIME SWORD goes on cooldown after a swing',sw.swordCd>0);animeSword=svs;}
  // ── v5.1.172: P7 TANK INVASION — every bot mounts the Tank-Fight cannon, auto-firing shells at the nearest enemy ──
  {const svt=tankPort;tankPort=true;
   const gun=bbBotWith('wedge','balanced',0,0,true);gun.x=200;gun.y=300;gun.h=0;
   const tgt=bbBotWith('wedge','balanced',1,1,true);tgt.x=320;tgt.y=300;tgt.hp=BB.HP;tgt.inv=0;
   bb2.bots=[gun,tgt];bb2.result=null;bb2.shells=[];gun._tpCd=0; // fire on the first tick
   const thp0=tgt.hp;for(let i=0;i<90;i++){bbTankPortUpdate(1/60);bbShellsUpdate(1/60);}
   ok('TANK INVASION: a bot auto-fires a shell',gun._tpAim!=null&&tgt.hp<thp0);
   ok('TANK INVASION: the cannon tracks + the shell damages the nearest enemy',gun._tpAim!=null&&tgt.hp<thp0);
   const svp=tankPort;tankPort=false;bb2.shells=[];const tg2=bbBotWith('wedge','balanced',1,2,true);tg2.x=320;tg2.y=300;tg2.hp=BB.HP;bb2.bots=[gun,tg2];gun._tpCd=0;const h2=tg2.hp;for(let i=0;i<30;i++){bbTankPortUpdate(1/60);bbShellsUpdate(1/60);}
   ok('TANK INVASION off: no shells, no damage',bb2.shells.length===0&&tg2.hp===h2);tankPort=svt;}
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
  {ok('CANNON is a PICKABLE weapon',BB_WEAPONS.some(w=>w.id==='cannon')&&BB_ARMORY_W.some(w=>w.id==='cannon'));
   ok('CANNON is a TURRET (aims independent of the chassis)',bbIsTurret('cannon')===true);
   const cn=bbBotWith('cannon','balanced',0,0,true);cn.x=200;cn.y=300;cn.h=0;cn.ctl.brain.fire=true;cn.cannonCd=0;
   const tg=bbBotWith('wedge','balanced',1,1,true);tg.x=340;tg.y=300;tg.hp=BB.HP;tg.inv=0;
   bb2.bots=[cn,tg];bb2.result=null;bb2.shells=[];
   bbWeaponPre(1/60);bbWeaponFire(1/60);
   ok('CANNON fires a shell on RT',(bb2.shells||[]).length>0);
   const h0=tg.hp;for(let i=0;i<90;i++){bbWeaponPre(1/60);bbShellsUpdate(1/60);}
   ok('CANNON shell travels + damages a foe at range',tg.hp<h0);
   const cn2=bbBotWith('cannon','balanced',0,0,true);cn2.x=200;cn2.y=300;cn2.ctl.brain.fire=false;cn2.cannonCd=0;bb2.bots=[cn2,tg];bb2.shells=[];
   bbWeaponPre(1/60);bbWeaponFire(1/60);ok('CANNON holds fire when RT is up',(bb2.shells||[]).length===0);}
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
    ok('map picker = one tile per arena + a RANDOM tile',tiles.length===TF2_MAPS.length+1&&tiles[tiles.length-1].map==='rand');
    ok('map-picker tiles stay on-screen',tiles.every(t=>t.x>=0&&t.y>=0&&t.x+t.w<=CW+1&&t.y+t.h<=CH+1));
    const svp=phase,svm2=m2.set.map;
    phase='p2bbmap';const t0=tiles[0];bbMapPickerClick(t0.x+t0.w/2,t0.y+t0.h/2);
    ok('clicking a map tile selects that arena + returns to settings',m2.set.map===t0.map&&phase==='p2settings');
    phase='p2bbmap';const tr=tiles[tiles.length-1];bbMapPickerClick(tr.x+tr.w/2,tr.y+tr.h/2);
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
   // DOMINATION (KOTH hold-point)
   ok('GAME MODE includes DOMINATION',BB_MODES.some(m=>m.id==='domination'));
   m2.set.bbmode='domination';
   const dz=bbBotWith('none','balanced',0,0,true);dz.x=FW/2;dz.y=FH/2;
   bb2.bots=[dz];bb2.result=null;bb2.dom=null;bb2.map=TF2_MAPS[0];bbModeUpdate(1.0);
   ok('DOMINATION: holding the zone ALONE banks time',bb2.dom[0]>0&&bb2.dom[1]===0);
   const da=bbBotWith('none','balanced',0,0,true);da.x=FW/2;da.y=FH/2;const db=bbBotWith('none','balanced',1,1,true);db.x=FW/2;db.y=FH/2;
   bb2.bots=[da,db];bb2.dom=[0,0];bb2.result=null;bbModeUpdate(1.0);
   ok('DOMINATION: a CONTESTED zone banks nothing',bb2.dom[0]===0&&bb2.dom[1]===0);
   bb2.bots=[dz];bb2.dom=[BB_DOM_TARGET-0.01,0];bb2.result=null;bbModeUpdate(0.5);
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
   ok('CTF: a carrier dying DROPS the flag (not home)',fl2[0].carrier===null&&fl2[0].home===false);
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
    ok('DOMINATION: a CPU outside the zone drives toward the center',dme.ctl.brain.inp.vx>0&&dme.ctl.brain.inp.vy>0);
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
