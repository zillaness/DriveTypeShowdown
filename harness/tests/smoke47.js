// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  const startShooter=()=>{
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='shooter';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'H',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'C',c:'#0ff'};m2.claim=[{type:'kb'},{type:'cpu',tier:3}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);
  };
  let _s=909;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};

  // STUCK: pin the bot in a corner; after ~2.5s the unstick should fire and steer to center
  startShooter();let bo=b2.bots[1],br=cpuH2H[1];
  let fired=false,dirOK=false,firedFrame=-1;
  for(let f=0;f<240;f++){bo.x=RR+6;bo.y=RR+6;updateP2Ball(1/60);
    if(br.escapeT>0&&!fired){fired=true;firedFrame=f;dirOK=(br.inp.vx>0&&br.inp.vy>0);}}
  ok('shooter unstick: escape triggers after being pinned (~'+(firedFrame/60).toFixed(1)+'s)',fired&&firedFrame>=140&&firedFrame<=175);
  ok('shooter unstick: escape steers toward open field center',dirOK);

  // NOT STUCK: a freely-playing shooter CPU never false-triggers the escape
  startShooter();br=cpuH2H[1];let everEscape=false;
  for(let f=0;f<360;f++){updateP2Ball(1/60);if(br.escapeT>0)everEscape=true;}
  ok('shooter unstick: a freely-moving bot never false-triggers',!everEscape);

  // normal mode is cycle-driven and unaffected by the shooter unstick fields
  applyLayout('land2p');phase='p2claim';m2.mode='normal';m2.claim=[{type:'kb'},{type:'cpu',tier:3}];m2._gpPrev=[];
  const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);
  for(let f=0;f<120;f++)updateP2Ball(1/60);
  ok('normal mode unaffected: cycle still running, no escape state',cpuH2H[1].cyc&&!(cpuH2H[1].escapeT>0));

  console.log('--- smoke47: '+P+' pass, '+F+' fail ---');
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
