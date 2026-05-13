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

function addEventListenerCompat(el, event, handler, options) {
    try { el.addEventListener(event, handler, options); }
    catch (err) { el.addEventListener(event, handler, false); }
}

// ── Canvas size ──────────────────────────────────────
const CW = 480, CH = 520;
function resizeCanvas(){ canvas.width=CW; canvas.height=CH; }

// ── Level config (10 levels) ─────────────────────────
const LEVELS = {
    1:{ speed:1.0, spawnMs:1800, killsNeeded:10, pts:10,  bossHp:18,  label:'SCOUT WAVE',     bg:'#020810', bgGlow:'#00d4ff', bossType:'crusher', starCount:84 },
    2:{ speed:1.6, spawnMs:1600, killsNeeded:14, pts:14,  bossHp:28,  label:'FIGHTER WAVE',   bg:'#0a1020', bgGlow:'#7b2fff', bossType:'leviathan', starCount:92 },
    3:{ speed:2.0, spawnMs:1400, killsNeeded:18, pts:18,  bossHp:38,  label:'ASSAULT WAVE',   bg:'#12080a', bgGlow:'#ffaa00', bossType:'iron', starCount:98 },
    4:{ speed:2.4, spawnMs:1200, killsNeeded:20, pts:22,  bossHp:50,  label:'SIEGE WAVE',     bg:'#021008', bgGlow:'#00ff99', bossType:'dark', starCount:104 },
    5:{ speed:2.8, spawnMs:1000, killsNeeded:24, pts:26,  bossHp:64,  label:'OMEGA WAVE',     bg:'#100008', bgGlow:'#ff0055', bossType:'apex', starCount:110 },
    6:{ speed:3.2, spawnMs:900,  killsNeeded:26, pts:30,  bossHp:78,  label:'PHANTOM FOG',    bg:'#0b0f1e', bgGlow:'#6ae0ff', bossType:'spectre', starCount:116 },
    7:{ speed:3.6, spawnMs:820,  killsNeeded:28, pts:34,  bossHp:94,  label:'CRYSTAL STORM',  bg:'#0f0416', bgGlow:'#ff6cff', bossType:'crystal', starCount:122 },
    8:{ speed:4.0, spawnMs:760,  killsNeeded:30, pts:38,  bossHp:112, label:'NEON VOID',      bg:'#100010', bgGlow:'#3effd4', bossType:'void', starCount:128 },
    9:{ speed:4.4, spawnMs:700,  killsNeeded:32, pts:42,  bossHp:132, label:'MAELSTROM',      bg:'#120816', bgGlow:'#ff9a00', bossType:'maelstrom', starCount:134 },
   10:{ speed:4.8, spawnMs:640,  killsNeeded:36, pts:48,  bossHp:160, label:'APEX ASCENT',    bg:'#000000', bgGlow:'#ff2255', bossType:'ascendant', starCount:140 }
};

// ── Ship designs (10 levels) ─────────────────────────
const SHIPS = {
    1:{ name:'SCOUT',        body:'#00d4ff', wing:'#7b2fff', wing2:'#5522cc', cock:'#c0f0ff', eng:'#ff7700', sz:1.0,  triple:false, desc:'Light scout — agile and swift' },
    2:{ name:'FIGHTER',      body:'#00ff99', wing:'#ff6600', wing2:'#cc3300', cock:'#ffffc0', eng:'#ff2200', sz:1.1,  triple:false, desc:'Battle fighter — reinforced hull' },
    3:{ name:'INTERCEPTOR',  body:'#ffaa00', wing:'#ff3300', wing2:'#991100', cock:'#fffff0', eng:'#ff9900', sz:1.18, triple:true,  desc:'Interceptor — triple cannon unlocked' },
    4:{ name:'DREADNOUGHT',  body:'#ff44aa', wing:'#ffcc00', wing2:'#ff8800', cock:'#ffffff', eng:'#00ffff', sz:1.26, triple:true,  desc:'Dreadnought — quad-core engines' },
    5:{ name:'APEX TITAN',   body:'#cc44ff', wing:'#ff00ff', wing2:'#8800ff', cock:'#ffffff', eng:'#00ffff', sz:1.32, triple:true,  desc:'Apex Titan — final form, maximum power' },
    6:{ name:'PHANTOM',      body:'#7be6ff', wing:'#77aaff', wing2:'#4836ad', cock:'#ffffff', eng:'#88ffff', sz:1.38, triple:true, desc:'Phantom — swift and ghostly' },
    7:{ name:'CRYSTAL',      body:'#ff8cff', wing:'#ffc8ff', wing2:'#8c46ff', cock:'#ffffff', eng:'#e600ff', sz:1.44, triple:true, desc:'Crystal — jagged energy hull' },
    8:{ name:'NEON',         body:'#3effd4', wing:'#00ffd0', wing2:'#00aabb', cock:'#ffffff', eng:'#22ffff', sz:1.5,  triple:true, desc:'Neon — bright and fast' },
    9:{ name:'MAELSTROM',    body:'#ff9900', wing:'#ff4499', wing2:'#663399', cock:'#ffffff', eng:'#ffdd33', sz:1.56, triple:true, desc:'Maelstrom — chaotic energy surge' },
   10:{ name:'ASCENDANT',    body:'#ff2266', wing:'#ff77aa', wing2:'#662244', cock:'#ffffff', eng:'#ff4488', sz:1.62, triple:true, desc:'Ascendant — ultimate cosmic destroyer' }
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
    shield:    { color:'#00aaff', glow:'#0088ff', label:'SHIELD',      icon:'🛡', dur:180 },
    rapidfire: { color:'#ffcc00', glow:'#ffaa00', label:'RAPID FIRE',  icon:'⚡', dur:300 },
    tripleshot:{ color:'#ff44ff', glow:'#cc00cc', label:'TRIPLE SHOT', icon:'💠', dur:360 },
    extralife: { color:'#ff3c5a', glow:'#ff0033', label:'+1 LIFE',     icon:'❤', dur:0   },
    bomb:      { color:'#ff8800', glow:'#ff5500', label:'BOMB',        icon:'💣', dur:0   },
    cleanse:   { color:'#00ffcc', glow:'#00ddaa', label:'CLEANSE',     icon:'✨', dur:0   }  // removes all debuffs
    , magnet:  { color:'#66ffdd', glow:'#00ffaa', label:'MAGNET',      icon:'M', dur:420 }
};
const PU_WEIGHTS = { shield:24, rapidfire:20, tripleshot:17, extralife:7, bomb:13, cleanse:9, magnet:10 };
const LEADERBOARD_KEY = 'starSiegeLeaderboard';

function powerupSpawnIntervalForLevel(lv){
    return lv > 2 ? 3500 + Math.random()*2500 : 7000 + Math.random()*5000;
}

let upgradeStats = JSON.parse(localStorage.getItem('starSiegeUpgrades')) || { speed:0, fire:0, lives:0 };

// ── Game state ───────────────────────────────────────
let state = {};
function resetState(){
    state = {
        score:0, level:1, lives:3 + upgradeStats.lives, kills:0, totalKills:0,
        paused:false, over:false, levelingUp:false, running:false,
        animId:null, spawnTimer:0, puSpawnTimer:0, puInterval:powerupSpawnIntervalForLevel(1),
        bossPhase:false, bossDefeated:false,
        // Powerup timers (frames)
        shield:0, rapidfire:0, tripleshot:0, magnet:0,
        // Active debuffs: { type, framesLeft }
        debuffs:[]
    };
}

// ── Objects ──────────────────────────────────────────
let player={}, bullets=[], enemies=[], particles=[], stars=[];
let boss=null, bossBullets=[], powerups=[], debuffDrops=[];
let upgradeFlash=null, puBanner=null, debuffBanner=null;

// ── Keys held ────────────────────────────────────────
const keys = { ArrowLeft:false, ArrowRight:false, ArrowUp:false, ArrowDown:false, ' ':false, p:false, w:false, a:false, s:false, d:false, W:false, A:false, S:false, D:false };

