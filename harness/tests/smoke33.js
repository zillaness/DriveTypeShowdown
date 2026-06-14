const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // default is double: fresh tour from the modes-screen click path
  applyLayout('land2p');phase='p2modes';tour=null;
  const tb=p2TourBtnRect();p2Click(tb.x+tb.w/2,tb.y+tb.h/2);
  console.log('default format: '+(tour.format)+' (expect double)');
  // option row 4 toggles format
  p2Click(tourOptRect(3).x+10,tourOptRect(3).y+10);
  console.log('toggle: '+tour.format+' (expect single)');
  // SINGLE N=8: 4+2=6 bracket matches, zero L matches, Bo3 final, champion
  tour={names:['A','B','C','D','E','F','G','H'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'race',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('single N=8: matches='+tour.M.length+' (expect 6) L-matches='+tour.M.filter(m=>m.br==='L').length+' (expect 0)');
  let g=0,pl=0;
  while(tour.champ===null&&g++<30){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(pl++%4===0?1:0);}
  console.log('single completes: champ='+(tour.champ!==null)+' played='+pl+' gf games='+tour.gf.n+' (final is Bo3: gf>=2)');
  // single-elim property: a loser NEVER plays again (appears in no later match)
  const losses={};let ok=true,order=0;
  for(const m of tour.M){if(m.l>=0){if(losses[m.l]!==undefined)ok=false;losses[m.l]=order;}order++;}
  console.log('one loss = out (bracket): '+ok+' distinct losers='+Object.keys(losses).length+' (expect 6: all but the two finalists)');
  // SINGLE with byes N=5 → P=8, 3 byes; completes
  tour={names:['A','B','C','D','E'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();g=0;pl=0;
  while(tour.champ===null&&g++<30){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(0);}
  console.log('single N=5 byes: champ='+(tour.champ!==null)+' played='+pl);
  // SINGLE N=4: semis only (2 matches) + Bo3 final
  tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',format:'single',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('single N=4: matches='+tour.M.length+' (expect 2)');
  g=0;while(tour.champ===null&&g++<10){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(0);}
  console.log('single N=4 champion: '+(tour.champ!==null));
  // DOUBLE regression untouched: N=8 → 13 matches, second life holds
  tour={names:['A','B','C','D','E','F','G','H'],drv:[],policy:'open',seedMode:'rand',format:'double',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('double N=8 regression: matches='+tour.M.length+' (expect 13)');
  g=0;while(tour.champ===null&&g++<40){const m=tourNext();if(!m)break;tour.cur=m;tour.curE=tourEntrants(m);tourMatchEnd(g%3===0?1:0);}
  const lostWB=new Set(tour.M.filter(m=>m.br==='W'&&m.l>=0).map(m=>m.l));
  const wonLB=new Set(tour.M.filter(m=>m.br==='L'&&m.w>=0).map(m=>m.w));
  console.log('double second life still holds: '+([...lostWB].some(e=>wonLB.has(e)))+' champ='+(tour.champ!==null));
  // legacy tour objects without format default to double (||'double' guard)
  tour={names:['A','B','C','D'],drv:[],policy:'open',seedMode:'rand',mode:'normal',buf:'',seeds:[],M:[],qi:0};
  tourBuild();
  console.log('format-less tour builds double: L-matches='+(tour.M.filter(m=>m.br==='L').length>0));
  // bracket draw runs in both formats
  tour.format='single';tourBuild();drawTourBracket();
  tour.format='double';tourBuild();drawTourBracket();
  console.log('both bracket views draw ok');
  tour=null;console.log('done');
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
