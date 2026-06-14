const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;function burn(n){for(let i=0;i<n;i++)performance.now();}
(function(){
  // ── A: pad 2 navigates while pad 1 is idle ──
  applyLayout('land2p');phase='p2modes';tour=null;
  PADS[0].connected=true;PADS[1].connected=true;
  press(1,13);updateGamepad();releaseAll();updateGamepad();
  console.log('pad2 dpad moves cursor: idx='+p2GpIdx+' (expect 1)');
  press(1,12);updateGamepad();releaseAll();updateGamepad();
  press(1,0);updateGamepad();releaseAll();updateGamepad();
  console.log('pad2 A activates: phase='+phase+' (expect p2drive)');
  press(0,1);updateGamepad();releaseAll();updateGamepad();
  console.log('pad1 B still backs out: phase='+phase+' (expect p2modes)');
  // simultaneous edges on both pads = one step each frame, no crash
  press(0,13);press(1,13);updateGamepad();releaseAll();updateGamepad();
  console.log('both-pad edge same frame: idx='+p2GpIdx+' (expect 1, merged single step)');
  // pad2 START launches from claim
  m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.bestOf=1;m2.set.contact='full';
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  phase='p2claim';m2.claim=[{type:'gp',gp:0},{type:'gp',gp:1}];m2._gpPrev=[];m2.sens=[1,1];
  playerBind=[{type:'gp',gp:0},{type:'gp',gp:1}];
  press(1,9);updateGamepad();releaseAll();updateGamepad();
  console.log('pad2 START launches: phase='+phase+' (expect p2ball)');
  // ── rumble: first contact taps both pads, sustained contact stays silent ──
  updateP2Ball(3.1);rumbles.length=0;
  const a=b2.bots[0],c=b2.bots[1];
  a._inp={vx:200,vy:0};c._inp={vx:-200,vy:0};
  a.x=600;a.y=300;c.x=600+RR*2+8;c.y=300; // apart
  updateP2Ball(1/60);
  console.log('apart: rumbles='+rumbles.length+' (expect 0)');
  c.x=600+RR*2-1; // first contact
  updateP2Ball(1/60);
  console.log('first contact: rumbles='+rumbles.length+' (expect 2, one per pad) padIdx='+rumbles.map(r=>r.pad).join(','));
  console.log('magnitudes light: weak='+rumbles[0].fx.weakMagnitude.toFixed(2)+' strong='+rumbles[0].fx.strongMagnitude.toFixed(2)+' dur='+rumbles[0].fx.duration+' capped='+(rumbles.every(r=>r.fx.weakMagnitude<=0.6&&r.fx.strongMagnitude<=0.3)));
  for(let i=0;i<30;i++){a.x=600;c.x=600+RR*2-1;updateP2Ball(1/60);} // grind for 0.5s
  console.log('sustained contact silent: rumbles still='+rumbles.length);
  // separate then re-collide after cooldown → fires again
  c.x=600+RR*2+30;updateP2Ball(1/60);
  burn(30); // mock clock only ticks on now() calls; push past the 150ms cooldown
  c.x=600+RR*2-1;updateP2Ball(1/60);
  console.log('re-contact after separation: rumbles='+rumbles.length+' (expect 4)');
  // CPU contact rumbles the player only
  p2QuitMatch(false);m2.set.cpus=1;phase='p2claim';
  press(0,9);updateGamepad();releaseAll();updateGamepad();
  updateP2Ball(3.1);rumbles.length=0;burn(30);
  const cu=b2.cpus[0],pa=b2.bots[0];
  pa._inp={vx:300,vy:0};pa.x=cu.x-RR*2+1;pa.y=cu.y;
  updateP2Ball(1/60);
  console.log('player-CPU contact: rumbles='+rumbles.length+' pad='+(rumbles[0]&&rumbles[0].pad)+' (expect 1 on pad 0)');
  // keyboard-bound player gets no rumble (no pad to buzz)
  p2QuitMatch(false);m2.set.cpus=0;playerBind=[{type:'kb'},{type:'gp',gp:1}];
  m2.claim=[{type:'kb'},{type:'gp',gp:1}];phase='p2claim';
  press(1,9);updateGamepad();releaseAll();updateGamepad();
  updateP2Ball(3.1);rumbles.length=0;burn(30);
  const a2=b2.bots[0],c2=b2.bots[1];
  a2._inp={vx:200,vy:0};c2._inp={vx:-200,vy:0};
  a2.x=600;a2.y=300;c2.x=600+RR*2+8;c2.y=300;updateP2Ball(1/60);
  c2.x=600+RR*2-1;updateP2Ball(1/60);
  console.log('kb player skipped: rumbles='+rumbles.length+' pad='+(rumbles[0]&&rumbles[0].pad)+' (expect 1, pad 1 only)');
  p2QuitMatch(false);p2Exit();console.log('done');
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
