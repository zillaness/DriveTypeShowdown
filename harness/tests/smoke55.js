const fs=require('fs');let src=fs.readFileSync('/tmp/g.js','utf8');
src+=`
;(function(){
  let P=0,F=0;const ok=(l,c)=>{console.log((c?'PASS':'FAIL')+' — '+l);c?P++:F++;};
  const startTank=(map)=>{applyLayout('land2p');phase='p2claim';tour=null;m2.mode='tankfight';
    m2.set.cpus=0;m2.set.layout='mirrored';m2.set.format='timed';m2.set.timeSec=90;m2.set.bestOf=1;m2.set.contact='full';m2.set.lives=3;m2.set.map=map||0;m2.set.hpk=false;m2.set.pow=true;
    m2.drive[0]={kind:'main',idx:1,name:'A',c:'#0ff'};m2.drive[1]={kind:'main',idx:1,name:'A',c:'#0ff'};
    m2.claim=[{type:'kb'},{type:'kb'}];m2.sens=[1,1];m2._gpPrev=[];
    playerBind[0]=m2.claim[0];playerBind[1]=m2.claim[1];startP2Tank();updateP2Tank(3.1);};
  const idIdx=id=>PUP_TYPES.findIndex(p=>p.id===id);

  // ── pup table + gating ──
  startTank();
  ok('PUP_TYPES has the 3 new pickups',PUP_TYPES.length===7&&idIdx('expl')>=0&&idIdx('pierce')>=0&&idIdx('aim')>=0);
  m2.set.pow=true;m2.set.hpk=false; ok('allowed pups = 6 with POWER-UPS on, health off',tf2AllowedPups().length===6);
  m2.set.pow=false; ok('allowed pups = 0 with POWER-UPS off',tf2AllowedPups().length===0);
  m2.set.pow=true;
  // per-pup keys: individual gating within the pow/hpk master gates
  m2.set.hpk=true;
  ok('all 7 pups when pow+hpk+all puX enabled',tf2AllowedPups().length===7);
  m2.set.puRapid=false;m2.set.puSpeed=false;
  ok('disabling puRapid+puSpeed yields 5 pups',tf2AllowedPups().length===5);
  m2.set.puHp=false;
  ok('disabling puHp reduces to 4 (hpk alone no longer enough)',tf2AllowedPups().length===4);
  m2.set.puRapid=true;m2.set.puSpeed=true;m2.set.puHp=true;m2.set.hpk=false; // restore smoke55 baseline
  // settings rows: pow/hpk removed from tankfight rows (moved to per-pup sub-screen)
  m2.mode='tankfight';m2.set.tformat='lives';
  const tfrows=p2SettingsRows();
  ok('tankfight has 4 settings rows (format/lives/bestOf/map; team comp on the claim grid; pow+hpk in sub-screen)',tfrows.length===4&&tfrows[0].k==='tformat'&&tfrows[1].k==='lives'&&tfrows[2].k==='bestOf'&&tfrows[3].k==='map');
  ok('p2ShowPupCfg() true in tankfight',p2ShowPupCfg());
  ok('p2ShowPupCfg() false in ball mode',(m2.mode='normal',!p2ShowPupCfg()));
  m2.mode='tankfight';
  // open pup sub-screen via button click
  phase='p2settings';pupSettingsReturn=null;m2.set.puRapid=true;
  const pupBtn=p2PupCfgBtnRect();p2Click(pupBtn.x+pupBtn.w/2,pupBtn.y+pupBtn.h/2);
  ok('pup cfg button opens p2pupSettings',phase==='p2pupSettings'&&pupSettingsReturn==='p2settings');
  handleP2PupSettingsClick(p2SetRowRect(1).x+10,p2SetRowRect(1).y+10); // click RAPID row
  ok('clicking pup row toggles off (puRapid=false)',m2.set.puRapid===false);
  handleP2PupSettingsClick(p2SetRowRect(1).x+10,p2SetRowRect(1).y+10); // click again
  ok('clicking again re-enables (puRapid=true)',m2.set.puRapid===true);
  handleP2PupSettingsClick(p2BackBtnRect().x+5,p2BackBtnRect().y+5);
  ok('back closes pup screen, returns to p2settings',phase==='p2settings'&&pupSettingsReturn===null);
  m2.set.puRapid=true;m2.set.pow=true;m2.set.hpk=false; // restore baseline

  // ── apply stacks / timed ──
  const t0=tf2.tanks[0];t0.explAmmo=0;t0.aimT=0;
  tf2ApplyPup(t0,PUP_TYPES[idIdx('expl')]);tf2ApplyPup(t0,PUP_TYPES[idIdx('expl')]);
  ok('EXPLOSIVE stacks (+3 each → 6)',t0.explAmmo===6);
  tf2ApplyPup(t0,PUP_TYPES[idIdx('aim')]); ok('AUTO-AIM sets an 8s timer',t0.aimT===8);

  // ── respawn rule: ammo persists, timed buff resets ──
  t0.explAmmo=4;t0.pierceAmmo=2;t0.aimT=5;tf2Respawn(0);
  ok('respawn: ammo persists (expl 4, pierce 2), aim resets',tf2.tanks[0].explAmmo===4&&tf2.tanks[0].pierceAmmo===2&&tf2.tanks[0].aimT===0);

  // ── shoot consumes ammo + flags the bullet ──
  const t=tf2.tanks[0];tf2.bullets.length=0;t.explAmmo=3;t.pierceAmmo=0;t.aimT=0;tf2Shoot(0);
  ok('shoot consumes 1 explosive ('+t.explAmmo+') and flags the bullet',t.explAmmo===2&&tf2.bullets[tf2.bullets.length-1].expl===true);

  // ── AUTO-AIM snaps the launch angle to the foe (independent of heading) ──
  tf2.bullets.length=0;t.explAmmo=0;t.aimT=8;t.h=0;t.x=600;t.y=300;const foeT=tf2.tanks[1];foeT.x=600;foeT.y=120; // foe straight up
  tf2Shoot(0);const bAim=tf2.bullets[tf2.bullets.length-1];const wantA=Math.atan2(foeT.y-t.y,foeT.x-t.x),gotA=Math.atan2(bAim.vy,bAim.vx);
  ok('AUTO-AIM snaps to the foe (Δang='+Math.abs(gotA-wantA).toFixed(3)+')',Math.abs(gotA-wantA)<0.02);
  t.aimT=0;

  // ── EXPLOSION AoE damages a nearby foe, owner-immune ──
  const fa=tf2.tanks[1];fa.x=500;fa.y=300;fa.hp=3;fa.inv=0;fa.shield=false;const hp0=fa.hp;
  tf2.tanks[0].x=900;tf2.tanks[0].y=300;tf2.tanks[0].hp=3;tf2.tanks[0].inv=0;const ohp0=tf2.tanks[0].hp;tf2.blasts.length=0;
  tf2Explode(500+20,300,0); // blast next to the foe, far from owner
  ok('EXPLOSION AoE damages the nearby foe',fa.hp===hp0-1);
  ok('EXPLOSION is owner-immune',tf2.tanks[0].hp===ohp0);
  ok('EXPLOSION spawns a blast ring',tf2.blasts.length>0);

  // ── PIERCING passes through an obstacle, then dies at the bound ──
  startTank(1); // CENTER PILLAR (obstacle ~x540-660, y230-410)
  const f1=tf2.tanks[1];f1.x=60;f1.y=60; // foe parked out of the lane
  tf2.bullets.length=0;
  tf2.bullets.push({x:500,y:320,vx:600,vy:0,owner:0,id:999,expl:false,pierce:true,hitSet:[]});
  for(let i=0;i<24;i++)updateP2Tank(1/60); // cross fully past the pillar (x540-660)
  const pb=tf2.bullets.find(b=>b.id===999);
  ok('PIERCING survives crossing an obstacle (x='+(pb?pb.x.toFixed(0):'gone')+')',!!pb&&pb.x>670);
  for(let i=0;i<200&&tf2.bullets.find(b=>b.id===999);i++)updateP2Tank(1/60);
  ok('PIERCING still dies at the arena bound',!tf2.bullets.find(b=>b.id===999));

  // ── PIERCING damages a tank only ONCE across the overlap window ──
  startTank(0);const fp=tf2.tanks[1];fp.x=600;fp.y=320;fp.hp=3;fp.inv=0;fp.lives=3;const fphp=fp.hp;
  tf2.bullets.length=0;
  tf2.bullets.push({x:540,y:320,vx:600,vy:0,owner:0,id:998,expl:false,pierce:true,hitSet:[]});
  for(let i=0;i<10;i++){fp.x=600;fp.y=320;fp.inv=0;updateP2Tank(1/60);}
  ok('PIERCING hits a tank exactly once (hp '+fphp+'→'+fp.hp+')',fp.hp===fphp-1);

  // ── MACHINE GUN converts a banked stack into a TIMED full-auto barrage (~MG_BURST_PER s/round), not one-per-shot ──
  startTank(0);machineGun=2;const tg=tf2.tanks[0];tg.explAmmo=3;tg.explBurstT=0;tg.reload=0;tg.stunT=0;tg.h=0;tg.x=600;tg.y=320;
  tf2.bullets.length=0;tf2Shoot(0); // first MG shot banks the stack into a burst
  ok('MACHINE GUN banks the stack into a ~3s barrage (burst='+tg.explBurstT.toFixed(1)+', ammo='+tg.explAmmo+')',tg.explAmmo===0&&Math.abs(tg.explBurstT-3*MG_BURST_PER)<0.01&&tf2.bullets[0].expl===true);
  // during the barrage every MG shot is explosive without consuming ammo
  tf2.bullets.length=0;tf2Shoot(0);
  ok('barrage shots stay explosive while the timer runs',tf2.bullets[0].expl===true&&tg.explBurstT>0);
  machineGun=0;

  console.log('--- tank-pickups: '+P+' pass, '+F+' fail ---');
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
