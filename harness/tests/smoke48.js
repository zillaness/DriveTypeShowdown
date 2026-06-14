const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  let _s=4242;Math.random=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
  const startN=(tier,cpus)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='normal';m2.set.cpus=cpus||0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';
    m2.drive[0]={kind:'main',idx:1,name:'H',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'C',c:'#0ff'};m2.claim=[{type:'kb'},{type:'cpu',tier:tier}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);};

  // 1) CYCLE UNSTICK: pin the CPU main bot ~3s -> it jukes away from the opponent toward open space
  startN(3);let bo=b2.bots[1],br=cpuH2H[1];
  let fired=false,firedF=-1,awayOK=false;
  for(let f=0;f<260;f++){bo.x=300;bo.y=FH/2;b2.bots[0].x=260;b2.bots[0].y=FH/2;b2.bots[0]._inp={vx:0,vy:0,vr:0}; // opponent pinning from the -x side
    updateP2Ball(1/60);
    if(br.escapeT2>0&&!fired){fired=true;firedF=f;awayOK=br._ctx>300;}} // escape target should head +x, away from the -x opponent and toward center
  ok('cycle unstick: pinned CPU breaks free after ~3s (~'+(firedF/60).toFixed(1)+'s)',fired&&firedF>=170&&firedF<=200);
  ok('cycle unstick: escape steers away from the pinning opponent toward open space',awayOK);

  // 2) PIN PENALTY only between main bots — an alliance bot in the cluster voids it
  const pinRun=(withAlly)=>{applyLayout('land2p');phase='p2claim';m2.mode='normal';m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.contact='pin';
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#f44'};m2.drive[1]={kind:'main',idx:1,name:'B',c:'#0ff'};m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);while(b2.cd>0)updateP2Ball(1/60);
    b2.toast=null;let maxPin=0,penalty=false;
    for(let f=0;f<260;f++){
      b2.bots[0].x=120;b2.bots[0].y=300;b2.bots[1].x=120;b2.bots[1].y=330; // both near the left wall, touching
      if(withAlly)b2.cpus=[{al:0,x:120,y:300,h:0,role:'guard',roleT:9}]; else b2.cpus=[];
      updateP2Ball(1/60);
      maxPin=Math.max(maxPin,b2.pinT[0],b2.pinT[1]);
      if(b2.toast&&/PIN PENALTY/.test(b2.toast.txt))penalty=true;}
    return {maxPin,penalty};};
  const noAlly=pinRun(false), ally=pinRun(true);
  ok('pin penalty: a clean main-vs-main wall pin still triggers',noAlly.penalty===true);
  ok('pin penalty: an alliance bot in the cluster voids it (maxPin='+ally.maxPin.toFixed(2)+')',ally.penalty===false&&ally.maxPin<1);

  // 3) END COUNTDOWN: the final five seconds beep 5-4-3-2-1
  startN(3);b2.t=84.4;b2._endCount=undefined;const seq=[];
  for(let f=0;f<420&&b2.result===null;f++){updateP2Ball(1/30);
    if(b2._endCount&&seq[seq.length-1]!==b2._endCount)seq.push(b2._endCount);}
  const hitAll=[5,4,3,2,1].every(n=>seq.includes(n));
  ok('end countdown: beeps fire at 5,4,3,2,1 (seq='+seq.join(',')+')',hitAll&&seq[0]===5);

  console.log('--- smoke48: '+P+' pass, '+F+' fail ---');
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
