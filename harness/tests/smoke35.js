const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // ── 2P race fully functional WITHOUT ghosts ──
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2.mode='race';m2.set.course=0;m2.set.haz=true;m2.set.bestOf=1;
  p2SeriesStart();startP2Race();updateP2Race(3.1);
  console.log('2P race starts clean: r2 has no ghost fields='+(r2.rec===undefined&&r2.ghosts===undefined));
  for(let i=0;i<30;i++)updateP2Race(1/60);
  r2.bots[0].x=330;r2.bots[0].y=OC_FINISH_Y-2;updateP2Race(1/60);
  console.log('2P race finishes: result='+r2.result+' no frcds_ghost writes='+(Object.keys(LS).filter(k=>k.startsWith('frcds_ghost')).length===0));
  drawP2Race(); // result screen draws without ghost buttons
  texts.length=0;drawP2Race();
  console.log('no ghost UI on result: '+(texts.join('|').indexOf('EXPORT')===-1&&texts.join('|').indexOf('IMPORT')===-1));
  p2NavClick(0,0,FY+FH/2+34,startP2Race); // miss-click path safe
  p2QuitMatch(false);p2Exit();
  // ── SP toggle ──
  console.log('default toggle: spGhostOn='+spGhostOn);
  startDrive(1);phase='playing';
  for(let i=0;i<40;i++)update(1/60);
  for(const b of balls)b.sc=true;update(1/60);
  console.log('SP PB saved while ON: '+(('frcds_spghost:arcade') in LS));
  cancelNameEntry();startDrive(1);phase='playing';update(1/60);playT=0.4;
  ops.length=0;drawSpGhost();
  console.log('ghost shows when ON: '+(ops.length>0));
  spGhostToggle();
  console.log('toggle persists: spGhostOn='+spGhostOn+' stored='+LS['frcds_spgon']);
  ops.length=0;drawSpGhost();
  console.log('ghost hidden when OFF: '+(ops.length===0));
  // recording + saving continue while OFF
  for(let i=0;i<200;i++)update(1/60);
  const sBefore=JSON.parse(LS['frcds_spghost:arcade']).t;
  for(const b of balls)b.sc=true;update(1/60); // slower run: no overwrite either way
  console.log('recording continued while OFF: samples='+(spRec.length>50));
  // faster run while OFF still saves PB ghost
  cancelNameEntry();startDrive(1);phase='playing';
  for(let i=0;i<10;i++)update(1/60);
  for(const b of balls)b.sc=true;update(1/60);
  const sAfter=JSON.parse(LS['frcds_spghost:arcade']).t;
  console.log('PB ghost saved while OFF: '+(sAfter<sBefore)+' ('+sBefore.toFixed(2)+'→'+sAfter.toFixed(2)+')');
  spGhostToggle();
  ops.length=0;playT=0.05;drawSpGhost();
  console.log('re-enable shows immediately: '+(ops.length>0)+' spGhostOn='+spGhostOn);
  // persistence across reload: simulate by reading stored flag
  console.log('persist key round-trip: '+(LS['frcds_spgon']==='1'));
  // G key + HUD click toggle (name entry must be closed first — it rightly captures keys)
  window._kd({key:'g',preventDefault:()=>{}});
  console.log('G swallowed by name entry (correct): '+(spGhostOn===true)+' nameEntry active='+nameEntry.active);
  cancelNameEntry();
  window._kd({key:'g',preventDefault:()=>{}});
  console.log('G key toggles after entry closed: '+(spGhostOn===false));
  click(342,22);
  console.log('HUD click toggles back: '+(spGhostOn===true));
  // tank fight: toggle hidden + inert
  cancelNameEntry();phase='menu';tankFight=true;startTankFight(0);
  texts.length=0;draw();
  console.log('tank HUD hides toggle: '+(texts.join('|').indexOf('👻')===-1));
  tankFight=false;console.log('done');
})();
`;
global.ctxState={depth:0};global.texts=[];global.ops=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},translate:()=>{ops.push('t');},fillText:(t)=>{texts.push(String(t));},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:400,height:720,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:400,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