// ── Player init ──────────────────────────────────────
function initPlayer(){
    player = {
        x:CW/2, y:CH-55,
        w:36, h:36,
        baseSpeed:5.0 + (upgradeStats.speed * 0.4),
        design:SHIPS[1],
        level:1,
        shootCooldown:0,
        baseCooldown:18 - (upgradeStats.fire * 1.5),
        shooting:false,
        invincible:false,
        invTimer:0,
        blinkTimer:0,
        // mobile overrides
        mLeft:false, mRight:false, mUp:false, mDown:false, mFire:false,
        jx:0, jy:0
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
    const cfg = LEVELS[state.level] || LEVELS[1];
    const count = cfg.starCount || 90;
    stars=[];
    for(let i=0;i<count;i++) stars.push({ x:Math.random()*CW, y:Math.random()*CH, r:Math.random()*1.5+0.3, speed:Math.random()*0.6+0.2, alpha:Math.random()*0.7+0.3 });
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
function visualClampW(){ return Math.max(effectiveW()/2, player.w*0.78); }
function visualClampH(){ return Math.max(effectiveH()/2, player.h*0.7); }
function shieldActive(){ return state.shield > 0; }

// ── Shoot ─────────────────────────────────────────────
function enemyHealthMultiplier(lv){
    if(lv <= 2) return 1;
    if(lv <= 5) return 1 + Math.floor((lv - 1) / 2);
    return 3 + Math.floor((lv - 6) / 2);
}

function bossHealthMultiplier(lv){
    const layers = [0, 1, 1, 3, 4, 5, 6, 7, 8, 10, 12];
    return layers[lv] || Math.max(1, lv);
}

function enemyBaseHealth(type){
    const hpByType = { basic:2, fast:2, alien:3, zigzag:3, shooter:3, gunship:4, swoop:3, crawler:4, burst:4, mine:4 };
    return hpByType[type] || 2;
}

function enemyShooterChance(lv){
    return Math.min(0.14 + lv * 0.025, 0.38);
}

function isBossPhaseTwo(){
    if(!boss) return false;
    if(boss.layersTotal <= 1) return boss.hp < boss.maxHp * 0.5;
    const halfwayLayer = Math.ceil(boss.layersTotal / 2);
    return boss.layersLeft <= halfwayLayer || boss.hp < boss.maxHp * 0.5;
}

function damageBoss(amount){
    if(!boss) return false;
    let dmg = Math.max(1, amount || 1);
    while(dmg > 0 && boss){
        boss.hp -= dmg;
        if(boss.hp > 0) return false;
        dmg = Math.abs(boss.hp);
        if(boss.layersLeft > 1){
            boss.layersLeft--;
            boss.hp = boss.maxHp;
            spawnExplosion(boss.x,boss.y,'#ffcc00',14);
            shakeCanvas();
            playSound('bossHit');
        } else {
            defeatBoss();
            return true;
        }
    }
    return false;
}

function shootBullet(){
    if(hasDebuff('noshoot')) return;
    const isLaser = state.rapidfire>0 && state.tripleshot>0;
    
    if(isLaser){
        bullets.push({ x:player.x, y:player.y-player.h, w:14, h:45, speed:16, isLaser:true });
        playSound('laser');
    } else {
        const useTriple = player.design.triple || state.tripleshot>0;
        const offsets = useTriple ? [-14,0,14] : [0];
        offsets.forEach(off=>{
            bullets.push({ x:player.x+off, y:player.y-player.h/2, w:6, h:18, speed:10, isLaser:false });
        });
        playSound('shoot');
    }
}

// ── Spawn enemy ──────────────────────────────────────
function spawnEnemy(){
    if(state.bossPhase) return;
    const cfg = LEVELS[state.level];
    const lvl = state.level;
    const size = 34+Math.random()*18;
    let type = 'basic';
    if(lvl>=2 && Math.random()<0.22) type='alien';
    if(lvl>=3 && Math.random()<0.24) type='fast';
    if(lvl>=4 && Math.random()<0.2)  type='zigzag';
    if(lvl>=5 && Math.random()<0.16) type='shooter';
    if(lvl>=5 && Math.random()<0.14) type='gunship';
    if(lvl>=6 && Math.random()<0.14) type='swoop';
    if(lvl>=7 && Math.random()<0.12) type='crawler';
    if(lvl>=8 && Math.random()<0.1)  type='burst';
    if(lvl>=9 && Math.random()<0.08)  type='mine';

    const enraged = hasDebuff('rapidenemy');
    let speed = cfg.speed + Math.random()*0.7;
    let hp = enemyBaseHealth(type);
    const hpMult = enemyHealthMultiplier(lvl);
    const canShoot = type === 'shooter' || type === 'alien' || type === 'gunship' || (type !== 'mine' && Math.random() < enemyShooterChance(lvl));
    const props = { zigDir:1, zigTimer:0, shootTimer:Math.floor(Math.random()*55), shootInterval:90+Math.random()*55, canShoot, orbitAngle:Math.random()*Math.PI*2, burstFired:false, armed:false, edgeDir:1 };
    switch(type){
        case 'fast': speed *= 1.7; break;
        case 'alien': speed *= 0.9; break;
        case 'zigzag': speed *= 1.05; break;
        case 'shooter': speed *= 0.95; break;
        case 'gunship': speed *= 0.75; break;
        case 'swoop': speed *= 1.1; break;
        case 'crawler': speed *= 0.55; break;
        case 'burst': speed *= 1.0; break;
        case 'mine':  speed *= 0.35; break;
    }
    hp *= hpMult;

    const enemy = {
        x:Math.random()*(CW-size*2)+size,
        y:-size,
        w:size, h:size,
        speed:(enraged?speed*1.8:speed),
        type, hp, maxHp:hp,
        baseX:0,
        ...props
    };
    enemy.baseX = enemy.x;
    enemies.push(enemy);
}

// ── Spawn boss ───────────────────────────────────────
function spawnBoss(lv){
    const cfg=LEVELS[lv], size=(55+(lv-1)*10)*1.18;
    const hpMultiplier = bossHealthMultiplier(lv);
    const hp = cfg.bossHp;
    boss={ x:CW/2, y:-size, w:size, h:size, targetY:75, speed:1.4, hp, maxHp:hp, hpMultiplier, layersTotal:hpMultiplier, layersLeft:hpMultiplier, moveDir:1, shootTimer:0, level:lv, entering:true };
    state.bossPhase=true; enemies=[]; bullets=[]; bossBullets=[];
    startBossMusic(lv);
    playBossStinger(lv);
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
    const mLeft  = keys.ArrowLeft  || keys.a || keys.A || player.mLeft;
    const mRight = keys.ArrowRight || keys.d || keys.D || player.mRight;
    const mUp    = keys.ArrowUp    || keys.w || keys.W || player.mUp;
    const mDown  = keys.ArrowDown  || keys.s || keys.S || player.mDown;
    const fire   = keys[' ']       || player.mFire || player.shooting;

    if(mLeft)  player.x -= spd * rev;
    if(mRight) player.x += spd * rev;
    if(mUp)    player.y -= spd * rev;
    if(mDown)  player.y += spd * rev;

    // Joystick movement is free in both axes, with slightly reduced max speed for control
    const joyScale = 1.0;
    if(player.jx) player.x += player.jx * spd * rev * joyScale;
    if(player.jy) player.y += player.jy * spd * rev * joyScale;

    // Clamp inside canvas
    const ew=visualClampW(), eh=visualClampH();
    player.x = Math.max(ew, Math.min(CW-ew, player.x));
    player.y = Math.max(eh, Math.min(CH-eh, player.y));

    // Shoot
    const cooldown = state.rapidfire>0 ? Math.floor(player.baseCooldown/2) : player.baseCooldown;
    if(fire && player.shootCooldown<=0){ shootBullet(); player.shootCooldown=cooldown; }
    if(player.shootCooldown>0) player.shootCooldown--;

    // Powerup timers
    if(state.shield>0)     state.shield--;
    if(state.rapidfire>0)  state.rapidfire--;
    if(state.tripleshot>0) state.tripleshot--;
    if(state.magnet>0)     state.magnet--;

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
        updateHostileBullets();
    }

    // Powerup & debuff drop spawning
    state.puSpawnTimer+=dt;
    if(state.puSpawnTimer>=state.puInterval){ spawnPowerup(); state.puSpawnTimer=0; state.puInterval=powerupSpawnIntervalForLevel(state.level); }

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
        e.y += e.speed * (enraged?1.8:1);

        if(e.type==='zigzag'){
            e.zigTimer++;
            if(e.zigTimer>35){ e.zigDir *= -1; e.zigTimer = 0; }
            e.x += e.zigDir * 2.2;
            e.x = Math.max(e.w/2, Math.min(CW-e.w/2, e.x));
        }

        if(e.type==='alien'){
            e.orbitAngle += 0.05;
            e.x = e.baseX + Math.sin(e.orbitAngle) * 32;
            e.x = Math.max(e.w/2, Math.min(CW-e.w/2, e.x));
        }

        if(e.type==='gunship'){
            e.x += Math.sin(e.y * 0.025) * 0.7;
            e.x = Math.max(e.w/2, Math.min(CW-e.w/2, e.x));
        }

        if(e.type==='swoop'){
            e.orbitAngle += 0.06;
            e.x = e.baseX + Math.sin(e.orbitAngle) * 24;
            if(e.y > 70) e.y += Math.sin(e.orbitAngle * 0.65) * 0.5;
        }

        if(e.type==='crawler'){
            e.x += e.edgeDir * 1.8;
            if(e.x > CW - e.w/2 || e.x < e.w/2) e.edgeDir *= -1;
        }

        if(e.type==='burst' && !e.burstFired && e.y > 90){
            e.burstFired = true;
            for(let n=0;n<5;n++){
                const ang = Math.PI*2*(n/5);
                bossBullets.push({ x:e.x, y:e.y, vx:Math.cos(ang)*3.5, vy:Math.sin(ang)*3.5, w:6, h:6, aimed:false });
            }
        }

        if(e.type==='mine'){
            if(!e.armed && e.y > 70){ e.armed = true; e.speed = 0.18; }
            if(e.armed && Math.abs(e.x-player.x) < e.w && Math.abs(e.y-player.y) < e.h){
                spawnExplosion(e.x, e.y, '#ffdd33'); enemies.splice(i,1); playerHit(); continue;
            }
        }

        if(e.canShoot){
            e.shootTimer++;
            if(e.y > 20 && e.shootTimer > e.shootInterval){ fireEnemyShot(e); e.shootTimer = 0; }
        }

        if(e.y > CH + e.h){ enemies.splice(i,1); continue; }

        const ew2=effectiveW()/2, eh2=effectiveH()/2;
        if(!player.invincible && rectsOverlap(e.x-e.w/2,e.y-e.h/2,e.w,e.h, player.x-ew2,player.y-eh2,effectiveW(),effectiveH())){
            spawnExplosion(e.x,e.y,'#ff3c5a'); enemies.splice(i,1); playerHit(); continue;
        }
    }
}

