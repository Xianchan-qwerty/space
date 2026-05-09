/* =====================================================
   Star Siege - game.js
   Undertale-style free movement | 5 Levels | Debuffs | Powerups | Bosses
   ===================================================== */

// ── DOM ──────────────────────────────────────────────
const canvas       = document.getElementById('gameCanvas');
const ctx          = canvas.getContext('2d');
const startScreen  = document.getElementById('startScreen');
const gameScreen   = document.getElementById('gameScreen');
const gameOverScr  = document.getElementById('gameOverScreen');
const scoreDisp    = document.getElementById('scoreDisplay');
const levelDisp    = document.getElementById('levelDisplay');
const livesDisp    = document.getElementById('livesDisplay');
const finalScore   = document.getElementById('finalScore');
const finalLevel   = document.getElementById('finalLevel');
const finalHSEl    = document.getElementById('finalHighScore');
const newHSBadge   = document.getElementById('newHighScore');
const hsDisplay    = document.getElementById('highScoreDisplay');
const levelFlash   = document.getElementById('levelUpFlash');
const pauseOverlay = document.getElementById('pauseOverlay');
const canvasWrap   = document.querySelector('.canvas-wrapper');

// ── Canvas size ──────────────────────────────────────
const CW = 480, CH = 520;
function resizeCanvas(){ canvas.width=CW; canvas.height=CH; }

// ── Level config (5 levels) ──────────────────────────
const LEVELS = {
    1:{ speed:1.0, spawnMs:1800, killsNeeded:10, pts:10,  bossHp:18,  label:'SCOUT WAVE' },
    2:{ speed:1.8, spawnMs:1100, killsNeeded:20, pts:20,  bossHp:35,  label:'FIGHTER WAVE' },
    3:{ speed:2.6, spawnMs:750,  killsNeeded:30, pts:30,  bossHp:55,  label:'ASSAULT WAVE' },
    4:{ speed:3.5, spawnMs:500,  killsNeeded:40, pts:50,  bossHp:80,  label:'SIEGE WAVE' },
    5:{ speed:5.0, spawnMs:350,  killsNeeded:Infinity, pts:80, bossHp:120, label:'OMEGA WAVE' }
};

// ── Ship designs (5 levels) ──────────────────────────
const SHIPS = {
    1:{ name:'SCOUT',        body:'#00d4ff', wing:'#7b2fff', wing2:'#5522cc', cock:'#c0f0ff', eng:'#ff7700', sz:1.0,  triple:false, desc:'Light scout — agile and swift' },
    2:{ name:'FIGHTER',      body:'#00ff99', wing:'#ff6600', wing2:'#cc3300', cock:'#ffffc0', eng:'#ff2200', sz:1.18, triple:false, desc:'Battle fighter — reinforced hull' },
    3:{ name:'INTERCEPTOR',  body:'#ffaa00', wing:'#ff3300', wing2:'#991100', cock:'#fffff0', eng:'#ff9900', sz:1.28, triple:true,  desc:'Interceptor — triple cannon unlocked' },
    4:{ name:'DREADNOUGHT',  body:'#ff44aa', wing:'#ffcc00', wing2:'#ff8800', cock:'#ffffff', eng:'#00ffff', sz:1.42, triple:true,  desc:'Dreadnought — quad-core engines' },
    5:{ name:'APEX TITAN',   body:'#cc44ff', wing:'#ff00ff', wing2:'#8800ff', cock:'#ffffff', eng:'#00ffff', sz:1.58, triple:true,  desc:'Apex Titan — final form, maximum power' }
};

// ── Debuff definitions ───────────────────────────────
// Each debuff fires once on player then fades
const DEBUFFS = {
    slow:      { label:'SLOW',       icon:'🐢', color:'#88aaff', desc:'Movement speed halved',       dur:300 },
    reverse:   { label:'REVERSED',   icon:'🔄', color:'#ff8800', desc:'Controls reversed!',           dur:180 },
    noshoot:   { label:'JAMMED',     icon:'🚫', color:'#ff3333', desc:'Weapons jammed',               dur:240 },
    bigplayer: { label:'OVERSIZED',  icon:'⬛', color:'#ffcc00', desc:'Collision box doubled',        dur:360 },
    blindness: { label:'BLIND',      icon:'👁', color:'#333355', desc:'Partial screen blackout',      dur:200 },
    rapidenemy:{ label:'ENRAGED',    icon:'💢', color:'#ff0055', desc:'Enemies 2× faster temporarily',dur:300 }
};

// ── Powerup definitions ──────────────────────────────
const POWERUP_TYPES = {
    shield:    { color:'#00aaff', glow:'#0088ff', label:'SHIELD',      icon:'🛡', dur:0   },
    rapidfire: { color:'#ffcc00', glow:'#ffaa00', label:'RAPID FIRE',  icon:'⚡', dur:300 },
    tripleshot:{ color:'#ff44ff', glow:'#cc00cc', label:'TRIPLE SHOT', icon:'💠', dur:360 },
    extralife: { color:'#ff3c5a', glow:'#ff0033', label:'+1 LIFE',     icon:'❤', dur:0   },
    bomb:      { color:'#ff8800', glow:'#ff5500', label:'BOMB',        icon:'💣', dur:0   },
    cleanse:   { color:'#00ffcc', glow:'#00ddaa', label:'CLEANSE',     icon:'✨', dur:0   }  // removes all debuffs
};
const PU_WEIGHTS = { shield:28, rapidfire:22, tripleshot:18, extralife:8, bomb:14, cleanse:10 };

let upgradeStats = JSON.parse(localStorage.getItem('starSiegeUpgrades')) || { speed:0, fire:0, lives:0 };

// ── Game state ───────────────────────────────────────
let state = {};
function resetState(){
    state = {
        score:0, level:1, lives:3 + upgradeStats.lives, kills:0, totalKills:0,
        paused:false, over:false, levelingUp:false, running:false,
        animId:null, spawnTimer:0, puSpawnTimer:0, puInterval:9000,
        bossPhase:false, bossDefeated:false,
        // Powerup timers (frames)
        shield:false, rapidfire:0, tripleshot:0,
        // Active debuffs: { type, framesLeft }
        debuffs:[]
    };
}

// ── Objects ──────────────────────────────────────────
let player={}, bullets=[], enemies=[], particles=[], stars=[];
let boss=null, bossBullets=[], powerups=[], debuffDrops=[];
let upgradeFlash=null, puBanner=null, debuffBanner=null;

// ── Keys held ────────────────────────────────────────
const keys = { ArrowLeft:false, ArrowRight:false, ArrowUp:false, ArrowDown:false, ' ':false, p:false };

// ── Player init ──────────────────────────────────────
function initPlayer(){
    player = {
        x:CW/2, y:CH-55,
        w:36, h:36,
        baseSpeed:4.0 + (upgradeStats.speed * 0.4),
        design:SHIPS[1],
        level:1,
        shootCooldown:0,
        baseCooldown:18 - (upgradeStats.fire * 1.5),
        shooting:false,
        invincible:false,
        invTimer:0,
        blinkTimer:0,
        // mobile overrides
        mLeft:false, mRight:false, mUp:false, mDown:false, mFire:false
    };
}

