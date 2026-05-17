// =====================================================================
// BALDIN' RING v3 - Fighting Game
// Street Fighter-style 1v1 vs Evil Bald. SNES sprites, chat sidebar, juice.
// =====================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = canvas.width;     // 1280
const H = canvas.height;    // 720
const GW = 960;             // game area width (chat sidebar is 320 right)
const SIDEBAR_X = 960;
const SIDEBAR_W = 320;
const FLOOR_Y = 580;        // y position fighters stand on (their feet hit this)

// =====================================================================
// IMAGES
// =====================================================================
const IMAGES = {
    evil_bald:        { src: 'assets/img/evil_bald.png',        img: null, loaded: false },
    ladder_man:       { src: 'assets/img/ladder_man.png',       img: null, loaded: false },
    generic_white:    { src: 'assets/img/generic_white.png',    img: null, loaded: false },
    slug:             { src: 'assets/img/slug.png',             img: null, loaded: false },
    pullout_merchant: { src: 'assets/img/pullout_merchant.png', img: null, loaded: false },
    dj_plan_b:        { src: 'assets/img/dj_plan_b.png',        img: null, loaded: false },
    the_m:            { src: 'assets/img/the_m.png',            img: null, loaded: false },
    evil_bald_sprite:        { src: 'assets/img/sprites/evil_bald_sprite.png',        img: null, loaded: false },
    ladder_man_sprite:       { src: 'assets/img/sprites/ladder_man_sprite.png',       img: null, loaded: false },
    generic_white_sprite:    { src: 'assets/img/sprites/generic_white_sprite.png',    img: null, loaded: false },
    slug_sprite:             { src: 'assets/img/sprites/slug_sprite.png',             img: null, loaded: false },
    pullout_merchant_sprite: { src: 'assets/img/sprites/pullout_merchant_sprite.png', img: null, loaded: false },
    dj_plan_b_sprite:        { src: 'assets/img/sprites/dj_plan_b_sprite.png',        img: null, loaded: false },
    the_m_sprite:            { src: 'assets/img/sprites/the_m_sprite.png',            img: null, loaded: false },
    spam_mets:               { src: 'assets/img/sprites/spam_mets.png',               img: null, loaded: false },
    spam_halo:               { src: 'assets/img/sprites/spam_halo.png',               img: null, loaded: false },
    spam_food:               { src: 'assets/img/sprites/spam_food.png',               img: null, loaded: false },
    spam_rip:                { src: 'assets/img/sprites/spam_rip.png',                img: null, loaded: false },
    spam_flex:               { src: 'assets/img/sprites/spam_flex.png',               img: null, loaded: false },
    background_arena:        { src: 'assets/img/sprites/background_arena.png',        img: null, loaded: false }
};
(function loadImages() {
    Object.keys(IMAGES).forEach(key => {
        const img = new Image();
        img.onload = () => { IMAGES[key].loaded = true; };
        img.onerror = () => { };
        img.src = IMAGES[key].src;
        IMAGES[key].img = img;
    });
})();
const HARKONNEN_FILTER = 'sepia(0.42) contrast(1.18) brightness(0.88) saturate(0.85) hue-rotate(-8deg)';

// =====================================================================
// MUSIC - DJ Plan B's boss theme (tech house track, ~2 min, loops)
// =====================================================================
const bossMusic = new Audio('assets/audio/boss_theme.mp3');
bossMusic.loop = true;
bossMusic.volume = 0.6;
function playBossMusic() {
    try {
        bossMusic.currentTime = 0;
        const p = bossMusic.play();
        if (p && p.catch) p.catch(() => { /* autoplay blocked - silently ignore */ });
    } catch (e) { /* silent */ }
}
function stopBossMusic() {
    try { bossMusic.pause(); bossMusic.currentTime = 0; } catch (e) {}
}

// =====================================================================
// STATE
// =====================================================================
const STATE = { TITLE: 'title', CHAR_SELECT: 'char_select', SHOP: 'shop', FIGHT: 'fight', WIN: 'win', LOSE: 'lose' };
let gameState = STATE.TITLE;

// Hit-stop and screen-shake (the juice)
let hitStopTimer = 0;
let shakeX = 0, shakeY = 0, shakeTimer = 0, shakeIntensity = 0;
function addShake(intensity, duration) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeTimer = Math.max(shakeTimer, duration);
}
function addHitStop(duration) {
    hitStopTimer = Math.max(hitStopTimer, duration);
}

// =====================================================================
// CHARACTERS (fighting game stats)
// =====================================================================
// spriteDefaultFacing: which direction the source PNG visually faces (-1 left, 1 right).
// Used by drawFighter so we only flip the sprite when its natural facing differs from f.facing.
const CHARACTERS = {
    ladder_man: {
        name: "LADDER MAN",
        tag: "The Lanky Goon",
        maxHp: 100,
        walkSpeed: 220,
        jumpPower: 750,
        light: { startup: 0.08, active: 0.10, recovery: 0.20, damage: 7,  knockback: 200, range: 90, height: 70 },
        heavy: { startup: 0.22, active: 0.14, recovery: 0.40, damage: 16, knockback: 380, range: 130, height: 100 },
        specialName: "LADDER SWING",
        specialDesc: "Wide swing. Hits both sides. Knocks boss across screen.",
        special: { startup: 0.30, active: 0.30, recovery: 0.55, damage: 24, knockback: 500, range: 160, height: 140, both: true },
        spriteKey: 'ladder_man_sprite',
        spriteDefaultFacing: 1,   // source has ladder over right shoulder = faces RIGHT
        scale: 1.5
    },
    generic_white: {
        name: "GENERIC WHITE",
        tag: "The Default Protagonist",
        maxHp: 130,
        walkSpeed: 200,
        jumpPower: 760,
        light: { startup: 0.06, active: 0.10, recovery: 0.18, damage: 6,  knockback: 180, range: 80, height: 90 },
        heavy: { startup: 0.18, active: 0.12, recovery: 0.35, damage: 14, knockback: 350, range: 110, height: 100 },
        specialName: "SHIELD COUNTER",
        specialDesc: "Brief invuln. If hit during, automatic counter-slash for huge damage.",
        special: { startup: 0.05, active: 0.50, recovery: 0.40, damage: 30, knockback: 450, range: 130, height: 110, counter: true },
        spriteKey: 'generic_white_sprite',
        spriteDefaultFacing: -1,  // sword on viewer's left = faces LEFT
        scale: 1.5
    },
    slug: {
        name: "SLUG",
        tag: "The Big Spender",
        maxHp: 90,
        walkSpeed: 210,
        jumpPower: 720,
        light: { startup: 0.07, active: 0.09, recovery: 0.16, damage: 5,  knockback: 170, range: 75, height: 80 },
        heavy: { startup: 0.20, active: 0.12, recovery: 0.32, damage: 12, knockback: 330, range: 100, height: 95 },
        specialName: "UFC TICKET FAN",
        specialDesc: "Throws 3 gold tickets in a spread. Ranged projectiles.",
        special: { startup: 0.18, active: 0.05, recovery: 0.40, damage: 12, knockback: 200, range: 0, height: 0, projectile: 'tickets' },
        spriteKey: 'slug_sprite',
        spriteDefaultFacing: -1,  // cards on viewer's left = faces LEFT
        scale: 1.5
    }
};

// =====================================================================
// FIGHTERS (player and boss are similar structures)
// =====================================================================
function makeFighter(opts) {
    return {
        // Position
        x: opts.x, y: FLOOR_Y,
        vx: 0, vy: 0,
        w: 70, h: 140,
        facing: opts.facing,
        onGround: true,
        // Stats
        hp: opts.maxHp,
        maxHp: opts.maxHp,
        special: opts.special || 0,
        maxSpecial: 100,
        // Action state
        state: 'idle',          // idle | walking | crouching | jumping | attacking | hit | blocking | special
        attackType: null,       // 'light' | 'heavy' | 'special'
        attackPhase: 'none',    // 'startup' | 'active' | 'recovery'
        attackTimer: 0,
        hitTimer: 0,            // hitstun duration
        hitFlash: 0,
        blockTimer: 0,
        invuln: 0,
        hasHitThisAttack: false,
        // Animation
        bobPhase: Math.random() * Math.PI * 2,
        leanAngle: 0,           // for attack tilt and hit lean
        squishY: 1.0,           // for landing/crouching scale
        data: opts.data || null // fighter stats (set immediately, no race with updateFighter)
    };
}

