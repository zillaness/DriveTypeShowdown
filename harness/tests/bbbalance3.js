// Copyright (C) 2026 Projects and Mods
// GPL-3.0-or-later WITH Commons Clause (non-commercial) — see LICENSE.
// bbbalance3.js — RoboRumble 3v3 TEAM balance: a side of 3×weaponX vs 3×weaponY, seeded CPU teams,
// sides alternated. Prints a team win-rate matrix + each weapon's overall TEAM win%. Companion to
// bbbalance.js (1v1) — shows how weapons scale to 3v3 (AoE / control / push / support shine here).
// Run: ./extract.sh && node harness/tests/bbbalance3.js /tmp/g.js
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  function seedRng(s){let sd=s>>>0;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
  function mkBot(weapon,armor,perk,side,bind,y){const ld=bbResolveLoadout({weapon:weapon,armor:armor,perk:perk});const sp=tf2SpawnSide(side,y);
    return{x:sp.x,y:sp.y,h:sp.h,_sx:sp.x,_sy:sp.y,_sh:sp.h,side:side,col:'#fff',mob:ld.mobMax,hp:BB.HP,mhp:BB.HP,inv:1.0,dead:false,dmgDealt:0,boostT:0,boostCd:0,
      ctl:{bind:bind,type:'cpu',tier:3,name:'CPU',brain:{inp:{vx:0,vy:0,vr:0},fire:false}},ld:ld,spin:0,pistCd:0,pinT:0,burn:0,outT:0,heat:{},firing:false,
      wheels:[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false})),_inp:{vx:0,vy:0,vr:0},_vis:null};}
  function runMatch(wA,wB,arm,perk,seed,aSide){
    seedRng(seed);applyLayout('tank2p');m2.mode='battlebots';m2.set.map=0;m2.set.bbmode='ko';const mp=TF2_MAPS[0];tfObs=[]; // open arena, KO (last side standing)
    m2.drive=[];playerBind=[];for(let i=0;i<6;i++){m2.drive.push({kind:'main',idx:1,name:'A',c:'#0ff'});playerBind.push({type:'cpu'});}
    const bSide=1-aSide,ys=tf2SpawnYs(3),bots=[];
    for(let k=0;k<3;k++)bots.push(mkBot(wA,arm,perk,aSide,k,ys[k]));
    for(let k=0;k<3;k++)bots.push(mkBot(wB,arm,perk,bSide,3+k,ys[k]));
    bb2={t:0,cd:0,result:null,repd:false,map:mp,fx:[],blasts:[],deb:[],bots:bots,minis:[]};
    bb2.minis=bbMiniSpawn(); // deploys MINIBOT/PIT STOP drones if the perk calls for them
    const MAXF=80*60;let f=0;while(bb2.result===null&&f<MAXF){updateBB(1/60);f++;}
    let res=bb2.result,timedOut=(res===null);
    if(timedOut){const hp=[0,0];for(const b of bb2.bots)if(!b.dead)hp[b.side]+=b.hp;res=(hp[0]===hp[1])?'draw':(hp[0]>hp[1]?0:1);}
    const nan=bb2.bots.some(b=>!isFinite(b.hp));
    return {w:(res==='draw'?'draw':(res===aSide?'A':'B')),timedOut:timedOut,nan:nan};
  }
  const WEAPONS=['spinner','buzzsaw','piston','flame','wedge','flipper','pincer','kamikaze','drill','jet'],ARMOR='balanced',PERK='none',N=10;
  const wins={},games={},matrix={};for(const w of WEAPONS){wins[w]=0;games[w]=0;}
  let total=0,draws=0,tos=0,nanc=0;
  console.log('RoboRumble 3v3 TEAM balance — 3×ROW vs 3×COLUMN, '+N+' matches/matchup, armor='+ARMOR+', perk='+PERK+', KO, OPEN ARENA');
  for(const a of WEAPONS){matrix[a]={};
    for(const b of WEAPONS){let aw=0,bw=0;
      for(let i=0;i<N;i++){const seed=(0x3B37+a.charCodeAt(0)*131+b.charCodeAt(1%b.length)*977+i*2654435761)>>>0;
        const r=runMatch(a,b,ARMOR,PERK,seed,i%2);
        if(r.nan)nanc++; if(r.timedOut)tos++; total++;
        if(r.w==='A')aw++;else if(r.w==='B')bw++;else draws++;}
      matrix[a][b]=aw/N;
      if(a!==b){wins[a]+=aw;games[a]+=N;wins[b]+=bw;games[b]+=N;}}}
  const pad=(s,n)=>{s=String(s);return s+' '.repeat(Math.max(0,n-s.length));};
  console.log('\\nTEAM win% of ROW vs COLUMN:');console.log(pad('A\\\\B',9)+WEAPONS.map(w=>pad(w,9)).join(''));
  for(const a of WEAPONS)console.log(pad(a,9)+WEAPONS.map(b=>pad((matrix[a][b]*100).toFixed(0)+'%',9)).join(''));
  console.log('\\noverall TEAM win% (vs all OTHER weapons):');
  const overall=WEAPONS.map(w=>({w:w,r:games[w]?wins[w]/games[w]:0})).sort((x,y)=>y.r-x.r);
  for(const o of overall)console.log('  '+pad(o.w,9)+(o.r*100).toFixed(1)+'%');
  const hi=overall[0],lo=overall[overall.length-1];
  console.log('\\nmatches: '+total+'  decisive: '+(100*(total-tos-draws)/total).toFixed(0)+'%  timeout: '+(100*tos/total).toFixed(0)+'%  draws: '+(100*draws/total).toFixed(0)+'%');
  console.log('spread: '+hi.w+' '+(hi.r*100).toFixed(0)+'% … '+lo.w+' '+(lo.r*100).toFixed(0)+'%'+(nanc?(' — NaN '+nanc):''));
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
