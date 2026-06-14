const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  applyLayout('land2p');
  // label fits: bold 15px Courier ≈ 9px/char
  const tb=p2TourBtnRect(),label='🏆 TOURNAMENT · 4–16 PLAYERS';
  console.log('bar fits: '+(label.length*9<tb.w-20)+' ('+(label.length*9)+'px label in '+tb.w+'px bar)');
  // click via shared rect enters registration
  phase='p2modes';tour=null;
  p2Click(tb.x+tb.w/2,tb.y+tb.h/2);
  console.log('bar click: phase='+phase+' (expect p2tnames)');
  // registration draw: placeholder + ENTER tag + counter + keyboard hint when empty
  texts.length=0;drawTourNames();
  const tx=texts.join('|');
  console.log('empty-state affordances: placeholder='+(tx.indexOf('type a team name')!==-1)+' enterTag='+(tx.indexOf('ENTER adds')!==-1)+' counter='+(tx.indexOf('0 of 4')!==-1)+' kbHint='+(tx.indexOf('keyboard is needed')!==-1));
  // typing shows caret-bearing buffer, placeholder gone
  window._kd({key:'R',preventDefault:()=>{}});window._kd({key:'a',preventDefault:()=>{}});
  texts.length=0;drawTourNames();
  const tx2=texts.join('|');
  console.log('typing state: buf shown='+(tx2.indexOf('Ra')!==-1)+' placeholder gone='+(tx2.indexOf('type a team name')===-1));
  window._kd({key:'Enter',preventDefault:()=>{}});
  texts.length=0;drawTourNames();
  console.log('committed: counter now='+(texts.join('|').indexOf('1 of 4')!==-1)+' chip drawn='+(texts.join('|').indexOf('1. Ra')!==-1));
  // chips clear the input box: first chip y > box bottom
  const r0=tourNameRect(0);
  console.log('chips below box: '+(r0.y>142+46));
  // gp nav still reaches the bar through the shared rect
  const items=(phase='p2modes',p2GpItems());
  console.log('gp item uses shared rect: '+(items[4].x===tb.x&&items[4].w===tb.w));
  console.log('done');
})();
`;
global.ctxState={depth:0};global.texts=[];
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},fillText:(t)=>{texts.push(String(t));},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};
const NAV={getGamepads:()=>[]};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
