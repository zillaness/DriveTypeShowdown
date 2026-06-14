const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  function setup(){
    arcadeMode=true;bouncyMode=false;
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'B',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:0}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);
    balls.forEach(b=>{b.sc=true;b.held=false;b.heldBy=null;});
  }
  // BOOST: kb player (p0) presses boost -> boostT engages and it lunges forward
  setup();let a=b2.bots[0],c=b2.bots[1];
  a.x=300;a.y=FH/2;a.h=0;c.x=900;c.y=60; // c far away
  kbBoostHeld=true; const x0=a.x; updateP2Ball(1/60); kbBoostHeld=false;
  ok('boost engages on RT/Shift (boostT>0)',a.boostT>0);
  const moved=a.x-x0; for(let f=0;f<12;f++)updateP2Ball(1/60);
  ok('boost lunges the bot forward ('+moved.toFixed(1)+'px in 1 frame)',moved>4);
  ok('boost goes on cooldown',a.boostCd>0);

  // TACKLE: boost into the opponent -> opponent stunned + knocked back + load scattered
  setup();a=b2.bots[0];c=b2.bots[1];
  a.x=400;a.y=FH/2;a.h=0; c.x=400+RR*2+2;c.y=FH/2;c.h=Math.PI; // c right in front of a
  c.load=[balls[0],balls[1]];balls[0].held=balls[1].held=true;balls[0].heldBy=balls[1].heldBy=c; // c carries 2
  const cx0=c.x; kbBoostHeld=true; for(let f=0;f<6;f++){updateP2Ball(1/60);} kbBoostHeld=false;
  ok('tackle stuns the victim (stunT>0)',c.stunT>0);
  ok('tackle knocks the victim back ('+(c.x-cx0).toFixed(1)+'px)',c.x-cx0>10);
  ok('tackle scatters the victim load (2->'+c.load.length+')',c.load.length===0);
  // stunned victim cannot move
  c.x=500;c.y=300;const sx=c.x; c._inp=null; for(let f=0;f<6;f++)updateP2Ball(1/60);
  ok('stunned victim is frozen',Math.abs(c.x-sx)<2);
  // stun wears off
  for(let f=0;f<140;f++)updateP2Ball(1/60);
  ok('stun wears off after ~2s',(c.stunT||0)===0);

  // CPU never rams (ramming is human-only)
  setup();a=b2.bots[0];c=b2.bots[1]; // p1 is the CPU
  a.x=420;a.y=FH/2;a.h=0;c.x=420+RR*2+4;c.y=FH/2;c.h=Math.PI; // human + CPU facing each other, point blank
  kbBoostHeld=false; let cpuBoosted=false;
  for(let f=0;f<60;f++){updateP2Ball(1/60);if((c.boostT||0)>0||(c.boostCd||0)>0)cpuBoosted=true;}
  ok('CPU never rams (human-only)',!cpuBoosted);

  // arcadeMode OFF -> no boost
  arcadeMode=false;setup();arcadeMode=false;a=b2.bots[0];a.boostT=0;a.boostCd=0;
  kbBoostHeld=true;updateP2Ball(1/60);kbBoostHeld=false;
  ok('no boost when arcade mode is off',!(a.boostT>0));

  console.log('--- arcade: '+P+' pass, '+F+' fail ---');
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
