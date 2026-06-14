const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);
  const reset=()=>{achUnlocked={};achProg={drives:[],tiers:[]};achToast=null;};

  ok('ACH_DEFS has 13 entries',ACH_DEFS.length===13);
  ok('exactly 4 secret achievements',ACH_DEFS.filter(a=>a.secret).length===4);
  ok('every def has id/name/desc',ACH_DEFS.every(a=>a.id&&a.name&&a.desc));

  reset();
  const r1=achUnlock('firstwin');
  ok('unlock returns true first time + records it',r1===true&&!!achUnlocked['firstwin']);
  const r2=achUnlock('firstwin');
  ok('unlock is idempotent (false second time)',r2===false);
  ok('unknown id rejected',achUnlock('not_a_real_id')===false&&!achUnlocked['not_a_real_id']);

  reset();
  achDrive('tank');achDrive('arcade');achDrive('botSwerve');achDrive('mecanum');
  ok('4 distinct drives: alldrives NOT yet unlocked',!achUnlocked['alldrives']&&achProg.drives.length===4);
  achDrive('tank'); // dup does not advance
  ok('duplicate drive does not advance count',achProg.drives.length===4);
  achDrive('carSteer');
  ok('5th distinct drive unlocks alldrives',!!achUnlocked['alldrives']&&achProg.drives.length===5);

  reset();
  achBeatTier(0);achBeatTier(1);achBeatTier(2);achBeatTier(3);
  ok('4 tiers: alltiers NOT yet unlocked',!achUnlocked['alltiers']);
  achBeatTier(3); // dup
  achBeatTier(4);
  ok('all 5 tiers unlocks alltiers',!!achUnlocked['alltiers']&&achProg.tiers.length===5);
  reset();
  achBeatTier('notanumber');
  ok('non-numeric tier ignored',achProg.tiers.length===0);
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
function mkPad(i){return{connected:false,index:i,mapping:'standard',
  buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],
  vibrationActuator:{playEffect:(type,fx)=>{rumbles.push({pad:i,type,fx});return{catch:()=>{}};}}};}
global.PADS=[mkPad(0),mkPad(1)];
global.press=(p,i)=>{PADS[p].buttons[i].pressed=true;};
global.releaseAll=()=>{for(const pd of PADS)for(const b of pd.buttons)b.pressed=false;};
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
