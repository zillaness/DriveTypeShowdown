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
  T('careerNew shape (difficulty pick / pro / 0.5 / empty / ver1)', n.node==='difficulty'&&n.diff==='pro'&&n.skill===0.5&&n.taught.length===0&&n.cleared.length===0&&n.ver===1);
  career=careerNew(); career.skill=2.3; career.taught.push('C1'); careerStore();
  const back=JSON.parse(localStorage.getItem('frcds_career_v1'));
  T('careerStore round-trips through localStorage', !!back&&back.skill===2.3&&back.taught[0]==='C1');
  T('careerMigrate fills a sparse save', (()=>{const m=careerMigrate({skill:1.1,node:'after:tank_hook'});return m.skill===1.1&&Array.isArray(m.cleared)&&m.ver===1;})());
  careerSave=null; career=null; careerEnter();
  T('careerEnter → p2career hub', phase==='p2career');
  let B=careerHubBtns(); careerHubClick(B.go.x+10,B.go.y+10);
  T('hub START → p2cbeat at the difficulty pick', phase==='p2cbeat'&&!!career&&career.node==='difficulty');
  // difficulty beat sets diff + advances to the intro
  career=careerNew(); phase='p2cbeat'; pick(2);
  T('difficulty CHAMPION → diff set + → intro', career.diff==='champion'&&career.node==='intro');
  career=careerNew(); pick(0); T('difficulty ROOKIE sets diff', career.diff==='rookie');
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
  // careerTier mapping
  career.skill=2.2; T('careerTier: skill 2.2 → tier 2', careerTier()===2);
  career.skill=3.9; T('careerTier: skill 3.9 → tier 4', careerTier()===4);
  career.skill=-1;  T('careerTier clamps low → 0', careerTier()===0);
  career.skill=0.5;
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
  freshAt('after:heading_advanced'); pick(0);
  T('quiz beat opens the QUIZ screen with 3 power questions', phase==='p2cquiz'&&!!career._quiz&&career._quiz.qs.length===3&&career._quiz.qs.every(x=>x.topic==='power'));
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
  freshAt('after:heading_advanced'); pick(0); answerQuiz(false);
  T('FLUNK the power quiz → chem volatile, no weapon bonus', career.flags.chem==='volatile'&&career.bonuses.weapon===0);
  texts.length=0; drawCareerBeat();
  T('pit-lane (volatile) copy warns of the FLAMETHROWER', texts.some(t=>/FLAMETHROWER|LiPo/i.test(t)));
  pick(0);
  T('VOLATILE chemistry → rival brings the FLAMETHROWER, player has no heat shield', m2.bbLoadout[1].weapon==='flame'&&m2.bbLoadout[0].armor!=='heatshield');
  T('the rival BOT actually fields the flamethrower', (()=>{const c=bb2.bots.find(b=>b.side===1);return !!c&&!!c.ld&&c.ld.weapon==='flame';})());

  // ───────────────────────── DIFFICULTY: rematches + CPU tier + question scaling (Sam) ─────────────────────────
  const cy=400, navClick=(rect)=>p2NavClick(rect.x+5,rect.y+5,cy,()=>{});
  // rematch budget per difficulty
  career=careerNew();career.diff='rookie';careerGoto('stage:tank_hook');
  T('ROOKIE: a fresh fight grants unlimited rematches (99)', phase==='p2tank'&&career._rematchLeft===99);
  career=careerNew();career.diff='champion';careerGoto('stage:tank_hook');
  T('CHAMPION: zero rematches', career._rematchLeft===0);
  // PRO rematch flow: lose, run it back, decrementing — then the budget runs out and the loss becomes canon
  career=careerNew();career.diff='pro';careerGoto('stage:tank_hook');
  T('PRO: a fresh fight grants 3 rematches', career._rematchLeft===3);
  const loseRematch=()=>{tf2.result=1;navClick(careerNavRects(true,cy).re);};
  loseRematch(); T('rematch 1 → 2 left, SAME stage relaunched, not advanced', career._rematchLeft===2&&phase==='p2tank'&&!!tf2&&tf2.result===null&&career.node!=='after:tank_hook');
  loseRematch(); loseRematch(); T('after 3 rematches → 0 left, still on the stage', career._rematchLeft===0&&phase==='p2tank');
  tf2.result=1; navClick(careerNavRects(false,cy).go);
  T('budget spent → TAKE-THE-L advances (loss becomes canon)', career.node==='after:tank_hook'&&(career.flags.lastResult==='lost'||career.flags.lastResult==='blown_out'));
  // champion: a loss advances immediately (no rematch button)
  career=careerNew();career.diff='champion';careerGoto('stage:tank_hook');tf2.result=1;navClick(careerNavRects(false,cy).go);
  T('CHAMPION loss advances immediately (no rematch)', career.node==='after:tank_hook');
  // difficulty offsets the CPU tier
  career=careerNew();career.skill=1.0;
  career.diff='champion'; T('champion tier offset +1', careerTier()===2);
  career.diff='rookie';   T('rookie tier offset -1', careerTier()===0);
  career.diff='pro';      T('pro tier no offset', careerTier()===1);
  // questions scale with difficulty (grade-banded via level tags)
  career=careerNew();career.diff='rookie';
  T('ROOKIE quiz: 3 questions, all CORE (4th–5th-grade level, no algebra)', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===3&&q.every(x=>x.level==='core');})());
  career.diff='champion';
  T('CHAMPION quiz: 4 questions incl. ≥2 harder (algebra/headline)', (()=>{const q=careerQuizPick('power',careerQuizPlan());return q.length===4&&q.filter(x=>x.level==='algebra'||x.level==='headline').length>=2;})());
  career.diff='pro';
  T('PRO quiz: 3 questions', careerQuizPick('power',careerQuizPlan()).length===3);

  // ───────────────────────── FULL CURRICULUM WALK (win every match, ace every quiz) ─────────────────────────
  freshAt('intro'); let guard=0;
  while(career.node!=='after:capstone_rumble'&&guard++<160){
    if(phase==='p2cbeat')pick(0);
    else if(phase==='p2cquiz'){const Q=career._quiz,q=Q.qs[Q.i];if(Q.picked==null){const R=careerQuizOptRects(q.opts.length);careerQuizClick(R[q.ans].x+5,R[q.ans].y+5);}else careerQuizClick(careerQuizContRect().x+5,careerQuizContRect().y+5);}
    else { liveResult(0); careerMatchEnd(0); } // a match is live → win it
  }
  T('full walk reaches the finale', career.node==="after:capstone_rumble"&&guard<160);
  T('full walk taught C1..C6', ['C1','C2','C3','C4','C5','C6'].every(c=>career.taught.includes(c)));
  T('full walk cleared all 7 stages', ['tank_hook','arcade_course','strafe_intro','field_centric','holo_shooter','heading_advanced','capstone_rumble'].every(s=>career.cleared.includes(s)));
  T('full walk raised skill above the start', career.skill>0.5);
  // finale Finish → hub
  pick(0); T('finale Finish → hub', phase==='p2career');

  // splash CAREER tile → hub
  applyLayout('legacy'); phase='splash';
  const SR=splashRects(); click(SR.career.x+10,SR.career.y+10);
  T('splash CAREER tile → p2career', phase==='p2career');

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
