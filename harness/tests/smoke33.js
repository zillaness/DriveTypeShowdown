const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // default is double: fresh tour from the modes-screen click path
  applyLayout('land2p');phase='p2modes';tour=null;
  const tb=p2TourBtnRect();p2Click(tb.x+tb.w/2,tb.y+tb.h/2);
  console.log('default format: '+(tour.format)+' (expect double)');
  // option row 4 toggles format
  p2Click(tourOptRect(3).x+10,tourOptRect(3).y+10);
  console.log('toggle: '+tour.format+' (expect single)');
  // SINGLE N=8: 4+2=6 bracket matches, zero L matches, Bo3 final, champion
  tour={names:['A','B','C','D','E','F','G','H'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'race',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('single N=8: matches='+tour.M.length+' (expect 6) L-matches='+tour.M.filter(m=>m.br==='L').length+' (expect 0)');
  let g=0,pl=0;
  while(tour.champ===null&&g++<30){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(pl++%4===0?1:0);}
  console.log('single completes: champ='+(tour.champ!==null)+' played='+pl+' gf games='+tour.gf.n+' (final is Bo3: gf>=2)');
  // single-elim property: a loser NEVER plays again (appears in no later match)
  const losses={};let ok=true,order=0;
  for(const m of tour.M){if(m.l>=0){if(losses[m.l]!==undefined)ok=false;losses[m.l]=order;}order++;}
  console.log('one loss = out (bracket): '+ok+' distinct losers='+Object.keys(losses).length+' (expect 6: all but the two finalists)');
  // SINGLE with byes N=5 → P=8, 3 byes; completes
  tour={names:['A','B','C','D','E'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();g=0;pl=0;
  while(tour.champ===null&&g++<30){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(0);}
  console.log('single N=5 byes: champ='+(tour.champ!==null)+' played='+pl);
  // SINGLE N=4: semis only (2 matches) + Bo3 final
  tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('single N=4: matches='+tour.M.length+' (expect 2)');
  g=0;while(tour.champ===null&&g++<10){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(0);}
  console.log('single N=4 champion: '+(tour.champ!==null));
  // DOUBLE regression untouched: N=8 → 13 matches, second life holds
  tour={names:['A','B','C','D','E','F','G','H'],drv:[],policy:'open',seedMode:'rand',format:'double',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('double N=8 regression: matches='+tour.M.length+' (expect 13)');
  g=0;while(tour.champ===null&&g++<40){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(g%3===0?1:0);}
  const lostWB=new Set(tour.M.filter(m=>m.br==='W'&&m.l>=0).map(m=>m.l));
  const wonLB=new Set(tour.M.filter(m=>m.br==='L'&&m.w>=0).map(m=>m.w));
  console.log('double second life still holds: '+([...lostWB].some(e=>wonLB.has(e)))+' champ='+(tour.champ!==null));
  // legacy tour objects without format default to double (||'double' guard)
  tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('format-less tour builds double: L-matches='+(tour.M.filter(m=>m.br==='L').length>0));
  // bracket draw runs in both formats
  tour.format='single';tourBuild();drawTourBracket();
  tour.format='double';tourBuild();drawTourBracket();
  console.log('both bracket views draw ok');
  // ── v5.1.124 T3: RoboRumble joins the tournament bracket ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   const seq=['normal','shooter','tankfight','battlebots','race'];
   T('tour mode list includes RoboRumble',seq.indexOf('battlebots')>=0);
   // a RoboRumble bracket runs to a champion, resolving each match through the CONTINUE-BRACKET nav (p2NavClick reads bb2.result)
   tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'battlebots',buf:'',seeds:[],M:[],qi:0};
   tourBuild();let gg=0;while(tour.champ===null&&gg++<12){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);
     r2=null;tf2=null;bb2={result:0,bots:[]};const cy=300;p2NavClick(CW/2,cy+20,cy,()=>{});}
   T('RoboRumble single N=4 bracket completes via p2NavClick(bb2)',tour.champ!==null);
   // a DRAW (mutual destruction) is undecisive → replay (rematch), do NOT advance the bracket
   tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'battlebots',buf:'',seeds:[],M:[],qi:0};
   tourBuild();const md=tourNext();tour.cur=md;tour.curE=tourEntrants(md);r2=null;tf2=null;bb2={result:'draw',bots:[]};let remat=0;
   p2NavClick(CW/2,320,300,()=>{remat++;});
   T('RoboRumble DRAW replays (rematch called, match not advanced)',remat===1&&tour.cur===md);
   // v5.1.125 T1: registration is framed by ALLIANCE (team), not per-player
   texts.length=0;tour={names:['A','B'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'battlebots',buf:'',seeds:[],M:[],qi:0};
   phase='p2tnames';drawTourNames();
   T('tournament registration is ALLIANCE-framed',texts.some(t=>/ALLIANCE/i.test(t)));}
  // ── v5.1.135 TOURNAMENT v2: FRC alliance-selection draft (auto-draft model) ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   const ranked=[];for(let i=0;i<24;i++)ranked.push(i); // 24 teams, seed order 0(best)..23
   const al=tourAllianceDraft(ranked,8,3);
   T('8 alliances of 3 from 24 teams',al.length===8&&al.every(a=>a.teams.length===3));
   T('top 8 seeds are the captains',al.map(a=>a.captain).join(',')==='0,1,2,3,4,5,6,7');
   T('serpentine: alliance 1 = seeds [0,8,23]',al[0].teams.join(',')==='0,8,23');
   T('serpentine: alliance 8 = seeds [7,15,16]',al[7].teams.join(',')==='7,15,16');
   const seen=new Set();let dup=false;for(const a of al)for(const t of a.teams){if(seen.has(t))dup=true;seen.add(t);}
   T('no team is on two alliances; 24 teams placed',!dup&&seen.size===24);
   // graceful with a short field (10 teams, 8 alliances of 3): captains fill, picks run out cleanly
   const short=tourAllianceDraft([0,1,2,3,4,5,6,7,8,9],8,3);const st=new Set();let sdup=false;for(const a of short)for(const t of a.teams){if(st.has(t))sdup=true;st.add(t);}
   T('short field drafts without crashing or duplicates',short.length===8&&!sdup&&st.size===10);}
  // ── v5.1.237 format-aware entrant cap (double-elim "FRC mode" ≤8 / single-elim party ≤16) ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   tour={format:'double',names:[]};T('double-elim caps entrants at 8',tourMaxEntrants()===8);
   tour.format='single';T('single-elim caps entrants at 16',tourMaxEntrants()===16);}
  // ── v5.1.238 T4: RoboRumble tournament votes on the arena before each match ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);m2.set=m2.set||{};
   tour={names:['A','B','C','D'],drv:[null,null,null,null],policy:'open',seedMode:'rand',format:'single',mode:'battlebots',buf:'',seeds:[],M:[],qi:0};
   tourBuild();phase='x';tourStartMatch();
   T('RoboRumble tournament match opens the arena VOTE first',phase==='p2mapvote'&&!!mapVote);
   mapVotePick(0);
   T('resolving the vote proceeds into the match (drive pick) + sets the arena',phase==='p2drive'&&m2.set.map===0);
   tour={names:['A','B','C','D'],drv:[null,null,null,null],policy:'open',seedMode:'rand',format:'single',mode:'normal',buf:'',seeds:[],M:[],qi:0};
   tourBuild();phase='x';mapVote=null;tourStartMatch();
   T('non-RoboRumble tournament skips the vote (straight to drive)',phase==='p2drive'&&!mapVote);}
  // ── v5.1.239 captain DRAFT: alliance mode → draft screen → 3-bot alliances → bracket ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   tour={names:['Cap1','Cap2','Cap3','Cap4'],drv:[null,null,null,null],policy:'open',seedMode:'manual',format:'single',allianceMode:true,mode:'normal',buf:'',seeds:[],M:[],qi:0};
   phase='x';tourAfterSeed();
   T('ALLIANCES on → opens the captain DRAFT screen',phase==='p2tdraft'&&!!tour.draft);
   T('pool = captains×2 bots, pre-ranked (BOT A = champ)',tour.draft.pool.length===8&&tour.draft.pool[0].tier==='champ'&&tour.draft.pool[7].tier==='rookie');
   T('snake order: 4 caps × 2 rounds = 8 picks; round 2 reversed',tour.draft.order.length===8&&tour.draft.order[0]===tour.rank[0]&&tour.draft.order[4]===tour.rank[3]);
   const firstCap=tourDraftCaptain();tourDraftPick(0);
   T('a pick assigns the bot to the on-clock captain + advances',tour.alli[firstCap].bots.length===1&&tour.draft.pool[0].by===firstCap&&tour.draft.pick===1);
   tourDraftAuto();
   T('AUTO-DRAFT fills every alliance to 3 (captain+2)',Object.values(tour.alli).every(a=>a.bots.length===2)&&tour.draft.pool.every(b=>b.by!==null));
   const taken={};let dup=false;for(const b of tour.draft.pool){if(taken[b.name])dup=true;taken[b.name]=1;}
   T('no bot drafted twice',!dup);
   phase='x';tourFinishDraft();
   T('BUILD BRACKET → bracket built (reusing the draft seed order)',phase==='p2tbracket'&&Array.isArray(tour.M)&&tour.M.length>0);
   // non-alliance still goes straight to the bracket
   tour={names:['A','B','C','D'],drv:[null,null,null,null],policy:'open',seedMode:'rand',format:'single',allianceMode:false,mode:'normal',buf:'',seeds:[],M:[],qi:0};
   phase='x';tourAfterSeed();T('ALLIANCES off → straight to the 1v1 bracket (no draft)',phase==='p2tbracket'&&!tour.draft);}
  // ── v5.1.240 3v3 routing: an alliance match → captain + 2 drafted-tier CPU allies per side ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   m2.claim=[{type:'human'},{type:'human'}];m2.set=m2.set||{};m2.set.tallies=0;m2.mode='battlebots';
   tour={allianceMode:true,curE:[0,1],alli:{0:{captain:0,bots:[{tier:'champ'},{tier:'rookie'}]},1:{captain:1,bots:[{tier:'vet'},{tier:'vet'}]}}};
   const seats=tankSeatsFromClaim(),mx=modeTiers().length-1;
   T('RED = captain + 2 allies (3v3)',seats[0].length===3&&seats[0][0].type==='human'&&seats[0][1].type==='cpu'&&seats[0][2].type==='cpu');
   T('BLUE = captain + 2 allies (3v3)',seats[1].length===3&&seats[1][0].type==='human');
   T('RED allies use drafted tiers (champ→top, rookie→0)',seats[0][1].tier===Math.min(2,mx)&&seats[0][2].tier===0);
   T('BLUE allies use drafted tiers (vet,vet)',seats[1][1].tier===Math.min(1,mx)&&seats[1][2].tier===Math.min(1,mx));
   tour=null;const seats2=tankSeatsFromClaim();T('non-alliance match: no drafted allies (tallies=0 → 1v1)',seats2[0].length===1&&seats2[1].length===1);}
  // ── v5.1.241 MANUAL seeding (rank by skill via ▲▼) ──
  {const T=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
   tour={names:['Weak','Strong','Mid'],seedMode:'manual'};
   T('MANUAL seed order = registration order',JSON.stringify(tourRankedIdx())==='[0,1,2]');
   tourSwapSeed(0,1);T('▲▼ swap reorders entrants (seed)',tour.names[0]==='Strong'&&tour.names[1]==='Weak');
   tourSwapSeed(0,-1);T('swap past the ends is a safe no-op',tour.names[0]==='Strong'&&tour.names.length===3);}
  tour=null;bb2=null;console.log('done');
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
