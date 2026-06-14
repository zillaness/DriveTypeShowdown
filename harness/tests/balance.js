const fs=require('fs');
let src=fs.readFileSync(process.argv[2]||'/tmp/g.js','utf8');
src+=`
;(function(){
  const scenarios=[
    ['2P tank',()=>{m2.mode='tankfight';m2.set.map=0;m2.set.pow=true;m2.set.hpk=true;
      m2.drive[0]={kind:'main',idx:0,name:'T',c:'#0f0'};m2.drive[1]={kind:'holo',idx:0,name:'M',c:'#f80'};
      playerBind=[{type:'kb'},{type:'kb'}];startP2Tank();update(3.2);
      tf2.pups.push({x:600,y:140,type:PUP_TYPES[1],age:0});}],
    ['2P race',()=>{m2.mode='race';startP2Race();update(3.2);}],
    ['2P ball',()=>{m2.mode='normal';startP2Ball();update(3.2);}],
    ['SP tank fight',()=>{p2QuitMatch(false);p2Exit();tankFight=true;startTankFight(0);}],
    ['SP obstacle course',()=>{tankFight=false;obstacleCourse=true;startObstacleCourse(0);}],
    ['SP normal',()=>{obstacleCourse=false;startDrive(0);}],
    ['menu',()=>{phase='menu';applyLayout('legacy');}],
  ];
  let allOk=true;
  for(const[name,setup]of scenarios){
    setup();
    const d0=ctxState.depth;
    for(let f=0;f<5;f++){update(1/60);draw();}
    const ok=ctxState.depth===d0;
    if(!ok)allOk=false;
    console.log((ok?'BALANCED':'LEAK ('+(ctxState.depth-d0)+'/5 frames)')+' — '+name);
  }
  console.log(allOk?'ALL SCENARIOS BALANCED':'BALANCE FAILURES PRESENT');
})();
`;
global.ctxState={depth:0};
function mkCtx(){
  const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});
}
const canvas={getContext:()=>mkCtx(),focus:()=>{},addEventListener:()=>{},style:{},width:0,height:0};
global.window={addEventListener:()=>{},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('FAIL:',e.message);process.exit(1);}
