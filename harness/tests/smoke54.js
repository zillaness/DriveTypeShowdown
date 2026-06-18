const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  const baseSet=()=>{m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.ballN='auto';};
  const startBall=(mode)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode=mode;baseSet();
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    const sb=p2StartBtnRect();p2Click(sb.x+sb.w/2,sb.y+sb.h/2);updateP2Ball(3.1);};
  const startTank=()=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';baseSet();m2.set.lives=1;m2.set.map=0;m2.set.hpk=false;m2.set.pow=false;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2Tank();updateP2Tank(3.1);};

  // ── EXTRA BALLS: the slider multiplies the balls in play ──
  ballMult=1;startBall('normal');const base=balls.length;
  ballMult=3;startBall('normal');const x3=balls.length;
  ok('EXTRA BALLS: 3x multiplies the ball count (x1='+base+' x3='+x3+')',x3>=base*2.5);
  ballMult=1;

  // ── MACHINE GUN (shooter): big hopper + rapid fire ──
  machineGun=2;startBall('shooter');
  let bo=b2.bots[0];bo.x=FW/2;bo.y=FH/2;bo.h=0;bo.stunT=0;bo.intk=[];
  for(let i=0;i<8&&i<balls.length;i++){const b=balls[i];b.sc=false;b.proj=false;b.held=false;b.intaken=true;b.lastT=0;bo.intk.push(b);}
  ok('MACHINE GUN shooter: hopper holds more than 4 ('+bo.intk.length+')',bo.intk.length>4);
  bo.shootCd=0;kbSpaceHeld=true;updateP2Ball(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN shooter: rapid shootCd after firing ('+bo.shootCd.toFixed(2)+')',bo.shootCd>0&&bo.shootCd<=0.06);
  machineGun=0;

  // ── MACHINE GUN (tank): rapid reload after a shot ──
  machineGun=2;startTank();
  const t=tf2.tanks[0];t.reload=0;t.stunT=0;kbSpaceHeld=true;updateP2Tank(1/60);kbSpaceHeld=false;
  ok('MACHINE GUN tank: rapid reload after firing ('+t.reload.toFixed(2)+')',t.reload>0&&t.reload<=0.06);
  machineGun=0;

  // ── v5.1.17 crash regression: MACHINE GUN's big hopper (>4) must not crash the shooter MAG readout (repeat() negative count) ──
  machineGun=2;startBall('shooter');
  {const bw=b2.bots[0];bw.intk=[];for(let i=0;i<9&&i<balls.length;i++){balls[i].intaken=true;bw.intk.push(balls[i]);}
   let drew=true;try{drawP2Ball();}catch(e){drew=false;}
   ok('big MACHINE GUN hopper does not crash the shooter HUD render',drew===true);}
  machineGun=0;

  // ── MACHINE GUN tri-state (v5.1.17): OFF/YOU/BOTH — YOU gives only the human side full-auto ──
  m2.claim=[{type:'kb'},{type:'cpu',tier:1}];
  machineGun=1;ok('MACHINE GUN YOU: human side on, CPU side off',mgOn(0)===true&&mgOn(1)===false);
  machineGun=2;ok('MACHINE GUN BOTH: both sides on',mgOn(0)===true&&mgOn(1)===true);
  machineGun=0;ok('MACHINE GUN OFF: neither side',mgOn(0)===false&&mgOn(1)===false);

  // ── ULTIMATE ASCENT: a 2P-shooter shot ricochets off walls and stays alive (stacks with everything) ──
  frisbeeMode=true;bouncyMode=true;startBall('shooter'); // stack two cheats
  const b=balls.find(x=>!x.sc&&!x.intaken&&!x.proj&&!x.held);
  b.proj=true;b.sc=false;b.intaken=false;b.held=false;b.lastT=0;b.x=FW/2;b.y=b2mGT()-20;b.vx=300;b.vy=0;b._dist=0;
  const park=()=>{b2.bots[0].x=20;b2.bots[0].y=FH-20;b2.bots[1].x=FW-20;b2.bots[1].y=FH-20;};
  park();let alive=0,flips=0,lv=b.vx;
  for(let i=0;i<200&&b.proj;i++){updateP2Ball(1/60);park();alive++;if(Math.sign(b.vx)!==Math.sign(lv)&&b.vx!==0)flips++;lv=b.vx;}
  ok('ULTIMATE ASCENT+BOUNCY: shot ricochets and survives ('+alive+'f, '+flips+' flips, proj='+b.proj+')',alive>=200&&flips>=1);
  frisbeeMode=false;bouncyMode=false;

  // ── PER-MODE tables (v5.1.15): shooter CHAMPION keeps a speed edge; normal CHAMPION stays clamped ──
  startBall('shooter');playerBind[1].tier=3;const sSh=cpuTierParams(1,0).spd;
  startBall('normal');playerBind[1].tier=3;const sNo=cpuTierParams(1,0).spd;
  ok('per-mode: shooter CHAMPION has a speed edge but normal is clamped (shooter '+sSh.toFixed(2)+' > normal '+sNo.toFixed(2)+')',sSh>1.0&&sNo<=1.0);

  // ── MULTIBALL: each goal spawns 2 more balls, capped ──
  startBall('normal');multiBall=true;
  {const n0=balls.length;const bb=balls.find(b=>!b.sc)||balls[0];b2Credit(bb,0);
   ok('MULTIBALL: a goal spawns +2 balls ('+n0+'→'+balls.length+')',balls.length===n0+2);}
  multiBall=false;

  // ── STICKY PLOW: the cheat gives human main bots CHAMPION-grade sticky carriers ──
  startBall('normal');
  ok('STICKY PLOW off: no human carriers',b2StickyCarriers().filter(c=>!(m2.claim[c.al]&&m2.claim[c.al].type==='cpu')).length===0);
  stickyPlow=true;
  {const cs=b2StickyCarriers();ok('STICKY PLOW on: human bot is a cap-5 carrier',cs.length>=1&&cs.every(c=>c.cap===CARRY_CAP[3]));}
  stickyPlow=false;

  // ── NO-CLIP: overlapping main bots don't separate ──
  startBall('normal');
  const A=b2.bots[0],B=b2.bots[1];
  const setOverlap=()=>{A.x=600;A.y=320;B.x=600+RR;B.y=320;cpuH2H&&cpuH2H.forEach&&0;};
  noClip=true;setOverlap();updateP2Ball(1/60);const dNo=Math.hypot(A.x-B.x,A.y-B.y);
  ok('NO-CLIP: overlapping bots stay overlapped (d='+dNo.toFixed(0)+')',dNo<RR*2);
  noClip=false;setOverlap();updateP2Ball(1/60);const dYes=Math.hypot(A.x-B.x,A.y-B.y);
  ok('NO-CLIP off: overlapping bots separate (d='+dYes.toFixed(0)+')',dYes>dNo);
  noClip=false;

  // ── ICE momentum: builds + glides; human-only ──
  iceMode=true;
  {const bot={x:0,y:0,h:0,vx:0,vy:0};applyMomentum(bot,{vx:120,vy:0},1/60,'ice');const v1=bot.vx;applyMomentum(bot,{vx:0,vy:0},1/60,'ice');
   ok('ICE: velocity builds then glides after input stops (v1='+v1.toFixed(0)+'→'+bot.vx.toFixed(0)+')',v1>0&&bot.vx>v1*0.5);}
  startBall('normal');playerBind[0]={type:'kb'};playerBind[1]={type:'cpu',tier:1};
  ok('ICE applies to the human bot, not the CPU',momModeFor(b2.bots[0],0)==='ice'&&momModeFor(b2.bots[1],1)===null);
  iceMode=false;ok('no momentum when ICE off',momModeFor(b2.bots[0],0)===null);
  // ── MAX SENSITIVITY cheat: uncaps the sensitivity ceiling (replaces retired DRIFT) ──
  {const ms=CHEATS.find(c=>c.name==='MAX SENSITIVITY');
   ms.set(6);ok('MAX SENSITIVITY raises SENS_MAX (='+SENS_MAX+') + taints records',SENS_MAX===6&&anyCheat());
   ms.set(2);ok('MAX SENSITIVITY back to 2× restores the base cap',SENS_MAX===2&&SENS_MAX===SENS_MAX_BASE);}
  // ── CAP CPU SPEED: clamp the ball/shooter CPU's inherited sensitivity so MAX SENSITIVITY only turbos YOU ──
  {const sv=m2.sens;m2.sens=[5,5];
   capCpuSpeed=false;ok('CPU keeps pace: oS = full human sensitivity (chaos)',cpuPaceSens(0)===5&&cpuPaceSens(1)===5);
   capCpuSpeed=true;ok('CAP CPU SPEED on: ball CPU sens clamped to base 2.0',cpuPaceSens(0)===SENS_MAX_BASE&&cpuPaceSens(1)===SENS_MAX_BASE);
   capCpuSpeed=false;m2.sens=sv;}
  // ── RAM COOLDOWN cheat: scales the dash cooldown ──
  {const rc=CHEATS.find(c=>c.name==='RAM COOLDOWN');
   rc.set(0.2);ok('RAM COOLDOWN shortens the dash cooldown (mult='+ramCdMult+')',ramCdMult===0.2&&anyCheat());
   rc.set(1);ok('RAM COOLDOWN 1× restores the default cooldown',ramCdMult===1);}

  // ── BALL SIZE cheat scales the live ball radius (clamped 4..18) ──
  {const bs=CHEATS.find(c=>c.name==='BALL SIZE');
   bs.set(2);ok('BALL SIZE 2× grows BR (='+BR+', ≤18)',BR>9&&BR<=18);
   bs.set(0.5);ok('BALL SIZE 0.5× shrinks BR (='+BR+', ≥4)',BR<9&&BR>=4);
   bs.set(1);ok('BALL SIZE 1× restores BR=9',BR===9);}

  // ── ROBOT SIZE cheat scales RR live + recomputes the plow geometry (clamped) ──
  {const rs=CHEATS.find(c=>c.name==='ROBOT SIZE');const tx0=SC_TX;
   rs.set(1.5);ok('ROBOT SIZE 1.5× grows RR (='+RR.toFixed(0)+') + plow',RR>17&&RR<=26&&SC_TX>tx0);
   rs.set(0.5);ok('ROBOT SIZE 0.5× shrinks RR (='+RR.toFixed(0)+', ≥8)',RR<17&&RR>=8);
   rs.set(1);ok('ROBOT SIZE 1× restores RR=17 + plow',RR===17&&Math.abs(SC_TX-tx0)<0.01);}

  // ── BALL POWER-UPS cheat: SPEED pickup grants a boost on contact ──
  startBall('normal');ballPups=true;
  b2.pups=[{x:600,y:320,type:{id:'speed',icon:'»',col:'#40c4ff'},age:0}];b2.bots[0].x=600;b2.bots[0].y=320;b2.bots[0].speedT=0;
  b2PupTick(1/60);
  ok('BALL POWER-UPS: SPEED pickup boosts the bot + is consumed',b2.bots[0].speedT===8&&b2.pups.length===0);
  ballPups=false;b2PupTick(1/60);ok('BALL POWER-UPS off: pickups cleared',b2.pups.length===0);

  // ── cheats disable records/high-scores (anyCheat/cheated + H2H record gate) ──
  iceMode=false;SENS_MAX=SENS_MAX_BASE;ramCdMult=1;ballScale=1;robotScale=1;ballMult=1;machineGun=0;arcadeMode=false;bouncyMode=false;frisbeeMode=false;multiBall=false;stickyPlow=false;noClip=false;ballPups=false;cheatedRun=false;
  ok('anyCheat() false with nothing on',!anyCheat()&&!cheated());
  iceMode=true;ok('anyCheat()/cheated() true with a cheat on',anyCheat()&&cheated());
  {startBall('normal');m2.claim=[{type:'kb'},{type:'cpu',tier:3}];b2.score=[5,0];const h0=JSON.stringify(h2hRec);achH2HResult(0);
   ok('cheated H2H win records nothing',JSON.stringify(h2hRec)===h0);}
  iceMode=false;cheatedRun=false;

  // ── cheat menu fits on screen + sliders/toggles are type-grouped (v5.1.52) ──
  konamiActive=true;drawKonami();
  {const rowsMax=Math.max.apply(null,drawKonami._rows.map(r=>r.y+r.h));const linkMax=Math.max.apply(null,(drawKonami._links||[{hy:0,hh:0}]).map(l=>l.hy+l.hh));
   ok('cheat menu fits ('+CHEATS.length+' cheats, rows→'+rowsMax.toFixed(0)+', links→'+linkMax.toFixed(0)+' < '+CH+')',rowsMax<CH-40&&linkMax<CH-8);
   {const half=Math.ceil(CHEATS.length/2); // v5.1.158: two columns laid out IN ORDER (themed; sliders beside their toggles)
    ok('cheats lay out in two columns in order (first half left, rest right)',drawKonami._rows.every((r,i)=>i<half?(r.x<CW/2):(r.x>CW/2)));
    const mi=CHEATS.findIndex(c=>c.name==='MAX SENSITIVITY'),ci=CHEATS.findIndex(c=>c.name==='CAP CPU SPEED');
    ok('MAX SENSITIVITY sits right next to CAP CPU SPEED',Math.abs(mi-ci)===1);
    const ri=CHEATS.findIndex(c=>c.name==='RAMMING'),rci=CHEATS.findIndex(c=>c.name==='RAM COOLDOWN');
    ok('RAM COOLDOWN sits beside RAMMING',Math.abs(ri-rci)===1);}
   const ex=drawKonami._exit,ao=drawKonami._alloff;
   ok('cheat menu has ✕ EXIT + ⟲ TURN OFF ALL buttons on-screen',!!ex&&!!ao&&ex.x>=0&&ex.x+ex.w<=CW&&ao.x>=0&&ao.x+ao.w<=CW);}

  // ── PORTRAIT cheats (v5.1.92): one full-width column so nothing is crushed; everything stays on-screen ──
  {const _sv=curLayout;applyLayout('legacy');konamiActive=true;drawKonami();const rws=drawKonami._rows;
   ok('portrait: cheats render in ONE column (all rows share an x)',new Set(rws.map(r=>Math.round(r.x))).size===1);
   ok('portrait: all '+rws.length+' rows fit within the canvas width',rws.every(r=>r.x>=0&&r.x+r.w<=CW));
   const pRowsMax=Math.max.apply(null,rws.map(r=>r.y+r.h)),pLinkMax=Math.max.apply(null,(drawKonami._links||[{hy:0,hh:0}]).map(l=>l.hy+l.hh));
   ok('portrait: rows + links fit vertically ('+pRowsMax.toFixed(0)+'/'+pLinkMax.toFixed(0)+' < '+CH+')',pRowsMax<CH-30&&pLinkMax<CH-8);
   const sl=rws.find((r,i)=>CHEATS[i].slider);
   ok('portrait: a slider gets a usable track (>80px wide)',!!sl&&!!sl.slider&&(sl.slider.x2-sl.slider.x1)>80);
   const _ex=drawKonami._exit,_ao=drawKonami._alloff;
   ok('portrait: EXIT + TURN-OFF-ALL buttons stay on-screen',_ex.x>=0&&_ex.x+_ex.w<=CW&&_ao.x>=0&&_ao.x+_ao.w<=CW);
   applyLayout(_sv);drawKonami();konamiActive=false;} // restore the landscape layout/rows for the slider tests below

  // ── v5.1.52: ICE SKATING + ICE SLIP merged into ONE slider (1.0× = OFF) ──
  {const gi=CHEATS.findIndex(c=>c.name==='ICE SKATING');
   ok('ICE SKATING is now a slider; ICE SLIP removed',gi>=0&&CHEATS[gi].slider===true&&CHEATS[gi].min===1&&CHEATS.findIndex(c=>c.name==='ICE SLIP')<0);
   const r=drawKonami._rows[gi];
   applyKonamiSlider(gi,r.slider.x1);ok('1.0× = OFF (far-left: slip 1, iceMode off)',Math.abs(iceSlip-1)<1e-9&&iceMode===false);
   applyKonamiSlider(gi,r.slider.x2);ok('far-right = max slip ON (slip 5 → fri 0.08, iceMode on)',Math.abs(iceSlip-5)<1e-9&&Math.abs(MOM.ice.fri-0.08)<1e-6&&iceMode===true);
   applyKonamiSlider(gi,(r.slider.x1+r.slider.x2)/2);ok('mid = ice on, more slide ('+iceSlip.toFixed(1)+'×, fri '+MOM.ice.fri.toFixed(3)+')',iceSlip>1&&iceSlip<5&&iceMode===true&&MOM.ice.fri<0.4&&Math.abs(MOM.ice.fri-0.4/iceSlip)<1e-9);
   CHEATS[gi].set(1);ok('setting ICE SKATING to 1.0× turns ice OFF',iceSlip===1&&iceMode===false);MOM.ice.fri=0.4;
   const ti=CHEATS.findIndex(c=>!c.slider);const tv=CHEATS[ti].get();applyKonamiSlider(ti,drawKonami._rows[ti].x);ok('applyKonamiSlider ignores non-slider rows',CHEATS[ti].get()===tv);}
  // ── ⟲ TURN OFF ALL CHEATS button clears every cheat (panel stays open) ──
  {iceSlip=3;iceMode=true;SENS_MAX=6;ramCdMult=0.3;ballMult=4;arcadeMode=true;bouncyMode=true;machineGun=2;multiBall=true;stickyPlow=true;noClip=true;ballPups=true;ballScale=2;robotScale=1.5;capCpuSpeed=true;
   ok('cheats on before TURN OFF ALL',anyCheat());
   const ao=drawKonami._alloff;konamiActive=true;click(ao.x+ao.w/2,ao.y+ao.h/2);
   ok('⟲ TURN OFF ALL clears every cheat',!anyCheat()&&!iceMode&&iceSlip===1&&SENS_MAX===SENS_MAX_BASE&&ramCdMult===1&&ballMult===1&&!arcadeMode&&!machineGun&&ballScale===1&&robotScale===1&&capCpuSpeed===false);
   ok('TURN OFF ALL keeps the cheat panel open',konamiActive===true);}
  // ── ✕ EXIT button closes the panel (click) ──
  {const ex=drawKonami._exit;konamiActive=true;click(ex.x+ex.w/2,ex.y+ex.h/2);ok('clicking ✕ EXIT closes the cheat menu',konamiActive===false);}
  konamiActive=false;

  // ── PAUSE menu: freezes the match; RESUME/QUIT overlay ──
  startBall('normal');paused=false;
  ok('canPause() true during a live match',canPause()===true);
  paused=true;{const t0=b2.t;update(1/60);ok('paused freezes the match (b2.t unchanged)',b2.t===t0);}
  paused=false;{const t1=b2.t;update(1/60);ok('resume advances the match',b2.t>t1);}
  paused=true;{const r=pauseResumeRect();pauseClick(r.x+5,r.y+5);ok('RESUME click unpauses',paused===false);}
  startBall('normal');paused=true;{const q=pauseQuitRect();pauseClick(q.x+5,q.y+5);ok('QUIT click leaves the match',paused===false&&phase!=='p2ball');}
  // ── pause menu = endgame-style nav (v5.1.47): RESUME · RESTART · SETUP · MODE · SETTINGS · MENU ──
  startBall('normal');paused=true;{const labs=pauseItems().map(i=>i.lab.replace(/[^A-Z]/g,''));
   ok('2P pause has 7 nav items incl. SETUP/MODE/MAIN MENU + TURN RATE',pauseItems().length===7&&labs.indexOf('SETUP')>=0&&labs.indexOf('MODE')>=0&&labs.some(l=>l.indexOf('MENU')>=0)&&labs.indexOf('TURNRATE')>=0);}
  startBall('normal');paused=true;{const it=pauseItems(),mode=it.find(x=>x.lab.indexOf('MODE')>=0);mode.act();ok('pause → MODE goes to mode select',phase==='p2modes'&&paused===false);}
  startBall('normal');paused=true;{const it=pauseItems(),setup=it.find(x=>x.lab.indexOf('SETUP')>=0);setup.act();ok('pause → SETUP goes to the claim screen',phase==='p2claim'&&paused===false);}
  startBall('normal');paused=true;{const it=pauseItems(),re=it.find(x=>x.lab.indexOf('RESTART')>=0);re.act();ok('pause → RESTART relaunches the match',phase==='p2ball'&&paused===false&&!!b2);}
  // ── TURN RATE knob: rotRatio biases rotation vs translation (default 1:1) ──
  {phase='playing';holoMode=false;steerMode=false;obstacleCourse=false;curD=1;Object.keys(keys).forEach(kk=>delete keys[kk]);
   robot={x:300,y:300,h:0};FX=0;FY=0;sensitivity=1;mouseAim=false;setRotRatio(1);keys['ArrowLeft']=true;
   const vr1=getInp({type:'kb'}).vr;setRotRatio(2);const vr2=getInp({type:'kb'}).vr;
   ok('TURN RATE 2× doubles rotation, translation unchanged',Math.abs(vr2-vr1*2)<1e-6&&vr1!==0);
   const st=pauseItems().find(x=>x.kind==='step');st.dec();ok('TURN RATE ◀ steps rotRatio down 0.25',Math.abs(rotRatio-1.75)<1e-6);
   st.act();ok('TURN RATE reset → 1:1',rotRatio===1);keys['ArrowLeft']=false;}

  // ── MOUSE-AIM: a keyboard bot turns toward the cursor (non-steer drives) ──
  {phase='playing';holoMode=false;steerMode=false;obstacleCourse=false;curD=1;Object.keys(keys).forEach(kk=>delete keys[kk]);
   robot={x:300,y:300,h:0};FX=0;FY=0;sensitivity=1;mouseAim=true;
   mouseX=300;mouseY=100;const up=getInp({type:'kb'}).vr;   // cursor above → turn negative
   mouseX=300;mouseY=500;const dn=getInp({type:'kb'}).vr;   // cursor below → turn positive
   ok('MOUSE-AIM turns toward the cursor (up='+up.toFixed(1)+' dn='+dn.toFixed(1)+')',up<-0.1&&dn>0.1);
   mouseAim=false;ok('MOUSE-AIM off leaves turn to keys (~0)',Math.abs(getInp({type:'kb'}).vr)<0.01);}

  // ── v5.1.177 ABSOLUTE HEADING (snap-to-angle): the aim stick's ANGLE sets the chassis facing ──
  {const sv=absHeading;absHeading=true;
   ok('ABS-HEADING: stick UP (0,-1) faces up → turn negative',absHeadingVr(0,-1,0)<-0.1);
   ok('ABS-HEADING: stick DOWN (0,1) faces down → turn positive',absHeadingVr(0,1,0)>0.1);
   ok('ABS-HEADING: stick RIGHT (1,0) when already facing right → ~no turn',Math.abs(absHeadingVr(1,0,0))<0.01);
   ok('ABS-HEADING: a centered stick (deadzone) → null (hold heading)',absHeadingVr(0.1,0.1,0)===null);
   absHeading=false;ok('ABS-HEADING off → null (default rate-of-rotation)',absHeadingVr(0,-1,0)===null);
   absHeading=true;const t1=toggleAbsHeading;t1();ok('toggleAbsHeading flips the flag',absHeading===false);t1();ok('toggleAbsHeading flips back',absHeading===true);
   absHeading=sv;}

  // ── v5.1.53: beating SP with cheats on must NOT freeze (drawDone read best[k]=undefined → fmt(undefined) threw → killed the rAF loop) ──
  {holoMode=false;steerMode=false;obstacleCourse=false;curD=0;playT=12.34;cheatedRun=true;nameEntry={active:false};spGhostSaved=false;
   const k2=driveKey(DRIVES[0].id);delete best[k2];
   let threw=false;try{drawDone();}catch(e){threw=true;}
   ok('cheated SP win: drawDone does not throw with no saved best (was a hard freeze)',!threw);
   cheatedRun=false;}

  // ── v5.1.188 single-player top-left ESC → SPLASH hub ──
  {const sp=phase,sk=konamiActive,spa=paused,shm=holoMode,ssm=steerMode;
   konamiActive=false;paused=false;holoMode=false;steerMode=false;phase='playing';
   click(23,22); // center of the top-left ESC button (rect x4 y8 w38 h28)
   ok('single-player top-left ESC returns to the SPLASH screen',phase==='splash');
   phase=sp;konamiActive=sk;paused=spa;holoMode=shm;steerMode=ssm;}

  console.log('--- cheats: '+P+' pass, '+F+' fail ---');
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
global.navigator={getGamepads:()=>[]};
global.Image=class{set src(v){}};
try{eval(src);}catch(e){console.log('RUNTIME FAIL:',e.message,e.stack&&e.stack.split('\n')[1]);process.exit(1);}