function upgradePlayerShip(lv){
    const d = SHIPS[lv]||SHIPS[5];
    player.design = d;
    player.level  = lv;
    player.w      = Math.round(36*d.sz);
    player.h      = Math.round(36*d.sz);
    player.baseCooldown = 18 - (lv-1)*2;
    upgradeFlash  = { name:d.name, desc:d.desc, timer:220 };
}

// ── Stars ────────────────────────────────────────────
function initStars(){
    stars=[];
    for(let i=0;i<90;i++) stars.push({ x:Math.random()*CW, y:Math.random()*CH, r:Math.random()*1.5+0.3, speed:Math.random()*0.6+0.2, alpha:Math.random()*0.7+0.3 });
}

// ── Debuff helpers ───────────────────────────────────
function hasDebuff(type){ return state.debuffs.some(d=>d.type===type); }
function addDebuff(type){
    // Don't stack same debuff
    if(hasDebuff(type)) return;
    const def = DEBUFFS[type];
    state.debuffs.push({ type, framesLeft:def.dur });
    debuffBanner = { label:def.label, icon:def.icon, color:def.color, desc:def.desc, timer:160 };
    playSound('debuff');
}
function clearAllDebuffs(){ state.debuffs=[]; }
function tickDebuffs(){
    state.debuffs = state.debuffs.filter(d=>{ d.framesLeft--; return d.framesLeft>0; });
}

// ── Effective player speed/size with debuffs ─────────
function effectiveSpeed(){
    let s = player.baseSpeed;
    if(hasDebuff('slow')) s *= 0.45;
    return s;
}
function effectiveW(){ return hasDebuff('bigplayer') ? player.w*1.9 : player.w; }
function effectiveH(){ return hasDebuff('bigplayer') ? player.h*1.9 : player.h; }

// ── Shoot ─────────────────────────────────────────────
function shootBullet(){
    if(hasDebuff('noshoot')) return;
    const isLaser = state.rapidfire>0 && state.tripleshot>0;
    
    if(isLaser){
        bullets.push({ x:player.x, y:player.y-player.h, w:14, h:45, speed:16, isLaser:true });
        playSound('laser');
    } else {
        const useTriple = player.design.triple || state.tripleshot>0;
        const offsets = useTriple ? [-11,0,11] : [0];
        offsets.forEach(off=>{
            bullets.push({ x:player.x+off, y:player.y-player.h/2, w:4, h:13, speed:9, isLaser:false });
        });
        playSound('shoot');
    }
}

// ── Spawn enemy ──────────────────────────────────────
function spawnEnemy(){
    if(state.bossPhase) return;
    const cfg = LEVELS[state.level];
    const lvl = state.level;
    const size = 26+Math.random()*12;
    // Higher levels get enemy variants
    let type = 'basic';
    if(lvl>=3 && Math.random()<0.25) type='fast';
    if(lvl>=4 && Math.random()<0.2)  type='zigzag';
    if(lvl>=5 && Math.random()<0.15) type='shooter'; // enemies that shoot back

    const enraged = hasDebuff('rapidenemy');
    enemies.push({
        x:Math.random()*(CW-size*2)+size,
        y:-size,
        w:size, h:size,
        speed:(cfg.speed+Math.random()*0.6)*(enraged?2:1),
        type, hp:1,
        zigDir:1, zigTimer:0,
        shootTimer:0
    });
}

// ── Spawn boss ───────────────────────────────────────
function spawnBoss(lv){
    const cfg=LEVELS[lv], size=55+(lv-1)*10;
    boss={ x:CW/2, y:-size, w:size, h:size, targetY:75, speed:1.4, hp:cfg.bossHp, maxHp:cfg.bossHp, moveDir:1, shootTimer:0, level:lv, entering:true };
    state.bossPhase=true; enemies=[]; bullets=[]; bossBullets=[];
    playSound('bossAlert');
}

// ── Spawn powerup ─────────────────────────────────────
function spawnPowerup(x,y){
    const keys=Object.keys(PU_WEIGHTS), total=keys.reduce((s,k)=>s+PU_WEIGHTS[k],0);
    let r=Math.random()*total, type=keys[0];
    for(const k of keys){ r-=PU_WEIGHTS[k]; if(r<=0){type=k;break;} }
    const def=POWERUP_TYPES[type];
    powerups.push({ x:x||Math.random()*(CW-60)+30, y:y||-24, w:26, h:26, speed:1.5+Math.random()*0.5, type, def, wobble:Math.random()*Math.PI*2 });
}

// ── Spawn debuff drop ─────────────────────────────────
function spawnDebuffDrop(){
    const types = Object.keys(DEBUFFS);
    // Level-gate: more dangerous debuffs at higher levels
    const avail = types.filter(t=>{
        if(t==='noshoot'||t==='blindness'||t==='rapidenemy') return state.level>=3;
        if(t==='bigplayer') return state.level>=2;
        return true;
    });
    const type = avail[Math.floor(Math.random()*avail.length)];
    const def  = DEBUFFS[type];
    debuffDrops.push({ x:Math.random()*(CW-60)+30, y:-24, w:26, h:26, speed:1.3+Math.random()*0.4, type, def, wobble:Math.random()*Math.PI*2 });
}

// ── Particles ─────────────────────────────────────────
function spawnExplosion(x,y,color,count){
    const n=count||12;
    for(let i=0;i<n;i++){
        const a=(Math.PI*2/n)*i+Math.random()*0.5;
        particles.push({ x,y, vx:Math.cos(a)*(1.5+Math.random()*3), vy:Math.sin(a)*(1.5+Math.random()*3), life:1, decay:0.03+Math.random()*0.025, r:2+Math.random()*4, color:color||'#ff9933' });
    }
}