// =====================================================================
// PLAYER + BOSS
// =====================================================================
const player = {
    charKey: null,
    data: null,
    fighter: null,
    flasks: 2,
    runes: 100,
    specialCharges: 0,
    ownedItems: new Set(),
    comboCount: 0,
    comboTimer: 0
};

const boss = {
    data: null,
    fighter: null,
    aiTimer: 1.5,           // before next decision
    aiAction: null,         // current action plan
    phase: 1,
    nextSpamType: null
};

const BOSS_DATA = {
    maxHp: 180,
    walkSpeed: 130,
    jumpPower: 760,
    spriteDefaultFacing: -1,  // Evil Bald source is symmetric, treat as left-default like the rest
    // Boss attacks
    jab:        { startup: 0.18, active: 0.10, recovery: 0.30, damage: 8,  knockback: 220, range: 110, height: 100, name: 'jab' },
    haloSlash:  { startup: 0.30, active: 0.20, recovery: 0.55, damage: 18, knockback: 380, range: 180, height: 110, name: 'haloSlash', advance: 260 },
    metsToss:   { startup: 0.35, active: 0.10, recovery: 0.50, damage: 14, projectile: 'mets',  name: 'metsToss' },
    foodPic:    { startup: 0.45, active: 0.40, recovery: 0.60, damage: 12, name: 'foodPic', radius: 160 },
    ripDrop:    { startup: 0.45, active: 0.20, recovery: 0.50, damage: 22, name: 'ripDrop', jumpHigh: true },
    flex:       { startup: 1.20, active: 0.30, recovery: 0.80, damage: 35, knockback: 600, range: 180, height: 200, name: 'flex' },
    spamWall:   { startup: 0.40, active: 0.10, recovery: 0.30, damage: 12, projectile: 'wall', name: 'spamWall' }
};

// Projectiles (mets tweets, slug tickets, etc)
let projectiles = [];
// Foodpic AOE markers (visual warnings)
let aoeMarkers = [];
// Floating texts
let floatingTexts = [];
// Particle effects (hit sparks)
let particles = [];

// =====================================================================
// SHOP
// =====================================================================
const SHOP_ITEMS = [
    { id: 'flask',   name: 'Pull Out Insurance', desc: '+1 Healing Flask',         cost: 30, apply: () => { player.flasks += 1; } },
    { id: 'grip',    name: 'Iron Grip',           desc: '+25% Attack Damage',       cost: 40, apply: () => { player.dmgMult = (player.dmgMult || 1) * 1.25; } },
    { id: 'patient', name: 'Patient Eye',         desc: 'Boss startup +25%',        cost: 50, apply: () => { boss.startupBonus = 1.25; } },
    { id: 'plate',   name: 'Heavy Plate',         desc: 'Block reduces 80% damage', cost: 40, apply: () => { player.blockMult = 0.20; } },
    { id: 'plan_b',  name: 'Plan B',              desc: '+1 Special Charge',        cost: 60, apply: () => { player.specialCharges += 1; } }
];
const MERCHANT_LINES = [
    "Pull out before it's too late.",
    "He's been worse than usual.",
    "I sold the last flask to your brother. Never saw him again.",
    "He's posting again. I can feel it.",
    "Protection is essential, friend.",
    "...he's been late to chat for hours.",
    "Have you considered just muting him?",
    "Plan ahead. Plan B."
];
let merchantLine = MERCHANT_LINES[0];

// =====================================================================
// CHAT SIDEBAR
// =====================================================================
const CHAT_MESSAGES = [];
const MAX_CHAT_LINES = 22;
const CHAT_AUTHORS = {
    bald:    { name: 'EVIL BALD',  color: '#ff4848' },
    m:       { name: 'THE M',      color: '#888888' },
    dj:      { name: 'DJ PLAN B',  color: '#fada30' },
    merchant:{ name: 'MERCHANT',   color: '#5a8a3a' },
    sys:     { name: 'SYS',        color: '#666666' },
    you:     { name: 'YOU',        color: '#5aafff' }
};
function chatPush(author, text) {
    CHAT_MESSAGES.push({ author, text });
    while (CHAT_MESSAGES.length > MAX_CHAT_LINES * 2) CHAT_MESSAGES.shift();
}
const SPAM_CHAT_TEXTS = {
    mets:  ['mets won 7-2', 'mets news', 'this is huge for the mets', 'mets WALK-OFF', 'pete alonso 30th HR', 'NYM @ ATL today fellas', 'starling marte is back'],
    halo:  ['new halo leaks', 'halo infinite update', 'master chief returns', 'halo trailer ?', 'campaign confirmed', 'this is real halo content'],
    food:  ['look what I made', 'gym meal 2 of 5', 'protein bowl 800cal', 'this is fire', 'lunch', 'meal prep sunday', 'cant eat carbs anymore'],
    rip:   ['did you see who died', 'rip', 'tragic loss today', 'cant believe this', 'so young', 'press F'],
    flex:  ['hit a new PR', 'lift today was insane', '405 deadlift', 'gym update', 'shredded', 'progress pic', '12 weeks in']
};
const M_RANDOM_LINES = [
    'why does this keep happening', 'today is the worst day of my life', 'I just want to sleep',
    'so tired of this group chat', 'mute. just mute. why cant I mute', 'I had plans tonight',
    'why am I watching this', 'this is fine', 'I cant believe Im still alive for this'
];
const DJ_RANDOM_LINES = [
    'this beat is fire', 'queueing the next track', 'plan b dropping bombs',
    '*scratches*', 'feeling it tonight', 'one more for the road', 'cant stop wont stop'
];
const BOSS_TAUNTS = [
    'lol', 'u up?', 'didnt see this', 'scroll up', 'one more', 'look at this',
    'guys', 'guys?', 'GUYS', 'hello?', 'anyone there', 'reply'
];
let mLineTimer = 8 + Math.random() * 8;
let djLineTimer = 12 + Math.random() * 8;
let bossTauntTimer = 10 + Math.random() * 8;
let djBobPhase = 0;  // for DJ Plan B head-bobbing animation

// =====================================================================
// AUDIO
// =====================================================================
let audioCtx = null;
function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}
function sfx(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const beep = (freq, kind, dur, gain, slide) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = kind; o.frequency.value = freq;
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now); o.stop(now + dur);
    };
    if (type === 'hit_light') beep(280, 'square',   0.10, 0.18, 100);
    else if (type === 'hit_heavy') { beep(140, 'square', 0.25, 0.30, 50); beep(80, 'sawtooth', 0.30, 0.20, 30); }
    else if (type === 'damage')   beep(220, 'sawtooth', 0.25, 0.20, 70);
    else if (type === 'dodge')    beep(700, 'triangle', 0.12, 0.08, 280);
    else if (type === 'jump')     beep(440, 'triangle', 0.15, 0.10, 880);
    else if (type === 'block')    beep(900, 'square',   0.10, 0.12, 600);
    else if (type === 'heal')     beep(440, 'sine',     0.40, 0.10, 880);
    else if (type === 'click')    beep(880, 'sine',     0.06, 0.08);
    else if (type === 'special')  { beep(660, 'square', 0.20, 0.15, 1200); beep(330, 'sawtooth', 0.30, 0.15, 660); }
    else if (type === 'whiff')    beep(400, 'triangle', 0.08, 0.05, 200);
    else if (type === 'win')      [440,554,659,880].forEach((f,i)=>setTimeout(()=>beep(f,'triangle',0.5,0.10),i*150));
    else if (type === 'lose')     [330,277,220,165].forEach((f,i)=>setTimeout(()=>beep(f,'sawtooth',0.6,0.10),i*200));
    else if (type === 'ko')       [880,660,440,220,110].forEach((f,i)=>setTimeout(()=>beep(f,'square',0.2,0.15),i*60));
}

