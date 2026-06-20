// smoke83 — CAREER / STORY MODE, Phase ① (shell + HUB + CYOA beat screen)
// Exercises: careerNew shape, store/load round-trip, hub→intro, beat render,
// choice routing (+ stub-stage advance), when-gated choices, coach `then`
// chaining, a full curriculum walk to the finale, and the splash CAREER tile.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(l,c)=>console.log((c?'ok — ':'FAIL — ')+l);
  let P=0,F=0; const T=(l,c)=>{ (c?P++:F++); ok(l,c); };

  // 1) careerNew shape
  const n=careerNew();
  T('careerNew: node=intro, skill=0.5, empty arrays, ver=1',
    n.node==='intro'&&n.skill===0.5&&n.taught.length===0&&n.cleared.length===0&&n.ver===1);

  // 2) store/load round-trip via the mock localStorage
  career=careerNew(); career.skill=2.3; career.taught.push('C1'); careerStore();
  const back=JSON.parse(localStorage.getItem('frcds_career_v1'));
  T('careerStore round-trips through localStorage', !!back&&back.skill===2.3&&back.taught[0]==='C1');
  T('careerMigrate fills a sparse save', (()=>{const m=careerMigrate({skill:1.1,node:'after:tank_hook'});return m.skill===1.1&&m.node==='after:tank_hook'&&Array.isArray(m.cleared)&&m.ver===1;})());

  // 3) hub: careerEnter then START → p2cbeat at intro
  careerSave=null; career=null; careerEnter();
  T('careerEnter → p2career hub (land2p)', phase==='p2career');
  let B=careerHubBtns(); careerHubClick(B.go.x+10,B.go.y+10);
  T('hub START → p2cbeat at intro', phase==='p2cbeat'&&!!career&&career.node==='intro');

  // 4) a beat renders without throwing + emits text
  texts.length=0; let drew=true; try{drawCareerBeat();}catch(e){drew=false;console.log('  draw err:',e.message);}
  T('intro beat renders (no throw, emits text)', drew&&texts.length>0);
  let drewHub=true; try{drawCareerHub();}catch(e){drewHub=false;console.log('  hub err:',e.message);}
  T('hub renders (no throw)', drewHub);

  // 5) choosing choice 0 → stage:tank_hook (Phase① stub) → after:tank_hook; records the choice
  let items=careerBeatButtons(careerBeat('intro')), R=careerBeatRects(items.length);
  careerBeatClick(R[0].x+5,R[0].y+5);
  T('intro choice0 → tank cleared + lands on after:tank_hook + choice recorded',
    career.cleared.includes('tank_hook')&&career.node==='after:tank_hook'&&career.choices['intro']===0);

  // 6) when-gated detour choice: hidden unless lastResult==='dominated'
  career.flags.lastResult='won';
  T('detour hidden when not dominated (2 of 3 choices)', careerVisibleChoices(careerBeat('after:tank_hook')).length===2);
  career.flags.lastResult='dominated';
  T('detour appears when dominated (3 choices)', careerVisibleChoices(careerBeat('after:tank_hook')).length===3);

  // 7) coach via 'then': intro choice1 → coach:C1 (marks taught) → continue → stub stage
  career=careerNew(); career.node='intro'; phase='p2cbeat';
  items=careerBeatButtons(careerBeat('intro')); R=careerBeatRects(items.length);
  careerBeatClick(R[1].x+5,R[1].y+5);
  T('intro choice1 → coach:C1 shown + C1 marked taught', career.node==='coach:C1'&&career.taught.includes('C1'));
  items=careerBeatButtons(careerBeat('coach:C1')); R=careerBeatRects(items.length);
  T('coach card shows a single continue button', items.length===1&&items[0].cont===true);
  careerBeatClick(R[0].x+5,R[0].y+5);
  T('coach continue follows _then → tank stub → after:tank_hook',
    career.cleared.includes('tank_hook')&&career.node==='after:tank_hook');

  // 8) full curriculum walk (always pick choice 0) reaches the finale
  career=careerNew(); career.node='intro'; phase='p2cbeat'; let guard=0;
  while(career.node!=='after:capstone_rumble'&&guard++<80){
    const b=careerBeat(career.node), its=careerBeatButtons(b), rs=careerBeatRects(its.length);
    careerBeatClick(rs[0].x+5,rs[0].y+5);
  }
  T('full walk reaches the finale beat', career.node==='after:capstone_rumble'&&guard<80);
  T('full walk taught C1..C6', ['C1','C2','C3','C4','C5','C6'].every(c=>career.taught.includes(c)));
  T('full walk cleared all 7 stages',
    ['tank_hook','arcade_course','strafe_intro','field_centric','holo_shooter','heading_advanced','capstone_rumble'].every(s=>career.cleared.includes(s)));

  // 9) finale Finish → back to the hub
  {const fb=careerBeat('after:capstone_rumble'), fi=careerBeatButtons(fb), fr=careerBeatRects(fi.length);
   T('finale shows a Finish choice', fi.length===1);
   careerBeatClick(fr[0].x+5,fr[0].y+5);
   T('finale Finish → hub', phase==='p2career');}

  // 10) ESC routing: beat → hub → splash
  phase='p2cbeat'; p2Back(); T('ESC from beat → hub', phase==='p2career');
  p2Back(); T('ESC from hub → splash', phase==='splash');

  // 11) splash CAREER tile routes to the hub
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