// ── Update ────────────────────────────────────────────
function update(dt){
    if(state.paused||state.over||state.levelingUp) return;

    tickDebuffs();

    // Player movement (Undertale-style: free 4-directional)
    const spd = effectiveSpeed();
    const rev = hasDebuff('reverse') ? -1 : 1;
    const mLeft  = keys.ArrowLeft  || player.mLeft;
    const mRight = keys.ArrowRight || player.mRight;
    const mUp    = keys.ArrowUp    || player.mUp;
    const mDown  = keys.ArrowDown  || player.mDown;
    const fire   = keys[' ']       || player.mFire || player.shooting;

    if(mLeft)  player.x -= spd * rev;
    if(mRight) player.x += spd * rev;
    if(mUp)    player.y -= spd * rev;
    if(mDown)  player.y += spd;  // down always goes down (escape route)

    // Clamp inside canvas
    const ew=effectiveW()/2, eh=effectiveH()/2;
    player.x = Math.max(ew, Math.min(CW-ew, player.x));
    player.y = Math.max(eh, Math.min(CH-eh, player.y));

    // Shoot
    const cooldown = state.rapidfire>0 ? Math.floor(player.baseCooldown/2) : player.baseCooldown;
    if(fire && player.shootCooldown<=0){ shootBullet(); player.shootCooldown=cooldown; }
    if(player.shootCooldown>0) player.shootCooldown--;

    // Powerup timers
    if(state.rapidfire>0)  state.rapidfire--;
    if(state.tripleshot>0) state.tripleshot--;

    // Invincibility
    if(player.invincible){ player.invTimer--; player.blinkTimer++; if(player.invTimer<=0) player.invincible=false; }

    // Bullets move up
    for(let i=bullets.length-1;i>=0;i--){ bullets[i].y-=bullets[i].speed; if(bullets[i].y<-20) bullets.splice(i,1); }

    // Boss or enemy phase
    if(state.bossPhase && boss) updateBoss(dt);
    else {
        state.spawnTimer+=dt;
        if(state.spawnTimer>=LEVELS[state.level].spawnMs){ spawnEnemy(); state.spawnTimer=0; }
        updateEnemies();
    }

    // Powerup & debuff drop spawning
    state.puSpawnTimer+=dt;
    if(state.puSpawnTimer>=state.puInterval){ spawnPowerup(); state.puSpawnTimer=0; state.puInterval=7000+Math.random()*5000; }

    // Debuff drops every 6–10s (level 2+)
    if(state.level>=2){
        if(!state.debuffSpawnTimer) state.debuffSpawnTimer=0;
        state.debuffSpawnTimer+=dt;
        const di = 6000 - state.level*400;
        if(state.debuffSpawnTimer>=(di<2500?2500:di)){ spawnDebuffDrop(); state.debuffSpawnTimer=0; }
    }

    updatePowerups();
    updateDebuffDrops();
    bulletEnemyCollision();

    // Particles
    for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay; if(p.life<=0) particles.splice(i,1); }
    // Stars
    for(const s of stars){ s.y+=s.speed; if(s.y>CH){s.y=0;s.x=Math.random()*CW;} }

    // Banner timers
    if(upgradeFlash){ upgradeFlash.timer--; if(upgradeFlash.timer<=0) upgradeFlash=null; }
    if(puBanner)    { puBanner.timer--;     if(puBanner.timer<=0)     puBanner=null; }
    if(debuffBanner){ debuffBanner.timer--; if(debuffBanner.timer<=0) debuffBanner=null; }

    updateHUD();
}

// ── Update enemies ────────────────────────────────────
function updateEnemies(){
    const enraged = hasDebuff('rapidenemy');
    for(let i=enemies.length-1;i>=0;i--){
        const e=enemies[i];
        e.y+=e.speed*(enraged?1.8:1);

        // Zigzag movement
        if(e.type==='zigzag'){
            e.zigTimer++;
            if(e.zigTimer>45){ e.zigDir*=-1; e.zigTimer=0; }
            e.x+=e.zigDir*2;
            e.x=Math.max(e.w/2,Math.min(CW-e.w/2,e.x));
        }
        // Shooter enemies fire down
        if(e.type==='shooter'){
            e.shootTimer++;
            if(e.shootTimer>80){ bossBullets.push({ x:e.x, y:e.y+e.h/2, vx:0, vy:3, w:7, h:7, aimed:false }); e.shootTimer=0; }
        }

        if(e.y>CH+e.h){ enemies.splice(i,1); continue; }

        const ew2=effectiveW()/2, eh2=effectiveH()/2;
        if(!player.invincible && rectsOverlap(e.x-e.w/2,e.y-e.h/2,e.w,e.h, player.x-ew2,player.y-eh2,effectiveW(),effectiveH())){
            spawnExplosion(e.x,e.y,'#ff3c5a'); enemies.splice(i,1); playerHit(); continue;
        }
    }
}

// ── Update boss ───────────────────────────────────────
function updateBoss(dt){
    if(!boss) return;
    if(boss.entering){ boss.y+=boss.speed; if(boss.y>=boss.targetY){boss.y=boss.targetY;boss.entering=false;} return; }
    const p2=boss.hp<boss.maxHp*0.5;
    boss.x+=boss.speed*boss.moveDir*(p2?1.7:1.0);
    if(boss.x>CW-boss.w/2){boss.x=CW-boss.w/2;boss.moveDir=-1;}
    if(boss.x<boss.w/2){boss.x=boss.w/2;boss.moveDir=1;}
    boss.shootTimer++;
    if(boss.shootTimer>=(p2?48:85)){bossShoot(p2);boss.shootTimer=0;}

    // Boss bullets
    for(let i=bossBullets.length-1;i>=0;i--){
        const b=bossBullets[i]; b.x+=b.vx; b.y+=b.vy;
        if(b.y>CH+20||b.x<-20||b.x>CW+20){bossBullets.splice(i,1);continue;}
        const ew2=effectiveW()/2, eh2=effectiveH()/2;
        if(!player.invincible && rectsOverlap(b.x-b.w/2,b.y-b.h/2,b.w,b.h, player.x-ew2,player.y-eh2,effectiveW(),effectiveH())){
            spawnExplosion(b.x,b.y,'#ff3c5a',6); bossBullets.splice(i,1); playerHit(); continue;
        }
    }
    // Player bullets vs boss
    for(let i=bullets.length-1;i>=0;i--){
        if(rectsOverlap(bullets[i].x-bullets[i].w/2,bullets[i].y-bullets[i].h/2,bullets[i].w,bullets[i].h, boss.x-boss.w/2,boss.y-boss.h/2,boss.w,boss.h)){
            spawnExplosion(bullets[i].x,bullets[i].y,'#ffcc00',5); bullets.splice(i,1); boss.hp--; playSound('bossHit');
            if(boss.hp<=0){defeatBoss();return;} break;
        }
    }
    if(!player.invincible){
        const ew2=effectiveW()/2, eh2=effectiveH()/2;
        if(rectsOverlap(boss.x-boss.w/2,boss.y-boss.h/2,boss.w,boss.h, player.x-ew2,player.y-eh2,effectiveW(),effectiveH())) playerHit();
    }
}

function bossShoot(p2){
    if(!boss) return;
    const bx=boss.x, by=boss.y+boss.h*0.4;
    const angles=p2?[-0.7,-0.35,0,0.35,0.7]:[-0.3,0,0.3];
    angles.forEach(a=>bossBullets.push({ x:bx, y:by, vx:Math.sin(a)*(p2?4.2:3.5), vy:p2?4.2:3.5, w:7,h:7,aimed:false }));
    if(p2 && player){ const dx=player.x-bx,dy=player.y-by,dist=Math.sqrt(dx*dx+dy*dy)||1; bossBullets.push({ x:bx,y:by, vx:dx/dist*5,vy:dy/dist*5, w:9,h:9,aimed:true }); }

    // Boss drops debuff at phase 2
    if(p2 && Math.random()<0.3) spawnDebuffDrop();
    playSound('bossShoot');
}

function defeatBoss(){
    spawnExplosion(boss.x,boss.y,'#ffcc00',35);
    spawnExplosion(boss.x-20,boss.y+10,'#ff4400',20);
    spawnExplosion(boss.x+20,boss.y-10,'#ff9900',20);
    playSound('bossExplode');
    state.score+=LEVELS[state.level].pts*10;
    spawnPowerup(boss.x,boss.y);
    boss=null; bossBullets=[]; state.bossPhase=false; state.bossDefeated=true;
    if(state.level<5) triggerLevelUp();
}

