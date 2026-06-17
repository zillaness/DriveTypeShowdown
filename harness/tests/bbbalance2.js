// bbbalance2.js — RoboRumble ARMOR + PERK + 3v3 ALLIANCE-SYNERGY balance report (tuning report, not pass/fail).
// Drives the REAL startP2BB grid path (seats 0-2 = RED side0, 3-5 = BLUE side1) so every perk/armor/minibot
// effect resolves exactly as in-game. Seeded CPU-vs-CPU, sides alternated to cancel positional bias.
// Run: ./extract.sh && node harness/tests/bbbalance2.js
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  function seedRng(s){let sd=s>>>0;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
  function seats(arr){m2.tseats=[null,null,null,null,null,null];
    for(let i=0;i<6;i++){const L=arr[i];if(!L)continue;
      m2.tseats[i]={type:'cpu',dev:null,tier:3,drive:tankGridDefDrive(),sens:1,loadout:{weapon:L.weapon,armor:L.armor,perk:L.perk||'none'}};}}
  // A,B = arrays of up to 3 loadouts. aSide=0 → A is RED(seats0-2), B is BLUE(seats3-5); aSide=1 swaps.
  function runComp(A,B,seed,aSide){
    seedRng(seed);
    m2.mode='battlebots';m2.set.tfmt='multi';m2.set.map=0;m2.set.bbmode='ko';m2.set.bblives=1;m2.set.bbtime=0;m2.set.tdrv='open';
    const red=aSide===0?A:B, blue=aSide===0?B:A, arr=[null,null,null,null,null,null];
    red.forEach((L,k)=>arr[k]=L); blue.forEach((L,k)=>arr[3+k]=L);
    seats(arr);
    startP2BB(); tfObs=[]; bb2.cd=0; // isolate from obstacle pathing + countdown
    const MAXF=70*60;let f=0;while(bb2.result===null&&f<MAXF){updateBB(1/60);f++;}
    let res=bb2.result,timedOut=(res===null);
    if(timedOut){const hp=[0,0];for(const b of bb2.bots)if(!b.dead)hp[b.side]+=b.hp;res=(hp[0]===hp[1])?'draw':(hp[0]>hp[1]?0:1);}
    const nan=bb2.bots.some(b=>!isFinite(b.hp));
    // res is winning SIDE; map back to A/B given aSide
    const aSideWon=(res===aSide);
    return {w:(res==='draw'?'draw':(aSideWon?'A':'B')),timedOut:timedOut,nan:nan};
  }
  const pad=(s,n)=>{s=String(s);return s+' '.repeat(Math.max(0,n-s.length));};
  let totalM=0,totalTO=0,totalDraw=0,totalNan=0;
  function roundRobin(label,items,build,N,note){
    // items: list of keys; build(key)->comp array. Full matrix, N matches each, sides alternated.
    const wins={},games={},matrix={};for(const k of items){wins[k]=0;games[k]=0;matrix[k]={};}
    for(const a of items)for(const b of items){let aw=0,bw=0;
      for(let i=0;i<N;i++){const seed=(0x9E37+hash(a)*131+hash(b)*977+i*2654435761)>>>0;
        const r=runComp(build(a),build(b),seed,i%2);
        totalM++;if(r.nan)totalNan++;if(r.timedOut)totalTO++;
        if(r.w==='A')aw++;else if(r.w==='B')bw++;else totalDraw++;}
      matrix[a][b]=aw/N;
      if(a!==b){wins[a]+=aw;games[a]+=N;wins[b]+=bw;games[b]+=N;}}
    const W=Math.max(10,...items.map(k=>k.length+1));
    console.log('\\n=== '+label+' ===');if(note)console.log(note);
    console.log('win% ROW vs COL ('+N+'/cell):');
    console.log(pad('A\\\\B',W)+items.map(k=>pad(k,W)).join(''));
    for(const a of items)console.log(pad(a,W)+items.map(b=>pad((matrix[a][b]*100).toFixed(0)+'%',W)).join(''));
    const overall=items.map(k=>({k:k,r:games[k]?wins[k]/games[k]:0})).sort((x,y)=>y.r-x.r);
    console.log('overall win% (vs all OTHERS):');
    for(const o of overall)console.log('  '+pad(o.k,W)+(o.r*100).toFixed(1)+'%');
    return overall;
  }
  function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}

  console.log('RoboRumble ARMOR / PERK / ALLIANCE balance — tier=CHAMPION, map=OPEN ARENA, 1-life KO');

  // ── 1. ARMOR sweep (1v1), under a KINETIC weapon then a THERMAL weapon (reveals the RPS triangle) ──
  const ARMORS=['balanced','hardplate','heatshield','light','runflat','reactive'];
  roundRobin('ARMOR sweep — weapon=PISTON (kinetic)',ARMORS,a=>[{weapon:'piston',armor:a,perk:'pitstop'}],14,
    'kinetic should fold to HARDPLATE, shred LIGHT');
  roundRobin('ARMOR sweep — weapon=FLAME (thermal)',ARMORS,a=>[{weapon:'flame',armor:a,perk:'pitstop'}],14,
    'thermal should beat HARDPLATE, fold to HEATSHIELD');

  // ── 2. PERK sweep (1v1), neutral chassis (piston/balanced) — note: minibot/repair-leaning perks favor 3v3 ──
  const PERKS=['partinggift','flameproof','minibot','vampire','sparetire','pitstop'];
  roundRobin('PERK sweep — chassis=PISTON/BALANCED (1v1)',PERKS,p=>[{weapon:'piston',armor:'balanced',perk:p}],14,
    'note: MINIBOT (extra body) + VAMPIRE/PIT STOP (sustain) shine more in 3v3 — 1v1 understates team perks');

  // ── 3. ALLIANCE SYNERGY (3v3): named comps, full round-robin — how weapons + perks combine on a team ──
  const COMPS={
    BRUISER:   [{weapon:'buzzsaw',armor:'hardplate',perk:'vampire'},{weapon:'buzzsaw',armor:'hardplate',perk:'vampire'},{weapon:'piston',armor:'hardplate',perk:'pitstop'}],
    SUPPORT:   [{weapon:'drill',armor:'hardplate',perk:'pitstop'},{weapon:'drill',armor:'hardplate',perk:'pitstop'},{weapon:'repair',armor:'balanced',perk:'pitstop'}],
    CONTROL:   [{weapon:'pincer',armor:'reactive',perk:'sparetire'},{weapon:'buzzsaw',armor:'balanced',perk:'vampire'},{weapon:'buzzsaw',armor:'balanced',perk:'vampire'}],
    SWARM:     [{weapon:'wedge',armor:'balanced',perk:'minibot'},{weapon:'wedge',armor:'balanced',perk:'minibot'},{weapon:'flame',armor:'heatshield',perk:'minibot'}],
    KAMISQUAD: [{weapon:'kamikaze',armor:'light',perk:'partinggift'},{weapon:'kamikaze',armor:'light',perk:'partinggift'},{weapon:'buzzsaw',armor:'hardplate',perk:'vampire'}],
    BASELINE:  [{weapon:'piston',armor:'balanced',perk:'pitstop'},{weapon:'piston',armor:'balanced',perk:'pitstop'},{weapon:'piston',armor:'balanced',perk:'pitstop'}],
  };
  const compKeys=Object.keys(COMPS);
  roundRobin('ALLIANCE SYNERGY (3v3)',compKeys,k=>COMPS[k],10,
    'BRUISER=2 buzzsaw+vamp/hardplate · SUPPORT=2 drill+1 repair healer · CONTROL=pincer holds, buzzsaws kill · SWARM=minibot harassers · KAMISQUAD=2 suicide bombers+1 cleanup · BASELINE=3 vanilla piston');

  console.log('\\n--- totals: '+totalM+' matches · timeout→judges '+(100*totalTO/totalM).toFixed(0)+'% · draws '+(100*totalDraw/totalM).toFixed(0)+'%'+(totalNan?(' · NaN '+totalNan+'!'):'')+' ---');
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
