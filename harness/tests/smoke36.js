// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const T=(id,x,y)=>({identifier:id,clientX:x,clientY:y});
  const ts=t=>canvas._touchstart({preventDefault:()=>{},changedTouches:[t]});
  const tm=t=>canvas._touchmove({preventDefault:()=>{},changedTouches:[t]});
  const te=t=>canvas._touchend({preventDefault:()=>{},changedTouches:[t]});
  // ── DPI canvas ──
  window.devicePixelRatio=2;applyLayout('land2p');
  console.log('dpi backing: C.width='+canvas.width+' (expect 2560) css='+canvas.style.width+' dpr='+canvas._dpr);
  window.devicePixelRatio=3;fitCanvas();
  console.log('dpr capped at 2: '+(canvas._dpr===2));
  draw(); // setTransform path runs
  console.log('frame transform applied: '+(lastTransform.join(',')==='2,0,0,2,0,0'));
  // ── PWA manifest injected ──
  const man=head.filter(e=>e.rel==='manifest')[0];
  console.log('manifest link: '+(man&&man.href.indexOf('data:application/manifest+json')===0));
  console.log('sw not registered on file://: '+(swRegistered===false));
  // ── fire buttons at outer corners ──
  const f0=p2FireRect(0),f1=p2FireRect(1);
  console.log('fire corners: left x='+f0.x+' (expect 20) right edge='+(f1.x+f1.w)+' (expect '+(CW-20)+')');
  // ── full touch-only tournament: registration → bracket → grand final ──
  // pin the window to logical 1:1 so harness taps in canvas coords map straight through
  window.innerWidth=1280;window.innerHeight=720;window.devicePixelRatio=1;fitCanvas();
  phase='p2modes';tour=null;
  const tb=p2TourBtnRect();
  ts(T(1,tb.x+10,tb.y+10));te(T(1,tb.x+10,tb.y+10));
  console.log('touch enters tournament: '+phase);
  // tap the name box → native input opens
  const ib=tourInputRect();
  ts(T(2,ib.x+10,ib.y+10));te(T(2,ib.x+10,ib.y+10));
  console.log('input overlay opened: '+(tourInputEl!==null)+' fontSize≥16: '+(parseInt((tourInputEl.style.cssText.match(/font-size:(\\d+)/)||[])[1])>=16));
  // type 4 names through the native input (Enter commits, stays open)
  for(const n of ['Ava','Ben','Cy','Dee']){
    tourInputEl.value=n;
    tourInputEl._fire('keydown',{key:'Enter',stopPropagation:()=>{},preventDefault:()=>{}});
  }
  console.log('4 names via native input: '+tour.names.join(',')+' input still open='+(tourInputEl!==null));
  // keystrokes do NOT leak to the game handler
  let leaked=false;const realKd=window._kd;window._kd=e=>{leaked=true;realKd(e);};
  tourInputEl._fire('keydown',{key:'x',stopPropagation:()=>{},preventDefault:()=>{}});
  window._kd=realKd;
  console.log('stopPropagation wired (handler present): '+(typeof tourInputEl._handlers.keydown==='function'));
  // start bracket by touch → input closes
  ts(T(3,CW/2,CH-92+21));te(T(3,CW/2,CH-92+21));
  console.log('bracket started by touch: phase='+phase+' input closed='+(tourInputEl===null));
  // play the whole bracket by touch: PLAY MATCH → claim both touch → match → tap CONTINUE
  m2.set.format='timed';m2.set.timeSec=60;m2.set.cpus=0;m2.set.contact='full';
  let guard=0;
  while(tour.champ===null&&guard++<30){
    ts(T(4,CW/2,CH-86+20));te(T(4,CW/2,CH-86+20)); // PLAY MATCH
    if(phase==='p2drive'){ // open policy: pick drives by touch
      const d=p2DriveList()[1],r=p2DriveRect(d);
      ts(T(5,r.x+5,r.y+5));te(T(5,r.x+5,r.y+5));
      ts(T(5,r.x+5,r.y+5));te(T(5,r.x+5,r.y+5));
    }
    if(phase!=='p2claim')break;
    ts(T(6,200,250));te(T(6,200,250));ts(T(7,1000,250));te(T(7,1000,250)); // claim touch L+R
    const sb=p2StartBtnRect();ts(T(8,sb.x+10,sb.y+10));te(T(8,sb.x+10,sb.y+10)); // start
    if(phase!=='p2ball')break;
    b2.cd=0;b2.result=0;b2.repd=true; // decide the match
    ts(T(9,CW/2,FY+FH/2+34+20));te(T(9,CW/2,FY+FH/2+34+20)); // CONTINUE BRACKET
  }
  console.log('touch-only tournament: champ='+(tour.champ!==null?tour.names[tour.champ]:'NONE')+' (zero kb/mouse/pad)');
  p2Exit();
  // ── 2-stick strip ──
  phase='p2claim';m2.claim=[{type:'touchL'},{type:'touchR'}];m2.tstrip=[false,false];
  m2.drive[0]={kind:'main',idx:0,name:'Tank',c:'#0f0'};m2.drive[1]={kind:'main',idx:0,name:'Tank',c:'#0f0'};
  applyLayout('land2p');
  // toggle strip for red via its claim-card button
  click(CW/4,432);
  console.log('strip toggle: red='+m2.tstrip[0]+' blue='+m2.tstrip[1]);
  playerBind=[{type:'touchL'},{type:'touchR'}];m2.sens=[1,1];m2.mode='normal';m2.set.cpus=0;p2SeriesStart();
  startP2Ball();updateP2Ball(3.1);
  // red: left stick forward + strip pulled down → right channel differs from left (tank turns)
  ts(T(10,300,400));tm(T(10,300,400-JR)); // left stick full up
  const sr=p2StripRect(0);ts(T(11,sr.x+10,sr.y+sr.h-1)); // strip at bottom = +1
  console.log('strip engaged: v='+p2Strip[0].v.toFixed(2)+' (expect ~1)');
  let iStrip;withBot(0,b2.bots[0],()=>{iStrip=getInp(playerBind[0]);});
  console.log('tank channels differ with strip: vr='+iStrip.vr.toFixed(2)+' (nonzero = turning)');
  te(T(11,sr.x+10,sr.y+sr.h-1));
  console.log('strip release zeroes: v='+p2Strip[0].v);
  // without strip, same stick both channels → no rotation
  m2.tstrip[0]=false;
  let iNo;withBot(0,b2.bots[0],()=>{iNo=getInp(playerBind[0]);});
  console.log('no strip = straight: vr='+iNo.vr.toFixed(2)+' (expect 0)');
  te(T(10,300,400-JR));p2QuitMatch(false);p2Exit();
  console.log('done');
})();
`;
global.ctxState={depth:0};global.texts=[];global.ops=[];global.head=[];global.body=[];global.lastTransform=[];global.swRegistered=false;
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},setTransform:(...a)=>{global.lastTransform=a;},translate:()=>{ops.push('t');},fillText:(t)=>{texts.push(String(t));},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
function mkEl(tag){const el={tag,style:{},_handlers:{},value:'',
  addEventListener:(ev,fn)=>{el._handlers[ev]=fn;},
  _fire:(ev,e)=>{if(el._handlers[ev])el._handlers[ev](e);},
  setAttribute:()=>{},remove:()=>{const i=body.indexOf(el);if(i>=0)body.splice(i,1);},
  focus:()=>{},blur:()=>{if(el._handlers.blur)el._handlers.blur();},click:()=>{}};
  Object.defineProperty(el.style,'cssText',{set(v){el.style._css=v;},get(){return el.style._css||'';}});
  return el;}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,_dpr:1,
  addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:parseFloat(canvas.style.width)||1280,height:parseFloat(canvas.style.height)||720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,devicePixelRatio:1,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.location={protocol:'file:'};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:t=>mkEl(t),
  head:{appendChild:e=>head.push(e)},body:{appendChild:e=>{body.push(e);}}};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[],serviceWorker:{register:()=>{global.swRegistered=true;return{catch:()=>{}};}}};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