// =====================================================================
// INPUT
// =====================================================================
const keys = {};
window.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    if (!keys[e.code]) handleInputDown(e.code);
    keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function handleInputDown(code) {
    initAudio();
    if (gameState === STATE.TITLE && code === 'Space') { gameState = STATE.CHAR_SELECT; sfx('click'); return; }
    if (gameState === STATE.CHAR_SELECT) {
        if (code === 'Digit1') selectCharacter('ladder_man');
        if (code === 'Digit2') selectCharacter('generic_white');
        if (code === 'Digit3') selectCharacter('slug');
        return;
    }
    if (gameState === STATE.SHOP) {
        const num = parseInt(code.replace('Digit', ''));
        if (num >= 1 && num <= SHOP_ITEMS.length) tryBuyItem(SHOP_ITEMS[num - 1]);
        if (code === 'Space') startFight();
        return;
    }
    if (gameState === STATE.FIGHT) {
        const f = player.fighter;
        // Snap-face the boss on ANY arrow / movement key press (even if mid-recovery or stunned).
        // Fixes "stuck not facing boss" complaint.
        if (['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(code)) {
            if (f.onGround && f.attackPhase !== 'active' && f.attackPhase !== 'startup') {
                f.facing = boss.fighter.x > f.x ? 1 : -1;
            }
        }
        if (!canAct(f)) return;
        if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') tryJump(f);
        if (code === 'KeyJ') startAttack(f, 'light', player.data.light);
        if (code === 'KeyK') startAttack(f, 'heavy', player.data.heavy);
        if (code === 'KeyL') trySpecial();
        if (code === 'KeyH' && player.flasks > 0 && f.hp < f.maxHp) { useFlask(); }
        return;
    }
    if ((gameState === STATE.WIN || gameState === STATE.LOSE) && code === 'Space') {
        gameState = STATE.TITLE;
    }
}

function selectCharacter(key) {
    sfx('click');
    player.charKey = key;
    player.data = CHARACTERS[key];
    player.dmgMult = 1.0;
    player.blockMult = 0.40;
    player.specialCharges = 3;
    player.flasks = 2;
    player.runes = 100;
    player.ownedItems = new Set();
    merchantLine = MERCHANT_LINES[Math.floor(Math.random() * MERCHANT_LINES.length)];
    gameState = STATE.SHOP;
}

function tryBuyItem(item) {
    if (player.ownedItems.has(item.id) || player.runes < item.cost) return;
    player.runes -= item.cost;
    player.ownedItems.add(item.id);
    item.apply();
    sfx('click');
}

function startFight() {
    sfx('click');
    player.fighter = makeFighter({ x: 300, facing: 1, maxHp: player.data.maxHp, data: player.data });
    boss.data = BOSS_DATA;
    boss.fighter = makeFighter({ x: 720, facing: -1, maxHp: BOSS_DATA.maxHp, data: BOSS_DATA });
    boss.fighter.w = 90; boss.fighter.h = 170;
    boss.aiTimer = 2.0;
    boss.aiAction = null;
    boss.phase = 1;
    boss.attackToken = 0;  // monotonic token: setTimeout callbacks check this before firing
    projectiles = [];
    aoeMarkers = [];
    floatingTexts = [];
    particles = [];
    hitStopTimer = 0;
    shakeTimer = 0;
    player.comboCount = 0;
    player.comboTimer = 0;
    CHAT_MESSAGES.length = 0;
    chatPush('sys', 'Evil Bald has logged on');
    chatPush('m', 'oh no');
    chatPush('dj', 'lets gooo');
    gameState = STATE.FIGHT;
    playBossMusic();
}

function canAct(f) {
    return f.hitTimer <= 0 && f.attackPhase === 'none' && f.state !== 'special';
}

function tryJump(f) {
    if (f.onGround) {
        f.vy = -f.data.jumpPower;
        f.onGround = false;
        sfx('jump');
    }
}

function startAttack(f, type, attackData) {
    f.state = 'attacking';
    f.attackType = type;
    f.attackData = attackData;
    f.attackPhase = 'startup';
    f.attackTimer = attackData.startup;
    f.hasHitThisAttack = false;
    if (type === 'heavy') sfx('whiff');
}

function trySpecial() {
    if (player.specialCharges <= 0) return;
    const f = player.fighter;
    if (!canAct(f)) return;
    player.specialCharges -= 1;
    f.state = 'attacking';
    f.attackType = 'special';
    f.attackData = player.data.special;
    f.attackPhase = 'startup';
    f.attackTimer = player.data.special.startup;
    f.hasHitThisAttack = false;
    sfx('special');
    if (player.data.special.projectile === 'tickets') {
        // spawn 3 tickets after startup
        setTimeout(() => {
            if (gameState !== STATE.FIGHT) return;
            const baseX = f.x + f.facing * 40;
            const baseY = f.y - f.h/2;
            for (let i = -1; i <= 1; i++) {
                projectiles.push({
                    type: 'ticket',
                    x: baseX, y: baseY,
                    vx: f.facing * 550,
                    vy: i * 180,
                    damage: 12,
                    owner: 'player',
                    life: 2.0,
                    spin: 0
                });
            }
        }, player.data.special.startup * 1000);
    }
    floatingTexts.push({ x: f.x, y: f.y - 200, text: player.data.specialName, color: '#fada30', life: 1.5 });
}

function useFlask() {
    player.flasks -= 1;
    player.fighter.hp = Math.min(player.fighter.maxHp, player.fighter.hp + 35);
    player.fighter.invuln = 0.8;
    sfx('heal');
    floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 160, text: '+35', color: '#5aff5a', life: 1.2 });
}

// =====================================================================
// UPDATE
// =====================================================================
function update(dt) {
    if (gameState !== STATE.FIGHT) {
        // chat updates pause when not fighting
        return;
    }
    if (hitStopTimer > 0) {
        hitStopTimer -= dt;
        return;
    }
    updateShake(dt);
    updateFighter(player.fighter, dt, false);
    updateFighter(boss.fighter, dt, true);
    updateBossAI(dt);
    updateProjectiles(dt);
    updateAOE(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateComboTimer(dt);
    updateChatTimers(dt);
    updateDJ(dt);
    // win/lose check
    if (boss.fighter.hp <= 0 && gameState === STATE.FIGHT) {
        boss.fighter.hp = 0;
        addShake(20, 1.0);
        sfx('ko');
        sfx('win');
        chatPush('bald', 'rude');
        chatPush('sys', 'Evil Bald is offline');
        stopBossMusic();
        setTimeout(() => { if (gameState === STATE.FIGHT) gameState = STATE.WIN; }, 600);
    }
    if (player.fighter.hp <= 0 && gameState === STATE.FIGHT) {
        player.fighter.hp = 0;
        addShake(20, 1.0);
        sfx('ko');
        sfx('lose');
        chatPush('sys', 'You opened the link');
        stopBossMusic();
        setTimeout(() => { if (gameState === STATE.FIGHT) gameState = STATE.LOSE; }, 600);
    }
}

function updateShake(dt) {
    if (shakeTimer > 0) {
        shakeTimer -= dt;
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        if (shakeTimer <= 0) {
            shakeX = 0; shakeY = 0; shakeIntensity = 0;
        }
    } else {
        shakeX = 0; shakeY = 0;
    }
}

function updateFighter(f, dt, isBoss) {
    // bobPhase speeds up with horizontal velocity so walking animation feels stepped
    const speed = Math.abs(f.vx) / 200;
    f.bobPhase += dt * (4 + speed * 10);
    if (f.invuln > 0) f.invuln -= dt;
    if (f.hitFlash > 0) f.hitFlash -= dt;
    if (f.blockTimer > 0) f.blockTimer -= dt;
    if (f.leanAngle !== 0) f.leanAngle *= 0.85;
    if (f.squishY !== 1) f.squishY += (1 - f.squishY) * 8 * dt;

    // Hit stun
    if (f.hitTimer > 0) {
        f.hitTimer -= dt;
        // Knockback friction - x is applied below in the unified "apply position" step,
        // so don't add it twice here
        f.vx *= 0.92;
    }

    // Attack progression - GATED on hit stun (a hit interrupts the attack)
    if (f.attackPhase !== 'none' && f.hitTimer <= 0) {
        f.attackTimer -= dt;
        if (f.attackTimer <= 0) {
            if (f.attackPhase === 'startup') {
                f.attackPhase = 'active';
                f.attackTimer = f.attackData.active;
                // Big lean for visible swing motion
                const isHeavy = f.attackType === 'heavy' || f.attackType === 'special';
                f.leanAngle = f.facing * (isHeavy ? 0.5 : 0.32);
                // Audible swing - so player hears the attack even when it whiffs
                if (!isBoss) sfx(isHeavy ? 'hit_heavy' : 'hit_light');
                // Spawn motion trail particles in the swing arc
                const cx = f.x + f.facing * 30;
                const cy = f.y - f.h * 0.55;
                const range = f.attackData.range || 100;
                const color = f.attackType === 'special' ? '#fada30' : (isHeavy ? '#ff8030' : '#ffffff');
                for (let i = 0; i < (isHeavy ? 14 : 8); i++) {
                    const a = -0.6 + Math.random() * 1.2;
                    particles.push({
                        x: cx + f.facing * Math.cos(a) * range * 0.7,
                        y: cy + Math.sin(a) * range * 0.5,
                        vx: f.facing * (150 + Math.random() * 100),
                        vy: (Math.random() - 0.5) * 200,
                        color,
                        life: 0.25 + Math.random() * 0.2,
                        size: 3 + Math.random() * 3
                    });
                }
                // Special: handle counter setup
                if (f.attackType === 'special' && f.attackData.counter) {
                    f.invuln = f.attackData.active;
                }
            } else if (f.attackPhase === 'active') {
                f.attackPhase = 'recovery';
                f.attackTimer = f.attackData.recovery;
            } else if (f.attackPhase === 'recovery') {
                f.attackPhase = 'none';
                f.attackType = null;
                f.attackData = null;
                f.state = 'idle';
                f.hasHitThisAttack = false;
            }
        }
        // Check hit during active phase
        if (f.attackPhase === 'active' && !f.hasHitThisAttack && f.attackData.range) {
            const target = isBoss ? player.fighter : boss.fighter;
            checkAttackHit(f, target, isBoss);
        }
    }

    // Player input (only if not in hit stun / not attacking)
    if (!isBoss && canAct(f)) {
        let walkDir = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) walkDir = -1;
        if (keys['ArrowRight'] || keys['KeyD']) walkDir = 1;

        // Block = holding away from boss
        const awayFromBoss = boss.fighter.x > f.x ? -1 : 1;
        const isBlocking = walkDir === awayFromBoss && walkDir !== 0;

        // Crouch
        const isCrouching = (keys['ArrowDown'] || keys['KeyS']) && f.onGround;

        if (isBlocking) {
            f.state = 'blocking';
            f.blockTimer = 0.1;
            f.vx = walkDir * f.data.walkSpeed * 0.5;  // slow walk while blocking
        } else if (isCrouching) {
            f.state = 'crouching';
            f.vx = 0;
            f.squishY = 0.7;
        } else if (walkDir !== 0) {
            f.state = 'walking';
            f.vx = walkDir * f.data.walkSpeed;
        } else {
            f.state = 'idle';
            f.vx = 0;
        }

    } else if (!isBoss && f.hitTimer <= 0) {
        // stunned no longer but in attack - velocity carries
    } else if (isBoss && !canAct(f)) {
        // boss in attack
    } else if (isBoss) {
        // walking handled by AI
    }

    // FACING: always face the opponent when on the ground and NOT in attack startup/active.
    // (during recovery we allow it to update too so player doesn't get stuck wrong-way after a whiff)
    // This runs for BOTH player and boss, regardless of canAct, fixing the "stuck facing wrong way" bug.
    if (f.onGround && f.attackPhase !== 'startup' && f.attackPhase !== 'active') {
        const opponent = isBoss ? player.fighter : boss.fighter;
        if (opponent) {
            f.facing = opponent.x > f.x ? 1 : -1;
        }
    }

    // Gravity
    if (!f.onGround) {
        f.vy += 2200 * dt;
        if (f.vy > 1500) f.vy = 1500;
    }

    // Apply position
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Floor collision
    if (f.y >= FLOOR_Y) {
        if (!f.onGround && f.vy > 100) {
            f.squishY = 0.7;  // landing squish
        }
        f.y = FLOOR_Y;
        f.vy = 0;
        f.onGround = true;
    }

    // Boundary
    if (f.x < 50) f.x = 50;
    if (f.x > GW - 50) f.x = GW - 50;

    // data ref for fighter (for attacks)
    f.data = isBoss ? BOSS_DATA : player.data;
}

