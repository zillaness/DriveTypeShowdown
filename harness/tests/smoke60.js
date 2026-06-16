// smoke60 — ONLINE P1: host-authoritative netcode SEAMS (ball/shooter snapshot, remote input, loopback echo)
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  const close=(a,b)=>Math.abs(a-b)<1e-6;
  let _sd=999;Math.random=()=>{_sd=(_sd*1664525+1013904223)>>>0;return _sd/4294967296;};
  function setBase(mode){applyLayout('ball2p');phase='p2claim';tour=null;m2.mode=mode;
    m2.set.tfmt='multi';m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.cpus=0;m2.set.ballN='auto';
    m2.tseats=[null,null,null,null,null,null];m2.tsel=0;m2.name=[null,null,null,null,null,null];m2._gpPrev=[];}
  function gridAllCpu(mode){setBase(mode);for(let i=0;i<6;i++)tankGridSetCpu(i);startP2Ball();}

  // ── 0. dormant by default ──
  ok('net starts in LOCAL mode (role null)',net.role===null);

  // ── 1. drive a 3v3 ball sim so the state is non-trivial ──
  gridAllCpu('normal');
  updateP2Ball(3.1);for(let i=0;i<240;i++)updateP2Ball(1/60);
  ok('sim produced live state (6 bots + balls)',b2.bots.length===6&&balls.length>0);

  // ── 2. serialize → perturb → apply → state is restored to the snapshot ──
  const snap=netSerializeBall();
  ok('snapshot tags the ball mode + carries every bot + ball',snap.md==='ball'&&snap.bots.length===6&&snap.balls.length===balls.length);
  const b0=b2.bots[0],ballRef=balls[0];
  const want={bx:b0.x,by:b0.y,bh:b0.h, lbx:ballRef.x,lby:ballRef.y, sc:b2.score.slice(), t:b2.t};
  // perturb everything the snapshot covers
  b0.x+=123;b0.y-=77;b0.h+=1.2; ballRef.x+=200;ballRef.y-=140;ballRef.vx=999;
  b2.score=[7,3];b2.t=12.5; const nukedBalls=balls.length; balls.push({x:1,y:1,vx:0,vy:0,id:99,sc:false,intaken:false,proj:false,lastT:null,golden:false});
  ok('netApplyBall restores it',netApplyBall(snap)
    &&close(b2.bots[0].x,want.bx)&&close(b2.bots[0].y,want.by)&&close(b2.bots[0].h,want.bh)
    &&close(balls[0].x,want.lbx)&&close(balls[0].y,want.lby)
    &&b2.score[0]===want.sc[0]&&b2.score[1]===want.sc[1]&&close(b2.t,want.t)
    &&balls.length===nukedBalls);

  // ── 3. JSON round-trip (the wire format) ──
  const json=netSnapshotJSON();
  ok('snapshot serializes to a JSON string',typeof json==='string'&&json.length>0);
  const preX=b2.bots[1].x; b2.bots[1].x+=500; balls[1]&&(balls[1].x+=500);
  ok('netApplyJSON parses + applies the wire blob',netApplyJSON(json)&&close(b2.bots[1].x,preX));
  ok('malformed JSON is rejected (no throw)',netApplyJSON('{bad json')===false);

  // ── 4. shooter magazine count survives the snapshot (HUD dots) ──
  gridAllCpu('shooter');updateP2Ball(3.1);for(let i=0;i<120;i++)updateP2Ball(1/60);
  b2.bots[0].intk=[{},{},{}]; // 3 in the mag
  const ss=netSerializeBall(); b2.bots[0].intk.length=0;
  ok('netApplyBall restores the magazine COUNT',netApplyBall(ss)&&b2.bots[0].intk.length===3);

  // ── 5. getInp 'remote' seam — a seat driven off the wire ──
  netClearRemote();
  ok('a remote seat with no packet yet reads zero',(()=>{const i=getInp({type:'remote',seat:0});return i.vx===0&&i.vy===0&&i.vr===0;})());
  netSetRemoteInput(0,{vx:42,vy:-9,vr:0.5});
  ok('getInp returns the latest received input for that seat',(()=>{const i=getInp({type:'remote',seat:0});return i.vx===42&&i.vy===-9&&i.vr===0.5;})());
  ok('a different remote seat is independent',getInp({type:'remote',seat:1}).vx===0);
  // (local kb/gamepad binds are covered by the rest of the battery, which runs getInp inside withBot)

  // ── 6. LOOPBACK echo: host serializes → transport → remote applies → states match ──
  gridAllCpu('normal');updateP2Ball(3.1);for(let i=0;i<180;i++)updateP2Ball(1/60);
  const tx=netLoopback();let echoed=null;
  tx.remote.onmessage=(m)=>{echoed=m;}; // the remote endpoint just captures the blob here
  const hostJson=netSnapshotJSON(); const hx=b2.bots[2].x,hy=b2.bots[2].y;
  tx.host.send(hostJson);
  ok('loopback delivered the snapshot to the remote endpoint',echoed===hostJson&&tx.host.sent===1);
  // now perturb + apply the echoed blob (what the remote does on recv) → restores host state
  b2.bots[2].x+=400;b2.bots[2].y+=400;
  ok('remote applies the echoed snapshot → matches the host',netApplyJSON(echoed)&&close(b2.bots[2].x,hx)&&close(b2.bots[2].y,hy));

  console.log('--- online P1 net seams: '+P+' pass, '+F+' fail ---');
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
