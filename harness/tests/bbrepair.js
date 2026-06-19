// bbrepair.js — REPAIR TORCH 3v3 assessment: does a healer earn a team slot?
// Team A = [fighter, fighter, REPAIR] vs Team B = [fighter, fighter, fighter]. If A wins ~50%+, the
// repair's heal is worth giving up a 3rd attacker; if it loses badly, the healing is too weak.
// Run: ./extract.sh && node harness/tests/bbrepair.js /tmp/g.js
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  function seedRng(s){let sd=s>>>0;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
  function mkBot(weapon,side,bind,y){const ld=bbResolveLoadout({weapon:weapon,armor:'balanced',perk:'none'});const sp=tf2SpawnSide(side,y);
    return{x:sp.x,y:sp.y,h:sp.h,_sx:sp.x,_sy:sp.y,_sh:sp.h,side:side,col:'#fff',mob:ld.mobMax,hp:BB.HP,mhp:BB.HP,inv:1.0,dead:false,dmgDealt:0,boostT:0,boostCd:0,
      ctl:{bind:bind,type:'cpu',tier:3,name:'CPU',brain:{inp:{vx:0,vy:0,vr:0},fire:false}},ld:ld,spin:0,pistCd:0,pinT:0,burn:0,outT:0,heat:{},firing:false,
      wheels:[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false})),_inp:{vx:0,vy:0,vr:0},_vis:null};}
  function runMatch(teamA,teamB,seed,aSide){ // teamA/B = arrays of 3 weapon ids
    seedRng(seed);applyLayout('tank2p');m2.mode='battlebots';m2.set.map=0;m2.set.bbmode='ko';const mp=TF2_MAPS[0];tfObs=[];
    m2.drive=[];playerBind=[];for(let i=0;i<6;i++){m2.drive.push({kind:'main',idx:1,name:'A',c:'#0ff'});playerBind.push({type:'cpu'});}
    const bSide=1-aSide,ys=tf2SpawnYs(3),bots=[];
    for(let k=0;k<3;k++)bots.push(mkBot(teamA[k],aSide,k,ys[k]));
    for(let k=0;k<3;k++)bots.push(mkBot(teamB[k],bSide,3+k,ys[k]));
    bb2={t:0,cd:0,result:null,repd:false,map:mp,fx:[],blasts:[],deb:[],bots:bots,minis:bbMiniSpawn()};
    const MAXF=80*60;let f=0;while(bb2.result===null&&f<MAXF){updateBB(1/60);f++;}
    let res=bb2.result;if(res===null){const hp=[0,0];for(const b of bb2.bots)if(!b.dead)hp[b.side]+=b.hp;res=(hp[0]===hp[1])?'draw':(hp[0]>hp[1]?0:1);}
    return (res==='draw')?'draw':(res===aSide?'A':'B');
  }
  function run1v1(wa,wb,seed,aSide){ // single wa vs single wb
    seedRng(seed);applyLayout('tank2p');m2.mode='battlebots';m2.set.map=0;m2.set.bbmode='ko';const mp=TF2_MAPS[0];tfObs=[];
    m2.drive=[];playerBind=[];for(let i=0;i<6;i++){m2.drive.push({kind:'main',idx:1,name:'A',c:'#0ff'});playerBind.push({type:'cpu'});}
    const bSide=1-aSide,ys=tf2SpawnYs(1),bots=[mkBot(wa,aSide,0,ys[0]),mkBot(wb,bSide,1,ys[0])];
    bb2={t:0,cd:0,result:null,repd:false,map:mp,fx:[],blasts:[],deb:[],bots:bots,minis:bbMiniSpawn()};
    const MAXF=80*60;let f=0;while(bb2.result===null&&f<MAXF){updateBB(1/60);f++;}
    let res=bb2.result;if(res===null){const hp=[0,0];for(const b of bb2.bots)if(!b.dead)hp[b.side]+=b.hp;res=(hp[0]===hp[1])?'draw':(hp[0]>hp[1]?0:1);}
    return (res==='draw')?'draw':(res===aSide?'A':'B');
  }
  const FIGHTERS=['spinner','buzzsaw','piston','flame','wedge','drill'],N=16,pad=(s,n)=>{s=String(s);return s+' '.repeat(Math.max(0,n-s.length));};
  console.log('REPAIR TORCH 3v3 — [W, W, REPAIR] vs [W, W, W], '+N+' matches each (50% = repair earns its slot vs a 3rd fighter):');
  let sumW=0,sumG=0;
  for(const W of FIGHTERS){let w=0,g=0;
    for(let i=0;i<N;i++){const seed=(0x4E0A+W.charCodeAt(0)*131+i*2654435761)>>>0;const r=runMatch([W,W,'repair'],[W,W,W],seed,i%2);w+=(r==='A')?1:(r==='draw'?0.5:0);g++;}
    sumW+=w;sumG+=g;console.log('  '+pad(W,9)+'repair-team win% '+(100*w/g).toFixed(1)+'%');}
  console.log('  '+pad('OVERALL',9)+(100*sumW/sumG).toFixed(1)+'%');
  // ── 1v1: a lone REPAIR vs each fighter (should LOSE most — life-steal is weak self-sustain, not offense) ──
  console.log('\\nREPAIR 1v1 vs each fighter, '+N+' matches each (low% = repair loses 1v1s, as intended):');
  let ls1=0,lg1=0;
  for(const W of FIGHTERS){let w=0,g=0;
    for(let i=0;i<N;i++){const seed=(0x1F0B+W.charCodeAt(0)*197+i*40503)>>>0;const r=run1v1('repair',W,seed,i%2);w+=(r==='A')?1:(r==='draw'?0.5:0);g++;}
    ls1+=w;lg1+=g;console.log('  '+pad(W,9)+'repair win% '+(100*w/g).toFixed(1)+'%');}
  console.log('  '+pad('OVERALL',9)+(100*ls1/lg1).toFixed(1)+'%  (target: well under 20% — you lose 80%+ of 1v1s)');
  // ── heal rate (ACTIVE = trigger HELD on a hurt ally) ──
  const A=mkBot('repair',0,0,FH/2);A.x=300;A.y=300;A.h=0;A.firing=true;
  const ally=mkBot('none',0,1,FH/2);ally.x=300+RR*1.6;ally.y=300;ally.hp=200;ally.mob=20;ally.wheels[0].dead=true;ally.wheels[0].hp=0;
  bb2={t:0,cd:0,result:null,map:TF2_MAPS[0],bots:[A,ally],blasts:[],fx:[],deb:[],minis:[]};
  const h0=ally.hp,m0=ally.mob;for(let i=0;i<60;i++){A.firing=true;bbWeaponFire(1/60);}
  console.log('\\nheal rate (1s, trigger held on a hurt ally): HP '+h0+'→'+ally.hp.toFixed(0)+' (+'+(ally.hp-h0).toFixed(0)+'/s)  ·  mob '+m0+'→'+ally.mob.toFixed(0)+'  ·  wheel re-welded: '+(!ally.wheels[0].dead));
  // ── life-steal rate (trigger held with NO ally to heal) ──
  const D=mkBot('repair',0,0,FH/2);D.x=300;D.y=300;D.h=0;D.firing=true;D.hp=300;
  const en=mkBot('none',1,1,FH/2);en.x=300+RR*3;en.y=300;en.hp=BB.HP;
  bb2={t:0,cd:0,result:null,map:TF2_MAPS[0],bots:[D,en],blasts:[],fx:[],deb:[],minis:[]};
  const eh=en.hp,dh=D.hp;for(let i=0;i<60;i++){D.firing=true;bbWeaponFire(1/60);}
  console.log('life-steal (1s, no ally, draining an enemy): enemy '+eh+'→'+en.hp.toFixed(0)+' (-'+(eh-en.hp).toFixed(0)+'/s)  ·  self-heal +'+(D.hp-dh).toFixed(0)+'/s');
  console.log('tunables: repairHps='+BB_W.repairHps+'  buffMult=×'+BB_W.repairDmgBuff+'  lifeDps='+BB_W.repairLifeDps+'  lifeHeal='+BB_W.repairLifeHeal+'  reachK='+BB_W.repairReachK+'  (a bot has '+BB.HP+' HP)');
})();
`;
function mkCtx(){const noop=()=>{};const ctx={save(){},restore(){},setTransform:()=>{},fillText:()=>{},createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,_dpr:1,addEventListener:()=>{},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
global.window={addEventListener:()=>{},innerWidth:1280,innerHeight:720,devicePixelRatio:1,open:()=>{}};
global.performance={now:(()=>{let t=0;return ()=>(t+=16);})()};
global.location={protocol:'file:'};
global.LS={};global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({style:{},addEventListener:()=>{},setAttribute:()=>{},remove:()=>{},focus:()=>{},click:()=>{},value:''}),head:{appendChild:()=>{}},body:{appendChild:()=>{}}};
global.requestAnimationFrame=()=>{};
function mkPad(i){return{connected:false,index:i,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],vibrationActuator:{playEffect:()=>({catch:()=>{}})}};}
global.PADS=[mkPad(0),mkPad(1)];
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