function checkAttackHit(attacker, defender, isBoss) {
    const range = attacker.attackData.range;
    const height = attacker.attackData.height;
    const reachX = attacker.x + attacker.facing * range / 2;
    // Hitbox
    const hbX = attacker.x + attacker.facing * 30;
    const hbW = range;
    const hbY = attacker.y - attacker.h + 20;
    const hbH = height;
    // Defender rect
    const dX = defender.x - defender.w/2;
    const dY = defender.y - defender.h;
    // Overlap check
    const overlap = Math.abs((attacker.x + attacker.facing * range/2 + 30) - defender.x) < range/2 + defender.w/2 + 20;
    if (!overlap) return;

    // Generic White special: counter trigger handled in onHit; here just deal normal damage
    attacker.hasHitThisAttack = true;
    onHit(attacker, defender, attacker.attackData, isBoss);
}

function onHit(attacker, defender, attackData, attackerIsBoss) {
    if (defender.invuln > 0) {
        // Generic white special active = counter
        if (!attackerIsBoss && defender === boss.fighter) {
            // shouldn't happen but skip
        }
        if (defender === player.fighter && player.fighter.state === 'attacking' && player.fighter.attackData?.counter) {
            // Boss hit player during counter - counter activates!
            const counterDmg = 30;
            boss.fighter.hp -= counterDmg;
            boss.fighter.hitTimer = 0.5;
            boss.fighter.vx = -player.fighter.facing * 350;
            boss.fighter.vy = -400;
            boss.fighter.onGround = false;
            boss.fighter.hitFlash = 0.3;
            addShake(15, 0.3);
            addHitStop(0.15);
            sfx('hit_heavy');
            spawnParticles(boss.fighter.x, boss.fighter.y - boss.fighter.h/2, '#fada30', 16);
            floatingTexts.push({ x: boss.fighter.x, y: boss.fighter.y - 180, text: 'COUNTER!', color: '#fada30', life: 1.3 });
            floatingTexts.push({ x: boss.fighter.x, y: boss.fighter.y - 160, text: `-${counterDmg}`, color: '#ff5a5a', life: 1.0 });
            chatPush('sys', 'COUNTER on Evil Bald');
            return;
        }
        return;
    }

    // Check if defender is blocking
    let isBlocked = false;
    if (defender === player.fighter && player.fighter.state === 'blocking') {
        isBlocked = true;
    }

    // Damage
    let dmg = attackData.damage;
    if (attackerIsBoss && player.dmgMult) {
        // boss damage is unmodified
    }
    if (!attackerIsBoss) {
        dmg *= (player.dmgMult || 1);
    }
    if (isBlocked) {
        dmg *= player.blockMult || 0.40;
        sfx('block');
        spawnParticles(defender.x + defender.facing * -40, defender.y - 70, '#fada30', 6);
    } else {
        // Hit FX - hit-stop only on heavy/special hits, kept short so it doesn't feel like freezing
        const heavy = (attackData.damage >= 12) || attacker.attackType === 'special';
        sfx(heavy ? 'hit_heavy' : 'hit_light');
        spawnParticles(defender.x, defender.y - 70, '#ff5a5a', heavy ? 14 : 8);
        addShake(heavy ? 10 : 5, heavy ? 0.20 : 0.10);
        if (heavy) addHitStop(0.04);  // ~2 frames of pause, just enough for impact
        defender.hitFlash = 0.2;
        defender.leanAngle = -attacker.facing * 0.5;
    }

    defender.hp -= dmg;
    if (!isBlocked) {
        // Knockback
        defender.vx = attacker.facing * (attackData.knockback || 200);
        defender.hitTimer = 0.35;
        defender.state = 'hit';
        // Hit INTERRUPTS the defender's attack (no more weird mid-attack damage exchanges)
        defender.attackPhase = 'none';
        defender.attackType = null;
        defender.attackData = null;
        defender.hasHitThisAttack = false;
        // Bump the boss attack token so any pending setTimeout fires no-op
        if (defender === boss.fighter) boss.attackToken = (boss.attackToken || 0) + 1;
        if (attackData.knockback >= 400) {
            defender.vy = -300;
            defender.onGround = false;
        }
        // Combo for player
        if (!attackerIsBoss) {
            player.comboCount += 1;
            player.comboTimer = 1.2;
            floatingTexts.push({
                x: defender.x + (Math.random() - 0.5) * 60,
                y: defender.y - 120 - Math.random() * 30,
                text: `-${Math.round(dmg)}`,
                color: heavy ? '#ff2020' : '#ff8080',
                life: 0.9
            });
        } else {
            floatingTexts.push({
                x: defender.x + (Math.random() - 0.5) * 60,
                y: defender.y - 120 - Math.random() * 30,
                text: `-${Math.round(dmg)}`,
                color: '#ff5a5a',
                life: 0.9
            });
        }
    } else {
        floatingTexts.push({ x: defender.x, y: defender.y - 100, text: 'BLOCK', color: '#fada30', life: 0.6 });
    }
}

