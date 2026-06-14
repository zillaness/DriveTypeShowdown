// smoke50 — v5.0 unified setup screen: flow, drive picker (tabs+arrows), rename, sensitivity slider, names
const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  const ok=(lab,cond)=>console.log((cond?'PASS':'FAIL')+' — '+lab);
  let pass=0,fail=0;const OK=(lab,c)=>{c?pass++:fail++;ok(lab,c);};
  const click=(r)=>p2Click(r.x+(r.w||0)/2,r.y+(r.h||0)/2);
  const kd=(k)=>window._kd({key:k,preventDefault:()=>{}});

  // ── flow: mode card -> settings (not drive) -> claim ──
  applyLayout('land2p');phase='p2modes';m2.drive=[null,null];m2.name=[null,null];m2.claim=[null,null];m2._gpPrev=[];tour=null;
  click(p2ModeRect(0));
  OK('mode card routes to p2settings (drive step merged away)',phase==='p2settings');
  OK('drives auto-defaulted on entry',!!m2.drive[0]&&!!m2.drive[1]&&m2.drive[0].kind==='main');
  click(p2StartBtnRect());
  OK('settings START routes to p2claim',phase==='p2claim');

  // ── drive group tabs + cycle arrows ──
  click(p2cTabRect(0,1)); // HOLONOMIC
  OK('tab switches group to holonomic',m2.drive[0].kind==='holo'&&p2cGroupIdx(0)===1);
  const before=m2.drive[0].idx;
  click(p2cArrowRect(0,1));
  OK('right arrow cycles drive within group',m2.drive[0].idx===((before+1)%HOLO_DRIVES.length));
  click(p2cArrowRect(0,-1));
  OK('left arrow cycles back',m2.drive[0].idx===before);
  click(p2cTabRect(0,2)); // STEER
  OK('tab switches to steer + name updates',m2.drive[0].kind==='steer'&&m2.drive[0].name===STEER_DRIVES[m2.drive[0].idx].name);
  click(p2cTabRect(0,0)); // back to CLASSIC

  // ── rename via name click + keydown ──
  click(p2cNameRect(0));
  OK('clicking name opens claim rename',nameEntry.active&&nameEntry.target==='claim'&&nameEntry.pl===0);
  kd('S');kd('a');kd('m');kd('Enter');
  OK('typed name commits to m2.name[0] (uppercased)',m2.name[0]==='SAM'&&!nameEntry.active);
  OK('p2Name returns custom name',p2Name(0)==='SAM');
  OK('p2Name defaults to BLUE when unset',p2Name(1)==='BLUE');
  // escape cancels without committing
  click(p2cNameRect(1));kd('X');kd('Escape');
  OK('escape cancels rename',!nameEntry.active&&m2.name[1]===null);

  // ── sensitivity slider (human spot) ──
  m2.claim=[{type:'kb'},null];m2.sens=[1,1];
  const sl=p2cSlider(0);
  p2Click(sl.x1,sl.y); // far left -> min
  OK('slider click sets sensitivity near min',Math.abs(m2.sens[0]-SENS_MIN)<0.15);
  p2Click(sl.x2,sl.y); // far right -> max
  OK('slider click sets sensitivity near max',Math.abs(m2.sens[0]-SENS_MAX)<0.15);

  // ── CPU add + tier stepper via new rects ──
  click(p2cCpuRect());
  OK('ADD CPU fills open slot at FINALIST',m2.claim[1]&&m2.claim[1].type==='cpu'&&m2.claim[1].tier===2);
  click(p2cTierRect(1,1));
  OK('tier stepper +1 -> WINNER',m2.claim[1].tier===3);

  // ── swap also swaps name/drive/sens ──
  m2.name=['AAA','BBB'];m2.sens=[0.5,1.5];
  const d0=m2.drive[0].name;
  click(p2cSwapRect());
  OK('swap exchanges names',m2.name[0]==='BBB'&&m2.name[1]==='AAA');
  OK('swap exchanges sens',m2.sens[0]===1.5&&m2.sens[1]===0.5);

  // ── start launches with both claimed ──
  m2.claim=[{type:'kb'},{type:'cpu',tier:4}];m2.mode='normal';m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.cpus=0;
  click(p2StartBtnRect());
  OK('START launches the ball match',phase==='p2ball'&&!!b2);

  // ── regression: leaving 2P must restore single-player gamepad routing (resetBinds wired into p2Exit) ──
  OK('a stale kb bind zeroes gamepad axes (the reported bug)',bindAxes({type:'kb'})===GP_AXES_ZERO);
  playerBind=[{type:'kb'},{type:'cpu',tier:2}];
  p2Exit();
  OK('p2Exit resets playerBind to single-player default',playerBind[0]&&playerBind[0].type==='any'&&playerBind[1].type==='none');
  OK('SP now reads the merged gamepad axes (sticks work again)',bindAxes(playerBind[0])===gpAxis);

  console.log('--- smoke50: '+pass+' pass, '+fail+' fail ---');
  if(fail)process.exit(1);
})();
`;
global.ctxState={depth:0};
function mkCtx(){const noop=()=>{};
  const ctx={save(){ctxState.depth++;},restore(){ctxState.depth=Math.max(0,ctxState.depth-1);},
    createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})};
  return new Proxy(ctx,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});}
const canvas={getContext:()=>mkCtx(),focus:()=>{},style:{},width:1280,height:720,
  addEventListener:(ev,fn)=>{canvas['_'+ev]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
global.window={addEventListener:(ev,fn)=>{if(ev==='keydown')global.window._kd=fn;},innerWidth:1400,innerHeight:800,open:()=>{}};
global.performance={now:()=>0};global.LS={};
global.localStorage={getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);},removeItem:k=>{delete LS[k];}};
global.document={getElementById:()=>canvas,addEventListener:()=>{},createElement:()=>({click:()=>{},style:{}})};
global.requestAnimationFrame=()=>{};global.navigator={getGamepads:()=>[]};global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