// ── Bullet-enemy collision ────────────────────────────
function bulletEnemyCollision(){
    for(let b=bullets.length-1;b>=0;b--){
        for(let e=enemies.length-1;e>=0;e--){
            if(rectsOverlap(bullets[b].x-bullets[b].w/2,bullets[b].y-bullets[b].h/2,bullets[b].w,bullets[b].h, enemies[e].x-enemies[e].w/2,enemies[e].y-enemies[e].h/2,enemies[e].w,enemies[e].h)){
                spawnExplosion(enemies[e].x,enemies[e].y); enemies.splice(e,1); bullets.splice(b,1); killEnemy(); playSound('explode'); break;
            }
        }
    }
}

// ── Update powerups ───────────────────────────────────
function updatePowerups(){
    for(let i=powerups.length-1;i>=0;i--){
        const pu=powerups[i]; pu.y+=pu.speed; pu.wobble+=0.06; pu.x+=Math.sin(pu.wobble)*0.4;
        if(pu.y>CH+30){powerups.splice(i,1);continue;}
        if(rectsOverlap(pu.x-pu.w/2,pu.y-pu.h/2,pu.w,pu.h, player.x-effectiveW()/2,player.y-effectiveH()/2,effectiveW(),effectiveH())){
            applyPowerup(pu); spawnExplosion(pu.x,pu.y,pu.def.color,8); powerups.splice(i,1);
        }
    }
}

// ── Update debuff drops ───────────────────────────────
function updateDebuffDrops(){
    for(let i=debuffDrops.length-1;i>=0;i--){
        const d=debuffDrops[i]; d.y+=d.speed; d.wobble+=0.05; d.x+=Math.sin(d.wobble)*0.35;
        if(d.y>CH+30){debuffDrops.splice(i,1);continue;}
        if(!player.invincible && rectsOverlap(d.x-d.w/2,d.y-d.h/2,d.w,d.h, player.x-effectiveW()/2,player.y-effectiveH()/2,effectiveW(),effectiveH())){
            addDebuff(d.type); spawnExplosion(d.x,d.y,d.def.color,8); debuffDrops.splice(i,1);
        }
    }
}

// ── Apply powerup ─────────────────────────────────────
function applyPowerup(pu){
    const t=pu.type;
    puBanner={ label:pu.def.label, icon:pu.def.icon, timer:150 };
    playSound('powerup');
    if(t==='shield')    { state.shield=true; }
    else if(t==='rapidfire')  { state.rapidfire=pu.def.dur; }
    else if(t==='tripleshot') { state.tripleshot=pu.def.dur; }
    else if(t==='extralife')  { state.lives=Math.min(state.lives+1,5); updateHUD(); }
    else if(t==='cleanse')    { clearAllDebuffs(); }
    else if(t==='bomb'){
        enemies.forEach(e=>{ spawnExplosion(e.x,e.y,'#ff8800',10); state.score+=LEVELS[state.level].pts; });
        enemies=[]; debuffDrops=[];
        if(boss){ boss.hp=Math.max(1,boss.hp-Math.floor(boss.maxHp*0.3)); }
        shakeCanvas(); playSound('bomb');
    }
}

// ── Kill enemy ────────────────────────────────────────
function killEnemy(){
    const cfg=LEVELS[state.level];
    state.score+=cfg.pts; state.kills++; state.totalKills++;
    if(Math.random()<0.14) spawnPowerup();
    // Boss threshold
    if(state.level<5 && state.kills>=cfg.killsNeeded && !state.bossPhase && !state.bossDefeated) spawnBoss(state.level);
    if(state.level===5 && state.kills>0 && state.kills%30===0 && !state.bossPhase) spawnBoss(5);
}

// ── Player hit ────────────────────────────────────────
function playerHit(){
    if(state.shield){ state.shield=false; shakeCanvas(); playSound('shieldHit'); return; }
    state.lives--; player.invincible=true; player.invTimer=120; player.blinkTimer=0;
    shakeCanvas(); updateHUD(); playSound('hit');
    if(state.lives<=0) triggerGameOver();
}

// ── Level up ─────────────────────────────────────────
function triggerLevelUp(){
    state.level++; state.kills=0; state.bossDefeated=false; state.levelingUp=true;
    enemies=[]; bullets=[]; bossBullets=[]; debuffDrops=[];
    upgradePlayerShip(state.level);
    levelFlash.classList.add('show');
    setTimeout(()=>{ levelFlash.classList.remove('show'); state.levelingUp=false; },1800);
}

// ── Game over ─────────────────────────────────────────
function triggerGameOver(){
    state.over=true; state.running=false; cancelAnimationFrame(state.animId);
    const hs=parseInt(localStorage.getItem('starSiegeHS')||'0'), isNew=state.score>hs;
    if(isNew) localStorage.setItem('starSiegeHS',state.score);
    
    // Add score to coins
    let coins = parseInt(localStorage.getItem('starSiegeCoins')||'0');
    coins += state.score;
    localStorage.setItem('starSiegeCoins', coins);

    finalScore.textContent=state.score; finalLevel.textContent=state.level;
    finalHSEl.textContent=isNew?state.score:hs; newHSBadge.classList.toggle('d-none',!isNew);
    showScreen('gameOver');
}

// ── Collision helper ──────────────────────────────────
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){ return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by; }

// ═══════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════
function draw(){
    ctx.clearRect(0,0,CW,CH);
    ctx.fillStyle='#020810'; ctx.fillRect(0,0,CW,CH);

    // Blindness debuff — partial blackout overlays
    if(hasDebuff('blindness')){
        ctx.fillStyle='rgba(0,0,10,0.82)';
        ctx.fillRect(0,0,CW,CH*0.28);
        ctx.fillRect(0,CH*0.72,CW,CH*0.28);
    }

    // Stars
    for(const s of stars){ ctx.globalAlpha=s.alpha; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;

    if(state.bossPhase&&boss&&!boss.entering) drawBossHUD();

    for(const e of enemies) drawEnemy(e);
    if(boss) drawBoss(boss);
    for(const b of bossBullets) drawBossBullet(b);

    // Powerups
    for(const pu of powerups) drawOrb(pu.x,pu.y,pu.def.glow,pu.def.color,pu.def.icon,false);
    // Debuff drops (red tinted orbs with skull border)
    for(const d of debuffDrops) drawOrb(d.x,d.y,'#ff2244','#cc1133',d.def.icon,true);

    // Player bullets
    for(const b of bullets){ 
        ctx.save(); 
        if(b.isLaser) {
            ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; 
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);
            ctx.fillStyle = '#00ffff'; 
            ctx.fillRect(b.x-b.w/4,b.y-b.h/2,b.w/2,b.h);
        } else {
            ctx.shadowColor=player.design.body; ctx.shadowBlur=8; 
            ctx.fillStyle=player.design.body; 
            ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h); 
        }
        ctx.restore(); 
    }

    if(!player.invincible||Math.floor(player.blinkTimer/5)%2===0) drawPlayer();
    if(state.shield) drawShieldBubble();

    if(player.invincible){
        const pulse=0.4+0.4*Math.sin(player.blinkTimer*0.25);
        ctx.save(); ctx.globalAlpha=pulse; ctx.strokeStyle='#ff3c5a'; ctx.lineWidth=2; ctx.shadowColor='#ff3c5a'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(player.x,player.y,effectiveW()*0.55,0,Math.PI*2); ctx.stroke(); ctx.restore();
    }

    // Particles
    for(const p of particles){ ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;

    drawActivePowerupHUD();
    drawDebuffBar();
    if(upgradeFlash) drawUpgradeBanner();
    if(puBanner)     drawPuPickupBanner(puBanner.label,puBanner.icon,'#00ff99');
    if(debuffBanner) drawPuPickupBanner(debuffBanner.label+' — '+debuffBanner.desc,debuffBanner.icon,debuffBanner.color);
    if(state.bossPhase&&boss&&boss.entering) drawBossWarning();
}

