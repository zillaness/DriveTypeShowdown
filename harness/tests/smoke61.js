const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  const sv=expFeatures;

  // ── 1. the b2Shooter() / p2BallMode() funnel (v6.3.0 BALL-MERGE) ──
  m2.mode='shooter';ok('b2Shooter true in SHOOTER',b2Shooter()===true);
  m2.mode='normal';ok('b2Shooter false in NORMAL',b2Shooter()===false);
  m2.mode='tankfight';ok('b2Shooter false in TANK FIGHT',b2Shooter()===false);
  ok('p2BallMode accepts normal + shooter + ball, rejects combat/race',p2BallMode('normal')&&p2BallMode('shooter')&&p2BallMode('ball')&&!p2BallMode('battlebots')&&!p2BallMode('race'));
  m2.mode='shooter';ok('p2BallMode with no arg reads m2.mode',p2BallMode()===true);
  m2.mode='battlebots';ok('p2BallMode no-arg false outside ball',p2BallMode()===false);

  // ── 2. GATE OFF → byte-identical classic 5 tiles + no BALL TYPE row ──
  expFeatures=false;
  ok('gate OFF: m2Modes is the classic list',m2Modes()===M2_MODES&&m2Modes().length===5&&m2Modes()[0].id==='normal'&&m2Modes()[1].id==='shooter');
  m2.mode='normal';
  ok('gate OFF: ball settings has NO ballFmt row (row order untouched)',p2SettingsRows().every(r=>r.k!=='ballFmt')&&p2SettingsRows()[0].k==='tfmt');
  ok('ballFmt default exists and is push',M2_SET_DEFAULTS.ballFmt==='push');

  // ── 3. GATE ON → merged BALL tile list ──
  expFeatures=true;
  ok('gate ON: BALL merges to one tile, first (BALLOON BATTLE added as the gated 6th)',m2Modes()[0].id==='ball'&&m2Modes()[1].id==='tankfight'&&m2Modes()[2].id==='battlebots'&&m2Modes()[3].id==='race'&&!m2Modes().some(m=>m.id==='shooter'));

  // ── 4. clicking the BALL tile resolves to a legacy mode via BALL TYPE ──
  applyLayout('land2p');phase='p2modes';tour=null;m2.set.ballFmt='push';
  {const r=p2ModeRect(0);p2Click(r.x+r.w/2,r.y+r.h/2);}
  ok('BALL tile with ballFmt push routes to NORMAL + settings',m2.mode==='normal'&&phase==='p2settings');
  phase='p2modes';m2.set.ballFmt='shooter';
  {const r=p2ModeRect(0);p2Click(r.x+r.w/2,r.y+r.h/2);}
  ok('BALL tile with ballFmt shooter routes to SHOOTER',m2.mode==='shooter'&&phase==='p2settings');

  // ── 5. the BALL TYPE cycler row syncs m2.mode ──
  m2.mode='normal';m2.set.ballFmt='push';phase='p2settings';
  {const bi=p2SettingsRows().findIndex(r=>r.k==='ballFmt');
   ok('gate ON: BALL TYPE is the first ball settings row',bi===0);
   p2CycleSet(bi,1);
   ok('cycling BALL TYPE to shooter syncs m2.mode',m2.set.ballFmt==='shooter'&&m2.mode==='shooter');
   p2CycleSet(bi,1);
   ok('cycling BALL TYPE back to push syncs m2.mode',m2.set.ballFmt==='push'&&m2.mode==='normal');
   const last=p2SetRowRect(p2SettingsRows().length-1);
   ok('the extra row does not push the last row under START',last.y+last.h<CH-90);}

  // ── 6. dropdown apply path also syncs ──
  m2.mode='normal';m2.set.ballFmt='push';phase='p2settings';
  {const bi=p2SettingsRows().findIndex(r=>r.k==='ballFmt');setDropdown=bi;
   const drops=p2SetDropRects();const sh=drops.find(d=>d.val==='shooter');
   if(sh)p2Click(sh.x+sh.w/2,sh.y+sh.h/2);
   ok('dropdown pick of SHOOTER syncs m2.mode',m2.set.ballFmt==='shooter'&&m2.mode==='shooter');}

  // ── 7. END-TO-END: the merged path yields a real SHOOTER match ──
  {const setBase=(mode)=>{applyLayout('ball2p');phase='p2claim';tour=null;m2.mode=mode;m2.set.ballFmt=(mode==='shooter')?'shooter':'push';
     m2.set.tfmt='multi';m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.cpus=0;m2.set.ballN='auto';
     m2.tseats=[null,null,null,null,null,null];m2.tsel=0;m2.name=[null,null,null,null,null,null];m2._gpPrev=[];};
   setBase('shooter');for(let i=0;i<6;i++)tankGridSetCpu(i);startP2Ball();
   ok('merged shooter match started (b2 live, shooter engine active)',!!b2&&b2Shooter()===true&&b2.bots.length===6);
   let threw=false;try{updateP2Ball(3.1);for(let i=0;i<1800;i++)updateP2Ball(1/60);}catch(e){threw=true;console.log('   update error:',e.message);}
   ok('merged shooter match runs 30s without throwing',!threw);
   ok('scores stay finite',b2.score.every(s=>isFinite(s)));}

  // ── 8. DRAW no-throw (mock canvas is a no-op → the branch must actually RUN) ──
  {const setBase2=(mode)=>{applyLayout('ball2p');phase='p2claim';tour=null;m2.mode=mode;m2.set.ballFmt=(mode==='shooter')?'shooter':'push';
     m2.set.tfmt='multi';m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.cpus=0;m2.set.ballN='auto';
     m2.tseats=[null,null,null,null,null,null];m2.tsel=0;m2.name=[null,null,null,null,null,null];m2._gpPrev=[];};
   let threw=false;try{
     expFeatures=true;phase='p2modes';m2.mode='normal';p2Draw();               // 4-tile picker
     phase='p2settings';p2Draw();                                              // settings with the extra row
     setBase2('shooter');for(let i=0;i<6;i++)tankGridSetCpu(i);startP2Ball();b2.cd=2;drawP2Ball(); // shooter countdown text branch
     setBase2('normal');for(let i=0;i<6;i++)tankGridSetCpu(i);startP2Ball();b2.cd=2;drawP2Ball();   // normal countdown text branch
   }catch(e){threw=true;console.log('   draw error:',e.message,e.stack&&e.stack.split('\\n')[1]);}
   ok('p2Draw + drawP2Ball render both formats without throwing',!threw);}

  // ── 9. RECORDS preservation: the h2h display tag still writes the legacy mode ──
  {expFeatures=false;cheatsAllOff();h2hRec={};
   m2.mode='shooter';m2.claim=[{type:'kb'},{type:'cpu',tier:1}];m2.drive=[{name:'swerve'},{name:'swerve'}];
   b2={score:[3,0],t:42,result:0,realGoals:[3,0],sudden:false,bots:[]};
   achH2HResult(0);
   ok('gate OFF: h2h record preserves mode tag shooter',!!h2hRec[1]&&h2hRec[1].mode==='shooter');}

  // ── 10. reset restores the classic tiles ──
  cheatsAllOff();
  ok('cheatsAllOff clears the gate → 5 classic tiles',expFeatures===false&&m2Modes().length===5);

  expFeatures=sv;
  console.log('--- ball-merge: '+P+' pass, '+F+' fail ---');
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
