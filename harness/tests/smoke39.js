const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);

  // seed two stored ghosts directly (key form matches spGhostKey output)
  LS['frcds_spghost:arcade']=JSON.stringify({k:'arcade',t:12.5,samples:[[0,10,10,0],[0.033,11,12,0.1]]});
  LS['frcds_spghost:tank']=JSON.stringify({k:'tank',t:9.0,samples:[[0,5,5,0]]});

  // ── ghostList enumerates + sorts by time ──
  let gl=ghostList();
  ok('ghostList finds both ghosts',gl.length===2);
  ok('ghostList sorts by time (tank first)',gl[0].key==='tank'&&gl[1].key==='arcade');
  ok('ghostList not imported by default',!gl[0].imported&&!gl[1].imported);

  // ── ghostKeyLabel readable ──
  const lab=ghostKeyLabel('arcade');
  ok('label resolves a drive name',typeof lab.name==='string'&&lab.name.length>0&&lab.name!=='arcade');
  ok('label tags NORMAL with no modifiers',lab.tags==='NORMAL');
  const lab2=ghostKeyLabel('arcade_oc');
  ok('label picks up OC modifier tag',lab2.tags.indexOf('🏁')>=0);

  // ── ghostsToJSON bundles, clean (no imported flag) ──
  const blob=ghostsToJSON();
  const parsed=JSON.parse(blob);
  ok('export bundles both ghosts',parsed.ghosts&&Object.keys(parsed.ghosts).length===2);
  ok('export is kind-tagged',parsed.kind==='frcds-ghosts'&&parsed.v===1);
  ok('export keeps samples',Array.isArray(parsed.ghosts.arcade.samples)&&parsed.ghosts.arcade.samples.length===2);
  ok('export does not carry imported flag',parsed.ghosts.arcade.imported===undefined);

  // ── ghostsFromJSON merges + tags imported + invalidates active cache ──
  _spgK='arcade';_spgG={k:'arcade'}; // pretend a ghost is active
  // a fresh bundle representing a different machine's run on arcade (slower) + a new course
  const incoming=JSON.stringify({v:1,kind:'frcds-ghosts',ghosts:{
    arcade:{t:20.0,samples:[[0,1,1,0]]},
    holo_swerve:{t:30.0,samples:[[0,2,2,0]]}
  }});
  const n=ghostsFromJSON(incoming);
  ok('import reports count',n===2);
  ok('import tags imported:true',JSON.parse(LS['frcds_spghost:arcade']).imported===true);
  ok('import overwrites even if slower (race-to-beat)',JSON.parse(LS['frcds_spghost:arcade']).t===20.0);
  ok('import adds a new ghost key',('frcds_spghost:holo_swerve') in LS);
  ok('import invalidates active ghost cache',_spgK===null&&_spgG===null);

  // ── imported ghost becomes the active racing ghost on reload ──
  curD=DRIVES.findIndex(d=>d.id==='arcade');holoMode=false;steerMode=false;obstacleCourse=false;
  inverted=false;cpuBot=0;shooterMode=false;tankFight=false;
  const active=spGhostGet();
  ok('active ghost loads the imported one',active&&active.imported===true&&active.t===20.0);

  // ── malformed import throws (drives the ✗ message path) ──
  let threw=false;try{ghostsFromJSON('{not valid json');}catch(e){threw=true;}
  ok('malformed JSON rejected',threw);
  let threw2=false;try{ghostsFromJSON(JSON.stringify({ghosts:{bad:{t:'nope'}}}));}catch(e){threw2=true;}
  ok('no-valid-ghosts rejected',threw2);

  // ── navigation: high-scores → GHOSTS submenu → back ──
  applyLayout('legacy');phase='highscores';hsClearConfirm=false;
  click(CW/2,CH-28); // GHOSTS button
  ok('GHOSTS button opens submenu',phase==='ghosts');
  click(33,22); // BACK
  ok('BACK returns to high scores',phase==='highscores');
  // Esc/back key from ghosts
  phase='ghosts';window._kd({key:'Escape',preventDefault(){},stopPropagation(){}});
  ok('Esc from ghosts returns to high scores',phase==='highscores');

  // ── export/import glue does not throw ──
  ok('exportGhosts glue no-throw',(()=>{try{exportGhosts();return true;}catch(e){return false;}})());
  ok('importGhosts glue no-throw',(()=>{try{importGhosts();return true;}catch(e){return false;}})());

  // ── drawGhosts renders without throwing, empty and populated ──
  phase='ghosts';
  ok('drawGhosts no-throw (populated)',(()=>{try{drawGhosts();return true;}catch(e){return false;}})());
  for(const k of Object.keys(LS))if(k.indexOf('frcds_spghost:')===0)delete LS[k];
  ok('drawGhosts no-throw (empty)',(()=>{try{drawGhosts();return true;}catch(e){return false;}})());

  // ── GHOSTS entry coexists with CLEAR ALL purge (still wipes ghosts) ──
  LS['frcds_spghost:arcade']=JSON.stringify({k:'arcade',t:5,samples:[]});
  phase='highscores';hsClearConfirm=false;click(CW-45,22);click(CW-45,22);
  ok('CLEAR ALL still purges ghosts',!(('frcds_spghost:arcade') in LS));

  console.log('done');
})();

`;
global.ctxState={depth:0};global.texts=[];global.ops=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},setTransform:()=>{},translate:()=>{},fillText:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},fill:()=>{},fillRect:()=>{},arc:()=>{},rect:()=>{},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:400,height:720,_dpr:1,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:400,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:400,innerHeight:720,devicePixelRatio:1,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.location={protocol:'file:'};
global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
Object.defineProperty(global.localStorage,'length',{get:()=>Object.keys(LS).length,configurable:true});
global.localStorage.key=i=>Object.keys(LS)[i];
global.localStorage=new Proxy(global.localStorage,{ownKeys:()=>Object.keys(LS),getOwnPropertyDescriptor:(t,k)=>(k in LS?{enumerable:true,configurable:true,value:LS[k]}:Object.getOwnPropertyDescriptor(t,k))});
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:t=>({style:{},addEventListener:()=>{},setAttribute:()=>{},remove:()=>{},focus:()=>{},click:()=>{},value:''}),head:{appendChild:()=>{}},body:{appendChild:()=>{}}};
global.requestAnimationFrame=()=>{};
function mkPad(i){return{connected:false,index:i,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],vibrationActuator:{playEffect:()=>({catch:()=>{}})}};}
global.PADS=[mkPad(0),mkPad(1)];
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