// ── Draw falling orb (powerup or debuff drop) ─────────
function drawOrb(x,y,glowCol,fillCol,icon,isDebuff){
    const t=Date.now()*0.005;
    ctx.save();
    ctx.shadowColor=glowCol; ctx.shadowBlur=isDebuff?22:16;
    ctx.strokeStyle=glowCol; ctx.lineWidth=isDebuff?2.5:2;
    ctx.beginPath(); ctx.arc(x,y,14+Math.sin(t)*1.5,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle=fillCol; ctx.globalAlpha=0.88;
    ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
    ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(icon,x,y+1);
    if(isDebuff){ // red X mark
        ctx.strokeStyle='rgba(255,0,0,0.6)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(x-9,y-9); ctx.lineTo(x+9,y+9); ctx.moveTo(x+9,y-9); ctx.lineTo(x-9,y+9); ctx.stroke();
    }
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.restore();
}

// ── Active powerup icons (top-left) ──────────────────
function drawActivePowerupHUD(){
    const items=[];
    if(state.shield)        items.push({icon:'🛡',color:'#00aaff',label:'SHIELD'});
    if(state.rapidfire>0)   items.push({icon:'⚡',color:'#ffcc00',label:'x2'});
    if(state.tripleshot>0)  items.push({icon:'💠',color:'#ff44ff',label:'3x'});
    let ix=6;
    for(const it of items){
        ctx.save();
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(ix,4,54,20,5); ctx.fill();
        ctx.shadowColor=it.color; ctx.shadowBlur=6;
        ctx.font='11px serif'; ctx.fillText(it.icon,ix+3,19);
        ctx.font='700 9px Orbitron,monospace'; ctx.fillStyle=it.color;
        ctx.fillText(it.label,ix+18,18);
        ctx.restore(); ix+=58;
    }
}

// ── Debuff status bar (bottom of canvas, above mobile controls) ─
function drawDebuffBar(){
    if(state.debuffs.length===0) return;
    let ix=6;
    for(const d of state.debuffs){
        const def=DEBUFFS[d.type];
        const pct=d.framesLeft/def.dur;
        ctx.save();
        ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(ix,CH-28,70,22,5); ctx.fill();
        // Timer bar
        ctx.fillStyle=def.color; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.roundRect(ix,CH-28,70*pct,22,5); ctx.fill();
        ctx.globalAlpha=1;
        ctx.font='11px serif'; ctx.fillText(def.icon,ix+3,CH-11);
        ctx.font='700 8px Orbitron,monospace'; ctx.fillStyle='#ffffff';
        ctx.fillText(def.label.slice(0,6),ix+18,CH-11);
        ctx.restore(); ix+=76;
    }
}

// ── Pickup banner ─────────────────────────────────────
function drawPuPickupBanner(label,icon,color){
    const banner = puBanner||debuffBanner;
    if(!banner) return;
    const alpha=Math.min(1,banner.timer/30);
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,CH/2+55,CW,36);
    ctx.font='bold 20px serif'; ctx.textAlign='center';
    ctx.fillText(icon,CW/2-70,CH/2+80);
    ctx.font='800 12px Orbitron,monospace'; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
    ctx.fillText(label,CW/2+10,CH/2+80);
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.restore();
}

