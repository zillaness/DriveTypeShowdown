// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  function run(seed,tier){
    let _s=seed>>>0;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
    applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'H',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'C',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);
    const br=cpuH2H[1],G=cpuBallGoals(1);let trans=0,last=br.cyc,ownGapMin=1e9;
    for(let f=0;f<5400&&b2.result===null;f++){updateP2Ball(1/60);
      if(br.cyc!==last){trans++;last=br.cyc;}
      ownGapMin=Math.min(ownGapMin,Math.abs(b2.bots[1].x-G.ox));}
    return {champ:b2.score[1],opp:b2.score[0],trans,ownGapMin};
  }
  // HARD: zero own goals, at every tier (cpus=0 -> opponent only scores via CHAMPION own goals)
  let allClean=true;
  for(let t=0;t<CPU_TIERS.length;t++){const r=run(3000+t*101,t);if(r.opp!==0)allClean=false;}
  ok('own goals are zero at every tier (hard guarantee)',allClean);

  // CHAMPION scoring bar: average over seeds >= 30 / 90s
  let cs=0;const N=3;for(let k=0;k<N;k++)cs+=run(5000+k*733,3).champ;
  ok('CHAMPION averages >= 30 goals/90s (got '+(cs/N).toFixed(1)+')',cs/N>=30);

  // tier ordering: CHAMPION clearly out-scores ROOKIE
  let champ=0,rook=0;for(let k=0;k<N;k++){champ+=run(6000+k*733,3).champ;rook+=run(6000+k*733,0).champ;}
  ok('CHAMPION out-scores ROOKIE (C='+(champ/N).toFixed(0)+' vs R='+(rook/N).toFixed(0)+')',champ/N>=rook/N*1.4);

  // own-gap safety: the cycle keeps the bot away from its own gap
  const rg=run(7777,3);
  ok('CHAMPION never parks at its own gap (mindx='+rg.ownGapMin.toFixed(0)+')',rg.ownGapMin>60);

  // no objective thrash: cycle state changes stay infrequent over a 90s match
  ok('no objective thrash (cyc transitions='+rg.trans+' over 90s)',rg.trans<150);

  console.log('--- smoke46: '+P+' pass, '+F+' fail ---');
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
