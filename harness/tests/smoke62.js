const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{c?P++:F++;console.log((c?'PASS':'FAIL')+' — '+l);};
  const sv=expFeatures;

  // ── 1. entry: kidsEnter sets a clean no-fail state ──
  expFeatures=true;kidsEnter();
  ok('kidsEnter → phase kids + fresh state',phase==='kids'&&!!kidsState&&kidsState.score===0&&kidsState.conf.length===0&&!('result'in kidsState));
  ok('bot + ball are inside the play field',(()=>{const F2=kidsField();const b=kidsState.bot,q=kidsState.ball;return b.x>F2.x&&b.x<F2.x+F2.w&&q.y>F2.y&&q.y<F2.y+F2.h;})());

  // ── 2. GATE: KIDS tile only exists on the splash when EXPERIMENTAL FEATURES is on ──
  expFeatures=false;{const R=splashRects();ok('gate OFF: no KIDS tile, classic 2-up bottom row',!R.kids&&R.set.x===30&&R.credits.x>R.set.x&&Math.abs(R.set.w-R.credits.w)<1);}
  expFeatures=true;{const R=splashRects();ok('gate ON: KIDS tile present, 3-up bottom row',!!R.kids&&R.kids.x===30&&R.set.x>R.kids.x&&R.credits.x>R.set.x);}

  // ── 3. drive input moves the bot (keyboard) ──
  kidsEnter();{const x0=kidsState.bot.x;keys['ArrowRight']=true;kidsUpdate(1/30);keys['ArrowRight']=false;
   ok('holding RIGHT drives the bot right',kidsState.bot.x>x0);}
  {const y0=kidsState.bot.y;keys['ArrowUp']=true;kidsUpdate(1/30);keys['ArrowUp']=false;
   ok('holding UP drives the bot up',kidsState.bot.y<y0);}

  // ── 4. scoring a goal: score++, confetti, ball resets (endless, no-fail) ──
  {const F2=kidsField();kidsState.bot.x=F2.x+40;kidsState.bot.y=F2.y+F2.h-40; // park the bot away from the ball
   kidsState.ball.x=CW/2;kidsState.ball.y=F2.y+KIDS_BALL_R-4;kidsState.ball.vx=0;kidsState.ball.vy=0; // ball at the goal mouth
   const s0=kidsState.score;kidsUpdate(1/60);
   ok('ball in the goal scores a point',kidsState.score===s0+1);
   ok('a goal spawns confetti',kidsState.conf.length>0);
   ok('the ball resets toward center after a goal',Math.abs(kidsState.ball.y-(F2.y+F2.h*0.5))<2);}

  // ── 5. missing the goal (off-center at the top) just bounces, no score ──
  {const F2=kidsField();kidsState.bot.x=F2.x+40;kidsState.bot.y=F2.y+F2.h-40;
   kidsState.ball.x=F2.x+KIDS_BALL_R+6;kidsState.ball.y=F2.y+KIDS_BALL_R-4;kidsState.ball.vx=0;kidsState.ball.vy=-40;
   const s0=kidsState.score;kidsUpdate(1/60);
   ok('hitting the top wall OFF the goal does not score',kidsState.score===s0);}

  // ── 6. no-fail endless: many frames never end the mode ──
  {let threw=false;try{for(let i=0;i<600;i++)kidsUpdate(1/60);}catch(e){threw=true;console.log('   kidsUpdate err:',e.message);}
   ok('600 frames run with no throw + no end state',!threw&&phase==='kids'&&!('result'in kidsState)&&typeof kidsState.score==='number');}

  // ── 7. draw no-throw (mock canvas → the draw must actually RUN) ──
  {let threw=false;try{kidsBurst(CW/2,kidsField().y);drawKids();
     expFeatures=true;phase='splash';drawSplash();                     // splash with the 3-up KIDS row
   }catch(e){threw=true;console.log('   draw err:',e.message,e.stack&&e.stack.split('\\n')[1]);}
   ok('drawKids + drawSplash(KIDS row) render without throwing',!threw);}

  // ── 8. exits back to the splash (back arrow) ──
  kidsEnter();{const bk=kidsBackRect();click(bk.x+bk.w/2,bk.y+bk.h/2);
   ok('tapping the back arrow returns to the splash',phase==='splash');}

  expFeatures=sv;keys['ArrowRight']=false;keys['ArrowUp']=false;
  console.log('--- kids mode: '+P+' pass, '+F+' fail ---');
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