// ── Draw player ───────────────────────────────────────
function drawPlayer(){
    const d=player.design, sc=player.w/36;
    let x=player.x, y=player.y;
    
    // Multiple Debuff Glitch Effect
    if(state.debuffs.length >= 2){
        x += (Math.random()-0.5)*4;
        y += (Math.random()-0.5)*4;
        if(Math.random()<0.2) spawnExplosion(x, y, '#220022', 1);
    }
    
    ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.shadowBlur=16;

    // Oversized debuff hitbox indicator
    if(hasDebuff('bigplayer')){
        ctx.strokeStyle='rgba(255,200,0,0.4)'; ctx.lineWidth=2;
        const sw=(effectiveW()/sc), sh=(effectiveH()/sc);
        ctx.strokeRect(-sw/2,-sh/2,sw,sh);
    }

    if(d.name==='SCOUT'){
        ctx.shadowColor=d.body; ctx.fillStyle=d.body;
        ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(13,13); ctx.lineTo(7,6); ctx.lineTo(-7,6); ctx.lineTo(-13,13); ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing;
        ctx.beginPath(); ctx.moveTo(-7,4); ctx.lineTo(-19,17); ctx.lineTo(-5,10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(7,4);  ctx.lineTo(19,17);  ctx.lineTo(5,10);  ctx.closePath(); ctx.fill();
    } else if(d.name==='FIGHTER'){
        ctx.shadowColor=d.body; ctx.fillStyle=d.body;
        ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(10,8); ctx.lineTo(6,16); ctx.lineTo(-6,16); ctx.lineTo(-10,8); ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing;
        ctx.beginPath(); ctx.moveTo(-8,5); ctx.lineTo(-24,18); ctx.lineTo(-20,4); ctx.lineTo(-10,-2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8,5);  ctx.lineTo(24,18);  ctx.lineTo(20,4);  ctx.lineTo(10,-2);  ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing2; ctx.beginPath(); ctx.roundRect(-14,12,6,8,3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(8,12,6,8,3); ctx.fill();
    } else if(d.name==='INTERCEPTOR'){
        ctx.shadowColor=d.body; ctx.fillStyle=d.body;
        ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(8,5); ctx.lineTo(8,15); ctx.lineTo(-8,15); ctx.lineTo(-8,5); ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing;
        ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-26,14); ctx.lineTo(-22,2); ctx.lineTo(-10,-4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8,0);  ctx.lineTo(26,14);  ctx.lineTo(22,2);  ctx.lineTo(10,-4);  ctx.closePath(); ctx.fill();
        ctx.fillStyle='#cccccc'; ctx.fillRect(-11,-26,4,10); ctx.fillRect(-2,-28,4,12); ctx.fillRect(7,-26,4,10);
    } else if(d.name==='DREADNOUGHT'){
        ctx.shadowColor=d.body; ctx.fillStyle=d.body;
        ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(8,0); ctx.lineTo(8,14); ctx.lineTo(-8,14); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing2;
        ctx.beginPath(); ctx.moveTo(-8,-2); ctx.lineTo(-22,10); ctx.lineTo(-22,18); ctx.lineTo(-8,14); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8,-2);  ctx.lineTo(22,10);  ctx.lineTo(22,18);  ctx.lineTo(8,14);  ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing;
        ctx.beginPath(); ctx.moveTo(-8,-4); ctx.lineTo(-18,2); ctx.lineTo(-14,-8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8,-4);  ctx.lineTo(18,2);  ctx.lineTo(14,-8);  ctx.closePath(); ctx.fill();
        ctx.fillStyle='#cccccc'; ctx.fillRect(-10,-24,4,10); ctx.fillRect(-2,-26,4,12); ctx.fillRect(6,-24,4,10);
    } else { // APEX TITAN
        ctx.shadowColor=d.body; ctx.fillStyle=d.body;
        ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(10,0); ctx.lineTo(10,16); ctx.lineTo(-10,16); ctx.lineTo(-10,0); ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing2;
        ctx.beginPath(); ctx.moveTo(-10,-4); ctx.lineTo(-28,8); ctx.lineTo(-28,20); ctx.lineTo(-10,16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10,-4);  ctx.lineTo(28,8);  ctx.lineTo(28,20);  ctx.lineTo(10,16);  ctx.closePath(); ctx.fill();
        ctx.fillStyle=d.wing;
        ctx.beginPath(); ctx.moveTo(-10,-8); ctx.lineTo(-22,0); ctx.lineTo(-18,-12); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10,-8);  ctx.lineTo(22,0);  ctx.lineTo(18,-12);  ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ddddff';
        ctx.fillRect(-12,-28,4,11); ctx.fillRect(-4,-30,4,13); ctx.fillRect(4,-30,4,13); ctx.fillRect(8,-28,4,11);
        // Extra engine pods
        ctx.fillStyle=d.wing2;
        ctx.beginPath(); ctx.roundRect(-24,12,8,10,4); ctx.fill();
        ctx.beginPath(); ctx.roundRect(16,12,8,10,4);  ctx.fill();
    }

    // Cockpit
    ctx.shadowColor=d.cock; ctx.fillStyle=d.cock;
    ctx.beginPath(); ctx.ellipse(0,-6,5,8,0,0,Math.PI*2); ctx.fill();
    // Engine glow
    ctx.globalAlpha=0.7+0.3*Math.sin(Date.now()*0.02);
    ctx.shadowColor=d.eng; ctx.fillStyle=d.eng;
    ctx.beginPath(); ctx.ellipse(0,16,5,5,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;

    // Slow debuff — blue frost tint
    if(hasDebuff('slow')){ ctx.fillStyle='rgba(100,180,255,0.18)'; ctx.beginPath(); ctx.ellipse(0,0,22,28,0,0,Math.PI*2); ctx.fill(); }
    // Reverse debuff — orange swirl
    if(hasDebuff('reverse')){ ctx.strokeStyle='rgba(255,140,0,0.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.stroke(); }

    ctx.restore();
}

// ── Draw enemy ────────────────────────────────────────
function drawEnemy(e){
    const x=e.x,y=e.y,s=e.w*0.5;
    ctx.save();
    // Color by type
    const bodyColors={basic:'#cc1133',fast:'#ff6600',zigzag:'#aa00ff',shooter:'#ff00aa'};
    const eyeColors={basic:'#ffaa00',fast:'#ffff00',zigzag:'#ff88ff',shooter:'#ff4444'};
    ctx.shadowColor=bodyColors[e.type]||'#cc1133'; ctx.shadowBlur=10;
    ctx.fillStyle=bodyColors[e.type]||'#cc1133';
    ctx.beginPath();
    ctx.moveTo(x,y+s*0.5); ctx.lineTo(x-s*0.6,y-s*0.35); ctx.lineTo(x-s*0.25,y-s*0.1);
    ctx.lineTo(x,y-s*0.5); ctx.lineTo(x+s*0.25,y-s*0.1); ctx.lineTo(x+s*0.6,y-s*0.35);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=eyeColors[e.type]||'#ffaa00'; ctx.shadowColor=eyeColors[e.type]||'#ffaa00';
    ctx.beginPath(); ctx.arc(x,y,s*0.2,0,Math.PI*2); ctx.fill();
    // Shooter enemy indicator
    if(e.type==='shooter'){ ctx.strokeStyle='#ff00aa'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,s*0.7,0,Math.PI*2); ctx.stroke(); }
    ctx.restore();
}

// ── Draw boss ─────────────────────────────────────────
function drawBoss(b){
    const x=b.x,y=b.y,s=b.w*0.5,p2=b.hp<b.maxHp*0.5;
    ctx.save(); ctx.translate(x,y);
    const bossColors=[['#880033','#660022'],['#330066','#220044'],['#551100','#331100'],['#004455','#002233'],['#550055','#330033']];
    const bc=bossColors[b.level-1]||bossColors[0];
    ctx.shadowColor=p2?'#ff4400':bc[0]; ctx.shadowBlur=p2?30:18;
    ctx.fillStyle=p2?'#aa1100':bc[0];
    // Boss body varies by level
    if(b.level<=2){
        ctx.beginPath(); ctx.moveTo(0,-s*0.9); ctx.lineTo(s*0.55,-s*0.3); ctx.lineTo(s*0.7,s*0.5); ctx.lineTo(s*0.2,s*0.9); ctx.lineTo(-s*0.2,s*0.9); ctx.lineTo(-s*0.7,s*0.5); ctx.lineTo(-s*0.55,-s*0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle=bc[1];
        ctx.beginPath(); ctx.moveTo(-s*0.55,-s*0.2); ctx.lineTo(-s,s*0.1); ctx.lineTo(-s*0.8,s*0.55); ctx.lineTo(-s*0.65,s*0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s*0.55,-s*0.2);  ctx.lineTo(s,s*0.1);  ctx.lineTo(s*0.8,s*0.55);  ctx.lineTo(s*0.65,s*0.3);  ctx.closePath(); ctx.fill();
    } else if(b.level<=4){
        ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s*0.4,-s*0.5); ctx.lineTo(s*0.8,0); ctx.lineTo(s*0.4,s*0.5); ctx.lineTo(0,s*0.8); ctx.lineTo(-s*0.4,s*0.5); ctx.lineTo(-s*0.8,0); ctx.lineTo(-s*0.4,-s*0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle=bc[1];
        for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*s*0.18,-s*0.9); ctx.lineTo(i*s*0.18+s*0.08,0); ctx.lineTo(i*s*0.18-s*0.08,0); ctx.closePath(); ctx.fill(); }
    } else {
        ctx.fillRect(-s,-s*0.6,s*2,s*1.2);
        ctx.fillStyle=bc[1]; ctx.fillRect(-s*0.9,-s*0.8,s*0.28,s*0.28); ctx.fillRect(s*0.62,-s*0.8,s*0.28,s*0.28); ctx.fillRect(-s*0.15,-s*0.95,s*0.3,s*0.4);
        ctx.fillStyle=p2?'#882288':'#551155'; ctx.fillRect(-s,-s*0.1,s*2,s*0.2);
        ctx.fillStyle='#888'; [-s*0.78,-s*0.25,s*0.25,s*0.78].forEach(bx=>{ ctx.fillRect(bx-s*0.05,-s*0.92,s*0.1,s*0.35); });
    }
    const pulse=0.5+0.5*Math.sin(Date.now()*0.01);
    ctx.globalAlpha=pulse; ctx.fillStyle=p2?'#ffcc00':'#ff2244'; ctx.shadowColor=ctx.fillStyle;
    ctx.beginPath(); ctx.arc(0,0,s*0.2,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,s*0.08,0,Math.PI*2); ctx.fill();
    ctx.restore();
}