// ── Update boss ───────────────────────────────────────
function fireEnemyShot(e){
    const bx = e.x, by = e.y + e.h/2;
    if(e.type === 'gunship'){
        const speed = 3.2 + state.level * 0.08;
        [-0.28, 0, 0.28].forEach(a => {
            bossBullets.push({ x:bx, y:by, vx:Math.sin(a)*speed, vy:Math.cos(a)*speed, w:7, h:7, aimed:false });
        });
        playSound('bossShoot');
        return;
    }

    if(e.type === 'alien'){
        const dx = player.x - bx;
        const dy = Math.max(40, player.y - by);
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const speed = 3.1 + state.level * 0.08;
        bossBullets.push({ x:bx-6, y:by, vx:dx/dist*speed-0.55, vy:dy/dist*speed, w:6, h:6, aimed:true });
        bossBullets.push({ x:bx+6, y:by, vx:dx/dist*speed+0.55, vy:dy/dist*speed, w:6, h:6, aimed:true });
        playSound('bossShoot');
        return;
    }

    const aimed = e.type === 'shooter' || Math.random() < 0.35;
    if(aimed && player){
        const dx = player.x - bx;
        const dy = Math.max(40, player.y - by);
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const speed = 3.0 + state.level * 0.08;
        bossBullets.push({ x:bx, y:by, vx:dx/dist*speed, vy:dy/dist*speed, w:7, h:7, aimed:true });
    } else {
        bossBullets.push({ x:bx, y:by, vx:0, vy:3.0 + state.level*0.08, w:6, h:6, aimed:false });
    }
    playSound('bossShoot');
}

function updateHostileBullets(){
    for(let i=bossBullets.length-1;i>=0;i--){
        const b=bossBullets[i]; b.x+=b.vx; b.y+=b.vy;
        if(b.y>CH+20||b.x<-20||b.x>CW+20){bossBullets.splice(i,1);continue;}
        const ew2=effectiveW()/2, eh2=effectiveH()/2;
        if(!player.invincible && rectsOverlap(b.x-b.w/2,b.y-b.h/2,b.w,b.h, player.x-ew2,player.y-eh2,effectiveW(),effectiveH())){
            spawnExplosion(b.x,b.y,shieldActive()?'#00aaff':'#ff3c5a',6); bossBullets.splice(i,1); playerHit(); continue;
        }
    }
}

function updateBoss(dt){
    if(!boss) return;
    if(boss.entering){ boss.y+=boss.speed; if(boss.y>=boss.targetY){boss.y=boss.targetY;boss.entering=false;} return; }
    const p2=isBossPhaseTwo();
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
            spawnExplosion(b.x,b.y,shieldActive()?'#00aaff':'#ff3c5a',6); bossBullets.splice(i,1); playerHit(); continue;
        }
    }
    // Player bullets vs boss
    for(let i=bullets.length-1;i>=0;i--){
        if(rectsOverlap(bullets[i].x-bullets[i].w/2,bullets[i].y-bullets[i].h/2,bullets[i].w,bullets[i].h, boss.x-boss.w/2,boss.y-boss.h/2,boss.w,boss.h)){
            spawnExplosion(bullets[i].x,bullets[i].y,'#ffcc00',5); bullets.splice(i,1); playSound('bossHit');
            if(damageBoss(1)) return; break;
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
    state.score += LEVELS[state.level].pts*10;
    spawnPowerup(boss.x,boss.y);
    boss = null; bossBullets=[]; state.bossPhase=false; state.bossDefeated=true;
    if(state.level < 10) triggerLevelUp();
    else startLevelMusic(state.level);
}

// ── Bullet-enemy collision ────────────────────────────
function bulletEnemyCollision(){
    for(let b=bullets.length-1;b>=0;b--){
        for(let e=enemies.length-1;e>=0;e--){
            if(rectsOverlap(bullets[b].x-bullets[b].w/2,bullets[b].y-bullets[b].h/2,bullets[b].w,bullets[b].h, enemies[e].x-enemies[e].w/2,enemies[e].y-enemies[e].h/2,enemies[e].w,enemies[e].h)){
                enemies[e].hp--;
                spawnExplosion(bullets[b].x,bullets[b].y,'#ffcc00',4);
                bullets.splice(b,1);
                if(enemies[e].hp<=0){
                    spawnExplosion(enemies[e].x,enemies[e].y);
                    enemies.splice(e,1);
                    killEnemy();
                    playSound('explode');
                } else {
                    playSound('bossHit');
                }
                break;
            }
        }
    }
}

// ── Update powerups ───────────────────────────────────
function updatePowerups(){
    for(let i=powerups.length-1;i>=0;i--){
        const pu=powerups[i]; pu.y+=pu.speed; pu.wobble+=0.06; pu.x+=Math.sin(pu.wobble)*0.4;
        if(state.magnet>0){
            const dx=player.x-pu.x, dy=player.y-pu.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
            const range=190, pull=Math.max(0, 1-dist/range);
            if(dist<range){
                const force=2.2+pull*5.2;
                pu.x += dx/dist*force;
                pu.y += dy/dist*force;
            }
        }
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
            if(shieldActive()){
                spawnExplosion(d.x,d.y,'#00aaff',8); debuffDrops.splice(i,1); playSound('shieldHit');
            } else {
                addDebuff(d.type); spawnExplosion(d.x,d.y,d.def.color,8); debuffDrops.splice(i,1);
            }
        }
    }
}

// ── Apply powerup ─────────────────────────────────────
function applyPowerup(pu){
    const t=pu.type;
    puBanner={ label:pu.def.label, icon:pu.def.icon, timer:150 };
    playSound('powerup');
    if(t==='shield')    { state.shield += pu.def.dur; }
    else if(t==='rapidfire')  { state.rapidfire=pu.def.dur; }
    else if(t==='tripleshot') { state.tripleshot=pu.def.dur; }
    else if(t==='magnet')     { state.magnet=pu.def.dur; }
    else if(t==='extralife')  { state.lives=Math.min(state.lives+1,5); updateHUD(); }
    else if(t==='cleanse')    { clearAllDebuffs(); }
    else if(t==='bomb'){
        enemies.forEach(e=>{ spawnExplosion(e.x,e.y,'#ff8800',10); state.score+=LEVELS[state.level].pts; });
        enemies=[]; debuffDrops=[];
        if(boss){ damageBoss(Math.floor(boss.maxHp*0.3)); }
        shakeCanvas(); playSound('bomb');
    }
}

// ── Kill enemy ────────────────────────────────────────
function killEnemy(){
    const cfg = LEVELS[state.level];
    state.score += cfg.pts; state.kills++; state.totalKills++;
    if(Math.random() < 0.14) spawnPowerup();
    if(!state.bossPhase && !state.bossDefeated){
        if(state.level < 10 && state.kills >= cfg.killsNeeded) spawnBoss(state.level);
        if(state.level === 10 && state.kills > 0 && state.kills % 30 === 0) spawnBoss(10);
    }
}

// ── Player hit ────────────────────────────────────────
function playerHit(){
    if(shieldActive()){ shakeCanvas(); playSound('shieldHit'); return; }
    state.lives--; player.invincible=true; player.invTimer=120; player.blinkTimer=0;
    shakeCanvas(); updateHUD(); playSound('hit');
    if(state.lives<=0) triggerGameOver();
}

// ── Level up ─────────────────────────────────────────
function triggerLevelUp(){
    if(state.level < 10) state.level++;
    state.kills = 0; state.bossDefeated = false; state.levelingUp = true;
    state.puSpawnTimer = 0;
    state.puInterval = powerupSpawnIntervalForLevel(state.level);
    enemies=[]; bullets=[]; bossBullets=[]; debuffDrops=[];
    upgradePlayerShip(state.level);
    initStars();
    startLevelMusic(state.level);
    playLevelStinger(state.level);
    levelFlash.classList.add('show');
    setTimeout(()=>{ levelFlash.classList.remove('show'); state.levelingUp=false; },1800);
}

// ── Game over ─────────────────────────────────────────
function triggerGameOver(){
    state.over=true; state.running=false; cancelAnimationFrame(state.animId);
    playSound('gameOver');
    stopLevelMusic();
    const hs=parseInt(localStorage.getItem('starSiegeHS')||'0'), isNew=state.score>hs;
    if(isNew) localStorage.setItem('starSiegeHS',state.score);
    
    // Add score to coins
    let coins = parseInt(localStorage.getItem('starSiegeCoins')||'0');
    coins += state.score;
    localStorage.setItem('starSiegeCoins', coins);

    finalScore.textContent=state.score; finalLevel.textContent=state.level;
    finalHSEl.textContent=isNew?state.score:hs; newHSBadge.classList.toggle('d-none',!isNew);
    
    // Reset and show leaderboard save section
    document.getElementById('saveScoreSection').classList.remove('d-none');
    document.getElementById('playerName').value = player.name || "";
    if(saveScoreBtn){
        saveScoreBtn.disabled = false;
        saveScoreBtn.textContent = 'SUBMIT SCORE';
    }

    showScreen('gameOver');
}

// ── Collision helper ──────────────────────────────────
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){ return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by; }

// ═══════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════
function draw(){
    ctx.clearRect(0,0,CW,CH);
    const cfg = LEVELS[state.level];
    
    // Background Color
    ctx.fillStyle=cfg.bg; ctx.fillRect(0,0,CW,CH);

    // Subtle Radial Glow
    const grd = ctx.createRadialGradient(CW/2, CH/2, 20, CW/2, CH/2, CW*0.8);
    grd.addColorStop(0, cfg.bgGlow + '15'); 
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,CW,CH);

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
    if(shieldActive()) drawShieldBubble();

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
    if(shieldActive())      items.push({icon:'🛡',color:'#00aaff',label:`SHIELD ${Math.ceil(state.shield/60)}s`});
    if(state.rapidfire>0)   items.push({icon:'⚡',color:'#ffcc00',label:'x2'});
    if(state.tripleshot>0)  items.push({icon:'💠',color:'#ff44ff',label:'3x'});
    if(state.magnet>0)      items.push({icon:'M',color:'#66ffdd',label:'MAG'});
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

    // Pilot Name
    if(player.name){
        ctx.save();
        const namePulse = 0.55 + Math.sin(Date.now()*0.006) * 0.25;
        ctx.globalAlpha = Math.max(0.35, namePulse);
        ctx.fillStyle='#ffffff';
        ctx.font='700 9px Orbitron, monospace';
        ctx.textAlign='center';
        ctx.shadowColor='#00d4ff';
        ctx.shadowBlur=8 + namePulse*10;
        ctx.fillStyle='rgba(0,212,255,0.25)';
        ctx.fillRect(-34, 28, 68, 14);
        ctx.fillStyle='#ffffff';
        ctx.fillText(player.name.toUpperCase(), 0, 38);
        ctx.restore();
    }

    ctx.restore();
}

