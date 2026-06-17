// bbreport.js — RoboRumble RELATIVE-STRENGTH report: ARMOR + PERK sweeps (companion to bbbalance.js which does weapons).
// Seeded CPU-vs-CPU 1v1, mirrored loadouts so only the ARMOR (or PERK) differs. Prints overall win% per armor / per perk.
// Run: ./extract.sh && node harness/tests/bbreport.js /tmp/g.js
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  function seedRng(s){let sd=s>>>0;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
  function mkBot(weapon,armor,perk,side,bind){const ld=bbResolveLoadout({weapon:weapon,armor:armor,perk:perk});const sp=tf2SpawnSide(side,FH/2);
    return{x:sp.x,y:sp.y,h:sp.h,side:side,col:'#fff',mob:ld.mobMax,hp:BB.HP,mhp:BB.HP,inv:1.0,dead:false,dmgDealt:0,boostT:0,boostCd:0,
      ctl:{bind:bind,type:'cpu',tier:3,name:'CPU',brain:{inp:{vx:0,vy:0,vr:0},fire:false}},ld:ld,spin:0,pistCd:0,pinT:0,burn:0,outT:0,heat:{},firing:false,
      wheels:[0,1,2,3].map(()=>({hp:BB_W.wheelHp,dead:false})),_inp:{vx:0,vy:0,vr:0},_vis:null};}
  function runMatch(wA,aA,pA,wB,aB,pB,seed,aSide){
    seedRng(seed);applyLayout('tank2p');m2.set.map=0;const mp=TF2_MAPS[0];tfObs=[];
    m2.drive=[{kind:'main',idx:1,name:'A',c:'#0ff'},{kind:'main',idx:1,name:'A',c:'#0ff'}];playerBind=[{type:'cpu'},{type:'cpu'}];
    const bSide=1-aSide;
    bb2={t:0,cd:0,result:null,repd:false,map:mp,fx:[],blasts:[],deb:[],bots:[mkBot(wA,aA,pA,aSide,aSide),mkBot(wB,aB,pB,bSide,bSide)]};
    bb2.minis=bbMiniSpawn(); // so MINIBOT / PIT STOP perks actually deploy their drones
    const MAXF=70*60;let f=0;while(bb2.result===null&&f<MAXF){updateBB(1/60);f++;}
    let res=bb2.result;if(res===null){const hp=[0,0];for(const b of bb2.bots)if(!b.dead)hp[b.side]+=b.hp;res=(hp[0]===hp[1])?'draw':(hp[0]>hp[1]?0:1);}
    return (res==='draw')?'draw':(res===aSide?'A':'B');
  }
  const pad=(s,n)=>{s=String(s);return s+' '.repeat(Math.max(0,n-s.length));};
  const N=24, SAMPLE=['piston','spinner','flame','wedge','drill']; // mirror these weapons so ONLY armor/perk differs; draws counted 0.5 (mirror matches draw often)

  // ── ARMOR sweep: armor X vs armor Y (same weapon both sides), overall win% per armor ──
  const ARMORS=['balanced','hardplate','heatshield','light','runflat','reactive'];
  const aw={},ag={};for(const a of ARMORS){aw[a]=0;ag[a]=0;}
  for(const X of ARMORS)for(const Y of ARMORS){if(X===Y)continue;
    for(let i=0;i<N;i++){const w=SAMPLE[i%SAMPLE.length];const seed=(0x51ED+X.charCodeAt(0)*131+Y.charCodeAt(0)*977+i*2654435761)>>>0;
      const r=runMatch(w,X,'none',w,Y,'none',seed,i%2);aw[X]+=(r==='A')?1:(r==='draw'?0.5:0);aw[Y]+=(r==='B')?1:(r==='draw'?0.5:0);ag[X]++;ag[Y]++;}}
  console.log('ARMOR relative strength — '+N+' mirrored matches/pair, sampled weapons '+SAMPLE.join('/')+' (50% = neutral):');
  const ar=ARMORS.map(a=>({a:a,r:ag[a]?aw[a]/ag[a]:0})).sort((x,y)=>y.r-x.r);
  for(const o of ar)console.log('  '+pad(o.a,11)+(o.r*100).toFixed(1)+'%');

  // ── PERK sweep: a bot WITH perk X vs an identical bot with NO perk (same weapon+balanced armor) ──
  const PERKS=['partinggift','flameproof','minibot','vampire','sparetire','pitstop'];
  console.log('\\nPERK relative strength — perked bot vs identical NO-PERK bot, '+N+' matches × '+SAMPLE.length+' weapons (50% = no effect in 1v1):');
  const pr=[];
  // BASELINE: A-side win% with NO perk on either bot — isolates the sim's bots[0] A/B handicap so a no-effect perk normalizes to ~50%
  let bw=0,bg=0;for(const wp of SAMPLE)for(let i=0;i<N;i++){const seed=(0xBA5E+wp.charCodeAt(0)*977+i*2654435761)>>>0;
    const r=runMatch(wp,'balanced','none',wp,'balanced','none',seed,i%2);bw+=(r==='A')?1:(r==='draw'?0.5:0);bg++;}
  const base=bg?bw/bg:0.5;
  for(const P of PERKS){let w8=0,g=0;
    for(const wp of SAMPLE)for(let i=0;i<N;i++){const seed=(0xC0FF+P.charCodeAt(1)*131+wp.charCodeAt(0)*977+i*2654435761)>>>0;
      const r=runMatch(wp,'balanced',P,wp,'balanced','none',seed,i%2);w8+=(r==='A')?1:(r==='draw'?0.5:0);g++;}
    const raw=g?w8/g:0;pr.push({p:P,raw:raw,r:clamp(0.5+(raw-base),0,1)});} // normalized: 0.5 + (perk − baseline) → ~50% means "no 1v1 effect"
  pr.sort((x,y)=>y.r-x.r);
  console.log('  (no-perk baseline A-side = '+(base*100).toFixed(1)+'% → normalized so 50% = no 1v1 effect)');
  for(const o of pr)console.log('  '+pad(o.p,12)+(o.r*100).toFixed(1)+'%   (raw '+(o.raw*100).toFixed(0)+'%)');
  console.log('\\n(NOTE: 1v1 under-counts 3v3/team perks — PIT STOP/MINIBOT/PARTING GIFT shine most in 3v3; FLAMEPROOF only vs flame.)');
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