// =====================================================================
// BOSS AI
// =====================================================================
function updateBossAI(dt) {
    const f = boss.fighter;
    if (f.hitTimer > 0 || f.attackPhase !== 'none') {
        boss.aiTimer = 0.6 + Math.random() * 0.4;
        return;
    }
    // Phase change
    if (boss.phase === 1 && f.hp < f.maxHp * 0.5) {
        boss.phase = 2;
        chatPush('sys', '!! Evil Bald is BACK ONLINE !!');
        floatingTexts.push({ x: f.x, y: f.y - 200, text: 'BACK ONLINE', color: '#ff4040', life: 2.0 });
    }
    boss.aiTimer -= dt;
    if (boss.aiTimer > 0) {
        // Idle behavior: slowly walk toward player
        const dist = player.fighter.x - f.x;
        const targetDist = 180;
        if (Math.abs(dist) > targetDist + 30) {
            f.vx = Math.sign(dist) * boss.data.walkSpeed;
            f.state = 'walking';
        } else if (Math.abs(dist) < targetDist - 30) {
            f.vx = -Math.sign(dist) * boss.data.walkSpeed * 0.7;
            f.state = 'walking';
        } else {
            f.vx = 0;
            f.state = 'idle';
        }
        return;
    }
    // Pick attack
    const dist = Math.abs(player.fighter.x - f.x);
    const attacks = [];
    if (dist < 200) attacks.push('jab', 'jab', 'flex');
    if (dist > 150 && dist < 380) attacks.push('haloSlash', 'haloSlash');
    if (dist > 200) attacks.push('metsToss', 'metsToss');
    attacks.push('foodPic', 'ripDrop');
    if (boss.phase === 2) {
        attacks.push('spamWall', 'spamWall');
        attacks.push('haloSlash');
    }
    const pick = attacks[Math.floor(Math.random() * attacks.length)];
    const atk = boss.data[pick];

    // Apply patient_eye startup bonus
    const startup = atk.startup * (boss.startupBonus || 1) * (boss.phase === 2 ? 0.7 : 1);

    f.state = 'attacking';
    f.attackType = pick;
    f.attackData = { ...atk, startup };
    f.attackPhase = 'startup';
    f.attackTimer = startup;
    f.hasHitThisAttack = false;

    // Bump attackToken at start of every new attack so any stale setTimeout from a
    // previous attack is invalidated. Re-bumped on hit too (see onHit).
    boss.attackToken = (boss.attackToken || 0) + 1;
    const myToken = boss.attackToken;
    const isCurrentAttack = () => gameState === STATE.FIGHT && boss.attackToken === myToken && boss.fighter.hp > 0;

    // Special boss attacks
    if (pick === 'metsToss' || pick === 'spamWall') {
        const type = pick === 'metsToss' ? randomSpamType() : 'wall';
        setTimeout(() => {
            if (!isCurrentAttack()) return;
            if (type === 'wall') {
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        if (!isCurrentAttack()) return;
                        spawnBossProjectile(randomSpamType());
                    }, i * 200);
                }
            } else {
                spawnBossProjectile(type);
            }
        }, startup * 1000);
    } else if (pick === 'foodPic') {
        setTimeout(() => {
            if (!isCurrentAttack()) return;
            const radius = atk.radius;
            const marker = { x: f.x, y: FLOOR_Y, radius, life: 0.5, damage: atk.damage, active: false };
            aoeMarkers.push(marker);
            setTimeout(() => {
                if (!isCurrentAttack()) return;
                marker.active = true;
                if (Math.abs(player.fighter.x - f.x) < radius && player.fighter.invuln <= 0) {
                    onHit(f, player.fighter, { damage: atk.damage, knockback: 250 }, true);
                }
            }, 500);
        }, startup * 1000);
        chatPush('bald', SPAM_CHAT_TEXTS.food[Math.floor(Math.random() * SPAM_CHAT_TEXTS.food.length)]);
    } else if (pick === 'ripDrop') {
        f.vy = -1100;
        f.onGround = false;
        const targetX = player.fighter.x;
        setTimeout(() => {
            if (!isCurrentAttack()) return;
            f.x = targetX;
            f.vx = 0;
            f.vy = 600;
        }, 300);
        chatPush('bald', SPAM_CHAT_TEXTS.rip[Math.floor(Math.random() * SPAM_CHAT_TEXTS.rip.length)]);
    } else if (pick === 'haloSlash') {
        setTimeout(() => {
            if (!isCurrentAttack()) return;
            f.vx = f.facing * atk.advance;
        }, startup * 800);
        chatPush('bald', SPAM_CHAT_TEXTS.halo[Math.floor(Math.random() * SPAM_CHAT_TEXTS.halo.length)]);
    } else if (pick === 'flex') {
        chatPush('bald', SPAM_CHAT_TEXTS.flex[Math.floor(Math.random() * SPAM_CHAT_TEXTS.flex.length)]);
        floatingTexts.push({ x: f.x, y: f.y - 200, text: 'FLEXING...', color: '#ff4040', life: 1.2 });
    }

    boss.aiTimer = 1.0 + Math.random() * 0.8;
}

function randomSpamType() {
    const types = ['mets', 'halo', 'food', 'rip', 'flex'];
    return types[Math.floor(Math.random() * types.length)];
}

function spawnBossProjectile(type) {
    if (gameState !== STATE.FIGHT) return;
    const f = boss.fighter;
    const px = player.fighter.x;
    const dir = px < f.x ? -1 : 1;
    projectiles.push({
        type: type,
        x: f.x + dir * 40,
        y: f.y - f.h + 40,
        vx: dir * 480,
        vy: -150,
        damage: 12 + Math.floor(Math.random() * 4),
        owner: 'boss',
        life: 3.0,
        spin: 0
    });
}

function updateProjectiles(dt) {
    for (const p of projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 800 * dt;
        p.spin += dt * 8;
        p.life -= dt;
        // Hit target
        if (p.owner === 'boss') {
            // hits player
            const f = player.fighter;
            if (rectHitProj(p, f) && f.invuln <= 0) {
                if (f.state === 'blocking') {
                    onHit({ facing: -f.facing }, f, { damage: p.damage, knockback: 0 }, true);
                } else {
                    f.hp -= p.damage;
                    f.hitTimer = 0.25;
                    f.vx = p.vx > 0 ? 250 : -250;
                    f.hitFlash = 0.25;
                    // Cancel any player attack in progress so they don't get stuck
                    f.attackPhase = 'none';
                    f.attackType = null;
                    f.attackData = null;
                    f.hasHitThisAttack = false;
                    f.state = 'hit';
                    sfx('damage');
                    spawnParticles(f.x, f.y - 80, '#ff5a5a', 10);
                    addShake(8, 0.18);
                    floatingTexts.push({ x: f.x, y: f.y - 120, text: `-${p.damage}`, color: '#ff5a5a', life: 0.9 });
                }
                p.life = 0;
            }
        } else if (p.owner === 'player') {
            const f = boss.fighter;
            if (rectHitProj(p, f)) {
                boss.fighter.hp -= p.damage;
                boss.fighter.hitFlash = 0.25;
                boss.fighter.vx = -player.fighter.facing * -150;
                sfx('hit_light');
                spawnParticles(f.x, f.y - 80, '#fada30', 10);
                addShake(6, 0.15);
                floatingTexts.push({ x: f.x, y: f.y - 120, text: `-${p.damage}`, color: '#fada30', life: 0.9 });
                p.life = 0;
            }
        }
        if (p.y > FLOOR_Y + 50) { p.life = 0; }
    }
    projectiles = projectiles.filter(p => p.life > 0);
}

function rectHitProj(p, f) {
    return p.x > f.x - f.w/2 && p.x < f.x + f.w/2 && p.y > f.y - f.h && p.y < f.y;
}

function updateAOE(dt) {
    aoeMarkers.forEach(m => { m.life -= dt; });
    aoeMarkers = aoeMarkers.filter(m => m.life > -0.4);
}

function updateParticles(dt) {
    for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 600 * dt;
        p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.7) * 400,
            color,
            life: 0.5 + Math.random() * 0.3,
            size: 2 + Math.random() * 4
        });
    }
}

function updateFloatingTexts(dt) {
    floatingTexts.forEach(f => { f.y -= 50 * dt; f.life -= dt; });
    floatingTexts = floatingTexts.filter(f => f.life > 0);
}

function updateComboTimer(dt) {
    if (player.comboTimer > 0) {
        player.comboTimer -= dt;
        if (player.comboTimer <= 0) player.comboCount = 0;
    }
}

function updateDJ(dt) {
    // DJ bobs faster during phase 2 (the beat drops)
    djBobPhase += dt * (boss.phase === 2 ? 6.5 : 4.5);
}