function drawBossBullet(b){ ctx.save(); ctx.shadowColor=b.aimed?'#ff00ff':'#ff6600'; ctx.shadowBlur=10; ctx.fillStyle=b.aimed?'#ff44ff':'#ff8800'; ctx.beginPath(); ctx.arc(b.x,b.y,b.w/2,0,Math.PI*2); ctx.fill(); ctx.restore(); }

function drawBossHUD(){
    if(!boss) return;
    const barW=CW*0.7,barH=12,bx=(CW-barW)/2,by=CH-28;
    const pct=Math.max(0,boss.hp/boss.maxHp),p2=boss.hp<boss.maxHp*0.5;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx-2,by-2,barW+4,barH+4);
    const bc=p2?'#ff4400':'#cc0044'; ctx.fillStyle=bc; ctx.shadowColor=bc; ctx.shadowBlur=8; ctx.fillRect(bx,by,barW*pct,barH); ctx.shadowBlur=0;
    ctx.strokeStyle='#ffffff44'; ctx.lineWidth=1; ctx.strokeRect(bx,by,barW,barH);
    const names={1:'THE CRUSHER',2:'VOID LEVIATHAN',3:'IRON SIEGE',4:'DARK OMEGA',5:'APEX DESTROYER'};
    ctx.fillStyle='#fff'; ctx.font='700 11px Orbitron,monospace'; ctx.textAlign='center';
    ctx.fillText(names[boss.level]+(p2?' — PHASE 2':''),CW/2,by-5); ctx.textAlign='left';
}

function drawShieldBubble(){
    const pulse=0.5+0.5*Math.sin(Date.now()*0.008);
    ctx.save(); ctx.globalAlpha=0.3+pulse*0.2; ctx.strokeStyle='#00aaff'; ctx.lineWidth=3; ctx.shadowColor='#00aaff'; ctx.shadowBlur=20;
    ctx.beginPath(); ctx.arc(player.x,player.y,effectiveW()*0.7,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(0,170,255,0.07)'; ctx.beginPath(); ctx.arc(player.x,player.y,effectiveW()*0.7,0,Math.PI*2); ctx.fill();
    ctx.restore();
}

function drawBossWarning(){
    const t=(Date.now()%600)<300?1:0.3;
    ctx.globalAlpha=t; ctx.fillStyle='#ff2244'; ctx.font='900 18px Orbitron,monospace'; ctx.textAlign='center';
    ctx.shadowColor='#ff2244'; ctx.shadowBlur=20; ctx.fillText('⚠ BOSS INCOMING ⚠',CW/2,CH/2+50);
    ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textAlign='left';
}

function drawUpgradeBanner(){
    if(!upgradeFlash) return;
    const alpha=Math.min(1,(upgradeFlash.timer)/200*4);
    ctx.globalAlpha=alpha; ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,CH/2-54,CW,80);
    ctx.textAlign='center'; ctx.fillStyle='#00ff99'; ctx.shadowColor='#00ff99'; ctx.shadowBlur=18;
    ctx.font='900 20px Orbitron,monospace'; ctx.fillText('SHIP UPGRADED: '+upgradeFlash.name,CW/2,CH/2-22);
    ctx.font='600 11px Rajdhani,sans-serif'; ctx.fillStyle='#aaffdd'; ctx.shadowBlur=6; ctx.fillText(upgradeFlash.desc,CW/2,CH/2+2);
    ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textAlign='left';
}

// ── Game loop ─────────────────────────────────────────
let lastTime=0;
function gameLoop(ts){ const dt=ts-lastTime; lastTime=ts; update(dt); draw(); if(state.running&&!state.over) state.animId=requestAnimationFrame(gameLoop); }
function updateHUD(){ scoreDisp.textContent=state.score; levelDisp.textContent=state.level; livesDisp.textContent='♥ '.repeat(state.lives).trim(); }
function showScreen(w){ startScreen.classList.remove('active'); gameScreen.classList.remove('active'); gameOverScr.classList.remove('active'); if(w==='start') startScreen.classList.add('active'); if(w==='game') gameScreen.classList.add('active'); if(w==='gameOver') gameOverScr.classList.add('active'); }
function shakeCanvas(){ canvasWrap.classList.add('shake'); setTimeout(()=>canvasWrap.classList.remove('shake'),350); }
const coinsDisplay = document.getElementById('coinsDisplay');
function loadStats(){ 
    hsDisplay.textContent=localStorage.getItem('starSiegeHS')||'0'; 
    if(coinsDisplay) coinsDisplay.textContent = localStorage.getItem('starSiegeCoins')||'0';
}

// ── Start / Restart ───────────────────────────────────
function startGame(){
    resetState(); initPlayer(); initStars();
    bullets=[]; enemies=[]; particles=[]; boss=null; bossBullets=[]; powerups=[]; debuffDrops=[]; upgradeFlash=null; puBanner=null; debuffBanner=null;
    resizeCanvas(); updateHUD(); loadStats(); showScreen('game');
    state.running=true; lastTime=performance.now(); state.animId=requestAnimationFrame(gameLoop);
}

// ── Pause ─────────────────────────────────────────────
function togglePause(){ if(state.over) return; state.paused=!state.paused; pauseOverlay.classList.toggle('active',state.paused); if(!state.paused){lastTime=performance.now();state.animId=requestAnimationFrame(gameLoop);} }