// ── Draw enemy ────────────────────────────────────────
function drawEnemy(e){
    const x=e.x,y=e.y,s=e.w*0.5;
    ctx.save();
    const bodyColors={basic:'#ff2a4b',fast:'#ff8c00',alien:'#5cff66',zigzag:'#d400ff',shooter:'#ff00d4',gunship:'#66d9ff',swoop:'#4d9cff',crawler:'#00ffd4',burst:'#ffff66',mine:'#88ff44'};
    const eyeColors={basic:'#ffdd00',fast:'#ffffff',alien:'#240044',zigzag:'#ffb3ff',shooter:'#ff8888',gunship:'#ffffff',swoop:'#88e6ff',crawler:'#55ffff',burst:'#ffdd55',mine:'#ffffff'};
    const glowColors={basic:'#ff8c6a',fast:'#ffbf7a',alien:'#99ff66',zigzag:'#ee66ff',shooter:'#ff88ff',gunship:'#7de6ff',swoop:'#7de6ff',crawler:'#66ffdd',burst:'#fff477',mine:'#bbff88'};
    ctx.shadowColor=glowColors[e.type]||'#ff8c6a'; ctx.shadowBlur=18;
    ctx.fillStyle=bodyColors[e.type]||'#ff2a4b';
    ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2;

    if(e.type==='alien'){
        ctx.beginPath(); ctx.ellipse(x,y,s*0.78,s*0.52,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle='rgba(140,255,120,0.55)';
        ctx.beginPath(); ctx.ellipse(x,y-s*0.12,s*1.08,s*0.22,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=eyeColors[e.type];
        ctx.beginPath(); ctx.ellipse(x-s*0.26,y-s*0.04,s*0.14,s*0.2,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+s*0.26,y-s*0.04,s*0.14,s*0.2,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#d8ffd0'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(x-s*0.35,y-s*0.48); ctx.lineTo(x-s*0.5,y-s*0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+s*0.35,y-s*0.48); ctx.lineTo(x+s*0.5,y-s*0.85); ctx.stroke();
    } else if(e.type==='gunship'){
        ctx.beginPath();
        ctx.moveTo(x,y+s*0.68); ctx.lineTo(x-s*0.28,y+s*0.18); ctx.lineTo(x-s*0.9,y+s*0.42);
        ctx.lineTo(x-s*0.58,y-s*0.1); ctx.lineTo(x-s*0.22,y-s*0.58); ctx.lineTo(x,y-s*0.82);
        ctx.lineTo(x+s*0.22,y-s*0.58); ctx.lineTo(x+s*0.58,y-s*0.1); ctx.lineTo(x+s*0.9,y+s*0.42);
        ctx.lineTo(x+s*0.28,y+s*0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#ffffffcc'; ctx.beginPath(); ctx.ellipse(x,y-s*0.16,s*0.2,s*0.26,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ff3355'; ctx.fillRect(x-s*0.65,y+s*0.3,s*0.2,s*0.12); ctx.fillRect(x+s*0.45,y+s*0.3,s*0.2,s*0.12);
    } else if(e.type==='crawler'){
        ctx.beginPath(); ctx.roundRect(x-s, y-s*0.4, s*2, s*0.8, s*0.25); ctx.fill(); ctx.stroke();
        ctx.fillStyle=eyeColors[e.type]||'#ffffff'; ctx.beginPath(); ctx.arc(x-s*0.4,y, s*0.14,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+s*0.4,y, s*0.14,0,Math.PI*2); ctx.fill();
    } else if(e.type==='mine'){
        ctx.beginPath(); ctx.arc(x,y,s*0.9,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=eyeColors[e.type]; ctx.beginPath(); ctx.arc(x,y, s*0.3,0,Math.PI*2); ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(x,y+s*0.5); ctx.lineTo(x-s*0.65,y-s*0.35); ctx.lineTo(x-s*0.25,y-s*0.1);
        ctx.lineTo(x,y-s*0.55); ctx.lineTo(x+s*0.25,y-s*0.1); ctx.lineTo(x+s*0.65,y-s*0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle=eyeColors[e.type]||'#ffdd00'; ctx.shadowColor=eyeColors[e.type]||'#ffdd00';
        ctx.beginPath(); ctx.arc(x,y,s*0.18,0,Math.PI*2); ctx.fill();
    }

    if(e.canShoot){
        ctx.strokeStyle='#ff00aa'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y,s*0.75,0,Math.PI*2); ctx.stroke();
    }
    if(e.type==='burst'){
        ctx.strokeStyle='#ffffff55'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,s*1.1,0,Math.PI*2); ctx.stroke();
    }
    if(e.maxHp && e.maxHp > 1){
        const bw = Math.max(22, e.w * 0.8);
        const bh = 4;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(x - bw/2, y - s - 8, bw, bh);
        ctx.fillStyle = pct > 0.5 ? '#00ff99' : '#ffcc00';
        ctx.fillRect(x - bw/2, y - s - 8, bw * pct, bh);
    }
    ctx.restore();
}

// ── Draw boss ─────────────────────────────────────────
function drawFleetBossShip(px, py, size, palette, variant){
    const main = palette[0], wing = palette[1], glow = palette[2] || main;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.82)';
    ctx.lineWidth = 1.1;

    if(variant % 4 === 0){
        ctx.fillStyle = wing;
        ctx.beginPath();
        ctx.moveTo(-size*0.18, -size*0.16); ctx.lineTo(-size*0.98, size*0.48); ctx.lineTo(-size*0.36, size*0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size*0.18, -size*0.16); ctx.lineTo(size*0.98, size*0.48); ctx.lineTo(size*0.36, size*0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.moveTo(0,-size); ctx.lineTo(size*0.34,size*0.52); ctx.lineTo(0,size*0.92); ctx.lineTo(-size*0.34,size*0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if(variant % 4 === 1){
        ctx.fillStyle = wing;
        ctx.beginPath();
        ctx.moveTo(-size*0.22,-size*0.46); ctx.lineTo(-size*0.92,size*0.14); ctx.lineTo(-size*0.38,size*0.84); ctx.lineTo(-size*0.16,size*0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size*0.22,-size*0.46); ctx.lineTo(size*0.92,size*0.14); ctx.lineTo(size*0.38,size*0.84); ctx.lineTo(size*0.16,size*0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.moveTo(0,-size*0.94); ctx.lineTo(size*0.26,size*0.7); ctx.lineTo(0,size); ctx.lineTo(-size*0.26,size*0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if(variant % 4 === 2){
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.moveTo(0,-size); ctx.lineTo(size*0.56,-size*0.18); ctx.lineTo(size*0.42,size*0.72); ctx.lineTo(0,size*0.5); ctx.lineTo(-size*0.42,size*0.72); ctx.lineTo(-size*0.56,-size*0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = wing;
        ctx.fillRect(-size*0.74, size*0.14, size*0.32, size*0.28);
        ctx.fillRect(size*0.42, size*0.14, size*0.32, size*0.28);
    } else {
        ctx.fillStyle = wing;
        ctx.beginPath();
        ctx.moveTo(-size*0.08,-size*0.54); ctx.lineTo(-size*0.82,size*0.66); ctx.lineTo(-size*0.2,size*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size*0.08,-size*0.54); ctx.lineTo(size*0.82,size*0.66); ctx.lineTo(size*0.2,size*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.roundRect(-size*0.22, -size*0.92, size*0.44, size*1.72, size*0.18); ctx.fill(); ctx.stroke();
    }

    ctx.shadowBlur = 7;
    ctx.fillStyle = '#eaffff';
    ctx.beginPath();
    ctx.ellipse(0, -size*0.18, size*0.14, size*0.24, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(-size*0.1, size*0.72, size*0.2, size*0.18);
    ctx.restore();
}

function drawBoss(b){
    const x=b.x,y=b.y,s=b.w*0.5,p2=boss===b ? isBossPhaseTwo() : b.hp<b.maxHp*0.5;
    ctx.save(); ctx.translate(x,y);
    const bossColors=[['#880033','#660022'],['#330066','#220044'],['#551100','#331100'],['#004455','#002233'],['#550055','#330033']];
    const bc=bossColors[b.level-1]||bossColors[0];
    ctx.shadowColor=p2?'#ff4400':bc[0]; ctx.shadowBlur=p2?30:18;
    ctx.fillStyle=p2?'#aa1100':bc[0];
    // Boss body varies by level
    if(b.level===10){
        const fleet = [
            [-0.78,-0.62, ['#ffd900','#a2ff2c','#fff36a']],
            [-0.26,-0.66, ['#3346ff','#ff8c22','#7ab6ff']],
            [ 0.26,-0.66, ['#2bdcff','#ff8844','#72ffff']],
            [ 0.78,-0.62, ['#ff1f35','#0fd66e','#ff5566']],
            [-0.78, 0.02, ['#b47a31','#39b6ff','#ffcc66']],
            [-0.26,-0.02, ['#ffffff','#b02bff','#ffffff']],
            [ 0.26,-0.02, ['#f2f2f2','#ff2a42','#ffffff']],
            [ 0.78, 0.02, ['#4034a8','#fff066','#9d8cff']],
            [-0.78, 0.62, ['#13aa55','#f2d43b','#49ff8a']],
            [-0.26, 0.64, ['#ffffff','#ff40d0','#ffffff']],
            [ 0.26, 0.64, ['#f4c246','#00d4ff','#ffe077']],
            [ 0.78, 0.62, ['#ff4ab4','#ff7be0','#ff99e8']]
        ];
        ctx.fillStyle = 'rgba(0,10,20,0.58)';
        ctx.strokeStyle = 'rgba(0,212,255,0.42)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(-s*1.15, -s*0.98, s*2.3, s*1.96, 10);
        ctx.fill();
        ctx.stroke();
        fleet.forEach((ship, i) => {
            const bob = Math.sin(Date.now()*0.004 + i) * s*0.025;
            drawFleetBossShip(ship[0]*s, ship[1]*s + bob, s*0.19, ship[2], i);
        });
    } else {
        const bossPalettes = [
            null,
            ['#00d4ff','#7b2fff','#7beeff'],
            ['#00ff99','#ff6600','#77ffd0'],
            ['#ffaa00','#ff3300','#ffe077'],
            ['#ff44aa','#ffcc00','#ff8cff'],
            ['#cc44ff','#00ffff','#ee88ff'],
            ['#7be6ff','#4836ad','#aaf3ff'],
            ['#ff8cff','#8c46ff','#ffc8ff'],
            ['#3effd4','#00aabb','#88fff0'],
            ['#ff9900','#ff4499','#ffdd33']
        ];
        const palette = bossPalettes[b.level] || ['#ff2255','#ff77aa','#ff99cc'];
        if(b.level >= 6){
            drawFleetBossShip(-s*0.68, s*0.18, s*0.32, [palette[1], palette[0], palette[2]], b.level + 1);
            drawFleetBossShip(s*0.68, s*0.18, s*0.32, [palette[1], palette[0], palette[2]], b.level + 2);
        }
        drawFleetBossShip(0, 0, s*0.82, palette, b.level);
        if(b.level >= 4){
            ctx.strokeStyle = palette[2];
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.arc(0, 0, s*1.02, 0, Math.PI*2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
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
    const pct=Math.max(0,boss.hp/boss.maxHp),p2=isBossPhaseTwo();
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx-2,by-2,barW+4,barH+4);
    const bc=p2?'#ff4400':'#cc0044'; ctx.fillStyle=bc; ctx.shadowColor=bc; ctx.shadowBlur=8; ctx.fillRect(bx,by,barW*pct,barH); ctx.shadowBlur=0;
    ctx.strokeStyle='#ffffff44'; ctx.lineWidth=1; ctx.strokeRect(bx,by,barW,barH);
    if(boss.layersTotal > 1){
        const dots = Math.min(boss.layersTotal, 12);
        const dotW = 8, gap = 4, startX = CW/2 - ((dots * dotW) + ((dots - 1) * gap)) / 2;
        for(let i=0;i<dots;i++){
            ctx.fillStyle = i < boss.layersLeft ? '#ffcc00' : 'rgba(255,255,255,0.18)';
            ctx.fillRect(startX + i*(dotW+gap), by-30, dotW, 3);
        }
    }
    const names={
        1:'THE CRUSHER',
        2:'VOID LEVIATHAN',
        3:'IRON SIEGE',
        4:'DARK OMEGA',
        5:'APEX DESTROYER',
        6:'PHANTOM MAW',
        7:'CRYSTAL WARDEN',
        8:'NEON ABERRATION',
        9:'MAELSTROM CORE',
       10:'ASCENDANT PRIME'
    };
    const bossName = boss.level === 2 ? '' : names[boss.level] + (p2?' — PHASE 2':'');
    const multLabel = boss.layersLeft && boss.layersLeft > 1 ? `x${boss.layersLeft}` : '';
    ctx.fillStyle='#fff'; ctx.font='700 11px Orbitron,monospace'; ctx.textAlign='center';
    if(bossName) ctx.fillText(bossName, CW/2, by-5);
    if(multLabel){
        ctx.fillStyle='#ffcc00';
        ctx.fillText(multLabel, CW/2, by-18);
    }
    ctx.textAlign='left';
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
function gameLoop(ts){ const dt=ts-lastTime; lastTime=ts; update(dt); draw(); if(state.running&&!state.over&&!state.paused) state.animId=requestAnimationFrame(gameLoop); }
function updateHUD(){ scoreDisp.textContent=state.score; levelDisp.textContent=state.level; livesDisp.textContent='♥ '.repeat(state.lives).trim(); }
function showScreen(w){ startScreen.classList.remove('active'); gameScreen.classList.remove('active'); gameOverScr.classList.remove('active'); if(w==='start') startScreen.classList.add('active'); if(w==='game') gameScreen.classList.add('active'); if(w==='gameOver') gameOverScr.classList.add('active'); }
function renderLifeBars(){
    const maxLives = Math.max(5, 3 + upgradeStats.lives);
    livesDisp.innerHTML = Array.from({length:maxLives}, (_, i) => {
        const active = i < state.lives ? ' active' : '';
        return `<span class="life-bar${active}"></span>`;
    }).join('');
}
updateHUD = function(){
    scoreDisp.textContent=state.score;
    levelDisp.textContent=state.level;
    livesDisp.classList.add('life-meter');
    renderLifeBars();
};
function shakeCanvas(){ canvasWrap.classList.add('shake'); setTimeout(()=>canvasWrap.classList.remove('shake'),350); }
const coinsDisplay = document.getElementById('coinsDisplay');
function loadStats(){ 
    hsDisplay.textContent=localStorage.getItem('starSiegeHS')||'0'; 
    if(coinsDisplay) coinsDisplay.textContent = localStorage.getItem('starSiegeCoins')||'0';
    
    const lastPilot = localStorage.getItem('starSiegePilotName');
    if(lastPilot) document.getElementById('shipNameInput').value = lastPilot;

    renderLeaderboard();
}

// ── Start / Restart ───────────────────────────────────
function startGame(){
    const nameInput = document.getElementById('shipNameInput');
    const pilotName = nameInput.value.trim() || "PILOT";
    localStorage.setItem('starSiegePilotName', pilotName);

    resetState(); initPlayer(); initStars();
    player.name = pilotName;

    bullets=[]; enemies=[]; particles=[]; boss=null; bossBullets=[]; powerups=[]; debuffDrops=[]; upgradeFlash=null; puBanner=null; debuffBanner=null;
    resizeCanvas(); updateHUD(); loadStats(); showScreen('game');
    state.running=true; startLevelMusic(state.level); playLevelStinger(state.level);
    lastTime=performance.now(); state.animId=requestAnimationFrame(gameLoop);
}

// ── Pause ─────────────────────────────────────────────
function togglePause(){
    if(state.over) return;
    state.paused=!state.paused;
    pauseOverlay.classList.toggle('active',state.paused);
    if(pauseControlsPanel) pauseControlsPanel.classList.add('d-none');
    if(state.paused) stopLevelMusic();
    if(!state.paused){
        startLevelMusic(state.level);
        lastTime=performance.now();
        state.animId=requestAnimationFrame(gameLoop);
    }
}

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
            bossExplode:()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(300,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(20,ac.currentTime+0.8);   g.gain.setValueAtTime(0.25,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.8);  osc.start();osc.stop(ac.currentTime+0.8); },
            gameOver:   ()=>{ osc.type='sawtooth'; osc.frequency.setValueAtTime(260,ac.currentTime); osc.frequency.exponentialRampToValueAtTime(36,ac.currentTime+1.1);   g.gain.setValueAtTime(0.28,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+1.2); osc.start();osc.stop(ac.currentTime+1.25); setTimeout(()=>playMusicTone(82,'square',getAC().currentTime,0.45,0.06),220); setTimeout(()=>playMusicTone(55,'triangle',getAC().currentTime,0.65,0.05),520); }
        };
        if(s[type]) s[type]();
    } catch(e){}
}

// ── Keyboard ──────────────────────────────────────────
let musicTimer=null, musicStep=0, musicLevel=0, musicGain=null, musicMode='level';
const LEVEL_MUSIC = [
    null,
    { tempo:520, notes:[196,247,294,330], bass:49, wave:'triangle' },
    { tempo:480, notes:[220,277,330,370], bass:55, wave:'square' },
    { tempo:440, notes:[165,247,311,370], bass:41, wave:'sawtooth' },
    { tempo:405, notes:[185,233,277,349], bass:46, wave:'triangle' },
    { tempo:370, notes:[196,262,330,392], bass:49, wave:'sawtooth' },
    { tempo:340, notes:[208,277,330,415], bass:52, wave:'triangle' },
    { tempo:315, notes:[220,294,349,440], bass:55, wave:'square' },
    { tempo:290, notes:[233,311,370,466], bass:58, wave:'triangle' },
    { tempo:265, notes:[247,330,392,494], bass:62, wave:'sawtooth' },
    { tempo:235, notes:[262,349,415,523], bass:65, wave:'square' }
];
const BOSS_MUSIC = [
    null,
    { tempo:360, notes:[98,147,196,247], bass:37, wave:'sawtooth' },
    { tempo:330, notes:[110,165,220,277], bass:41, wave:'square' },
    { tempo:300, notes:[123,185,247,311], bass:46, wave:'sawtooth' },
    { tempo:275, notes:[131,196,262,330], bass:49, wave:'square' },
    { tempo:250, notes:[147,220,294,370], bass:55, wave:'sawtooth' },
    { tempo:230, notes:[156,233,311,392], bass:58, wave:'square' },
    { tempo:210, notes:[165,247,330,415], bass:62, wave:'sawtooth' },
    { tempo:190, notes:[175,262,349,440], bass:65, wave:'square' },
    { tempo:170, notes:[185,277,370,466], bass:69, wave:'sawtooth' },
    { tempo:145, notes:[196,294,392,523], bass:73, wave:'square' }
];

function playMusicTone(freq, type, start, dur, gain){
    const ac=getAC(), osc=ac.createOscillator(), g=ac.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,start);
    g.gain.setValueAtTime(0.0001,start);
    g.gain.exponentialRampToValueAtTime(gain,start+0.025);
    g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    osc.connect(g); g.connect(musicGain || ac.destination);
    osc.start(start); osc.stop(start+dur+0.04);
}

function tickLevelMusic(){
    if(!state.running || state.paused || state.over) return;
    const isBossTrack = musicMode === 'boss';
    const cfg=(isBossTrack ? BOSS_MUSIC[musicLevel] : LEVEL_MUSIC[musicLevel]) || LEVEL_MUSIC[1];
    const ac=getAC(), t=ac.currentTime;
    const note=cfg.notes[musicStep % cfg.notes.length];
    const octave=musicStep % 8 >= 4 ? 2 : 1;
    playMusicTone(cfg.bass, 'sine', t, isBossTrack ? 0.28 : 0.22, isBossTrack ? 0.04 : 0.025);
    playMusicTone(note*octave, cfg.wave, t+0.035, isBossTrack ? 0.2 : 0.16, isBossTrack ? 0.03 : 0.018);
    if(isBossTrack && musicStep % 2 === 1) playMusicTone(note*0.5, 'sawtooth', t+0.11, 0.14, 0.024);
    if(musicStep % 4 === 3) playMusicTone(note*1.5, 'triangle', t+0.12, 0.12, isBossTrack ? 0.02 : 0.012);
    musicStep++;
}

function stopLevelMusic(){
    if(musicTimer){ clearInterval(musicTimer); musicTimer=null; }
    if(musicGain){ try{ musicGain.disconnect(); } catch(e){} musicGain=null; }
    musicStep=0; musicLevel=0; musicMode='level';
}

function startLevelMusic(lv, mode='level'){
    stopLevelMusic();
    try{
        const ac=getAC();
        if(ac.state === 'suspended') ac.resume();
        musicGain=ac.createGain();
        musicMode=mode;
        musicGain.gain.setValueAtTime(mode === 'boss' ? 0.68 : 0.55, ac.currentTime);
        musicGain.connect(ac.destination);
        musicLevel=lv;
        const cfg=(mode === 'boss' ? BOSS_MUSIC[lv] : LEVEL_MUSIC[lv]) || LEVEL_MUSIC[1];
        tickLevelMusic();
        musicTimer=setInterval(tickLevelMusic, cfg.tempo);
    } catch(e){}
}

function startBossMusic(lv){
    startLevelMusic(lv, 'boss');
}

function playLevelStinger(lv){
    try{
        const ac=getAC(), t=ac.currentTime;
        const cfg=LEVEL_MUSIC[lv] || LEVEL_MUSIC[1];
        [0,1,2,3].forEach((step)=>{
            const note=cfg.notes[step % cfg.notes.length] * (step===3 ? 2 : 1);
            playMusicTone(note, cfg.wave, t+step*0.08, 0.16, 0.04);
        });
    } catch(e){}
}

function playBossStinger(lv){
    try{
        const ac=getAC(), t=ac.currentTime;
        const cfg=BOSS_MUSIC[lv] || BOSS_MUSIC[1];
        [0,1,2,3,4].forEach((step)=>{
            playMusicTone(cfg.notes[step % cfg.notes.length] * (step > 2 ? 2 : 1), cfg.wave, t+step*0.06, 0.2, 0.055);
        });
        playMusicTone(cfg.bass*0.5, 'sawtooth', t, 0.6, 0.07);
    } catch(e){}
}

const isTypingElement = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

document.addEventListener('keydown',e=>{
    if (isTypingElement(e.target) || isTypingElement(document.activeElement)) return;
    if(e.key in keys){ e.preventDefault(); keys[e.key]=true; }
    if((e.key==='p'||e.key==='P')&&state.running) togglePause();
});
document.addEventListener('keyup',e=>{ 
    if (isTypingElement(e.target) || isTypingElement(document.activeElement)) return;
    if(e.key in keys) keys[e.key]=false; 
});

const playerNameInput = document.getElementById('playerName');
if (playerNameInput) {
    playerNameInput.addEventListener('keydown', e => e.stopPropagation());
}

// ── Mobile Joystick ───────────────────────────────────
const saveScoreBtn = document.getElementById('saveScoreBtn');
if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', async () => {
        const name = cleanLeaderboardName(playerNameInput ? playerNameInput.value : player.name);
        saveScoreBtn.disabled = true;
        saveScoreBtn.textContent = 'SAVING...';
        await saveLeaderboard(name, state.score);
        localStorage.setItem('starSiegePilotName', name);
        document.getElementById('saveScoreSection').classList.add('d-none');
        saveScoreBtn.textContent = 'SUBMITTED';
    });
}

function ensureMobileControls(){
    if(
        document.getElementById('joystickZone') &&
        document.getElementById('buttonPad') &&
        document.getElementById('btnFire')
    ) return;
    const gameScreenEl = document.getElementById('gameScreen');
    if(!gameScreenEl) return;

    const oldControls = gameScreenEl.querySelector('.mobile-controls');
    if(oldControls) oldControls.remove();

    const controls = document.createElement('div');
    controls.className = 'mobile-controls d-flex justify-content-between align-items-center px-3 py-3 w-100';
    controls.dataset.controlMode = 'joystick';
    controls.innerHTML = `
        <div class="mobile-move-area">
            <div id="joystickZone" class="joystick-wrapper d-flex align-items-center justify-content-center">
                <div id="joystickBase" class="joystick-base position-relative">
                    <div class="joystick-circle"></div>
                    <div id="joystickStick" class="joystick-stick"></div>
                </div>
            </div>
            <div id="buttonPad" class="button-pad" aria-label="Directional buttons">
                <span></span>
                <button id="btnUp" class="btn btn-mobile btn-dir" aria-label="Move up"><i class="fa-solid fa-chevron-up"></i></button>
                <span></span>
                <button id="btnLeft" class="btn btn-mobile btn-dir" aria-label="Move left"><i class="fa-solid fa-chevron-left"></i></button>
                <span></span>
                <button id="btnRight" class="btn btn-mobile btn-dir" aria-label="Move right"><i class="fa-solid fa-chevron-right"></i></button>
                <span></span>
                <button id="btnDown" class="btn btn-mobile btn-dir" aria-label="Move down"><i class="fa-solid fa-chevron-down"></i></button>
                <span></span>
            </div>
        </div>
        <div class="d-flex align-items-center">
            <button id="btnFire" class="btn btn-mobile btn-fire" aria-label="Fire">
                <i class="fa-solid fa-burst"></i>
            </button>
        </div>
    `;
    gameScreenEl.appendChild(controls);
}

ensureMobileControls();
window.ensureMobileControls = ensureMobileControls;

function verifyResponsiveControls(){
    const hadControls = Boolean(document.getElementById('joystickZone') && document.getElementById('joystickStick') && document.getElementById('buttonPad') && document.getElementById('btnFire'));
    ensureMobileControls();
    const hasControls = Boolean(document.getElementById('joystickZone') && document.getElementById('joystickStick') && document.getElementById('buttonPad') && document.getElementById('btnFire'));
    if(!hadControls && hasControls && !sessionStorage.getItem('starSiegeResponsiveControlsReloaded')){
        sessionStorage.setItem('starSiegeResponsiveControlsReloaded', '1');
        location.reload();
    }
}
window.addEventListener('resize', () => setTimeout(verifyResponsiveControls, 80));
window.addEventListener('orientationchange', () => setTimeout(verifyResponsiveControls, 160));
window.addEventListener('pageshow', () => setTimeout(verifyResponsiveControls, 80));

const joystickZone = document.getElementById('joystickZone');
const joystickStick = document.getElementById('joystickStick');
const joystickBase = document.getElementById('joystickBase');
const mobileControls = document.querySelector('.mobile-controls');
const mobileMoveArea = document.querySelector('.mobile-move-area');
const controlModeButtons = Array.from(document.querySelectorAll('[data-control-mode-choice="buttons"]'));
const controlModeJoystick = Array.from(document.querySelectorAll('[data-control-mode-choice="joystick"]'));
const joystickSensitivityInputs = Array.from(document.querySelectorAll('.joystick-sensitivity'));
const joystickScaleInputs = Array.from(document.querySelectorAll('.joystick-scale'));
const buttonScaleInputs = Array.from(document.querySelectorAll('.button-scale'));
const sensitivityControls = Array.from(document.querySelectorAll('.sensitivity-control'));
const joystickSizeControls = Array.from(document.querySelectorAll('.control-size-control')).filter(control => control.querySelector('.joystick-scale'));
const buttonSizeControls = Array.from(document.querySelectorAll('.control-size-control')).filter(control => control.querySelector('.button-scale'));
const savePositionButtons = Array.from(document.querySelectorAll('[data-control-save-position]'));
const restoreDefaultButtons = Array.from(document.querySelectorAll('[data-control-restore-default]'));
const pauseControlsBtn = document.getElementById('pauseControlsBtn');
const pauseControlsPanel = document.getElementById('pauseControlsPanel');
let joystickSensitivityValue = Number(localStorage.getItem('starSiegeJoystickSensitivity')) || 100;
let joystickScaleValue = Number(localStorage.getItem('starSiegeJoystickScale')) || 100;
let buttonScaleValue = Number(localStorage.getItem('starSiegeButtonScale')) || 100;
let controlMoveX = Number(localStorage.getItem('starSiegeControlMoveX')) || 0;
let controlMoveY = Number(localStorage.getItem('starSiegeControlMoveY')) || 0;
let joystickActive = false;
let joystickPointerId = null;
let controlPositionDrag = null;

function getMobileControlMode(){
    return localStorage.getItem('starSiegeControlMode') || 'joystick';
}

function getJoystickSensitivity(){
    const raw = joystickSensitivityValue;
    return Math.max(0.6, Math.min(1.6, raw / 100));
}

function stopMobileMovement(){
    player.mLeft=false; player.mRight=false; player.mUp=false; player.mDown=false;
    player.jx=0; player.jy=0;
    joystickActive=false;
    if(joystickStick) joystickStick.style.transform = `translate(-50%, -50%)`;
}

function applyMobileControlMode(mode){
    const selected = mode === 'buttons' ? 'buttons' : 'joystick';
    localStorage.setItem('starSiegeControlMode', selected);
    if(mobileControls) mobileControls.dataset.controlMode = selected;
    controlModeButtons.forEach(btn => btn.classList.toggle('active', selected === 'buttons'));
    controlModeJoystick.forEach(btn => btn.classList.toggle('active', selected === 'joystick'));
    sensitivityControls.forEach(control => control.classList.toggle('is-hidden', selected !== 'joystick'));
    joystickSizeControls.forEach(control => control.classList.toggle('is-hidden', selected !== 'joystick'));
    buttonSizeControls.forEach(control => control.classList.toggle('is-hidden', selected !== 'buttons'));
    stopMobileMovement();
}

function applyControlCustomization(){
    if(mobileControls){
        mobileControls.style.setProperty('--joystick-scale', Math.max(0.8, Math.min(1.3, joystickScaleValue / 100)));
        mobileControls.style.setProperty('--button-scale', Math.max(0.8, Math.min(1.3, buttonScaleValue / 100)));
        mobileControls.style.setProperty('--move-x', `${Math.round(controlMoveX)}px`);
        mobileControls.style.setProperty('--move-y', `${Math.round(controlMoveY)}px`);
    }
}

function syncControlCustomizationInputs(){
    joystickSensitivityInputs.forEach(input => { input.value = joystickSensitivityValue; });
    joystickScaleInputs.forEach(input => { input.value = joystickScaleValue; });
    buttonScaleInputs.forEach(input => { input.value = buttonScaleValue; });
}

function clampControlPosition(x, y){
    if(!mobileControls || !mobileMoveArea) return { x: 0, y: 0 };
    const maxX = Math.max(0, (mobileControls.clientWidth - mobileMoveArea.offsetWidth) / 2 - 12);
    const maxUp = Math.max(36, mobileControls.clientHeight * 0.55);
    const maxDown = Math.max(18, mobileControls.clientHeight * 0.18);
    return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxUp, Math.min(maxDown, y))
    };
}

function setControlPosition(x, y){
    const next = clampControlPosition(x, y);
    controlMoveX = next.x;
    controlMoveY = next.y;
    applyControlCustomization();
}

function saveControlPosition(){
    localStorage.setItem('starSiegeControlMoveX', Math.round(controlMoveX));
    localStorage.setItem('starSiegeControlMoveY', Math.round(controlMoveY));
}

function restoreDefaultControls(){
    joystickSensitivityValue = 100;
    joystickScaleValue = 100;
    buttonScaleValue = 100;
    controlMoveX = 0;
    controlMoveY = 0;
    localStorage.removeItem('starSiegeJoystickSensitivity');
    localStorage.removeItem('starSiegeJoystickScale');
    localStorage.removeItem('starSiegeButtonScale');
    localStorage.removeItem('starSiegeControlMoveX');
    localStorage.removeItem('starSiegeControlMoveY');
    localStorage.removeItem('starSiegeControlPlacement');
    syncControlCustomizationInputs();
    applyControlCustomization();
    applyMobileControlMode('joystick');
}

function canDragControlPosition(){
    return Boolean(state.paused && pauseControlsPanel && !pauseControlsPanel.classList.contains('d-none'));
}

function startControlPositionDrag(e){
    if(!canDragControlPosition() || !mobileMoveArea) return;
    if(e.cancelable) e.preventDefault();
    e.stopPropagation();
    stopMobileMovement();
    mobileMoveArea.classList.add('is-positioning');
    controlPositionDrag = {
        pointerId: e.pointerId ?? null,
        startX: e.clientX,
        startY: e.clientY,
        baseX: controlMoveX,
        baseY: controlMoveY
    };
    if(e.pointerId && mobileMoveArea.setPointerCapture){
        mobileMoveArea.setPointerCapture(e.pointerId);
    }
}

function moveControlPositionDrag(e){
    if(!controlPositionDrag) return;
    if(controlPositionDrag.pointerId !== null && e.pointerId !== undefined && e.pointerId !== controlPositionDrag.pointerId) return;
    if(e.cancelable) e.preventDefault();
    setControlPosition(
        controlPositionDrag.baseX + e.clientX - controlPositionDrag.startX,
        controlPositionDrag.baseY + e.clientY - controlPositionDrag.startY
    );
}

function endControlPositionDrag(e){
    if(!controlPositionDrag) return;
    if(controlPositionDrag.pointerId !== null && e && e.pointerId !== undefined && e.pointerId !== controlPositionDrag.pointerId) return;
    if(e && e.pointerId && mobileMoveArea && mobileMoveArea.releasePointerCapture){
        mobileMoveArea.releasePointerCapture(e.pointerId);
    }
    controlPositionDrag = null;
    if(mobileMoveArea) mobileMoveArea.classList.remove('is-positioning');
}

// Demo joystick for start screen
const demoJoystickZone = document.getElementById('demoJoystickZone');
const demoJoystickStick = document.getElementById('demoJoystickStick');
const demoJoystickBase = document.getElementById('demoJoystickBase');
let demoJoystickActive = false;

function initDemoJoystick() {
    if (!demoJoystickZone) return;

    function handleDemoJoystickMove(e) {
        if (!demoJoystickActive) return;
        const pointer = e.touches ? e.touches[0] : e;
        const rect = demoJoystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = pointer.clientX - centerX;
        let dy = pointer.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = rect.width / 2;
        
        if (distance > maxDistance) {
            dx *= maxDistance / distance;
            dy *= maxDistance / distance;
        }
        
        demoJoystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    function handleDemoJoystickStart(e) {
        e.preventDefault();
        demoJoystickActive = true;
        if (e.pointerId && demoJoystickZone.setPointerCapture) {
            demoJoystickZone.setPointerCapture(e.pointerId);
        }
        handleDemoJoystickMove(e);
    }
    
    function handleDemoJoystickEnd(e) {
        if (e && e.pointerId && demoJoystickZone.releasePointerCapture) {
            demoJoystickZone.releasePointerCapture(e.pointerId);
        }
        demoJoystickActive = false;
        demoJoystickStick.style.transform = `translate(-50%, -50%)`;
    }

    // Pointer events work for both touch and mouse
    demoJoystickZone.addEventListener('pointerdown', handleDemoJoystickStart);
    demoJoystickZone.addEventListener('pointermove', handleDemoJoystickMove);
    demoJoystickZone.addEventListener('pointerup', handleDemoJoystickEnd);
    demoJoystickZone.addEventListener('pointercancel', handleDemoJoystickEnd);
    demoJoystickZone.addEventListener('pointerleave', handleDemoJoystickEnd);

    // Touch fallback for browsers without Pointer Events
    addEventListenerCompat(demoJoystickZone, 'touchstart', (e) => { e.preventDefault(); handleDemoJoystickStart(e); }, { passive: false });
    addEventListenerCompat(demoJoystickZone, 'touchmove', (e) => { e.preventDefault(); handleDemoJoystickMove(e); }, { passive: false });
    addEventListenerCompat(demoJoystickZone, 'touchend', handleDemoJoystickEnd);
    addEventListenerCompat(demoJoystickZone, 'touchcancel', handleDemoJoystickEnd);
}

function initJoystick() {
    if (!joystickZone) return;

    // Add Bootstrap touch classes for better mobile support
    joystickZone.classList.add('touch-manipulation');
    
    function handleJoystickMove(e) {
        if (!joystickActive || getMobileControlMode() !== 'joystick') return;
        if (joystickPointerId !== null && e.pointerId !== undefined && e.pointerId !== joystickPointerId) return;
        if (e.cancelable) e.preventDefault();
        const pointer = e.touches ? e.touches[0] : e;
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = pointer.clientX - centerX;
        let dy = pointer.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = rect.width / 2;
        
        if (distance > maxDistance) {
            dx *= maxDistance / distance;
            dy *= maxDistance / distance;
        }
        
        joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Sensitivity changes how quickly the stick reaches full input; max speed still matches buttons.
        const sensitivity = getJoystickSensitivity();
        const rawX = dx / maxDistance;
        const rawY = dy / maxDistance;
        const magnitude = Math.min(1, Math.sqrt(rawX*rawX + rawY*rawY));
        const deadzone = 0.04;
        if(magnitude <= deadzone){
            player.jx = 0;
            player.jy = 0;
            return;
        }
        const response = Math.min(1, ((magnitude - deadzone) / (1 - deadzone)) * sensitivity);
        player.jx = (rawX / magnitude) * response;
        player.jy = (rawY / magnitude) * response;
    }

    function handleJoystickStart(e) {
        if (getMobileControlMode() !== 'joystick') return;
        if (e.cancelable) e.preventDefault();
        joystickActive = true;
        joystickPointerId = e.pointerId ?? null;
        if (e.pointerId && joystickZone.setPointerCapture) {
            joystickZone.setPointerCapture(e.pointerId);
        }
        handleJoystickMove(e);
    }
    
    function handleJoystickEnd(e) {
        if (joystickPointerId !== null && e && e.pointerId !== undefined && e.pointerId !== joystickPointerId) return;
        if (e && e.pointerId && joystickZone.releasePointerCapture) {
            joystickZone.releasePointerCapture(e.pointerId);
        }
        joystickActive = false;
        joystickPointerId = null;
        joystickStick.style.transform = `translate(-50%, -50%)`;
        player.jx = 0;
        player.jy = 0;
    }

    // Pointer events work for both touch and mouse
    addEventListenerCompat(joystickZone, 'pointerdown', handleJoystickStart);
    addEventListenerCompat(joystickZone, 'pointermove', handleJoystickMove);
    addEventListenerCompat(joystickZone, 'pointerup', handleJoystickEnd);
    addEventListenerCompat(joystickZone, 'pointercancel', handleJoystickEnd);
    addEventListenerCompat(window, 'pointermove', handleJoystickMove);
    addEventListenerCompat(window, 'pointerup', handleJoystickEnd);
    addEventListenerCompat(window, 'pointercancel', handleJoystickEnd);

    // Touch fallback for browsers without Pointer Events
    addEventListenerCompat(joystickZone, 'touchstart', (e) => { e.preventDefault(); handleJoystickStart(e); }, { passive: false });
    addEventListenerCompat(window, 'touchmove', (e) => { if(joystickActive){ e.preventDefault(); handleJoystickMove(e); } }, { passive: false });
    addEventListenerCompat(window, 'touchend', handleJoystickEnd);
    addEventListenerCompat(window, 'touchcancel', handleJoystickEnd);
}

initJoystick();
initDemoJoystick();

joystickSensitivityInputs.forEach(input => {
    input.value = joystickSensitivityValue;
    input.addEventListener('input', () => {
        joystickSensitivityValue = Number(input.value) || 100;
        localStorage.setItem('starSiegeJoystickSensitivity', joystickSensitivityValue);
        joystickSensitivityInputs.forEach(other => {
            if(other !== input) other.value = joystickSensitivityValue;
        });
    });
});
joystickScaleInputs.forEach(input => {
    input.value = joystickScaleValue;
    input.addEventListener('input', () => {
        joystickScaleValue = Number(input.value) || 100;
        localStorage.setItem('starSiegeJoystickScale', joystickScaleValue);
        joystickScaleInputs.forEach(other => {
            if(other !== input) other.value = joystickScaleValue;
        });
        applyControlCustomization();
    });
});
buttonScaleInputs.forEach(input => {
    input.value = buttonScaleValue;
    input.addEventListener('input', () => {
        buttonScaleValue = Number(input.value) || 100;
        localStorage.setItem('starSiegeButtonScale', buttonScaleValue);
        buttonScaleInputs.forEach(other => {
            if(other !== input) other.value = buttonScaleValue;
        });
        applyControlCustomization();
    });
});
controlModeButtons.forEach(btn => btn.addEventListener('click', () => applyMobileControlMode('buttons')));
controlModeJoystick.forEach(btn => btn.addEventListener('click', () => applyMobileControlMode('joystick')));
savePositionButtons.forEach(btn => btn.addEventListener('click', saveControlPosition));
restoreDefaultButtons.forEach(btn => btn.addEventListener('click', restoreDefaultControls));
if(pauseControlsBtn && pauseControlsPanel){
    pauseControlsBtn.addEventListener('click', () => {
        pauseControlsPanel.classList.toggle('d-none');
    });
}
if(mobileMoveArea){
    addEventListenerCompat(mobileMoveArea, 'pointerdown', startControlPositionDrag, { capture: true });
    addEventListenerCompat(window, 'pointermove', moveControlPositionDrag);
    addEventListenerCompat(window, 'pointerup', endControlPositionDrag);
    addEventListenerCompat(window, 'pointercancel', endControlPositionDrag);
    window.addEventListener('resize', () => setControlPosition(controlMoveX, controlMoveY));
}
applyControlCustomization();
applyMobileControlMode(getMobileControlMode());

function holdBtn(id, onStart, onEnd) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const start = (e) => {
        if (e.cancelable) e.preventDefault();
        onStart();
    };
    const end = (e) => {
        if (e && e.cancelable) e.preventDefault();
        onEnd();
    };

    addEventListenerCompat(btn, 'pointerdown', start);
    addEventListenerCompat(btn, 'pointerup', end);
    addEventListenerCompat(btn, 'pointercancel', end);
    addEventListenerCompat(btn, 'pointerleave', end);
    addEventListenerCompat(btn, 'touchstart', start, { passive: false });
    addEventListenerCompat(btn, 'touchend', end);
    addEventListenerCompat(btn, 'mousedown', start);
    addEventListenerCompat(btn, 'mouseup', end);
    addEventListenerCompat(btn, 'mouseleave', end);
    addEventListenerCompat(btn, 'contextmenu', (e) => e.preventDefault());
}

holdBtn('btnFire',  ()=>{player.mFire=true;},  ()=>{player.mFire=false;});
holdBtn('btnLeft',  ()=>{ if(getMobileControlMode()==='buttons') player.mLeft=true; },  ()=>{ player.mLeft=false; });
holdBtn('btnRight', ()=>{ if(getMobileControlMode()==='buttons') player.mRight=true; }, ()=>{ player.mRight=false; });
holdBtn('btnUp',    ()=>{ if(getMobileControlMode()==='buttons') player.mUp=true; },    ()=>{ player.mUp=false; });
holdBtn('btnDown',  ()=>{ if(getMobileControlMode()==='buttons') player.mDown=true; },  ()=>{ player.mDown=false; });

// ── UI buttons ────────────────────────────────────────
document.getElementById('playBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
document.getElementById('menuBtn').addEventListener('click',()=>{ cancelAnimationFrame(state.animId); state.running=false; stopLevelMusic(); loadStats(); showScreen('start'); });
document.getElementById('pauseBtn').addEventListener('click',togglePause);
document.getElementById('resumeBtn').addEventListener('click',togglePause);
const exitBtn = document.getElementById('exitBtn');
if(exitBtn) {
    exitBtn.addEventListener('click', () => {
        state.paused = false;
        pauseOverlay.classList.remove('active');
        cancelAnimationFrame(state.animId);
        state.running = false;
        stopLevelMusic();
        loadStats();
        showScreen('start');
    });
}

// Global Fullscreen
const globalFsBtn = document.getElementById('globalFullscreenBtn');
if(globalFsBtn){
    globalFsBtn.addEventListener('click', ()=>{
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// Fullscreen
document.getElementById('fullscreenBtn').addEventListener('click', ()=>{
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
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
        state.shield=0; state.rapidfire=0; state.tripleshot=0; state.magnet=0;
        
        initPlayer(); // re-init to reset position
        upgradePlayerShip(state.level); // keep ship design for current level
        
        updateHUD();
        showScreen('game');
        state.running = true;
        startLevelMusic(state.level);
        playLevelStinger(state.level);
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

// ── Leaderboard Logic (GLOBAL via PHP) ────────────────
function cleanLeaderboardName(name){
    const cleaned = String(name || '').trim().replace(/[<>]/g, '').slice(0, 10);
    return cleaned || 'PILOT';
}

function cleanScore(score){
    const n = parseInt(score, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function leaderboardDate(){
    return new Date().toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'2-digit' });
}

function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function getLeaderboardHeader(){
    const list = document.getElementById('leaderboardList');
    return list && list.closest('.info-card') ? list.closest('.info-card').querySelector('.info-card-header') : null;
}

function getLocalLeaderboard(){
    try {
        const board = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
        return Array.isArray(board) ? board : [];
    } catch (e) {
        return [];
    }
}

function saveLocalLeaderboard(name, score){
    const entry = { name: cleanLeaderboardName(name), score: cleanScore(score), date: leaderboardDate() };
    const board = getLocalLeaderboard();
    board.push(entry);
    board.sort((a, b) => cleanScore(b.score) - cleanScore(a.score));
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 20)));
}

function drawLeaderboard(board, total, sourceLabel){
    const list = document.getElementById('leaderboardList');
    const header = getLeaderboardHeader();
    if (!list) return;

    const safeBoard = (board || []).map(entry => ({
        name: cleanLeaderboardName(entry.name),
        score: cleanScore(entry.score),
        date: entry.date || ''
    })).sort((a, b) => b.score - a.score).slice(0, 3);

    if (header) {
        const suffix = sourceLabel ? ` ${sourceLabel}` : '';
        header.innerHTML = `<i class="fa-solid fa-trophy me-2"></i>Top Commanders (${total || safeBoard.length} total)${suffix}`;
    }

    if (safeBoard.length === 0) {
        list.innerHTML = '<div class="text-center text-muted py-3" style="font-size: 0.7rem; letter-spacing: 1px;">No records yet. Be the first!</div>';
        return;
    }

    list.innerHTML = safeBoard.map((entry, i) => {
        const rank = i + 1;
        const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--clr-warn)';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 5px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: ${rankColor}; font-family: var(--font-title); font-size: 0.8rem; min-width: 25px; font-weight: bold;">#${rank}</span>
                    <div>
                        <div class="pu-name" style="font-size: 0.75rem; color: #fff; margin: 0;">${escapeHtml(entry.name)}</div>
                        <div style="font-size: 0.55rem; color: var(--clr-muted);">${escapeHtml(entry.date)}</div>
                    </div>
                </div>
                <div style="font-family: var(--font-title); color: var(--clr-accent); font-size: 0.85rem;">${entry.score.toLocaleString()}</div>
            </div>
        `;
    }).join('');
}

async function saveLeaderboard(name, score) {
    const safeName = cleanLeaderboardName(name);
    const safeScore = cleanScore(score);
    saveLocalLeaderboard(safeName, safeScore);

    try {
        const res = await fetch('save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: safeName, score: safeScore })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        renderLeaderboard();
    } catch (e) {
        console.warn("Online leaderboard unavailable; saved locally.", e);
        renderLocalLeaderboard();
    }
}

async function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    
    try {
        const res = await fetch('get_leaderboard.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const board = data.top || [];
        const total = data.total || 0;
        drawLeaderboard(board, total, '');
    } catch (e) {
        console.error("Leaderboard Load Failed:", e);
        renderLocalLeaderboard();
    }
}

function renderLocalLeaderboard() {
    const board = getLocalLeaderboard();
    drawLeaderboard(board, board.length, '(local)');
}

// ── Init ──────────────────────────────────────────────
window.addEventListener('load',()=>{
    resizeCanvas(); loadStats(); showScreen('start'); initStars();
    ctx.fillStyle='#020810'; ctx.fillRect(0,0,CW,CH);
    for(const s of stars){ ctx.globalAlpha=s.alpha; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
});