function updateChatTimers(dt) {
    mLineTimer -= dt;
    if (mLineTimer <= 0) {
        chatPush('m', M_RANDOM_LINES[Math.floor(Math.random() * M_RANDOM_LINES.length)]);
        mLineTimer = 14 + Math.random() * 12;
    }
    djLineTimer -= dt;
    if (djLineTimer <= 0) {
        chatPush('dj', DJ_RANDOM_LINES[Math.floor(Math.random() * DJ_RANDOM_LINES.length)]);
        djLineTimer = 16 + Math.random() * 12;
    }
    bossTauntTimer -= dt;
    if (bossTauntTimer <= 0 && boss.fighter && boss.fighter.hp > 0) {
        chatPush('bald', BOSS_TAUNTS[Math.floor(Math.random() * BOSS_TAUNTS.length)]);
        bossTauntTimer = 8 + Math.random() * 8;
    }
}

// =====================================================================
// RENDER
// =====================================================================
function render() {
    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(-20, -20, W + 40, H + 40);

    if (gameState === STATE.TITLE) renderTitle();
    else if (gameState === STATE.CHAR_SELECT) renderCharSelect();
    else if (gameState === STATE.SHOP) renderShop();
    else if (gameState === STATE.FIGHT) {
        renderFight();
        renderChatSidebar();
    } else if (gameState === STATE.WIN) renderWin();
    else if (gameState === STATE.LOSE) renderLose();

    ctx.restore();
}

function renderTitle() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0202'); grad.addColorStop(0.5, '#3a0a08'); grad.addColorStop(1, '#0a0202');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#6a1a08'; ctx.shadowBlur = 25;
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 120px Georgia';
    ctx.fillText("BALDIN' RING", W / 2, 180);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8a6a28';
    ctx.font = 'italic 22px Georgia';
    ctx.fillText('A confrontation with Evil Bald', W / 2, 222);
    const items = [
        ['A / D',     'Walk forward / back (back from boss = BLOCK)'],
        ['S',         'Crouch (avoids high attacks)'],
        ['W / SPACE', 'Jump'],
        ['J',         'Light attack (fast, low damage)'],
        ['K',         'Heavy attack (slow, high damage)'],
        ['L',         'Special move (3 charges)'],
        ['H',         'Drink healing flask']
    ];
    const blockY = 280;
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('CONTROLS', W / 2, blockY);
    items.forEach((item, i) => {
        const rowY = blockY + 36 + i * 28;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 19px Georgia';
        ctx.fillText(item[0], W / 2 - 20, rowY);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cccccc';
        ctx.font = '17px Georgia';
        ctx.fillText(item[1], W / 2 + 20, rowY);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fada30';
    ctx.font = 'italic 16px Georgia';
    ctx.fillText('Block (hold away). Punish whiffs. Chain hits for combos.', W / 2, 560);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 26px Georgia';
    ctx.fillText('Press SPACE to begin', W / 2, H - 60);
}

function renderCharSelect() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0202'); grad.addColorStop(1, '#1a0606');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 48px Georgia';
    ctx.fillText('CHOOSE YOUR FIGHTER', W / 2, 75);
    const chars = [
        { key: '1', dataKey: 'ladder_man',    imgKey: 'ladder_man' },
        { key: '2', dataKey: 'generic_white', imgKey: 'generic_white' },
        { key: '3', dataKey: 'slug',          imgKey: 'slug' }
    ];
    chars.forEach((c, i) => {
        const x = (W / 4) * (i + 1);
        const d = CHARACTERS[c.dataKey];
        ctx.fillStyle = '#1a0606'; ctx.fillRect(x - 145, 115, 290, 560);
        ctx.strokeStyle = '#6a4818'; ctx.lineWidth = 2; ctx.strokeRect(x - 145, 115, 290, 560);
        ctx.fillStyle = '#0a0303'; ctx.fillRect(x - 125, 135, 250, 250);
        if (IMAGES[c.imgKey].loaded) {
            ctx.save(); ctx.filter = HARKONNEN_FILTER;
            const img = IMAGES[c.imgKey].img;
            const aspect = img.width / img.height;
            const drawW = 240; const drawH = drawW / aspect;
            ctx.drawImage(img, x - drawW/2, 145, drawW, Math.min(drawH, 230));
            ctx.restore();
        }
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 26px Georgia';
        ctx.fillText(d.name, x, 415);
        ctx.fillStyle = '#8a6a28';
        ctx.font = 'italic 14px Georgia';
        ctx.fillText(d.tag, x, 435);
        const stats = [
            ['HP',         d.maxHp],
            ['LIGHT DMG',  d.light.damage],
            ['HEAVY DMG',  d.heavy.damage]
        ];
        ctx.font = '13px Georgia';
        stats.forEach((s, j) => {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#8a6a28';
            ctx.fillText(s[0], x - 110, 465 + j * 20);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#dddddd';
            ctx.fillText(s[1], x + 110, 465 + j * 20);
        });
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 13px Georgia';
        ctx.fillText('SPECIAL (L)', x, 545);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Georgia';
        ctx.fillText(d.specialName, x, 563);
        ctx.fillStyle = '#bbbbbb';
        ctx.font = '12px Georgia';
        wrapText(d.specialDesc, x, 585, 260, 14);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 30px Georgia';
        ctx.fillText(`[${c.key}]`, x, 655);
    });
    ctx.fillStyle = '#8a6a28';
    ctx.font = 'italic 16px Georgia';
    ctx.fillText('Press 1, 2, or 3 to select', W / 2, 705);
}

function wrapText(text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '', yy = y;
    words.forEach(w => {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > maxW && line !== '') {
            ctx.fillText(line, x, yy);
            line = w + ' '; yy += lineH;
        } else { line = test; }
    });
    ctx.fillText(line, x, yy);
}

function renderShop() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#080404'); grad.addColorStop(1, '#1a0808');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 44px Georgia';
    ctx.fillText('THE PULLOUT MERCHANT', W / 2, 65);
    ctx.fillStyle = '#8a6a28';
    ctx.font = 'italic 16px Georgia';
    ctx.fillText('Pre-fight provisions for the foolish and the prepared', W / 2, 90);
    const mx = 210, my = 320;
    if (IMAGES.pullout_merchant.loaded) {
        ctx.save(); ctx.filter = HARKONNEN_FILTER;
        const img = IMAGES.pullout_merchant.img;
        const aspect = img.width / img.height;
        const drawW = 260; const drawH = drawW / aspect;
        ctx.drawImage(img, mx - drawW/2, my - drawH/2 - 30, drawW, drawH);
        ctx.restore();
    }
    ctx.fillStyle = 'rgba(20, 10, 8, 0.95)';
    ctx.fillRect(mx + 120, my - 130, 220, 100);
    ctx.strokeStyle = '#6a4818'; ctx.lineWidth = 1.5;
    ctx.strokeRect(mx + 120, my - 130, 220, 100);
    ctx.fillStyle = '#dddddd';
    ctx.font = 'italic 14px Georgia';
    ctx.textAlign = 'left';
    wrapText(`"${merchantLine}"`, mx + 130, my - 110, 200, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fada30';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${player.runes} Runes`, W - 40, 60);
    const sx = 520, sy = 140;
    ctx.font = 'bold 22px Georgia';
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'left';
    ctx.fillText('WARES', sx, sy - 10);
    SHOP_ITEMS.forEach((item, i) => {
        const rowY = sy + 20 + i * 92;
        const owned = player.ownedItems.has(item.id);
        const affordable = player.runes >= item.cost;
        ctx.fillStyle = owned ? '#0a1a0a' : '#15080a';
        ctx.fillRect(sx, rowY, 670, 78);
        ctx.strokeStyle = owned ? '#3a8a3a' : '#6a4818';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, rowY, 670, 78);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 22px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i + 1}]`, sx + 30, rowY + 48);
        ctx.textAlign = 'left';
        ctx.fillStyle = owned ? '#7aaa7a' : '#fff';
        ctx.font = 'bold 19px Georgia';
        ctx.fillText(item.name, sx + 70, rowY + 30);
        ctx.fillStyle = owned ? '#5a8a5a' : '#bbbbbb';
        ctx.font = '15px Georgia';
        ctx.fillText(item.desc, sx + 70, rowY + 55);
        ctx.textAlign = 'right';
        if (owned) {
            ctx.fillStyle = '#7aaa7a';
            ctx.font = 'bold 18px Georgia';
            ctx.fillText('OWNED', sx + 650, rowY + 48);
        } else {
            ctx.fillStyle = affordable ? '#fada30' : '#8a4040';
            ctx.font = 'bold 18px Georgia';
            ctx.fillText(`${item.cost} R`, sx + 650, rowY + 48);
        }
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 22px Georgia';
    ctx.fillText('Press 1-5 to buy. Press SPACE to enter the arena.', W / 2, H - 30);
}

function renderFight() {
    // Background
    if (IMAGES.background_arena.loaded) {
        ctx.drawImage(IMAGES.background_arena.img, 0, 0, GW, H);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0202'); grad.addColorStop(0.5, '#3a0a08'); grad.addColorStop(1, '#0a0202');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, GW, H);
    }
    // Floor strip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, FLOOR_Y, GW, H - FLOOR_Y);
    ctx.fillStyle = '#3a1a18';
    ctx.fillRect(0, FLOOR_Y, GW, 3);

    // DJ Plan B booth (lower-left corner of the arena)
    drawDJBooth();

    // AOE markers (warning circles)
    aoeMarkers.forEach(m => {
        const alpha = m.life > 0 ? Math.min(1, 1 - m.life) : Math.max(0, 1 + m.life * 2.5);
        ctx.fillStyle = m.active ? `rgba(255, 80, 40, ${alpha * 0.5})` : `rgba(255, 200, 40, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(m.x, FLOOR_Y, m.radius, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = m.active ? '#ff5040' : '#fada30';
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    // Boss
    drawFighter(boss.fighter, 'evil_bald_sprite', 'boss');
    // Player
    drawFighter(player.fighter, player.data ? player.data.spriteKey : null, 'player');
    // Projectiles
    projectiles.forEach(drawProjectile);
    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.globalAlpha = 1;
    });
    // Floating texts
    floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.min(1, t.life * 1.5);
        ctx.font = 'bold 22px Georgia';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });
    // HUD
    drawHUD();
    // Combo counter
    if (player.comboCount >= 2) {
        ctx.textAlign = 'left';
        const alpha = Math.min(1, player.comboTimer * 1.2);
        ctx.fillStyle = `rgba(255, 200, 40, ${alpha})`;
        ctx.font = `bold ${36 + player.comboCount * 4}px Georgia`;
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
        ctx.fillText(`${player.comboCount} HIT COMBO`, 40, H - 80);
        ctx.shadowBlur = 0;
    }
}