// ── Audio ─────────────────────────────────────────────
let audioCtx=null;
function getAC(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function playSound(type){
    try{
        const ac=getAC(),osc=ac.createOscillator(),g=ac.createGain(); osc.connect(g);g.connect(ac.destination);
        const s={
            laser:      ()=>{ osc.type='square';   osc.frequency.setValueAtTime(1200,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(600,ac.currentTime+0.1); g.gain.setValueAtTime(0.12,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.15); osc.start();osc.stop(ac.currentTime+0.15); },
            shoot:      ()=>{ osc.type='square';   osc.frequency.setValueAtTime(880,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(220,ac.currentTime+0.08); g.gain.setValueAtTime(0.08,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.08); osc.start();osc.stop(ac.currentTime+0.08); },
            explode:    ()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(200,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(40,ac.currentTime+0.2);  g.gain.setValueAtTime(0.12,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.2);  osc.start();osc.stop(ac.currentTime+0.2); },
            hit:        ()=>{ osc.type='sine';     osc.frequency.setValueAtTime(150,ac.currentTime);                                                                      g.gain.setValueAtTime(0.2, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.3);  osc.start();osc.stop(ac.currentTime+0.3); },
            powerup:    ()=>{ osc.type='sine';     osc.frequency.setValueAtTime(440,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(880,ac.currentTime+0.18); g.gain.setValueAtTime(0.12,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.2);  osc.start();osc.stop(ac.currentTime+0.2); },
            debuff:     ()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(300,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(80,ac.currentTime+0.25);  g.gain.setValueAtTime(0.15,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.3);  osc.start();osc.stop(ac.currentTime+0.3); },
            shieldHit:  ()=>{ osc.type='triangle';osc.frequency.setValueAtTime(600,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(200,ac.currentTime+0.15); g.gain.setValueAtTime(0.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.15); osc.start();osc.stop(ac.currentTime+0.15); },
            bomb:       ()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(120,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(20,ac.currentTime+0.6);   g.gain.setValueAtTime(0.25,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.6);  osc.start();osc.stop(ac.currentTime+0.6); },
            bossAlert:  ()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(80,ac.currentTime);  osc.frequency.linearRampToValueAtTime(200,ac.currentTime+0.4);       g.gain.setValueAtTime(0.18,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.5);  osc.start();osc.stop(ac.currentTime+0.5); },
            bossHit:    ()=>{ osc.type='square';   osc.frequency.setValueAtTime(440,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(180,ac.currentTime+0.1);  g.gain.setValueAtTime(0.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);  osc.start();osc.stop(ac.currentTime+0.1); },
            bossShoot:  ()=>{ osc.type='triangle'; osc.frequency.setValueAtTime(300,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(100,ac.currentTime+0.15); g.gain.setValueAtTime(0.09,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.15); osc.start();osc.stop(ac.currentTime+0.15); },
            bossExplode:()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(300,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(20,ac.currentTime+0.8);   g.gain.setValueAtTime(0.25,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.8);  osc.start();osc.stop(ac.currentTime+0.8); }
        };
        if(s[type]) s[type]();
    } catch(e){}
}

// ── Keyboard ──────────────────────────────────────────
document.addEventListener('keydown',e=>{
    if(e.key in keys){ e.preventDefault(); keys[e.key]=true; }
    if((e.key==='p'||e.key==='P')&&state.running) togglePause();
});
document.addEventListener('keyup',e=>{ if(e.key in keys) keys[e.key]=false; });

// ── Mobile buttons ────────────────────────────────────
function holdBtn(id,on,off){ const el=document.getElementById(id); if(!el) return; el.addEventListener('touchstart',ev=>{ev.preventDefault();on();},{passive:false}); el.addEventListener('touchend',ev=>{ev.preventDefault();off();},{passive:false}); el.addEventListener('touchcancel',ev=>{ev.preventDefault();off();},{passive:false}); el.addEventListener('mousedown',on); el.addEventListener('mouseup',off); el.addEventListener('mouseleave',off); }

holdBtn('btnLeft',  ()=>{player.mLeft=true;},  ()=>{player.mLeft=false;});
holdBtn('btnRight', ()=>{player.mRight=true;}, ()=>{player.mRight=false;});
holdBtn('btnFire',  ()=>{player.mFire=true;},  ()=>{player.mFire=false;});

// Up/Down mobile buttons (add to index.php if needed)
const btnUp   = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
if(btnUp)   holdBtn('btnUp',   ()=>{player.mUp=true;},   ()=>{player.mUp=false;});
if(btnDown) holdBtn('btnDown', ()=>{player.mDown=true;},  ()=>{player.mDown=false;});

// ── UI buttons ────────────────────────────────────────
document.getElementById('playBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
document.getElementById('menuBtn').addEventListener('click',()=>{ cancelAnimationFrame(state.animId); state.running=false; loadStats(); showScreen('start'); });
document.getElementById('pauseBtn').addEventListener('click',togglePause);
document.getElementById('resumeBtn').addEventListener('click',togglePause);

// Global Fullscreen
const globalFsBtn = document.getElementById('globalFullscreenBtn');
if(globalFsBtn){
    globalFsBtn.addEventListener('click', ()=>{
        const target = document.querySelector('.game-card');
        if (!document.fullscreenElement) {
            target.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// Fullscreen
document.getElementById('fullscreenBtn').addEventListener('click', ()=>{
    const target = document.querySelector('.game-card');
    if (!document.fullscreenElement) {
        target.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Reset High Score
document.getElementById('resetHsBtn').addEventListener('click', ()=>{
    if(confirm("Are you sure you want to reset your high score, coins, and upgrades?")){
        localStorage.removeItem('starSiegeHS');
        localStorage.removeItem('starSiegeCoins');
        localStorage.removeItem('starSiegeUpgrades');
        upgradeStats = { speed:0, fire:0, lives:0 };
        loadStats();
        updateUpgradeUI();
    }
});

// Continue Feature
const continueBtn = document.getElementById('continueBtn');
if(continueBtn){
    continueBtn.addEventListener('click', ()=>{
        // Reset score, keep level, reset lives
        state.score = 0;
        state.lives = 3 + upgradeStats.lives;
        state.paused = false;
        state.over = false;
        state.bossDefeated = false;
        state.bossPhase = false;
        boss = null;
        enemies=[]; bullets=[]; bossBullets=[]; particles=[]; powerups=[]; debuffDrops=[];
        clearAllDebuffs();
        state.shield=false; state.rapidfire=0; state.tripleshot=0;
        
        initPlayer(); // re-init to reset position
        upgradePlayerShip(state.level); // keep ship design for current level
        
        updateHUD();
        showScreen('game');
        state.running = true;
        lastTime = performance.now();
        state.animId = requestAnimationFrame(gameLoop);
    });
}

// ── Upgrades UI ───────────────────────────────────────
const UPGRADE_COSTS = { speed: [500, 1500, 3000, 5000], fire: [800, 2000, 4000, 8000], lives: [2000, 5000, 10000, 20000] };

function updateUpgradeUI(){
    const coins = parseInt(localStorage.getItem('starSiegeCoins')||'0');
    document.getElementById('upgradeCoinsDisplay').textContent = coins;
    
    ['speed', 'fire', 'lives'].forEach(k => {
        const lvl = upgradeStats[k];
        const max = UPGRADE_COSTS[k].length;
        document.getElementById(`lvl${k.charAt(0).toUpperCase() + k.slice(1)}`).textContent = lvl;
        const btn = document.getElementById(`buy${k.charAt(0).toUpperCase() + k.slice(1)}Btn`);
        const costEl = document.getElementById(`cost${k.charAt(0).toUpperCase() + k.slice(1)}`);
        
        if(lvl >= max){
            costEl.textContent = 'MAX';
            btn.disabled = true;
            btn.textContent = 'MAXED';
        } else {
            const cost = UPGRADE_COSTS[k][lvl];
            costEl.textContent = cost + ' pts';
            btn.disabled = coins < cost;
            btn.textContent = 'BUY';
        }
    });
}

['speed', 'fire', 'lives'].forEach(k => {
    const btn = document.getElementById(`buy${k.charAt(0).toUpperCase() + k.slice(1)}Btn`);
    if(btn){
        btn.addEventListener('click', ()=>{
            const coins = parseInt(localStorage.getItem('starSiegeCoins')||'0');
            const lvl = upgradeStats[k];
            if(lvl < UPGRADE_COSTS[k].length){
                const cost = UPGRADE_COSTS[k][lvl];
                if(coins >= cost){
                    localStorage.setItem('starSiegeCoins', coins - cost);
                    upgradeStats[k]++;
                    localStorage.setItem('starSiegeUpgrades', JSON.stringify(upgradeStats));
                    updateUpgradeUI();
                    loadStats();
                    playSound('powerup');
                }
            }
        });
    }
});

document.getElementById('upgradesBtn').addEventListener('click', updateUpgradeUI);

// ── Init ──────────────────────────────────────────────
window.addEventListener('load',()=>{
    resizeCanvas(); loadStats(); showScreen('start'); initStars();
    ctx.fillStyle='#020810'; ctx.fillRect(0,0,CW,CH);
    for(const s of stars){ ctx.globalAlpha=s.alpha; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
});