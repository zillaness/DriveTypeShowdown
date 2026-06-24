// smoke83 — CAREER / STORY MODE, Phases ①–③
//   ① shell + HUB + CYOA beat screen (story/coach/finale, choices, when-gating, then-chaining)
//   ② startCareerMatch: drive-lock + adaptive tier launches the real mode engine
//   ③ careerMatchEnd: WIN *or* LOSS advances to the post-match fork (the keystone)
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0; const T=(l,c)=>{ (c?P++:F++); console.log((c?'ok — ':'FAIL — ')+l); };
  const driveId=(d)=>{const g=[DRIVES,HOLO_DRIVES,STEER_DRIVES][d.kind==='main'?0:d.kind==='holo'?1:2];return g[d.idx]&&g[d.idx].id;};
  const liveResult=(r)=>{ if(tf2)tf2.result=r; else if(r2)r2.result=r; else if(bb2)bb2.result=r; else if(b2)b2.result=r; };
  const freshAt=(node)=>{career=careerNew();career.node=node||'intro';phase='p2cbeat';};
  const pick=(i)=>{const b=careerBeat(career.node),its=careerBeatButtons(b),rs=careerBeatRects(its.length);careerBeatClick(rs[i].x+5,rs[i].y+5);};

  // ───────────────────────── ① SHELL ─────────────────────────
  const n=careerNew();
  T('careerNew shape (difficulty pick / veteran lane / skill 1 / empty / ver1)', n.node==='difficulty'&&n.diff==='veteran'&&n.skill===1&&n.taught.length===0&&n.cleared.length===0&&n.ver===1);
  career=careerNew(); career.skill=2.3; career.taught.push('C1'); careerStore();
  const back=JSON.parse(localStorage.getItem('frcds_career_v1'));
  T('careerStore round-trips through localStorage', !!back&&back.skill===2.3&&back.taught[0]==='C1');
  T('careerMigrate fills a sparse save', (()=>{const m=careerMigrate({skill:1.1,node:'after:tank_hook'});return m.skill===1.1&&Array.isArray(m.cleared)&&m.ver===1;})());
  careerSave=null; career=null; careerEnter();
  T('careerEnter → p2career hub', phase==='p2career');
  let B=careerHubBtns(); careerHubClick(B.go.x+10,B.go.y+10);
  T('hub START → p2cbeat at the difficulty pick', phase==='p2cbeat'&&!!career&&career.node==='difficulty');
  // difficulty beat (4 lanes: rookie/veteran/winner/champion) sets diff + seeds the starting tier + → controls
  career=careerNew(); phase='p2cbeat'; pick(3);
  T('difficulty CHAMPION (choice 3) → diff + seeds skill 3 + → controls', career.diff==='champion'&&career.skill===3&&career.node==='controls');
  career=careerNew(); pick(0); T('difficulty ROOKIE (choice 0) → seeds skill 0', career.diff==='rookie'&&career.skill===0&&career.node==='controls');
  career=careerNew(); pick(2); T('difficulty WINNER (choice 2) → seeds skill 2', career.diff==='winner'&&career.skill===2);
  // controls beat → single info-acknowledge → intro (v5.1.263: keyboard AND controller are both live, no either/or)
  career=careerNew(); career.node='controls'; phase='p2cbeat'; pick(0);
  T('controls "got it" (choice 0) → intro', career.node==='intro');
  // careerHumanBind is the UNIVERSAL 'any' device (keyboard + every pad live at once)
  career.input='gp'; T('careerHumanBind → any (universal)', careerHumanBind().type==='any');
  career.input='kb'; T('careerHumanBind ignores input pref → still any', careerHumanBind().type==='any');
  career.input='auto'; T('careerHumanBind auto → any', careerHumanBind().type==='any');
  texts.length=0; let drew=true; try{drawCareerBeat();}catch(e){drew=false;console.log('  draw err:',e.message);}
  T('intro beat renders (no throw, emits text)', drew&&texts.length>0);
  let dh=true; try{drawCareerHub();}catch(e){dh=false;console.log('  hub err:',e.message);}
  T('hub renders', dh);

  // ───────────────────────── ② MATCH LAUNCH ─────────────────────────
  freshAt('intro'); pick(0); // "Let's GO — drive the tank" → startCareerMatch('tank_hook')
  T('intro choice0 launches the TANK match (phase p2tank, tf2 live)', phase==='p2tank'&&!!tf2&&tf2.result===null);
  T('drive-LOCKED to tank on side 0', driveId(m2.drive[0])==='tank');
  T('side 1 is a CPU at the adaptive tier', m2.claim[1]&&m2.claim[1].type==='cpu'&&typeof m2.claim[1].tier==='number');
  T('career flagged active + stage=tank_hook', career.active===true&&career.stage==='tank_hook');
  // careerTier mapping — adaptive skill → a VALID CPU tier index (0..3; tier 4 does NOT exist)
  career.skill=2.2; T('careerTier: skill 2.2 → tier 2', careerTier()===2);
  career.skill=3.9; T('careerTier: skill 3.9 → clamps to top tier 3 (CHAMPION)', careerTier()===3);
  career.skill=-1;  T('careerTier clamps low → 0', careerTier()===0);
  T('careerMaxTier === CPU_TIERS.length-1 (3)', careerMaxTier()===CPU_TIERS.length-1&&careerMaxTier()===3);
  // v5.1.263 SOLO time-trial races + per-lane par table (rookie = no clock; arcade anchors winner=15, bot-centric tighter)
  T('careerRacePar arcade winner=15', (()=>{career.diff='winner';return careerRacePar('arcade_course')===15;})());
  T('careerRacePar strafe champion=5', (()=>{career.diff='champion';return careerRacePar('strafe_intro')===5;})());
  T('careerRacePar arcade rookie=0 (just finish)', (()=>{career.diff='rookie';return careerRacePar('arcade_course')===0;})());
  T('careerRacePar steer_detour=0 (no anchor)', careerRacePar('steer_detour')===0);
  career=careerNew(); career.diff='winner'; career.skill=2; career.active=true;
  startCareerMatch('arcade_course');
  T('arcade_course → SOLO race (p2race · r2.solo · par 15 · SP course 0)', phase==='p2race'&&!!r2&&r2.solo===true&&r2.par===15&&m2.set.course===0);
  startCareerMatch('strafe_intro');
  T('strafe_intro winner → SOLO race par 10', phase==='p2race'&&r2.solo===true&&r2.par===10);
  career.diff='rookie'; startCareerMatch('arcade_course');
  T('rookie race → par 0 (just finish, no rival)', r2.solo===true&&(r2.par|0)===0);
  // v5.1.263 the 'any' bind reads gamepad BUTTONS (so STORY MODE has keyboard AND controller both live)
  T('gpBtnAny reads any pressed pad button', (()=>{gpBtnsAll=[[],[true]];return gpBtnAny(0)===true&&gpBtnAny(3)===false;})());
  gpBtnsAll=[]; r2=null;
  freshAt('intro'); pick(0); career.skill=0.5; // relaunch the TANK match so the live-match nav test below has tf2
  // careerSetDrive resolves across groups
  careerSetDrive(0,'mecanum'); T('careerSetDrive resolves a HOLO id', driveId(m2.drive[0])==='mecanum');
  careerSetDrive(0,'carSteer'); T('careerSetDrive resolves a STEER id', driveId(m2.drive[0])==='carSteer');

  // nav shows a single CONTINUE STORY button while a career match is live
  tf2.result=0; texts.length=0; let dn=true; try{drawP2Nav(400);}catch(e){dn=false;console.log('  nav err:',e.message);}
  T('drawP2Nav (career, win) renders a continue prompt', dn&&texts.some(t=>/CONTINUE STORY/.test(t)));

  // ───────────────────────── ③ RESULT ROUTER ─────────────────────────
  // a LOSS still advances (progression is by completion, not winning)
  freshAt('intro'); pick(0); tf2.result=1; const sk0=career.skill; careerMatchEnd(1);
  T('LOSS clears the stage + advances to after:tank_hook', career.cleared.includes('tank_hook')&&career.node==='after:tank_hook'&&phase==='p2cbeat');
  T('LOSS sets lastResult lost/blown_out + lowers skill', (career.flags.lastResult==='lost'||career.flags.lastResult==='blown_out')&&career.skill<sk0&&career.active===false);
  // a WIN advances + raises skill
  freshAt('intro'); pick(0); tf2.result=0; const sk1=career.skill; careerMatchEnd(0);
  T('WIN clears the stage + advances + raises skill', career.cleared.includes('tank_hook')&&career.node==='after:tank_hook'&&career.skill>sk1&&(career.flags.lastResult==='won'||career.flags.lastResult==='dominated'));
  // the nav CLICK path calls the router (advance on win)
  freshAt('intro'); pick(0); tf2.result=0;
  const handled=p2NavClick(CW/2, 420, 400, ()=>{});
  T('p2NavClick (career) routes the result → advanced + match torn down', handled===true&&career.active===false&&career.node==='after:tank_hook'&&tf2===null);

  // when-gated detour choice (pure gating logic)
  career.flags.lastResult='won';       T('detour hidden when not dominated (2 choices)', careerVisibleChoices(careerBeat('after:tank_hook')).length===2);
  career.flags.lastResult='dominated'; T('detour shows when dominated (3 choices)', careerVisibleChoices(careerBeat('after:tank_hook')).length===3);

  // ───────────────────────── ④ REAL MARGINS (skill + story track performance) ─────────────────────────
  const setLives=(s0,s1)=>{tf2.tanks.forEach(t=>{t.lives=(t.side===0?s0:s1);});};
  freshAt('intro'); pick(0); setLives(3,0); tf2.result=0; careerMatchEnd(0);
  T('flawless tank win (3 lives left) → DOMINATED', career.flags.lastResult==='dominated');
  T('dominated win makes the steer detour reachable for real', careerVisibleChoices(careerBeat('after:tank_hook')).length===3);
  freshAt('intro'); pick(0); setLives(0,3); tf2.result=1; careerMatchEnd(1);
  T('blowout tank loss (foe full) → BLOWN_OUT', career.flags.lastResult==='blown_out');
  freshAt('intro'); pick(0); setLives(0,1); tf2.result=1; careerMatchEnd(1);
  T('close tank loss (foe at 1 life) → LOST (not blown_out)', career.flags.lastResult==='lost');

  // coach then-chain: intro choice1 → coach:C1 → continue launches the stage
  freshAt('intro'); pick(1);
  T('intro choice1 → coach:C1 (taught)', career.node==='coach:C1'&&career.taught.includes('C1'));
  pick(0); // coach continue → its _then stage
  T('coach continue → launches the tank match', phase==='p2tank'&&!!tf2&&career.active===true);

  // ESC out of a live career match → back to the beat, nothing recorded
  career.cleared=[]; p2Back();
  T('ESC from a career match → p2cbeat, not cleared, inactive', phase==='p2cbeat'&&career.active===false&&career.cleared.length===0);

  // ───────────────────────── QUIZ + CHEMISTRY/FLAMETHROWER (Sam's idea) ─────────────────────────
  const answerQuiz=(correct)=>{let g=0;while(phase==='p2cquiz'&&g++<40){const Q=career._quiz,q=Q.qs[Q.i];
    if(Q.picked==null){const R=careerQuizOptRects(q.opts.length);const k=correct?q.ans:((q.ans+1)%q.opts.length);careerQuizClick(R[k].x+5,R[k].y+5);}
    else careerQuizClick(careerQuizContRect().x+5,careerQuizContRect().y+5);}};
  const finLane=(d,node)=>{career=careerNew();careerApplyEffect({setDiff:d});career.node=node;phase='p2cbeat';}; // WINNER → an all-RoboRumble finale so the chemistry/flamethrower path applies (battlebots round 1)
  finLane('winner','after:heading_advanced'); pick(0);
  T('quiz beat opens the QUIZ screen with power questions', phase==='p2cquiz'&&!!career._quiz&&career._quiz.qs.length>=3&&career._quiz.qs.every(x=>x.topic==='power'));
  let qdrew=true; try{drawCareerQuiz();}catch(e){qdrew=false;console.log('  quiz draw err:',e.message);}
  T('quiz renders', qdrew);
  answerQuiz(true);
  T('ACE the power quiz → chem safe + weapon bonus + → pre:capstone', career.flags.chem==='safe'&&career.bonuses.weapon>0&&career.node==='pre:capstone'&&phase==='p2cbeat');
  texts.length=0; drawCareerBeat();
  T('pit-lane (safe) copy mentions a heat shield', texts.some(t=>/heat shield|LiFePO4/i.test(t)));
  pick(0);
  T('capstone launches (battlebots, bb2 live)', phase==='p2bb'&&!!bb2);
  T('SAFE chemistry → player heat shield, rival not on fire', m2.bbLoadout[0].armor==='heatshield'&&m2.bbLoadout[1].weapon!=='flame');
  // now FLUNK it
  finLane('winner','after:heading_advanced'); pick(0); answerQuiz(false);
  T('FLUNK the power quiz → chem volatile, no weapon bonus', career.flags.chem==='volatile'&&career.bonuses.weapon===0);
  texts.length=0; drawCareerBeat();
  T('pit-lane (volatile) copy warns of the FLAMETHROWER', texts.some(t=>/FLAMETHROWER|LiPo/i.test(t)));
  pick(0);
  T('VOLATILE chemistry → rival brings the FLAMETHROWER, player has no heat shield', m2.bbLoadout[1].weapon==='flame'&&m2.bbLoadout[0].armor!=='heatshield');
  T('the rival BOT actually fields the flamethrower', (()=>{const c=bb2.bots.find(b=>b.side===1);return !!c&&!!c.ld&&c.ld.weapon==='flame';})());

  // ───────────────────────── DIFFICULTY LANE: rookie/veteran/winner/champion (Sam) ─────────────────────────
  const cy=400, navClick=(rect)=>p2NavClick(rect.x+5,rect.y+5,cy,()=>{});
  // the 4 lanes are named after — and seed — the engine's 4 CPU tiers; the lane also sets the rematch budget
  T('the 4 lanes match the engine CPU tier names', JSON.stringify(CAREER_LANES)===JSON.stringify(CPU_TIERS.map(t=>t.name.toLowerCase())));
  // lane → starting tier (seeded skill) + rematch budget
  const setLane=(d)=>{career=careerNew();career.flags={lastResult:null};careerApplyEffect({setDiff:d});careerGoto('stage:tank_hook');};
  setLane('rookie');   T('ROOKIE lane → tier 0 + ∞ rematches', careerTier()===0&&career._rematchLeft===99);
  setLane('veteran');  T('VETERAN lane → tier 1 + 5 rematches', careerTier()===1&&career._rematchLeft===5);
  setLane('winner');   T('WINNER lane → tier 2 + 2 rematches', careerTier()===2&&career._rematchLeft===2);
  setLane('champion'); T('CHAMPION lane → tier 3 + 0 rematches', careerTier()===3&&career._rematchLeft===0);
  // VETERAN rematch flow: lose, run it back (5×), then the budget runs out and the loss becomes canon
  setLane('veteran');
  const loseRematch=()=>{tf2.result=1;navClick(careerNavRects(true,cy).re);};
  loseRematch(); T('rematch 1 → 4 left, SAME stage relaunched, not advanced', career._rematchLeft===4&&phase==='p2tank'&&!!tf2&&tf2.result===null&&career.node!=='after:tank_hook');
  for(let i=0;i<4;i++)loseRematch(); T('after 5 rematches → 0 left, still on the stage', career._rematchLeft===0&&phase==='p2tank');
  T('rematches-used counter tracked for the recap', (career.flags.rematches|0)===5);
  tf2.result=1; navClick(careerNavRects(false,cy).go);
  T('budget spent → TAKE-THE-L advances (loss becomes canon)', career.node==='after:tank_hook'&&(career.flags.lastResult==='lost'||career.flags.lastResult==='blown_out'));
  // champion: a loss advances immediately (no rematch button)
  setLane('champion');tf2.result=1;navClick(careerNavRects(false,cy).go);
  T('CHAMPION loss advances immediately (no rematch)', career.node==='after:tank_hook');
  // questions scale with the lane (grade-banded via level tags)
  career=careerNew();career.diff='rookie';
  T('ROOKIE quiz: 3 questions, all CORE (4–5th-grade, no algebra)', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===3&&q.every(x=>x.level==='core');})());
  career.diff='veteran';
  T('VETERAN quiz: 3 questions, ≥1 algebra', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===3&&q.some(x=>x.level==='algebra');})());
  career.diff='winner';
  T('WINNER quiz: 4 questions incl. ≥2 harder', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===4&&q.filter(x=>x.level==='algebra'||x.level==='headline').length>=2;})());
  career.diff='champion';
  T('CHAMPION quiz: 4 questions, the hardest mix', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===4&&q.filter(x=>x.level==='algebra'||x.level==='headline').length>=2;})());

  // ───────────────────────── THE FINALE: lane-prestige SEQUENCE of rounds (Sam) ─────────────────────────
  const walkFinale=(res)=>{let g=0;while(career.finale&&career.finale.active&&g++<12){liveResult(res);careerMatchEnd(res);}};
  // champion lane = a 3-round WORLD RoboRumble tournament (all rumble)
  career=careerNew(); careerApplyEffect({setDiff:'champion'}); careerFinaleStart();
  T('champion finale → 3 rumble rounds, round 1 live', !!career.finale&&career.finale.active&&career.finale.rounds===3&&career.finale.stages.every(s=>s==='capstone_rumble')&&phase==='p2bb');
  liveResult(0); careerMatchEnd(0);
  T('win round 1 → advance to round 2 (still in the bracket)', career.finale.active&&career.finale.round===2&&phase==='p2bb');
  liveResult(0); careerMatchEnd(0); liveResult(0); careerMatchEnd(0);
  T('run the table (3-0) → WORLD CHAMPION → recap', career.finale.result==='champion'&&phase==='p2crecap'&&career.flags.ending==='world');
  // champion lane: a round-1 loss (0 rematches) → eliminated → deep-run
  career=careerNew(); careerApplyEffect({setDiff:'champion'}); careerFinaleStart(); liveResult(1); careerMatchEnd(1);
  T('champion round-1 loss → eliminated → recap (deep run)', career.finale.result==='eliminated'&&phase==='p2crecap'&&career.flags.ending==='deeprun');
  // rookie lane = a single-elim BALL tournament, then a 1v1 RoboRumble invite (last stage is rumble)
  career=careerNew(); careerApplyEffect({setDiff:'rookie'}); careerFinaleStart();
  T('rookie finale → starts in BALL mode (a ball tournament)', phase==='p2ball'&&!!b2&&career.finale.stages[0]==='capstone_ball');
  T('rookie finale ends on a RoboRumble invite round', career.finale.stages[career.finale.stages.length-1]==='capstone_rumble');
  walkFinale(0);
  T('rookie wins it all → graduate → recap', career.finale.result==='champion'&&phase==='p2crecap'&&career.flags.ending==='graduate');
  // veteran lane = a bigger ball tournament → a RoboRumble tryout (more rounds)
  career=careerNew(); careerApplyEffect({setDiff:'veteran'}); careerFinaleStart();
  T('veteran finale → BALL first, ends on a rumble, more rounds than rookie', phase==='p2ball'&&career.finale.stages[0]==='capstone_ball'&&career.finale.stages[career.finale.stages.length-1]==='capstone_rumble'&&career.finale.rounds>=4);
  walkFinale(0);
  T('veteran wins it all → HIGH-SCHOOL champion → recap', career.finale.result==='champion'&&phase==='p2crecap'&&career.flags.ending==='hschamp');
  // ending titles by lane (finale champion)
  const setFin=(d,res)=>{const c=CAREER_FINALE[d];career=careerNew();career.diff=d;career.flags={};career.finale={ending:c.ending,result:res,rounds:c.stages.length,round:c.stages.length,name:c.name,won:c.stages.length};};
  setFin('winner','champion');  T('winner finale champion → REGIONAL', careerEnding()==='regional');
  setFin('veteran','champion'); T('veteran finale champion → HIGH-SCHOOL', careerEnding()==='hschamp');
  // recap renders for a finale + NEW JOURNEY resets
  career=careerNew(); careerApplyEffect({setDiff:'winner'}); career.finale={ending:'regional',result:'champion',rounds:3,round:3,name:'Regional Championship',won:3}; career.flags={chem:'safe'}; careerRecapStart();
  T('recap renders for a finale champion', phase==='p2crecap'&&career.flags.ending==='regional'&&(()=>{let ok=true;try{drawCareerRecap();}catch(e){ok=false;console.log('  recap err:',e.message);}return ok;})());
  let RB=careerRecapBtns(); careerRecapClick(RB.again.x+5,RB.again.y+5);
  T('recap NEW JOURNEY → fresh career at the difficulty pick', career.node==='difficulty'&&career.cleared.length===0&&phase==='p2cbeat');

  // ───────────────────────── RELATIONSHIP / FAVOR economy (Sam §11.2) ─────────────────────────
  // a favor choice on after:arcade_course (lend a spare part) makes a friend
  freshAt('after:arcade_course'); pick(0);
  T('lending a spare part → an ally recorded + a favor', career.allies.length===1&&(career.favors|0)===1&&!!career.allies[0].name);
  // careerAddAlly dedupes by name
  T('careerAddAlly dedupes', (()=>{const n=career.allies[0].name;const before=career.allies.length;careerAddAlly(n,1,'x');return career.allies.length===before;})());
  // acing a quiz earns a study-buddy ally
  career=careerNew(); finLane('rookie','after:heading_advanced'); pick(0); answerQuiz(true);
  T('a perfect quiz earns a study-buddy ally', career.allies.some(a=>a.via==='a study buddy'));
  // an ally lends you a SPARE PART (a perk) in the RoboRumble finale
  career=careerNew(); career.allies=[{name:'Maya',tier:2,via:'lent a part'}]; m2.bbLoadout=[null,null]; m2.set={...M2_SET_DEFAULTS};
  careerApplyBonuses({mode:'battlebots'});
  T('an ally → a spare-part perk in the rumble', m2.bbLoadout[0].perk==='pitstop');
  // the recap narrates your allies + the post-tournament INVITE
  career=careerNew(); careerApplyEffect({setDiff:'champion'}); career.allies=[{name:'Maya',tier:3,via:'x'},{name:'Theo',tier:3,via:'y'}]; career.finale={ending:'world',result:'champion',rounds:3,round:3,name:'World Championship',won:3}; career.flags={};
  const RL=careerRecap();
  T('recap names your allies', RL.some(l=>/Maya/.test(l)&&/Theo/.test(l)));
  T('recap includes a post-tournament invite (world → national tryouts)', RL.some(l=>/tryout|scout|invite/i.test(l)));

  // STORY MODE label (Sam: "instead of career, its story mode")
  career=careerNew(); phase='p2career'; texts.length=0; drawCareerHub();
  T('hub titled STORY MODE', texts.some(t=>/STORY MODE/.test(t)));

  // ───────────────────────── FULL CURRICULUM WALK (win every match, ace every quiz) → finale → recap ──────────────
  freshAt('intro'); let guard=0; const quizTopics={};
  while(phase!=='p2crecap'&&guard++<240){
    if(phase==='p2cbeat')pick(0);
    else if(phase==='p2cquiz'){const Q=career._quiz,q=Q.qs[Q.i];quizTopics[q.topic]=1;if(Q.picked==null){const R=careerQuizOptRects(q.opts.length);careerQuizClick(R[q.ans].x+5,R[q.ans].y+5);}else careerQuizClick(careerQuizContRect().x+5,careerQuizContRect().y+5);}
    else { liveResult(0); careerMatchEnd(0); } // a match is live → win it (curriculum + every finale round)
  }
  T('full walk runs all the way to the RECAP via the finale', phase==='p2crecap'&&guard<240);
  T('curriculum hits 3 quizzes across topics (tools, fab, power)', quizTopics.tools&&quizTopics.fab&&quizTopics.power);
  T('acing the quizzes accrued build bonuses (hp+speed+weapon)', career.bonuses.hp>0&&career.bonuses.speed>0&&career.bonuses.weapon>0);
  T('full walk taught C1..C6', ['C1','C2','C3','C4','C5','C6'].every(c=>career.taught.includes(c)));
  T('full walk cleared all 7 stages', ['tank_hook','arcade_course','strafe_intro','field_centric','holo_shooter','heading_advanced','capstone_rumble'].every(s=>career.cleared.includes(s)));
  T('default (veteran) walk → HIGH-SCHOOL champion ending', career.flags.ending==='hschamp');
  let rdrew=true; try{drawCareerRecap();}catch(e){rdrew=false;console.log('  recap draw err:',e.message);}
  T('recap renders', rdrew);

  // ───────────────────────── ⑥ ACHIEVEMENTS · COACH-SKIP · BONUS TUNING ─────────────────────────
  // achievement: a PERFECT quiz fires Honor Roll
  for(const k in achUnlocked)delete achUnlocked[k];
  freshAt('after:heading_advanced'); pick(0); answerQuiz(true);
  T('perfect quiz → Honor Roll achievement', !!achUnlocked.honorroll);
  // achievements: graduating fires First Driver; champion lane also fires Untouchable
  for(const k in achUnlocked)delete achUnlocked[k];
  career=careerNew(); careerApplyEffect({setDiff:'champion'}); career.flags={lastResult:'won',chem:'safe'}; careerRecapStart();
  T('graduation → First Driver + (champion) Untouchable', !!achUnlocked.firstdriver&&!!achUnlocked.untouchable);
  for(const k in achUnlocked)delete achUnlocked[k];
  career=careerNew(); careerApplyEffect({setDiff:'veteran'}); career.flags={lastResult:'won'}; careerRecapStart();
  T('non-champion graduation → First Driver only', !!achUnlocked.firstdriver&&!achUnlocked.untouchable);
  // coach self-skip on replay: first visit teaches, second offers SKIP
  career=careerNew(); careerGoto('coach:C4');
  T('first coach visit → "Got it" (not skip)', /Got it/.test(careerBeatButtons(careerBeat('coach:C4'))[0].label));
  careerGoto('coach:C4');
  T('replay coach visit → SKIP label', /Skip/i.test(careerBeatButtons(careerBeat('coach:C4'))[0].label));
  // bonus tuning: summary string + license perks
  career=careerNew(); career.bonuses={speed:1,hp:1,weapon:0.5}; career.flags={license:true};
  T('careerBonusSummary reflects earned edge + license', /speed/.test(careerBonusSummary())&&/HP/.test(careerBonusSummary())&&/license/.test(careerBonusSummary()));
  // a licensed driver gets +1 tank life and a SPARE-PART perk in the capstone
  career=careerNew(); career.flags={license:true}; m2.set={...M2_SET_DEFAULTS}; m2.set.lives=3; m2.sens=[1,1]; m2.bbLoadout=[null,null];
  careerApplyBonuses({mode:'tankfight'});
  T('license → +1 tank life', m2.set.lives===4);
  careerApplyBonuses({mode:'battlebots'});
  T('license → spare-part perk in the rumble', m2.bbLoadout[0].perk==='sparetire');

  // splash CAREER tile → hub
  applyLayout('legacy'); phase='splash';
  const SR=splashRects(); click(SR.career.x+10,SR.career.y+10);
  T('splash CAREER tile → p2career', phase==='p2career');
  // the splash banner draws without throwing (text now fit-guarded to the card)
  let bdrew=true; try{drawCareerBanner(SR.career);}catch(e){bdrew=false;}
  T('career banner renders (fit-guarded)', bdrew);

  // ─────────────── v5.1.273 SOFT-LOCK REGRESSION: ESC out of a coach-launched match must NOT strand you ───────────────
  // Repro: intro → "how do tracks work?" (coach:C1, then stage:tank_hook) → continue launches the match →
  // player ESCs the match → back on coach:C1 with _then consumed. Continuing MUST relaunch the stage (was: dead-ended to the hub forever).
  {career=careerNew();career.diff='veteran';career.node='intro';phase='p2cbeat';
   const b=careerBeat('intro'),its=careerBeatButtons(b),ci=its.findIndex(it=>it.ch&&it.ch.goto==='coach:C1');
   const rs=careerBeatRects(its.length);careerBeatClick(rs[ci].x+5,rs[ci].y+5);
   T('intro → coach:C1 with a pending stage continuation', career.node==='coach:C1'&&career._then==='stage:tank_hook');
   pick(0); // coach "Got it" → launches stage:tank_hook
   T('coach continue launches the tank match', phase==='p2tank'&&career.active&&career.stage==='tank_hook');
   p2Back(); // ESC out of the match → back to the coach beat, _then now consumed
   T('ESC out of the career match → back on the coach beat (no result)', phase==='p2cbeat'&&career.node==='coach:C1'&&!career.active&&!career._then);
   pick(0); // continue the coach AGAIN — must relaunch the stage, not dead-end to the hub
   T('coach continue after ESC RELAUNCHES the stage (no soft-lock)', phase==='p2tank'&&career.active&&career.stage==='tank_hook');
   // and the hub→CONTINUE path is also safe (resting on a coach beat)
   p2Back(); career.active=false; career.stage=null; phase='p2cbeat'; career.node='coach:C1';
   phase='p2career'; {const HB=careerHubBtns();careerHubClick(HB.go.x+5,HB.go.y+5);} // hub CONTINUE → re-enters coach:C1
   T('hub CONTINUE re-enters the coach beat', phase==='p2cbeat'&&career.node==='coach:C1');
   pick(0);
   T('continuing that coach STILL reaches the stage (persisted continuation)', phase==='p2tank'&&career.stage==='tank_hook');
  }
  // v5.1.278 the coach-beat continuation must survive a RELOAD (careerMigrate) — dropping _thenByNode was a soft-lock loop (coach:C2 skip→hub→continue→coach:C2)
  {career=careerNew();career.active=true;career.node='intro';careerGoto('coach:C2','stage:arcade_course');
   const saved=JSON.parse(JSON.stringify(career)); // mirror the localStorage round-trip careerStore/careerMigrate do
   career=careerMigrate(saved);
   T('careerMigrate PRESERVES _thenByNode across a reload', !!(career._thenByNode&&career._thenByNode['coach:C2']==='stage:arcade_course'));
   careerGoto(career.node); careerContinue(); // CONTINUE → coach:C2 → skip
   T('continue after a RELOAD reaches the stage (no hub soft-lock)', career.stage==='arcade_course'&&phase!=='p2career');}
  // v5.1.278 even an OLD save with NO _thenByNode recovers via the curriculum-derived fallback
  {T('careerCoachThen derives the continuation from the curriculum', careerCoachThen('coach:C2')==='stage:arcade_course');
   career=careerMigrate({node:'coach:C2',active:true,taught:['C1','C2'],diff:'veteran'}); // no _thenByNode
   careerGoto(career.node); careerContinue();
   T('OLD save (no _thenByNode) recovers via the fallback (no soft-lock)', career.stage==='arcade_course'&&phase!=='p2career');}
  // v5.1.273 a quiz with zero questions skips instead of crashing
  {career=careerNew();career.node='intro';const skipped=(()=>{try{careerQuizStart({kind:'quiz',topic:'__none__',next:'hub'});return phase==='p2career';}catch(e){return false;}})();
   T('empty-pool quiz skips to next (no crash)', skipped);}

  console.log('smoke83: '+P+' pass, '+F+' fail');
})();
`;
global.ctxState={depth:0};global.texts=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},fillText:(t)=>{texts.push(String(t));},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