function drawFighter(f, spriteKey, who) {
    if (!f) return;
    const img = spriteKey && IMAGES[spriteKey] && IMAGES[spriteKey].loaded ? IMAGES[spriteKey].img : null;

    // --- ANIMATION VIA TRANSFORMS (no animation frames, so we fake step / breathe / lunge) ---
    const isWalking = (f.state === 'walking' || f.state === 'blocking') && f.onGround && Math.abs(f.vx) > 20;
    const isAttacking = f.attackPhase === 'startup' || f.attackPhase === 'active';
    const isInAir = !f.onGround;

    // Bob amplitude: bigger when walking, tiny when idle
    let bobAmp = 0;
    if (isWalking) bobAmp = 7;
    else if (f.state === 'idle' && !isAttacking && f.hitTimer <= 0) bobAmp = 2.5;
    const bob = Math.abs(Math.sin(f.bobPhase)) * bobAmp * -1;  // negative so feet stay planted

    // Per-step horizontal scale wobble (compresses/stretches on each step)
    const stepScale = isWalking ? 1 + Math.cos(f.bobPhase * 2) * 0.05 : 1;
    // Subtle walking lean toward facing direction
    const walkLean = isWalking ? f.facing * 0.06 * Math.sin(f.bobPhase) : 0;
    // Attack lunge - quick forward translate during active hit frames (BIG and visible)
    let lungeX = 0;
    if (f.attackPhase === 'active' && f.attackData) {
        const t = 1 - (f.attackTimer / f.attackData.active);  // 0 -> 1 over active phase
        lungeX = f.facing * (32 + Math.sin(t * Math.PI) * 16);  // 32-48px forward, peaking mid-active
    } else if (f.attackPhase === 'startup' && f.attackData) {
        lungeX = -f.facing * 8;  // bigger anticipation pull-back
    } else if (f.attackPhase === 'recovery' && f.attackData) {
        lungeX = f.facing * 18;  // settle slightly forward during recovery
    }
    // Idle breathing scale
    const breathScale = (!isWalking && !isAttacking && f.onGround) ? 1 + Math.sin(f.bobPhase * 0.7) * 0.015 : 1;
    // Air pose: stretch vertically slightly when ascending, compress on descent
    const airScaleY = isInAir ? (f.vy < 0 ? 1.08 : 0.95) : 1;

    const drawW = f.w * 1.8 * stepScale;
    const drawH = f.h * 1.15 * f.squishY * breathScale * airScaleY;

    ctx.save();
    if (f.hitFlash > 0) ctx.filter = 'brightness(3) saturate(0.2)';
    if (f.invuln > 0 && Math.floor(f.invuln * 14) % 2 === 0) ctx.globalAlpha = 0.5;

    // Pivot at feet for rotation. Apply walking lean + hit lean + attack tilt all together.
    ctx.translate(f.x + lungeX, f.y + bob);
    ctx.rotate(f.leanAngle + walkLean);
    // Per-character flip: each source sprite has its own default orientation (Nano Banana doesn't
    // generate consistent left/right poses). spriteDefaultFacing in the data declares where the
    // source naturally points; flip only when target facing differs.
    const defaultFacing = (f.data && f.data.spriteDefaultFacing) || -1;
    if (f.facing !== defaultFacing) ctx.scale(-1, 1);

    if (img) {
        ctx.drawImage(img, -drawW/2, -drawH, drawW, drawH);
    } else {
        ctx.fillStyle = who === 'boss' ? '#5a4838' : '#3a5a38';
        ctx.fillRect(-drawW/2, -drawH, drawW, drawH);
    }
    ctx.restore();

    // Blocking shield indicator
    if (f.state === 'blocking') {
        ctx.fillStyle = `rgba(212, 175, 55, ${0.3 + Math.sin(Date.now()/80)*0.2})`;
        ctx.fillRect(f.x - 50, f.y - f.h - 5, 100, 10);
        ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
        const blockH = f.h + 10;
        ctx.fillRect(f.x - f.facing * 30 - 5, f.y - blockH, 10, blockH);
    }

    // Attack hitbox + SWOOSH visualization (active phase) - dramatic so player can SEE the attack
    if (f.attackPhase === 'active' && f.attackData && f.attackData.range) {
        const t = 1 - (f.attackTimer / f.attackData.active);  // 0 -> 1
        const range = f.attackData.range;
        const height = f.attackData.height;
        const hx = f.x + f.facing * 30;
        const hy = f.y - f.h + 20;
        // Trapezoid swoosh - bright arc sweeping from back to front
        const swooshAlpha = Math.sin(t * Math.PI);  // 0 -> 1 -> 0 over active phase
        const isSpecial = f.attackType === 'special';
        const isHeavy = f.attackType === 'heavy' || isSpecial;

        // Big bright swoosh shape (motion-blur effect)
        ctx.save();
        ctx.fillStyle = isSpecial
            ? `rgba(255, 220, 80, ${swooshAlpha * 0.55})`
            : isHeavy
                ? `rgba(255, 140, 60, ${swooshAlpha * 0.50})`
                : `rgba(255, 255, 255, ${swooshAlpha * 0.40})`;
        // Curved swoosh polygon
        ctx.beginPath();
        const startA = -Math.PI / 2.6;
        const endA   = Math.PI / 2.6;
        const cx = f.x;
        const cy = f.y - f.h * 0.55;
        for (let a = startA; a <= endA; a += 0.08) {
            const swR = range * (0.7 + 0.3 * Math.cos(a));
            const px = cx + f.facing * Math.cos(a) * swR;
            const py = cy + Math.sin(a) * swR * 0.9;
            if (a === startA) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
        // Outline edge
        ctx.strokeStyle = isSpecial ? '#fada30' : isHeavy ? '#ff8030' : '#ffffff';
        ctx.lineWidth = isHeavy ? 4 : 2.5;
        ctx.globalAlpha = swooshAlpha * 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Bright impact flash at peak
        if (t > 0.3 && t < 0.7) {
            ctx.fillStyle = isSpecial ? 'rgba(255, 240, 100, 0.7)' : 'rgba(255, 200, 100, 0.5)';
            ctx.beginPath();
            ctx.arc(hx + f.facing * range * 0.6, hy + height * 0.4, 18 + (isHeavy ? 12 : 4), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawProjectile(p) {
    const imgKey = p.type === 'ticket' ? null : 'spam_' + p.type;
    if (p.type === 'ticket') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = '#fada30';
        ctx.fillRect(-26, -16, 52, 32);
        ctx.strokeStyle = '#aa7800'; ctx.lineWidth = 2;
        ctx.strokeRect(-26, -16, 52, 32);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('UFC', 0, 5);
        ctx.restore();
        return;
    }
    if (imgKey && IMAGES[imgKey] && IMAGES[imgKey].loaded) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        const img = IMAGES[imgKey].img;
        const size = 64;
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        const colors = { mets:'#fa6614', halo:'#5a8a4a', food:'#c87830', rip:'#444', flex:'#a02828' };
        ctx.fillStyle = colors[p.type] || '#aaa';
        ctx.fillRect(-26, -26, 52, 52);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(-26, -26, 52, 52);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((p.type || '').toUpperCase(), 0, 4);
        ctx.restore();
    }
}

function drawDJBooth() {
    // Lower-left corner booth, behind the action plane
    const x = 18, y = FLOOR_Y - 120, w = 175, h = 175;

    // Booth shell
    ctx.fillStyle = '#10070a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#6a4818'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Booth panel front (turntable surface)
    ctx.fillStyle = '#1a1014';
    ctx.fillRect(x, y + h - 40, w, 40);
    // Turntable circles
    ctx.fillStyle = '#1a1a1a';
    [[x + 42, y + h - 20], [x + w - 42, y + h - 20]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1; ctx.stroke();
        const spin = djBobPhase * 5;
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(spin) * 13, cy + Math.sin(spin) * 13);
        ctx.stroke();
    });

    // DJ Plan B sprite (head-bobbing)
    const bobOff = Math.abs(Math.sin(djBobPhase)) * -8;  // bob UP on beat
    const dx = x + w / 2;
    const dy = y + 40 + bobOff;
    if (IMAGES.dj_plan_b_sprite.loaded) {
        const img = IMAGES.dj_plan_b_sprite.img;
        const aspect = img.width / img.height;
        const drawH = 110;
        const drawW = drawH * aspect;
        ctx.drawImage(img, dx - drawW / 2, dy, drawW, drawH);
    } else {
        // procedural fallback
        ctx.fillStyle = '#7a4828';
        ctx.beginPath(); ctx.arc(dx, dy + 20, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(dx - 22, dy + 35, 44, 50);
        ctx.fillStyle = '#fada30';
        ctx.fillRect(dx - 16, dy + 45, 32, 3);
    }

    // Beat indicator: when on the beat, glow brighter
    const beatPulse = Math.max(0, Math.sin(djBobPhase) * 0.5 + 0.2);
    ctx.fillStyle = `rgba(255, 100, 200, ${beatPulse * 0.3})`;
    ctx.fillRect(x, y, w, 6);

    // Label
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('DJ PLAN B', x + w / 2, y + h - 6);
}

function drawHUD() {
    // Player HP bar (top left)
    drawHPBar(40, 30, 340, 28, player.fighter.hp, player.fighter.maxHp, '#5aafff', player.data.name);
    // Boss HP bar (top right of game area)
    drawHPBar(GW - 380, 30, 340, 28, boss.fighter.hp, boss.fighter.maxHp, '#c41818', 'EVIL BALD' + (boss.phase === 2 ? ' - BACK ONLINE' : ''), true);

    // Special charge indicator
    ctx.fillStyle = '#fada30';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`SPECIAL (L): ${player.specialCharges}`, 40, 80);
    ctx.fillStyle = '#5aff5a';
    ctx.fillText(`FLASKS (H): ${player.flasks}`, 200, 80);

    // Boss state indicator (typing, winding up flex)
    if (boss.fighter.attackType === 'flex' && boss.fighter.attackPhase === 'startup') {
        ctx.fillStyle = `rgba(255, 80, 40, ${0.5 + Math.sin(Date.now()/80)*0.3})`;
        ctx.font = 'bold 26px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('!! FLEX INCOMING !!', GW/2, 100);
    }
}

function drawHPBar(x, y, w, h, val, max, color, label, rightAlign) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = '#1a0808';
    ctx.fillRect(x, y, w, h);
    const fillW = Math.max(0, w * (val / max));
    if (rightAlign) {
        ctx.fillStyle = color;
        ctx.fillRect(x + w - fillW, y, fillW, h);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, fillW, h);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = rightAlign ? 'right' : 'left';
    ctx.fillText(label, rightAlign ? x + w - 6 : x + 6, y + h - 8);
    ctx.font = 'bold 11px Georgia';
    ctx.fillText(`${Math.ceil(val)}/${max}`, rightAlign ? x + w - 6 : x + 6, y + h + 14);
}

