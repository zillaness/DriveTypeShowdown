const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};

  // ── 6-seat grid (3v3 picker) LAYOUT AUDIT: no two simultaneously-active interactive
  //    controls in a cell may overlap, for every seat state × mode. Render is not
  //    headless-verifiable, but button-rect collisions are pure geometry — guard them. ──
  const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
  const area=r=>({x:r.x,y:r.y,w:r.w,h:r.h});
  const sensRect=g=>({x:g.x1-10,y:g.y-12,w:(g.x2-g.x1)+20,h:24}); // clickable band around the sens line (see tankGridClick)
  function loadRects(c){const lr=bbSeatLoadRects(c);return [['wL',lr.wL],['wR',lr.wR],['aL',lr.aL],['aR',lr.aR]];}
  // active interactive rects for seat 0 given a mode + state; returns [[name,rect],...]
  function activeRects(mode,state){
    m2.mode=mode;const c=tankCellRect(0),sub=tankCellSub(0),bb=(mode==='battlebots');const out=[];
    if(state==='empty'){out.push(['player',sub.player],['cpu',sub.cpu]);return out;}
    out.push(['rel',sub.rel],['grp',sub.grp],['dL',sub.dL],['dR',sub.dR]);
    if(state==='human-claimed'){out.push(['name',sub.name],['sens',sensRect(sub.sens)]);}
    else if(state==='human-awaiting'){out.push(['name',sub.name]);}
    else if(state==='cpu'){out.push(['tL',sub.tL],['tR',sub.tR]);}
    if(bb&&state!=='empty')for(const lr of loadRects(c))out.push(lr);
    return out.map(([n,r])=>[n,area(r)]);
  }
  const STATES=['empty','human-claimed','human-awaiting','cpu'],MODES=['tankfight','battlebots'];
  for(const mode of MODES)for(const st of STATES){
    const rs=activeRects(mode,st);let bad=[];
    for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(overlap(rs[i][1],rs[j][1]))bad.push(rs[i][0]+'×'+rs[j][0]);
    ok('['+mode+'/'+st+'] no overlapping controls'+(bad.length?(' — COLLISIONS: '+bad.join(', ')):''),bad.length===0);
  }
  // every interactive rect must sit INSIDE the cell box
  for(const mode of MODES)for(const st of STATES){
    const c=tankCellRect(0),rs=activeRects(mode,st);let oob=[];
    for(const [n,r] of rs)if(r.x<c.x||r.y<c.y||r.x+r.w>c.x+c.w+1||r.y+r.h>c.y+c.h+1)oob.push(n);
    ok('['+mode+'/'+st+'] all controls inside the cell'+(oob.length?(' — OOB: '+oob.join(', ')):''),oob.length===0);
  }
  // the BB loadout row must clear the human sens slider (the v5.1.81 fix; the USE-TOUCH button was removed in v5.1.87 — touch is claimed by tapping the seat)
  {m2.mode='battlebots';const sub=tankCellSub(0),c=tankCellRect(0),lr=bbSeatLoadRects(c);
   ok('BB: loadout row clears the sens slider band',!overlap(sensRect(sub.sens),area(lr.wL))&&!overlap(sensRect(sub.sens),area(lr.aR)));}
  // tankfight sens geometry is UNCHANGED by the BB-aware tweak (regression guard for v5.1.81)
  {m2.mode='tankfight';const c=tankCellRect(0),sub=tankCellSub(0);
   ok('tankfight sens.y stays c.y+116',sub.sens.y===c.y+116);}

  // monospace text-overflow: variable-length labels must not run under adjacent buttons (Courier New ≈ 0.6em advance)
  const txtW=(s,px)=>s.length*px*0.6;
  {m2.mode='battlebots';const c=tankCellRect(0),sub=tankCellSub(0);
   const driveNames=[];for(const g of DGROUPS)for(const d of g.list)driveNames.push(d.name);
   const longest=driveNames.reduce((a,b)=>b.length>a.length?b:a,'');
   // the drive name auto-fits (8..13px) into the gap between the ◀▶ arrows — verify EVERY name fits at its fitted size
   const dgap=sub.dR.x-(sub.dL.x+sub.dL.w)-16;
   const allFit=driveNames.every(nm=>{const px=Math.max(8,Math.min(13,dgap/Math.max(1,nm.length*0.6)));return nm.length*px*0.6<=dgap+0.5;});
   ok('every drive name auto-fits within the cycle arrows (longest: "'+longest+'")',allFit);
   const wLong=BB_ARMORY_W.map(w=>w.lab).reduce((a,b)=>b.length>a.length?b:a,''); // v5.1.173 grid row shows short LABELS (3 groups: weapon · armor · PERK)
   const aLong=BB_ARMORY_A.map(a=>a.lab).reduce((a,b)=>b.length>a.length?b:a,''),pLong=BB_PERKS.map(p=>p.lab).reduce((a,b)=>b.length>a.length?b:a,''),lr=bbSeatLoadRects(c);
   ok('weapon label ("'+wLong+'") fits between its ◀▶',txtW(wLong,10)<=(lr.wR.x-(lr.wL.x+lr.wL.w)));
   ok('armor label ("'+aLong+'") fits between its ◀▶',txtW(aLong,10)<=(lr.aR.x-(lr.aL.x+lr.aL.w)));
   ok('perk label ("'+pLong+'") fits between its ◀▶',txtW(pLong,10)<=(lr.pR.x-(lr.pL.x+lr.pL.w)));}

  // ── 1v1 BattleBots claim card: the LAYOUT picker (weapon/armor + AUTOBUILD) must clear the drive arrows above AND the controller box below (the AUTOBUILD-vs-description fix) ──
  {m2.mode='battlebots';
   for(let pl=0;pl<2;pl++){const cx=p2cCol(pl),lr=bbClaimLoadRects(pl),card=p2cCardRect(pl);
    const ctrlBox={x:cx-180,y:484,w:360,h:40};
    const a0=p2cArrowRect(pl,-1),a1=p2cArrowRect(pl,1),driveArrowsBottom=Math.max(a0.y+a0.h,a1.y+a1.h);
    const rects=[['wL',lr.w.l],['wR',lr.w.r],['aL',lr.a.l],['aR',lr.a.r],['pL',lr.p.l],['pR',lr.p.r],['auto',lr.auto]];let bad=[];
    for(const [n,r] of rects){
      if(overlap(r,ctrlBox))bad.push(n+'×ctrlBox');
      if(r.y<driveArrowsBottom)bad.push(n+'×driveArrows');
      if(r.x<card.x||r.y<card.y||r.x+r.w>card.x+card.w+1||r.y+r.h>card.y+card.h+1)bad.push(n+' OOB');
    }
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)if(overlap(rects[i][1],rects[j][1]))bad.push(rects[i][0]+'×'+rects[j][0]);
    ok('1v1 BB claim card pl'+pl+': LAYOUT picker is collision-free'+(bad.length?(' — '+bad.join(', ')):''),bad.length===0);
   }}

  console.log('--- grid layout audit: '+P+' pass, '+F+' fail ---');
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
function mkPad(i){return{connected:false,index:i,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0,0,0],vibrationActuator:{playEffect:()=>({catch:()=>{}})}};}
global.PADS=[mkPad(0),mkPad(1)];
const NAV={getGamepads:()=>PADS.map(p=>p.connected?p:null)};
try{Object.defineProperty(globalThis,'navigator',{get:()=>NAV,configurable:true});}catch(e){globalThis.navigator.getGamepads=NAV.getGamepads;}
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
