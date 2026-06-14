const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  applyLayout('land2p');phase='p2settings';tour=null;m2.mode='normal';m2._dp=0;m2.claim=[null,null];
  const rows=p2SettingsRows();
  const bi=rows.findIndex(r=>r.k==='ballN');
  ok('settings has a ballN option row',bi>=0);
  // gamepad-style cycle: ◀▶ advance/retreat the value with wraparound
  m2.set.ballN='auto';
  p2CycleSet(bi,1); ok('cycle +1 advances ballN auto -> '+m2.set.ballN,m2.set.ballN===rows[bi].vals[1]);
  p2CycleSet(bi,-1);ok('cycle -1 returns to auto ('+m2.set.ballN+')',m2.set.ballN==='auto');
  p2CycleSet(bi,-1);ok('cycle -1 from first wraps to last ('+m2.set.ballN+')',m2.set.ballN===rows[bi].vals[rows[bi].vals.length-1]);
  // dropdown: click the row opens the list of all choices
  setDropdown=null;m2.set.ballN='auto';
  const rc=p2SetRowRect(bi);
  p2Click(rc.x+rc.w/2,rc.y+rc.h/2);
  ok('clicking a row opens its dropdown (setDropdown='+setDropdown+')',setDropdown===bi);
  const dr=p2SetDropRects();
  ok('dropdown lists every choice ('+dr.length+'=='+rows[bi].vals.length+')',dr.length===rows[bi].vals.length);
  // pick a specific choice (8) from the dropdown
  const pick=dr.find(it=>it.val===8);
  p2Click(pick.x+pick.w/2,pick.y+pick.h/2);
  ok('picking a dropdown choice sets the value (ballN='+m2.set.ballN+')',m2.set.ballN===8);
  ok('picking closes the dropdown',setDropdown===null);
  // reopen, then a click outside the list closes it without changing the value
  p2Click(rc.x+rc.w/2,rc.y+rc.h/2); ok('reopened',setDropdown===bi);
  p2Click(CW-20,60);
  ok('click outside closes the dropdown',setDropdown===null);
  ok('outside click did not change the value',m2.set.ballN===8);
  // v5.1.9: ALLIANCE CPU AI button opens the shared CPU-settings screen and returns to 2P settings
  setDropdown=null;phase='p2settings';m2.mode='normal';cpuSettingsReturn=null;
  ok('ALLIANCE CPU AI button shows in ball modes',p2ShowCpuCfg());
  const cb=p2CpuCfgBtnRect();p2Click(cb.x+cb.w/2,cb.y+cb.h/2);
  ok('clicking it opens the CPU-settings screen',phase==='cpuSettings'&&cpuSettingsReturn==='p2settings');
  handleCpuSettingsClick(4+28,8+14); // the Back button
  ok('Back from there returns to 2P MATCH SETTINGS',phase==='p2settings'&&cpuSettingsReturn===null);
  m2.mode='race';ok('button is hidden in non-ball modes',!p2ShowCpuCfg());
  console.log('--- settings-options: '+P+' pass, '+F+' fail ---');
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