function renderChatSidebar() {
    ctx.fillStyle = '#0a0606';
    ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_W, H);
    ctx.fillStyle = '#1a0a08';
    ctx.fillRect(SIDEBAR_X, 0, 3, H);
    ctx.fillStyle = '#15080a';
    ctx.fillRect(SIDEBAR_X + 3, 0, SIDEBAR_W - 3, 40);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('# the-group-chat', SIDEBAR_X + 14, 26);
    ctx.fillStyle = '#5a8a3a';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`● 4 online`, SIDEBAR_X + SIDEBAR_W - 12, 26);
    const visible = CHAT_MESSAGES.slice(-MAX_CHAT_LINES);
    const startY = 60;
    const lineH = 28;
    visible.forEach((m, i) => {
        const y = startY + i * lineH;
        const author = CHAT_AUTHORS[m.author];
        if (!author) return;
        ctx.fillStyle = author.color;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(author.name, SIDEBAR_X + 14, y);
        ctx.fillStyle = '#dddddd';
        ctx.font = '12px Georgia';
        const maxW = SIDEBAR_W - 30;
        let display = m.text;
        if (ctx.measureText(m.text).width > maxW) {
            while (display.length > 3 && ctx.measureText(display + '...').width > maxW) display = display.slice(0, -1);
            display += '...';
        }
        ctx.fillText(display, SIDEBAR_X + 14, y + 14);
    });
    // Typing indicator
    let typingStr = null;
    if (boss.fighter && boss.fighter.attackPhase === 'startup') typingStr = `Evil Bald is typing${'.'.repeat(1 + Math.floor((Date.now() / 300) % 3))}`;
    if (typingStr) {
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'italic 12px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(typingStr, SIDEBAR_X + 14, H - 18);
    }
}

function renderWin() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0202'); grad.addColorStop(1, '#1a0606');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#fada30'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#fada30';
    ctx.font = 'bold 180px Georgia';
    ctx.fillText('K.O.', W / 2, H / 2 - 50);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 56px Georgia';
    ctx.fillText('EVIL BALD MUTED', W / 2, H / 2 + 30);
    ctx.fillStyle = '#8a6a28';
    ctx.font = 'italic 22px Georgia';
    ctx.fillText('The group chat knows peace. (At least until he wakes up.)', W / 2, H / 2 + 70);
    ctx.fillStyle = '#d4af37';
    ctx.font = '22px Georgia';
    ctx.fillText('Press SPACE to return to title', W / 2, H / 2 + 150);
}

function renderLose() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0202'); grad.addColorStop(1, '#1a0606');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#c41818'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#c41818';
    ctx.font = 'bold 110px Georgia';
    ctx.fillText('YOU CLICKED', W / 2, H / 2 - 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8a2828';
    ctx.font = 'italic 22px Georgia';
    ctx.fillText('You opened the link.', W / 2, H / 2 + 20);
    ctx.fillStyle = '#d4af37';
    ctx.font = '22px Georgia';
    ctx.fillText('Press SPACE to return to title', W / 2, H / 2 + 100);
}

// =====================================================================
// MAIN LOOP - hardened: try-catch around update + render so a single
// exception cannot kill the whole loop. Errors render on-screen.
// =====================================================================
let lastTime = 0;
let lastError = null;
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    try {
        update(dt);
    } catch (e) {
        lastError = `UPDATE ERROR: ${e.message || e} (line ${e.lineNumber || '?'})`;
        console.error('update() error:', e);
    }
    try {
        render();
        if (lastError) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, H - 90, W, 90);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('[GAME ERROR - press R to recover]', 20, H - 60);
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            // wrap the error message
            const maxChars = 140;
            let msg = lastError;
            let y = H - 40;
            while (msg.length > 0 && y < H - 10) {
                const chunk = msg.slice(0, maxChars);
                ctx.fillText(chunk, 20, y);
                msg = msg.slice(maxChars);
                y += 14;
            }
        }
    } catch (e) {
        console.error('render() error:', e);
    }
    requestAnimationFrame(loop);
}
// R key recovers from error by resetting to title
window.addEventListener('keydown', e => {
    if (e.code === 'KeyR' && lastError) {
        lastError = null;
        gameState = STATE.TITLE;
    }
});
requestAnimationFrame(loop);
