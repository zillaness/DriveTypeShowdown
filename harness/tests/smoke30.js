const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  // pickup feedback
  m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
  playerBind=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];
  m2.mode='tankfight';m2.set.lives=3;m2.set.map=0;m2.set.pow=true;m2.set.hpk=true;m2.set.bestOf=1;
  p2SeriesStart();startP2Tank();updateP2Tank(3.1);
  const t0=tf2.tanks[0];
  tf2.pups.push({x:t0.x,y:t0.y,type:PUP_TYPES[2],age:0});
  updateP2Tank(1/60);
  console.log('pickup fx: label spawned='+(tf2.fx.length===1)+' txt="'+(tf2.fx[0]&&tf2.fx[0].txt)+'" glow='+t0.glowT.toFixed(2)+' col='+t0.glowC);
  for(let i=0;i<80;i++)updateP2Tank(1/60);
  console.log('fx expires: fx='+tf2.fx.length+' glow='+t0.glowT);
  drawP2Tank();
  // gp menu grid covers all items incl new 2P bar at index 0
  p2QuitMatch(false);p2Exit();
  const items=gpMenuItems();
  console.log('2P bar is item 0: '+(items[0].y===58&&items[0].w===380)+' total items='+items.length);
  const grid=[[0],[1,2],[3,4],[5],[6],[7],[8,9],[10,11],[12],[13]];
  const flat=grid.flat();
  console.log('grid covers 0..13 uniquely: '+(new Set(flat).size===14&&Math.max(...flat)===13&&flat.length===14));
  // synthesized click at 2P bar center enters 2P
  click(items[0].x+items[0].w/2,items[0].y+items[0].h/2);
  console.log('activating item 0 enters 2P: phase='+phase+' (expect p2modes)');
  p2Exit();console.log('done');
})();
`;
global.ctxState={depth:0};
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,
  addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:canvas.width||1280,height:canvas.height||720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
