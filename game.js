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
    background_arena:        { src: 'assets/img/sprites/background_arena.png',        img: null, loaded: false },
    waiter_sprite:           { src: 'assets/img/sprites/waiter_sprite.png',           img: null, loaded: false },
    halo_grunt_enemy:        { src: 'assets/img/sprites/halo_grunt_enemy.png',        img: null, loaded: false },
    mets_fan_enemy:          { src: 'assets/img/sprites/mets_fan_enemy.png',          img: null, loaded: false },
    spartan_enemy:           { src: 'assets/img/sprites/spartan_enemy.png',           img: null, loaded: false },
    brute_enemy:             { src: 'assets/img/sprites/brute_enemy.png',             img: null, loaded: false }
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
const STATE = { TITLE: 'title', CHAR_SELECT: 'char_select', SHOP: 'shop', STAGE: 'stage', FIGHT: 'fight', WIN: 'win', LOSE: 'lose' };
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
        // HEAVY = Ladder Swing: wide arc that hits BOTH sides
        heavy: { startup: 0.28, active: 0.25, recovery: 0.50, damage: 22, knockback: 480, range: 170, height: 140, both: true },
        heavyName: "LADDER SWING",
        specialName: "??? BARRAGE",
        specialDesc: "Hurls 3 giant question marks at the boss. Confusion damage.",
        special: { startup: 0.25, active: 0.10, recovery: 0.40, damage: 0, knockback: 0, range: 0, height: 0, projectile: 'questions' },
        spriteKey: 'ladder_man_sprite',
        spriteDefaultFacing: 1,   // source has ladder over right shoulder = faces RIGHT
        bodyW: 58,    // skinny
        bodyH: 185,   // very tall lanky goon
        scale: 1.5
    },
    generic_white: {
        name: "GENERIC WHITE",
        tag: "The Default Protagonist",
        maxHp: 130,
        walkSpeed: 200,
        jumpPower: 760,
        light: { startup: 0.06, active: 0.10, recovery: 0.18, damage: 6,  knockback: 180, range: 80, height: 90 },
        // HEAVY = Shield Counter: brief invuln window. If boss hits during it -> auto counter for big damage.
        heavy: { startup: 0.10, active: 0.45, recovery: 0.40, damage: 14, knockback: 350, range: 105, height: 110, counter: true },
        heavyName: "SHIELD COUNTER",
        specialName: "PUERTO RICAN PRIDE",
        specialDesc: "Unfurls a giant PR flag that sweeps the boss. Massive damage + knockback.",
        special: { startup: 0.30, active: 0.10, recovery: 0.45, damage: 0, knockback: 0, range: 0, height: 0, projectile: 'flag' },
        spriteKey: 'generic_white_sprite',
        spriteDefaultFacing: -1,  // sword on viewer's left = faces LEFT
        bodyW: 72,    // medium build
        bodyH: 150,
        scale: 1.5
    },
    slug: {
        name: "SLUG",
        tag: "The Big Spender",
        maxHp: 90,
        walkSpeed: 210,
        jumpPower: 720,
        light: { startup: 0.07, active: 0.09, recovery: 0.16, damage: 5,  knockback: 170, range: 75, height: 80 },
        // HEAVY = UFC Ticket Fan: throws 3 gold tickets in a spread (pure projectile, no melee)
        heavy: { startup: 0.22, active: 0.10, recovery: 0.40, damage: 0, knockback: 0, range: 0, height: 0, projectile: 'tickets' },
        heavyName: "UFC TICKET FAN",
        specialName: "WAITER SERVICE",
        specialDesc: "Summons 2 pompous waiters who march in and serve platter strikes.",
        special: { startup: 0.30, active: 0.10, recovery: 0.40, damage: 0, knockback: 0, range: 0, height: 0, projectile: 'waiters' },
        spriteKey: 'slug_sprite',
        spriteDefaultFacing: -1,  // cards on viewer's left = faces LEFT
        bodyW: 82,    // heavyset, wider stance
        bodyH: 138,   // shorter and stockier
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

// =====================================================================
// STAGE MODE - side-scrolling beat-em-up before the boss
// =====================================================================
const ENEMY_TYPES = {
    halo_grunt: {
        spriteKey: 'halo_grunt_enemy',
        w: 56, h: 110, drawScale: 1.5, spriteDefaultFacing: 1,
        hp: 6,                  // dies in 1-2 light hits
        damage: 7,
        speed: 130,
        attackRange: 70,
        attackCooldown: 1.4,
        ai: 'melee',
        runeReward: 5
    },
    mets_fan: {
        spriteKey: 'mets_fan_enemy',
        w: 70, h: 130, drawScale: 1.5, spriteDefaultFacing: 1,
        hp: 8,                  // 2 light hits
        damage: 9,
        speed: 60,
        attackRange: 0,
        attackCooldown: 1.8,
        ai: 'ranged',
        runeReward: 7
    },
    spartan: {
        spriteKey: 'spartan_enemy',
        w: 80, h: 160, drawScale: 1.45, spriteDefaultFacing: 1,
        hp: 14,                 // tanky, 3-4 hits
        damage: 7,
        speed: 90,
        attackRange: 0,         // rifle burst (ranged)
        attackCooldown: 1.8,
        ai: 'spartan_rifle',
        runeReward: 12
    },
    brute: {
        spriteKey: 'brute_enemy',
        w: 95, h: 175, drawScale: 1.5, spriteDefaultFacing: 1,
        hp: 18,                 // tankiest, 4-5 hits
        damage: 14,
        speed: 95,
        attackRange: 100,       // melee hammer
        attackCooldown: 1.9,
        ai: 'melee',
        runeReward: 16
    }
};

// =====================================================================
// LEVEL LAYOUT - one continuous side-scrolling track from x=0 to LEVEL_END
// Boss door triggers at LEVEL_END. Player walks right; camera follows.
// =====================================================================
const LEVEL_END = 5400;
let cameraX = 0;

const LEVEL_ENTITIES = [
    // ZONE A - intro: halo grunts ease you in
    { type: 'enemy',    enemyType: 'halo_grunt', x: 600 },
    { type: 'enemy',    enemyType: 'halo_grunt', x: 780 },
    { type: 'enemy',    enemyType: 'halo_grunt', x: 950 },
    { type: 'enemy',    enemyType: 'spartan',    x: 1250 },
    { type: 'pickup',   pickupType: 'heal',      x: 1550 },
    // ZONE B - mets fans pelting you, mixed with grunts
    { type: 'enemy',    enemyType: 'mets_fan',   x: 1850 },
    { type: 'enemy',    enemyType: 'halo_grunt', x: 2050 },
    { type: 'enemy',    enemyType: 'mets_fan',   x: 2250 },
    { type: 'enemy',    enemyType: 'spartan',    x: 2450 },
    { type: 'pickup',   pickupType: 'power',     x: 2700 },
    // ZONE C - billboards falling + first brute
    { type: 'obstacle', kind: 'billboard',       x: 2950 },
    { type: 'enemy',    enemyType: 'brute',      x: 3100 },
    { type: 'obstacle', kind: 'billboard',       x: 3300 },
    { type: 'obstacle', kind: 'billboard',       x: 3500 },
    { type: 'enemy',    enemyType: 'mets_fan',   x: 3650 },
    { type: 'pickup',   pickupType: 'heal',      x: 3900 },
    // ZONE D - tombstone gauntlet finale
    { type: 'obstacle', kind: 'tombstone',       x: 4100 },
    { type: 'obstacle', kind: 'tombstone',       x: 4250 },
    { type: 'enemy',    enemyType: 'spartan',    x: 4400 },
    { type: 'obstacle', kind: 'tombstone',       x: 4550 },
    { type: 'enemy',    enemyType: 'brute',      x: 4700 },
    { type: 'obstacle', kind: 'tombstone',       x: 4850 },
    { type: 'pickup',   pickupType: 'power',     x: 5050 }
];

// Funny death messages for tombstone obstacles
const PEOPLE_DEATHS = [
    'rip - died of cringe',
    'rip - left on read',
    'rip - opened the link',
    'rip - couldnt mute',
    'rip - read the article',
    'rip - died waiting for reply',
    'rip - watched the halo trailer',
    'rip - reply guy',
    'rip - fomo',
    'rip - mets fan since 1986',
    'rip - the food pic got him',
    'rip - drowned in notifications',
    'rip - double tapped wrong post',
    'rip - typed too fast',
    'rip - couldnt take a hint',
    'rip - died of secondhand cringe',
    'rip - fell into the group chat',
    'rip - sent it to the wrong number',
    'rip - argued in the comments',
    'rip - tried to leave the chat'
];

// Spam content for falling billboards (his actual posts)
const BILLBOARD_CONTENT = [
    { type: 'food',  label: 'gym meal 800cal', color: '#c87830' },
    { type: 'flex',  label: 'PR DAY', color: '#a02828' },
    { type: 'food',  label: 'protein bowl', color: '#c87830' },
    { type: 'flex',  label: '12 wks shredded', color: '#a02828' },
    { type: 'food',  label: 'meal prep sunday', color: '#c87830' },
    { type: 'flex',  label: '405 deadlift', color: '#a02828' },
    { type: 'food',  label: 'cant eat carbs', color: '#c87830' },
    { type: 'flex',  label: 'progress pic', color: '#a02828' }
];

// Stage progression state
const stage = {
    wave: 0,           // 1..4
    phase: 'inactive', // 'walking' | 'wave_active' | 'wave_cleared' | 'transitioning'
    phaseTimer: 0,
    enemiesRemaining: 0,
    obstaclesRemaining: 0,
    showGoArrow: false,
    transitionAlpha: 0,
    bannerText: '',
    bannerTimer: 0
};

let enemies = [];      // halo grunts, mets fans
let obstacles = [];    // tombstones, billboards
let pickups = [];      // heal, power-up, runes

// Projectiles (mets tweets, slug tickets, question marks, etc)
let projectiles = [];
// Foodpic AOE markers (visual warnings)
let aoeMarkers = [];
// Floating texts
let floatingTexts = [];
// Particle effects (hit sparks)
let particles = [];
// Generic White's Puerto Rican flag sweep attack (single active at a time)
let flagAttack = null;
// Slug's summoned waiters (multiple at once possible)
let waiters = [];

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
    if (gameState === STATE.FIGHT || gameState === STATE.STAGE) {
        const f = player.fighter;
        // Snap-face the nearest opponent (or just face arrow direction in stage mode if no enemies)
        if (['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(code)) {
            if (f.onGround && f.attackPhase !== 'active' && f.attackPhase !== 'startup') {
                if (gameState === STATE.FIGHT && boss.fighter) {
                    f.facing = boss.fighter.x > f.x ? 1 : -1;
                } else {
                    // Stage: face nearest alive enemy, else face the direction of movement
                    const aliveEnemies = enemies.filter(e => e.alive);
                    if (aliveEnemies.length > 0) {
                        let nearest = aliveEnemies[0]; let nearestDist = Math.abs(nearest.x - f.x);
                        for (const e of aliveEnemies) {
                            const d = Math.abs(e.x - f.x);
                            if (d < nearestDist) { nearest = e; nearestDist = d; }
                        }
                        f.facing = nearest.x > f.x ? 1 : -1;
                    } else {
                        f.facing = (code === 'ArrowRight' || code === 'KeyD') ? 1 : -1;
                    }
                }
            }
        }
        if (!canAct(f)) return;
        if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') tryJump(f);
        if (code === 'KeyJ') startAttack(f, 'light', player.data.light);
        if (code === 'KeyK') tryHeavy();
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

// After the shop: walk through a continuous side-scrolling level, then boss FIGHT at the end
function startFight() {
    sfx('click');
    player.fighter = makeFighter({ x: 200, facing: 1, maxHp: player.data.maxHp, data: player.data });
    if (player.data.bodyW) player.fighter.w = player.data.bodyW;
    if (player.data.bodyH) player.fighter.h = player.data.bodyH;
    boss.fighter = null;
    projectiles = [];
    aoeMarkers = [];
    floatingTexts = [];
    particles = [];
    flagAttack = null;
    waiters = [];
    enemies = [];
    obstacles = [];
    pickups = [];
    cameraX = 0;
    hitStopTimer = 0;
    shakeTimer = 0;
    player.comboCount = 0;
    player.comboTimer = 0;
    player.specialCd = 0;
    CHAT_MESSAGES.length = 0;
    chatPush('sys', 'Evil Bald has logged on');
    chatPush('m', 'oh no');
    chatPush('dj', 'lets gooo');
    chatPush('sys', '!! Walk RIGHT to reach Evil Bald !!');
    // Pre-spawn the entire level (entities stay dormant until camera approaches)
    LEVEL_ENTITIES.forEach(def => {
        if (def.type === 'enemy') {
            const e = makeEnemy(def.enemyType, def.x);
            e.dormant = true;
            enemies.push(e);
        } else if (def.type === 'obstacle') {
            const o = def.kind === 'billboard' ? makeBillboard(def.x) : makeTombstone(def.x);
            o.dormant = true;
            obstacles.push(o);
        } else if (def.type === 'pickup') {
            pickups.push(makePickup(def.x, def.pickupType));
        }
    });
    stage.phase = 'walking';
    stage.phaseTimer = 0;
    stage.transitionAlpha = 0;
    stage.bannerText = 'GO';
    stage.bannerTimer = 1.4;
    gameState = STATE.STAGE;
    playBossMusic();
}

// Triggered when player walks past the right edge after wave 4 cleared
function startBossFight() {
    sfx('click');
    boss.data = BOSS_DATA;
    boss.fighter = makeFighter({ x: 850, facing: -1, maxHp: BOSS_DATA.maxHp, data: BOSS_DATA });
    boss.fighter.w = 100; boss.fighter.h = 195;
    boss.aiTimer = 2.0;
    boss.aiAction = null;
    boss.phase = 1;
    boss.attackToken = 0;
    player.fighter.x = 300;
    player.fighter.vx = 0;
    player.fighter.vy = 0;
    player.fighter.hitTimer = 0;
    enemies = [];
    obstacles = [];
    pickups = [];
    projectiles = [];
    floatingTexts = [];
    chatPush('sys', '!! EVIL BALD APPEARS !!');
    chatPush('bald', 'finally');
    gameState = STATE.FIGHT;
}

// =====================================================================
// STAGE WAVE SYSTEM
// =====================================================================
function spawnWave(waveNum) {
    enemies = [];
    obstacles = [];
    if (waveNum === 1) {
        for (let i = 0; i < 4; i++) enemies.push(makeEnemy('halo_grunt', 700 + i * 110));
    } else if (waveNum === 2) {
        for (let i = 0; i < 3; i++) enemies.push(makeEnemy('mets_fan', 650 + i * 130));
    } else if (waveNum === 3) {
        for (let i = 0; i < 5; i++) {
            const b = makeBillboard(450 + Math.random() * 480);
            b.spawnDelay = i * 0.7;
            obstacles.push(b);
        }
    } else if (waveNum === 4) {
        for (let i = 0; i < 6; i++) {
            const t = makeTombstone(420 + Math.random() * 500);
            t.spawnDelay = i * 0.5;
            obstacles.push(t);
        }
    }
    stage.enemiesRemaining = enemies.length;
    stage.obstaclesRemaining = obstacles.length;
}

function nextWave() {
    if (stage.wave >= 4) {
        stage.phase = 'transitioning';
        stage.phaseTimer = 1.2;
        return;
    }
    stage.wave += 1;
    stage.phase = 'wave_active';
    stage.showGoArrow = false;
    stage.bannerText = `WAVE ${stage.wave}`;
    stage.bannerTimer = 2.0;
    const desc = ['', 'HALO GRUNTS', 'METS FANS', 'FALLING BILLBOARDS', 'TOMBSTONES'][stage.wave];
    chatPush('sys', `!! WAVE ${stage.wave}: ${desc} !!`);
    player.fighter.x = 150;
    player.fighter.vx = 0;
    spawnWave(stage.wave);
}

function checkWaveClear() {
    if (stage.phase !== 'wave_active') return;
    const aliveEnemies = enemies.filter(e => e.alive).length;
    const activeObstacles = obstacles.filter(o => !o.destroyed && !o.passed).length;
    if (aliveEnemies === 0 && activeObstacles === 0) {
        // Check if all delayed-spawn obstacles have at least spawned
        const unspawned = obstacles.filter(o => !o.spawned).length;
        if (unspawned > 0) return;
        stage.phase = 'wave_cleared';
        stage.showGoArrow = true;
        chatPush('sys', 'Wave cleared! Walk right to advance.');
        const dropX = Math.min(GW - 150, player.fighter.x + 200);
        const rewardType = (stage.wave === 1 || stage.wave === 3) ? 'heal' : 'power';
        pickups.push(makePickup(dropX, rewardType));
        // Bonus runes
        player.runes += 15;
        floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 180, text: '+15 RUNES', color: '#fada30', life: 1.5 });
    }
}

// =====================================================================
// STAGE ENTITIES - constructors
// =====================================================================
function makeEnemy(type, x) {
    const d = ENEMY_TYPES[type];
    return {
        type, ...d,
        x, y: FLOOR_Y,
        vx: 0, vy: 0,
        hp: d.hp,
        maxHp: d.hp,
        facing: -1,
        state: 'idle',
        attackTimer: d.attackCooldown * 0.6 + Math.random() * 0.4,
        hitTimer: 0,
        hitFlash: 0,
        onGround: true,
        bobPhase: Math.random() * Math.PI * 2,
        alive: true
    };
}

function makeBillboard(x) {
    const content = BILLBOARD_CONTENT[Math.floor(Math.random() * BILLBOARD_CONTENT.length)];
    return {
        kind: 'billboard',
        contentType: content.type,
        contentLabel: content.label,
        contentColor: content.color,
        x, y: -150,
        vy: 0,
        w: 130, h: 130,
        landed: false,
        landTimer: 0,
        damage: 14,
        hp: 6,
        hitFlash: 0,
        spawnDelay: 0,
        spawned: false,
        destroyed: false,
        passed: false,
        rotation: (Math.random() - 0.5) * 0.3
    };
}

function makeTombstone(x) {
    return {
        kind: 'tombstone',
        x, y: FLOOR_Y + 100,
        targetY: FLOOR_Y - 10,
        w: 72, h: 110,
        hp: 4,
        damage: 0,
        hitFlash: 0,
        spawnDelay: 0,
        spawned: false,
        risen: false,
        riseProgress: 0,
        destroyed: false,
        passed: false,
        deathText: PEOPLE_DEATHS[Math.floor(Math.random() * PEOPLE_DEATHS.length)]
    };
}

function makePickup(x, type) {
    return {
        type,
        x, y: FLOOR_Y - 40,
        w: 36, h: 36,
        bobPhase: Math.random() * Math.PI * 2,
        life: 30.0
    };
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

// Heavy attack with character-specific behavior (the old per-character signature moves)
function tryHeavy() {
    const f = player.fighter;
    if (!canAct(f)) return;
    startAttack(f, 'heavy', player.data.heavy);
    const startupMs = player.data.heavy.startup * 1000;
    const myType = 'heavy';

    if (player.charKey === 'slug') {
        // UFC Ticket Fan - 3 gold tickets in a spread
        setTimeout(() => {
            if (gameState !== STATE.FIGHT || f.attackType !== myType) return;
            const baseX = f.x + f.facing * 40;
            const baseY = f.y - f.h / 2;
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
            sfx('parry');
        }, startupMs);
        floatingTexts.push({ x: f.x, y: f.y - 200, text: 'UFC TICKETS', color: '#fada30', life: 1.0 });
    } else if (player.charKey === 'generic_white') {
        // Shield Counter - announce that parry is active so player knows to bait the boss
        floatingTexts.push({ x: f.x, y: f.y - 200, text: 'SHIELD UP!', color: '#d4af37', life: 0.9 });
    } else if (player.charKey === 'ladder_man') {
        // Wide Ladder Swing - announce the move
        floatingTexts.push({ x: f.x, y: f.y - 200, text: 'LADDER SWING', color: '#3a8a4a', life: 0.9 });
    }
}

function trySpecial() {
    const f = player.fighter;
    if (!canAct(f)) return;
    if ((player.specialCd || 0) > 0) return;  // brief cooldown so it can't be button-mashed
    player.specialCd = 2.5;
    f.state = 'attacking';
    f.attackType = 'special';
    f.attackData = player.data.special;
    f.attackPhase = 'startup';
    f.attackTimer = player.data.special.startup;
    f.hasHitThisAttack = false;
    sfx('special');
    const startupMs = player.data.special.startup * 1000;
    const proj = player.data.special.projectile;

    if (proj === 'questions') {
        // LADDER MAN: 3 giant question marks fired at the boss
        setTimeout(() => {
            if (gameState !== STATE.FIGHT) return;
            chatPush('sys', 'Ladder Man: ???');
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (gameState !== STATE.FIGHT) return;
                    const baseX = f.x + f.facing * 40;
                    const baseY = f.y - f.h * 0.6;
                    const target = boss.fighter;
                    const targetX = target.x;
                    const targetY = target.y - target.h * 0.5;
                    const dx = targetX - baseX;
                    const dy = targetY - baseY + (i - 1) * 30;
                    const dist = Math.hypot(dx, dy);
                    projectiles.push({
                        type: 'question',
                        x: baseX, y: baseY,
                        vx: (dx / dist) * 750,
                        vy: (dy / dist) * 750,
                        damage: 14,
                        owner: 'player',
                        life: 2.0,
                        spin: 0
                    });
                    sfx('parry');
                }, i * 130);
            }
        }, startupMs);
    } else if (proj === 'flag') {
        // GENERIC WHITE: unfurl Puerto Rican flag and sweep boss
        setTimeout(() => {
            if (gameState !== STATE.FIGHT) return;
            chatPush('sys', 'Generic White unfurls the flag');
            flagAttack = {
                x: f.x + f.facing * 30,
                y: f.y - f.h - 10,
                vx: f.facing * 520,
                width: 0,            // grows from 0 to maxWidth during unfurl
                maxWidth: 320,
                height: 200,
                life: 1.4,
                phase: 'unfurl',     // unfurl -> sweep -> fade
                phaseTimer: 0.25,
                hasHitBoss: false,
                facing: f.facing,
                wavePhase: 0,
                damage: 45,
                knockback: 520
            };
        }, startupMs);
    } else if (proj === 'waiters') {
        // SLUG: summon 2 pompous waiters
        setTimeout(() => {
            if (gameState !== STATE.FIGHT) return;
            chatPush('sys', 'Slug summons the staff');
            for (let i = 0; i < 2; i++) {
                setTimeout(() => {
                    if (gameState !== STATE.FIGHT) return;
                    const fromLeft = i === 0;
                    waiters.push({
                        x: fromLeft ? -100 : GW + 100,
                        y: FLOOR_Y,
                        targetX: boss.fighter.x + (fromLeft ? -130 : 130),
                        facing: fromLeft ? 1 : -1,
                        state: 'walking',   // walking -> serving -> leaving
                        stateTimer: 0,
                        hasServed: false,
                        bobPhase: Math.random() * Math.PI * 2,
                        damage: 22
                    });
                }, i * 250);
            }
        }, startupMs);
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
    if (gameState !== STATE.FIGHT && gameState !== STATE.STAGE) return;
    if (hitStopTimer > 0) { hitStopTimer -= dt; return; }
    updateShake(dt);
    if (player.specialCd > 0) player.specialCd -= dt;

    if (gameState === STATE.STAGE) {
        updateFighter(player.fighter, dt, false);
        updateEnemies(dt);
        updateObstacles(dt);
        updatePickups(dt);
        updateProjectiles(dt);
        updateParticles(dt);
        updateFloatingTexts(dt);
        updateComboTimer(dt);
        updateChatTimers(dt);
        updateDJ(dt);
        updateStage(dt);
        if (player.fighter.hp <= 0) {
            player.fighter.hp = 0;
            addShake(20, 1.0);
            sfx('ko'); sfx('lose');
            chatPush('sys', 'You opened the link');
            stopBossMusic();
            setTimeout(() => { if (gameState === STATE.STAGE) gameState = STATE.LOSE; }, 600);
        }
        return;
    }

    // STATE.FIGHT (existing boss fight)
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
    updateFlagAttack(dt);
    updateWaiters(dt);
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
                // Counter setup - invuln during active for ANY counter-flagged attack (heavy or special)
                if (f.attackData.counter) {
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
            if (gameState === STATE.STAGE && !isBoss) {
                // Player attack vs enemies + obstacles
                const range = f.attackData.range;
                const dmg = (f.attackData.damage || 0) * (player.dmgMult || 1);
                const kb = f.attackData.knockback || 0;
                for (const e of enemies) {
                    if (!e.alive) continue;
                    const overlap = Math.abs((f.x + f.facing * range / 2 + 30) - e.x) < range / 2 + e.w / 2 + 20;
                    const backOverlap = f.attackData.both && Math.abs((f.x - f.facing * range / 2 - 30) - e.x) < range / 2 + e.w / 2 + 20;
                    if (overlap || backOverlap) {
                        damageEnemy(e, dmg, kb, f.facing);
                        f.hasHitThisAttack = true;
                        break;
                    }
                }
                if (!f.hasHitThisAttack) {
                    for (const o of obstacles) {
                        if (o.destroyed || !o.spawned) continue;
                        if (o.kind === 'tombstone' && !o.risen) continue;
                        const overlap = Math.abs((f.x + f.facing * range / 2 + 30) - o.x) < range / 2 + o.w / 2 + 20;
                        if (overlap) {
                            damageObstacle(o, dmg, f.facing);
                            f.hasHitThisAttack = true;
                            break;
                        }
                    }
                }
            } else if (boss.fighter) {
                const target = isBoss ? player.fighter : boss.fighter;
                checkAttackHit(f, target, isBoss);
            }
        }
    }

    // Player input (only if not in hit stun / not attacking)
    if (!isBoss && canAct(f)) {
        let walkDir = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) walkDir = -1;
        if (keys['ArrowRight'] || keys['KeyD']) walkDir = 1;

        // Block = holding away from boss (only meaningful in boss fight; stage mode = no blocking)
        let isBlocking = false;
        if (gameState === STATE.FIGHT && boss.fighter) {
            const awayFromBoss = boss.fighter.x > f.x ? -1 : 1;
            isBlocking = walkDir === awayFromBoss && walkDir !== 0;
        }

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

    // FACING: face the opponent (or nearest enemy in stage mode) when on ground + not mid-attack
    if (f.onGround && f.attackPhase !== 'startup' && f.attackPhase !== 'active') {
        if (gameState === STATE.STAGE && !isBoss) {
            const aliveEnemies = enemies.filter(e => e.alive);
            if (aliveEnemies.length > 0) {
                let nearest = aliveEnemies[0];
                let nearestDist = Math.abs(nearest.x - f.x);
                for (const e of aliveEnemies) {
                    const d = Math.abs(e.x - f.x);
                    if (d < nearestDist) { nearest = e; nearestDist = d; }
                }
                f.facing = nearest.x > f.x ? 1 : -1;
            } else if (stage.showGoArrow) {
                f.facing = 1;
            }
        } else {
            const opponent = isBoss ? player.fighter : boss.fighter;
            if (opponent) f.facing = opponent.x > f.x ? 1 : -1;
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

    // STAGE: tombstones block movement at ground level (must destroy or jump over)
    if (gameState === STATE.STAGE && !isBoss) {
        for (const o of obstacles) {
            if (o.kind !== 'tombstone' || !o.spawned || !o.risen || o.destroyed) continue;
            const tLeft = o.x - o.w / 2;
            const tRight = o.x + o.w / 2;
            const pLeft = f.x - f.w / 2;
            const pRight = f.x + f.w / 2;
            const playerFeet = f.y;
            const tombTop = o.y - o.h;
            // Only block if player is at ground level (overlapping tombstone height)
            if (playerFeet > tombTop + 20 && pRight > tLeft && pLeft < tRight) {
                if (f.vx > 0) { f.x = tLeft - f.w / 2; f.vx = 0; }
                else if (f.vx < 0) { f.x = tRight + f.w / 2; f.vx = 0; }
            }
        }
    }

    // Floor collision
    if (f.y >= FLOOR_Y) {
        if (!f.onGround && f.vy > 100) {
            f.squishY = 0.7;  // landing squish
        }
        f.y = FLOOR_Y;
        f.vy = 0;
        f.onGround = true;
    }

    // Boundary - in stage mode the level is wider than the screen
    const maxX = (gameState === STATE.STAGE) ? LEVEL_END - 50 : GW - 50;
    if (f.x < 50) f.x = 50;
    if (f.x > maxX) f.x = maxX;

    // data ref for fighter (for attacks)
    f.data = isBoss ? BOSS_DATA : player.data;
}

function checkAttackHit(attacker, defender, isBoss) {
    const range = attacker.attackData.range;
    if (!range) return;  // pure-projectile attacks (Slug heavy, all specials) skip melee check
    // Front overlap
    const frontX = attacker.x + attacker.facing * range / 2 + 30;
    const frontOverlap = Math.abs(frontX - defender.x) < range / 2 + defender.w / 2 + 20;
    // Back overlap (only for 'both: true' attacks like Ladder Swing)
    let backOverlap = false;
    if (attacker.attackData.both) {
        const backX = attacker.x - attacker.facing * range / 2 - 30;
        backOverlap = Math.abs(backX - defender.x) < range / 2 + defender.w / 2 + 20;
    }
    if (!frontOverlap && !backOverlap) return;

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
            // Hit boss if present (FIGHT mode)
            if (boss.fighter) {
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
                    continue;
                }
            }
            // Hit enemies (STAGE mode)
            for (const e of enemies) {
                if (!e.alive) continue;
                if (rectHitProj(p, e)) {
                    damageEnemy(e, p.damage, 150, p.vx > 0 ? 1 : -1);
                    p.life = 0;
                    break;
                }
            }
            // Hit obstacles (billboards use center-y, tombstones use feet-y)
            if (p.life > 0) {
                for (const o of obstacles) {
                    if (o.destroyed || !o.spawned) continue;
                    if (o.kind === 'tombstone' && !o.risen) continue;
                    let hit = false;
                    if (o.kind === 'billboard') {
                        hit = p.x > o.x - o.w / 2 && p.x < o.x + o.w / 2 && p.y > o.y - o.h / 2 && p.y < o.y + o.h / 2;
                    } else {
                        hit = p.x > o.x - o.w / 2 && p.x < o.x + o.w / 2 && p.y > o.y - o.h && p.y < o.y;
                    }
                    if (hit) {
                        damageObstacle(o, p.damage, p.vx > 0 ? 1 : -1);
                        p.life = 0;
                        break;
                    }
                }
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
    djBobPhase += dt * ((boss.fighter && boss.phase === 2) ? 6.5 : 4.5);
}

// =====================================================================
// STAGE update functions (continuous side-scroller)
// =====================================================================
function updateStage(dt) {
    if (stage.bannerTimer > 0) stage.bannerTimer -= dt;

    // Camera follows player smoothly
    const targetCam = player.fighter.x - GW * 0.35;
    cameraX += (targetCam - cameraX) * 0.10;
    cameraX = Math.max(0, Math.min(LEVEL_END - GW, cameraX));

    // Wake dormant entities when camera approaches (within 1 screen width)
    const wakeRange = GW;
    for (const e of enemies) {
        if (e.dormant && (e.x - player.fighter.x) < wakeRange) e.dormant = false;
    }
    for (const o of obstacles) {
        if (o.dormant && (o.x - player.fighter.x) < wakeRange) {
            o.dormant = false;
            o.spawned = false;     // trigger spawn animation
            o.spawnDelay = 0;
        }
    }

    // Boss door triggers when player reaches end of level
    if (stage.phase !== 'transitioning' && player.fighter.x >= LEVEL_END - 120) {
        stage.phase = 'transitioning';
        stage.phaseTimer = 1.2;
        chatPush('sys', '!! Approaching Evil Bald !!');
    }
    if (stage.phase === 'transitioning') {
        stage.phaseTimer -= dt;
        stage.transitionAlpha = Math.min(1, 1 - stage.phaseTimer / 1.2);
        if (stage.phaseTimer <= 0) startBossFight();
    }
}

function updateEnemies(dt) {
    for (const e of enemies) {
        if (!e.alive || e.dormant) continue;
        e.bobPhase += dt * 5;
        if (e.hitFlash > 0) e.hitFlash -= dt;
        if (e.hitTimer > 0) {
            e.hitTimer -= dt;
            e.x += e.vx * dt;
            e.vx *= 0.88;
            continue;
        }
        // AI
        const dx = player.fighter.x - e.x;
        const dist = Math.abs(dx);
        e.facing = dx < 0 ? -1 : 1;
        e.attackTimer -= dt;

        if (e.ai === 'melee') {
            // Halo grunt: charge in, melee swipe
            if (dist > e.attackRange - 15) {
                e.vx = Math.sign(dx) * e.speed;
                e.state = 'walking';
            } else {
                e.vx = 0;
                e.state = 'idle';
                if (e.attackTimer <= 0) {
                    // Swipe attack
                    if (dist < e.attackRange && player.fighter.hitTimer <= 0 && player.fighter.invuln <= 0) {
                        player.fighter.hp -= e.damage;
                        player.fighter.hitTimer = 0.25;
                        player.fighter.vx = -Math.sign(dx) * 250;
                        player.fighter.hitFlash = 0.25;
                        sfx('damage');
                        addShake(6, 0.15);
                        floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 130, text: `-${e.damage}`, color: '#ff5a5a', life: 0.9 });
                    }
                    e.attackTimer = e.attackCooldown;
                }
            }
        } else if (e.ai === 'ranged') {
            // Mets fan: kite + throw baseballs
            const ideal = 280;
            if (dist > ideal + 50) { e.vx = Math.sign(dx) * e.speed * 0.8; e.state = 'walking'; }
            else if (dist < ideal - 80) { e.vx = -Math.sign(dx) * e.speed * 0.9; e.state = 'walking'; }
            else {
                e.vx = 0; e.state = 'idle';
                if (e.attackTimer <= 0) {
                    projectiles.push({
                        type: 'mets', x: e.x + e.facing * 30, y: e.y - e.h * 0.6,
                        vx: e.facing * 500, vy: -180, damage: e.damage,
                        owner: 'boss', life: 2.5, spin: 0
                    });
                    sfx('whiff');
                    e.attackTimer = e.attackCooldown;
                }
            }
        } else if (e.ai === 'spartan_rifle') {
            // Spartan: medium range, 3-round burst from rifle
            const ideal = 320;
            if (dist > ideal + 50) { e.vx = Math.sign(dx) * e.speed; e.state = 'walking'; }
            else if (dist < ideal - 90) { e.vx = -Math.sign(dx) * e.speed * 0.85; e.state = 'walking'; }
            else {
                e.vx = 0; e.state = 'idle';
                if (e.attackTimer <= 0) {
                    // Fire 3-burst with quick succession
                    for (let b = 0; b < 3; b++) {
                        setTimeout(() => {
                            if (gameState !== STATE.STAGE || !e.alive) return;
                            projectiles.push({
                                type: 'bullet',
                                x: e.x + e.facing * 30,
                                y: e.y - e.h * 0.7,
                                vx: e.facing * 720,
                                vy: -20 + Math.random() * 40,
                                damage: e.damage,
                                owner: 'boss',
                                life: 1.8,
                                spin: 0
                            });
                            sfx('hit_light');
                        }, b * 100);
                    }
                    e.attackTimer = e.attackCooldown;
                }
            }
        }
        e.x += e.vx * dt;
        // Boundary
        if (e.x < 50) e.x = 50;
        if (e.x > GW - 50) e.x = GW - 50;
    }
    enemies = enemies.filter(e => e.alive || e.hp > 0);  // already-dead ones drop off
}

function updateObstacles(dt) {
    for (const o of obstacles) {
        if (o.destroyed || o.dormant) continue;
        if (!o.spawned) {
            o.spawnDelay -= dt;
            if (o.spawnDelay > 0) continue;
            o.spawned = true;
        }
        if (o.hitFlash > 0) o.hitFlash -= dt;

        if (o.kind === 'billboard') {
            if (!o.landed) {
                o.vy += 1100 * dt;
                o.y += o.vy * dt;
                if (o.y + o.h / 2 >= FLOOR_Y) {
                    o.y = FLOOR_Y - o.h / 2;
                    o.landed = true;
                    o.landTimer = 0.6;
                    addShake(8, 0.2);
                    spawnParticles(o.x, FLOOR_Y, '#8a6a28', 12);
                    sfx('hit_heavy');
                    // Damage check on landing
                    const px = player.fighter.x;
                    if (Math.abs(px - o.x) < o.w / 2 + player.fighter.w / 2 && player.fighter.invuln <= 0 && player.fighter.hitTimer <= 0) {
                        player.fighter.hp -= o.damage;
                        player.fighter.hitTimer = 0.30;
                        player.fighter.vx = (px < o.x ? -1 : 1) * 300;
                        player.fighter.vy = -250;
                        player.fighter.onGround = false;
                        player.fighter.hitFlash = 0.3;
                        sfx('damage');
                        addShake(10, 0.25);
                        floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 130, text: `-${o.damage}`, color: '#ff5a5a', life: 0.9 });
                    }
                }
            } else {
                o.landTimer -= dt;
                // After landing, becomes destructible obstacle (hit it to clear)
                if (o.landTimer <= 0 && !o.passed) {
                    // Check if player walked past it (left to right past x)
                    if (player.fighter.x > o.x + 80) o.passed = true;
                }
            }
        } else if (o.kind === 'tombstone') {
            if (!o.risen) {
                o.riseProgress = Math.min(1, o.riseProgress + dt * 1.6);
                o.y = FLOOR_Y + 100 - (110 * o.riseProgress);
                if (o.riseProgress >= 1) {
                    o.risen = true;
                    o.y = o.targetY;
                    spawnParticles(o.x, FLOOR_Y, '#5a3a18', 10);
                    sfx('hit_light');
                }
            } else {
                // Check passed
                if (player.fighter.x > o.x + 60 && !o.passed) {
                    o.passed = true;
                }
            }
        }
    }
    // Cull
    obstacles = obstacles.filter(o => !(o.destroyed && o.hitFlash <= 0));
}

function updatePickups(dt) {
    for (const p of pickups) {
        p.bobPhase += dt * 3;
        p.life -= dt;
        // Pickup collision with player
        const px = player.fighter.x;
        const py = player.fighter.y - player.fighter.h / 2;
        if (Math.abs(px - p.x) < 40 && Math.abs(py - p.y) < 60) {
            applyPickup(p);
            p.life = 0;
        }
    }
    pickups = pickups.filter(p => p.life > 0);
}

function applyPickup(p) {
    if (p.type === 'heal') {
        player.fighter.hp = Math.min(player.fighter.maxHp, player.fighter.hp + 40);
        sfx('heal');
        floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 160, text: '+40 HP', color: '#5aff5a', life: 1.4 });
    } else if (p.type === 'power') {
        player.dmgMult = (player.dmgMult || 1) * 1.20;
        sfx('parry');
        floatingTexts.push({ x: player.fighter.x, y: player.fighter.y - 160, text: '+20% DMG', color: '#fada30', life: 1.4 });
    }
}

// Damage an enemy from a player hit. Returns true if killed.
function damageEnemy(e, dmg, knockback, srcFacing) {
    e.hp -= dmg;
    e.hitFlash = 0.25;
    e.hitTimer = 0.25;
    e.vx = (srcFacing || 1) * (knockback || 200);
    sfx('hit_light');
    spawnParticles(e.x, e.y - e.h / 2, '#ff5a5a', 8);
    addShake(4, 0.10);
    floatingTexts.push({ x: e.x + (Math.random() - 0.5) * 30, y: e.y - e.h - 10, text: `-${Math.round(dmg)}`, color: '#ff8080', life: 0.8 });
    if (e.hp <= 0) {
        e.alive = false;
        spawnParticles(e.x, e.y - e.h / 2, '#fada30', 20);
        sfx('hit_heavy');
        player.runes += e.runeReward || 5;
        floatingTexts.push({ x: e.x, y: e.y - e.h - 30, text: `+${e.runeReward} R`, color: '#fada30', life: 1.2 });
        return true;
    }
    return false;
}

function damageObstacle(o, dmg, srcFacing) {
    o.hp -= dmg;
    o.hitFlash = 0.25;
    spawnParticles(o.x, o.y, '#cccccc', 6);
    sfx('hit_light');
    if (o.hp <= 0) {
        o.destroyed = true;
        spawnParticles(o.x, o.y, '#fada30', 18);
        sfx('hit_heavy');
        floatingTexts.push({ x: o.x, y: o.y - 40, text: '+5 R', color: '#fada30', life: 1.0 });
        player.runes += 5;
    }
}

function updateFlagAttack(dt) {
    if (!flagAttack) return;
    flagAttack.life -= dt;
    flagAttack.phaseTimer -= dt;
    flagAttack.wavePhase += dt * 8;

    if (flagAttack.phase === 'unfurl') {
        // Grow the flag width over 0.25s
        flagAttack.width = Math.min(flagAttack.maxWidth, flagAttack.maxWidth * (1 - flagAttack.phaseTimer / 0.25));
        if (flagAttack.phaseTimer <= 0) {
            flagAttack.phase = 'sweep';
            flagAttack.phaseTimer = 0.7;
        }
    } else if (flagAttack.phase === 'sweep') {
        // Move forward across screen
        flagAttack.x += flagAttack.vx * dt;
        if (flagAttack.phaseTimer <= 0) {
            flagAttack.phase = 'fade';
            flagAttack.phaseTimer = 0.45;
        }
    } else if (flagAttack.phase === 'fade') {
        // Slow + fade
        flagAttack.x += flagAttack.vx * dt * 0.3;
    }

    // Hit check on boss (once)
    if (!flagAttack.hasHitBoss) {
        const fx = flagAttack.x;
        const fLeft = flagAttack.facing > 0 ? fx : fx - flagAttack.width;
        const fRight = flagAttack.facing > 0 ? fx + flagAttack.width : fx;
        const fTop = flagAttack.y;
        const fBot = flagAttack.y + flagAttack.height;
        const b = boss.fighter;
        if (b.x > fLeft && b.x < fRight && (b.y - b.h) < fBot && b.y > fTop - 20) {
            flagAttack.hasHitBoss = true;
            boss.fighter.hp -= flagAttack.damage;
            boss.fighter.hitFlash = 0.4;
            boss.fighter.hitTimer = 0.6;
            boss.fighter.vx = flagAttack.facing * flagAttack.knockback;
            boss.fighter.vy = -350;
            boss.fighter.onGround = false;
            boss.fighter.attackPhase = 'none';
            boss.fighter.attackType = null;
            boss.fighter.attackData = null;
            boss.attackToken = (boss.attackToken || 0) + 1;
            sfx('hit_heavy');
            addShake(18, 0.4);
            addHitStop(0.08);
            spawnParticles(b.x, b.y - b.h/2, '#fff', 14);
            spawnParticles(b.x, b.y - b.h/2, '#c41818', 14);
            spawnParticles(b.x, b.y - b.h/2, '#1a4aff', 14);
            floatingTexts.push({ x: b.x, y: b.y - 200, text: 'BORICUA!', color: '#fada30', life: 1.6 });
            floatingTexts.push({ x: b.x, y: b.y - 160, text: `-${flagAttack.damage}`, color: '#ff5a5a', life: 1.2 });
            if (boss.fighter.hp <= 0) {
                boss.fighter.hp = 0;
                gameState = STATE.WIN;
                stopBossMusic();
                sfx('win');
            }
        }
    }

    if (flagAttack.life <= 0) flagAttack = null;
}

function updateWaiters(dt) {
    for (const w of waiters) {
        w.bobPhase += dt * 6;
        if (w.state === 'walking') {
            const dx = w.targetX - w.x;
            const dist = Math.abs(dx);
            if (dist < 8) {
                w.state = 'serving';
                w.stateTimer = 0.6;
                w.x = w.targetX;
            } else {
                w.x += Math.sign(dx) * 280 * dt;
                w.facing = Math.sign(dx);
            }
        } else if (w.state === 'serving') {
            w.stateTimer -= dt;
            if (w.stateTimer <= 0.3 && !w.hasServed) {
                w.hasServed = true;
                // Apply platter hit on boss
                const dxToBoss = Math.abs(boss.fighter.x - w.x);
                if (dxToBoss < 220) {
                    boss.fighter.hp -= w.damage;
                    boss.fighter.hitFlash = 0.3;
                    boss.fighter.hitTimer = 0.4;
                    boss.fighter.vx = (boss.fighter.x > w.x ? 1 : -1) * 350;
                    boss.fighter.attackPhase = 'none';
                    boss.fighter.attackType = null;
                    boss.fighter.attackData = null;
                    boss.attackToken = (boss.attackToken || 0) + 1;
                    sfx('hit_heavy');
                    addShake(10, 0.2);
                    spawnParticles(boss.fighter.x, boss.fighter.y - boss.fighter.h/2, '#cccccc', 12);
                    floatingTexts.push({ x: boss.fighter.x + (Math.random()-0.5)*40, y: boss.fighter.y - 140, text: `-${w.damage}`, color: '#fff', life: 1.0 });
                    if (boss.fighter.hp <= 0) {
                        boss.fighter.hp = 0;
                        gameState = STATE.WIN;
                        stopBossMusic();
                        sfx('win');
                    }
                }
            }
            if (w.stateTimer <= 0) {
                w.state = 'leaving';
                w.facing = w.x < GW / 2 ? -1 : 1;
            }
        } else if (w.state === 'leaving') {
            w.x += w.facing * 320 * dt;
            if (w.x < -120 || w.x > GW + 120) {
                w.life = 0;  // mark for removal
            }
        }
    }
    waiters = waiters.filter(w => w.life !== 0);
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
    else if (gameState === STATE.STAGE) {
        renderStage();
        renderChatSidebar();
    } else if (gameState === STATE.FIGHT) {
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
        ['K',         'Heavy attack = your CHARACTER SIGNATURE move'],
        ['L',         'ULTIMATE special (3 charges)'],
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
        // Heavy signature move
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 12px Georgia';
        ctx.fillText('HEAVY (K)', x, 530);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Georgia';
        ctx.fillText(d.heavyName, x, 547);
        // Ultimate special
        ctx.fillStyle = '#fada30';
        ctx.font = 'bold 12px Georgia';
        ctx.fillText('ULTIMATE (L)', x, 575);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Georgia';
        ctx.fillText(d.specialName, x, 592);
        ctx.fillStyle = '#bbbbbb';
        ctx.font = '11px Georgia';
        wrapText(d.specialDesc, x, 608, 270, 12);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 28px Georgia';
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
    // Waiters (in front of background, behind fighters? render above floor for clarity)
    waiters.forEach(drawWaiter);
    // Flag attack (over everything)
    drawFlagAttack();
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
    if (p.type === 'bullet') {
        // Spartan rifle round - bright tracer streak
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#fada30';
        ctx.shadowColor = '#fa9030';
        ctx.shadowBlur = 12;
        ctx.fillRect(-16, -3, 32, 6);
        ctx.fillStyle = '#ffeec0';
        ctx.fillRect(-16, -1, 24, 2);
        ctx.shadowBlur = 0;
        ctx.restore();
        return;
    }
    if (p.type === 'question') {
        // Ladder Man's "???" - giant glowing yellow question marks
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.spin) * 0.3);  // wobble
        // Glow
        ctx.shadowColor = '#fada30';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#fada30';
        ctx.font = 'bold 64px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 18);
        ctx.shadowBlur = 0;
        // Outline pass for crisp edge
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('?', 0, 18);
        ctx.restore();
        return;
    }
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

function renderStage() {
    // Parallax-ish background: tile the arena image horizontally, scrolling at half rate
    if (IMAGES.background_arena.loaded) {
        const bgW = GW;
        const parallax = cameraX * 0.5;
        let bgX = -((parallax % bgW + bgW) % bgW);
        for (let x = bgX; x < GW; x += bgW) {
            ctx.drawImage(IMAGES.background_arena.img, x, 0, bgW, H);
        }
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

    // ============ WORLD-SPACE rendering (translated by -cameraX) ============
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Distance markers along the floor (subtle visual feedback that you're moving)
    for (let x = 0; x < LEVEL_END; x += 400) {
        ctx.fillStyle = 'rgba(150, 60, 30, 0.3)';
        ctx.fillRect(x, FLOOR_Y + 12, 4, 4);
    }

    // Boss door at the end of the level
    if (player.fighter.x > LEVEL_END - 1200) {
        const dx = LEVEL_END - 60;
        // Door frame
        ctx.fillStyle = '#0a0303';
        ctx.fillRect(dx - 6, FLOOR_Y - 290, 130, 290);
        ctx.fillStyle = '#3a1818';
        ctx.fillRect(dx, FLOOR_Y - 280, 110, 280);
        ctx.fillStyle = '#5a2828';
        ctx.fillRect(dx + 8, FLOOR_Y - 270, 94, 260);
        // Door wood pattern
        ctx.fillStyle = '#2a1010';
        for (let yy = 0; yy < 6; yy++) ctx.fillRect(dx + 10, FLOOR_Y - 270 + yy * 40, 90, 2);
        // Sigil / label
        ctx.fillStyle = '#fada30';
        ctx.font = 'bold 20px Georgia';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#6a1a08'; ctx.shadowBlur = 12;
        ctx.fillText('EVIL BALD', dx + 55, FLOOR_Y - 300);
        ctx.fillStyle = '#c41818';
        ctx.font = '14px Georgia';
        ctx.fillText('inside', dx + 55, FLOOR_Y - 282);
        ctx.shadowBlur = 0;
    }

    // Obstacles
    obstacles.forEach(o => { if (!o.dormant) drawObstacle(o); });
    // Enemies
    enemies.forEach(e => { if (!e.dormant) drawEnemy(e); });
    // Pickups
    pickups.forEach(drawPickup);
    // Projectiles
    projectiles.forEach(drawProjectile);
    // Player
    drawFighter(player.fighter, player.data ? player.data.spriteKey : null, 'player');
    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
    });
    // Floating texts (world-positioned)
    floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.min(1, t.life * 1.5);
        ctx.font = 'bold 22px Georgia';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    ctx.restore();
    // ============ END world-space ============

    // Screen-locked overlays
    drawDJBooth();
    drawStageHUD();

    // Wave banner
    if (stage.bannerTimer > 0) {
        const a = Math.min(1, stage.bannerTimer / 0.4) * Math.min(1, (2.0 - stage.bannerTimer) / 0.3);
        ctx.fillStyle = `rgba(0, 0, 0, ${a * 0.6})`;
        ctx.fillRect(0, H / 2 - 70, GW, 100);
        ctx.fillStyle = `rgba(255, 60, 40, ${a})`;
        ctx.font = 'bold 64px Georgia';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
        ctx.fillText(stage.bannerText, GW / 2, H / 2);
        ctx.shadowBlur = 0;
    }

    // Boss-door transition fade
    if (stage.phase === 'transitioning') {
        ctx.fillStyle = `rgba(0, 0, 0, ${stage.transitionAlpha})`;
        ctx.fillRect(0, 0, GW, H);
        ctx.fillStyle = `rgba(255, 60, 40, ${stage.transitionAlpha})`;
        ctx.font = 'bold 56px Georgia';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 12;
        ctx.fillText('EVIL BALD AWAITS', GW / 2, H / 2);
        ctx.shadowBlur = 0;
    }
}

function drawEnemy(e) {
    if (!e.alive) return;
    const img = IMAGES[e.spriteKey] && IMAGES[e.spriteKey].loaded ? IMAGES[e.spriteKey].img : null;
    const bob = Math.abs(Math.sin(e.bobPhase)) * (e.state === 'walking' ? -5 : -1);
    const drawScale = e.drawScale || 1.5;
    const drawW = e.w * drawScale;
    const drawH = e.h * drawScale;
    ctx.save();
    if (e.hitFlash > 0) ctx.filter = 'brightness(3) saturate(0.2)';
    ctx.translate(e.x, e.y + bob);
    const defaultFacing = e.spriteDefaultFacing || -1;
    if (e.facing !== defaultFacing) ctx.scale(-1, 1);
    if (img) {
        ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    } else {
        ctx.fillStyle = e.type === 'halo_grunt' ? '#3a6a4a' : '#aa5a40';
        ctx.fillRect(-drawW / 2, -drawH, drawW, drawH);
    }
    ctx.restore();
    // HP bar above
    const barW = 50;
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - barW / 2 - 1, e.y - e.h * 1.4 - 1, barW + 2, 6);
    ctx.fillStyle = '#c41818';
    ctx.fillRect(e.x - barW / 2, e.y - e.h * 1.4, barW * (e.hp / e.maxHp), 4);
}

function drawObstacle(o) {
    if (o.destroyed) return;
    if (!o.spawned) return;
    if (o.kind === 'billboard') {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rotation + (o.landed ? 0 : (o.vy / 800)));
        // Frame
        ctx.fillStyle = '#1a1014';
        ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
        ctx.fillStyle = o.contentColor;
        ctx.fillRect(-o.w / 2 + 8, -o.h / 2 + 16, o.w - 16, o.h - 30);
        // Header strip (mimic instagram top bar)
        ctx.fillStyle = '#0a0608';
        ctx.fillRect(-o.w / 2, -o.h / 2, o.w, 14);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-o.w / 2 + 10, -o.h / 2 + 7, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-o.w / 2 + 18, -o.h / 2 + 5, 40, 3);
        // Content sprite if available
        const imgKey = 'spam_' + o.contentType;
        if (IMAGES[imgKey] && IMAGES[imgKey].loaded) {
            const img = IMAGES[imgKey].img;
            ctx.drawImage(img, -o.w / 2 + 14, -o.h / 2 + 22, o.w - 28, o.h - 46);
        }
        // Label at bottom
        ctx.fillStyle = '#000';
        ctx.fillRect(-o.w / 2, o.h / 2 - 16, o.w, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(o.contentLabel, 0, o.h / 2 - 4);
        // Hit flash
        if (o.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${o.hitFlash * 2})`;
            ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
        }
        ctx.restore();
        // HP bar if it has been hit
        if (o.hp < 6 && o.landed) {
            const barW = 60;
            ctx.fillStyle = '#000';
            ctx.fillRect(o.x - barW / 2 - 1, o.y - o.h / 2 - 12, barW + 2, 5);
            ctx.fillStyle = '#c41818';
            ctx.fillRect(o.x - barW / 2, o.y - o.h / 2 - 11, barW * (o.hp / 6), 3);
        }
    } else if (o.kind === 'tombstone') {
        // y is feet/bottom of tombstone
        ctx.save();
        ctx.translate(o.x, o.y);
        // Tombstone shape - rounded top rectangle
        ctx.fillStyle = '#3a3a3a';
        if (o.hitFlash > 0) ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(-o.w / 2, 0);
        ctx.lineTo(-o.w / 2, -o.h + 25);
        ctx.quadraticCurveTo(-o.w / 2, -o.h, -o.w / 2 + 25, -o.h);
        ctx.lineTo(o.w / 2 - 25, -o.h);
        ctx.quadraticCurveTo(o.w / 2, -o.h, o.w / 2, -o.h + 25);
        ctx.lineTo(o.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        // Darker stripe inset
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(-o.w / 2 + 6, 0);
        ctx.lineTo(-o.w / 2 + 6, -o.h + 28);
        ctx.quadraticCurveTo(-o.w / 2 + 6, -o.h + 6, -o.w / 2 + 28, -o.h + 6);
        ctx.lineTo(o.w / 2 - 28, -o.h + 6);
        ctx.quadraticCurveTo(o.w / 2 - 6, -o.h + 6, o.w / 2 - 6, -o.h + 28);
        ctx.lineTo(o.w / 2 - 6, 0);
        ctx.closePath();
        ctx.fill();
        // RIP text
        ctx.fillStyle = '#888';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('R.I.P.', 0, -o.h + 32);
        // Death cause text (wrapped)
        ctx.fillStyle = '#cccccc';
        ctx.font = '9px Georgia';
        wrapText(o.deathText, 0, -o.h + 50, o.w - 14, 11);
        // Mound at base
        ctx.fillStyle = '#2a1a08';
        ctx.beginPath();
        ctx.ellipse(0, 0, o.w / 2 + 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // HP bar
        if (o.hp < 4 && o.risen) {
            const barW = 50;
            ctx.fillStyle = '#000';
            ctx.fillRect(o.x - barW / 2 - 1, o.y - o.h - 12, barW + 2, 5);
            ctx.fillStyle = '#c41818';
            ctx.fillRect(o.x - barW / 2, o.y - o.h - 11, barW * (o.hp / 4), 3);
        }
    }
}

function drawPickup(p) {
    const bob = Math.sin(p.bobPhase) * 6;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    // Glow
    ctx.shadowColor = p.type === 'heal' ? '#5aff5a' : '#fada30';
    ctx.shadowBlur = 18;
    // Shape
    if (p.type === 'heal') {
        // Red cross flask
        ctx.fillStyle = '#c41818';
        ctx.fillRect(-12, -16, 24, 32);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-3, -10, 6, 20);
        ctx.fillRect(-10, -3, 20, 6);
    } else {
        // Gold gauntlet / fist
        ctx.fillStyle = '#fada30';
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeStyle = '#aa7800'; ctx.lineWidth = 2;
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, 6);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawStageHUD() {
    drawHPBar(40, 30, 340, 28, player.fighter.hp, player.fighter.maxHp, '#5aafff', player.data.name);

    // Special cooldown bar (replaces charges)
    const cdMax = 2.5;
    const cdNow = Math.max(0, cdMax - (player.specialCd || 0));
    drawHPBar(40, 66, 200, 10, cdNow, cdMax, '#fada30', '');
    ctx.fillStyle = (player.specialCd || 0) <= 0 ? '#fada30' : '#888';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText((player.specialCd || 0) <= 0 ? 'SPECIAL (L) READY' : `SPECIAL CD ${(player.specialCd).toFixed(1)}s`, 40, 90);

    ctx.fillStyle = '#5aff5a';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText(`FLASKS (H): ${player.flasks}`, 260, 90);
    ctx.fillStyle = '#fada30';
    ctx.fillText(`Runes: ${player.runes}`, 420, 90);

    // Progress bar - distance through the level (top-right of game area)
    const progressW = 300;
    const progressX = GW - progressW - 20;
    const progressY = 36;
    const pct = Math.min(1, player.fighter.x / LEVEL_END);
    ctx.fillStyle = '#000';
    ctx.fillRect(progressX - 2, progressY - 2, progressW + 4, 16);
    ctx.fillStyle = '#1a0808';
    ctx.fillRect(progressX, progressY, progressW, 12);
    ctx.fillStyle = '#c41818';
    ctx.fillRect(progressX, progressY, progressW * pct, 12);
    // Player marker
    ctx.fillStyle = '#5aafff';
    ctx.fillRect(progressX + progressW * pct - 2, progressY - 2, 4, 16);
    // Boss icon at end
    ctx.fillStyle = '#fada30';
    ctx.fillRect(progressX + progressW - 4, progressY - 4, 8, 20);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 12px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText('-> EVIL BALD', GW - 20, progressY - 4);
}

function drawFlagAttack() {
    if (!flagAttack) return;
    const F = flagAttack;
    const alpha = F.life < 0.4 ? Math.max(0, F.life / 0.4) : 1;
    const w = F.width;
    const h = F.height;
    const facing = F.facing;
    // Flag origin: left edge if facing right, right edge if facing left
    const ox = F.x;
    const oy = F.y;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Pole (a vertical staff at the origin edge)
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(ox - 4, oy - 20, 8, h + 30);
    ctx.fillStyle = '#fada30';
    ctx.fillRect(ox - 6, oy - 26, 12, 8);

    // Draw the flag as 5 horizontal stripes with sine-wave displacement to look like it's waving.
    // Stripe colors top to bottom: red, white, red, white, red.
    const stripeColors = ['#c41a1a', '#ffffff', '#c41a1a', '#ffffff', '#c41a1a'];
    const stripeH = h / 5;
    // Horizontal cells - finer cells = smoother wave
    const cells = 16;
    const cellW = w / cells;
    for (let s = 0; s < 5; s++) {
        ctx.fillStyle = stripeColors[s];
        for (let c = 0; c < cells; c++) {
            const xOff = facing * c * cellW;
            const wave = Math.sin(F.wavePhase + c * 0.6) * 8 * (c / cells);  // amplitude grows toward free end
            ctx.fillRect(ox + xOff, oy + s * stripeH + wave, cellW + 1, stripeH + 1);
        }
    }

    // Blue triangle on the pole-side (left when facing right, right when facing left), point toward center
    ctx.fillStyle = '#0050aa';
    ctx.beginPath();
    if (facing > 0) {
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + h);
        ctx.lineTo(ox + h * 0.5, oy + h / 2);
    } else {
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + h);
        ctx.lineTo(ox - h * 0.5, oy + h / 2);
    }
    ctx.closePath();
    ctx.fill();

    // White 5-pointed star in the triangle
    const starCx = ox + facing * h * 0.18;
    const starCy = oy + h / 2;
    const starR = h * 0.13;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? starR : starR * 0.4;
        const px = starCx + Math.cos(ang) * r;
        const py = starCy + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawWaiter(w) {
    const sprite = IMAGES.waiter_sprite;
    const bob = Math.abs(Math.sin(w.bobPhase)) * (w.state === 'walking' || w.state === 'leaving' ? -6 : -2);
    const drawH = 180;
    if (sprite && sprite.loaded) {
        const img = sprite.img;
        const aspect = img.width / img.height;
        const drawW = drawH * aspect;
        ctx.save();
        ctx.translate(w.x, w.y + bob);
        // Waiter sprite faces left by default (platter on viewer's left). Flip to face right.
        if (w.facing > 0) ctx.scale(-1, 1);
        ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
        ctx.restore();
        // Serving "BAM!" flash
        if (w.state === 'serving' && w.stateTimer < 0.4 && w.hasServed === false) {
            ctx.fillStyle = `rgba(255, 240, 200, ${0.6 - w.stateTimer})`;
            ctx.beginPath();
            ctx.arc(w.x + w.facing * 60, w.y - 130, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Fallback - dark figure with silver disk
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(w.x - 20, w.y - 130, 40, 130);
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(w.x + w.facing * 28, w.y - 130, 18, 0, Math.PI * 2);
        ctx.fill();
    }
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

// =====================================================================
// TOUCH CONTROLS - auto-shown on touch devices
// =====================================================================
(function setupTouchControls() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
                    window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;
    const tc = document.getElementById('touch-controls');
    if (tc) tc.classList.remove('hidden');
    document.querySelectorAll('.tbtn').forEach(btn => {
        const code = btn.dataset.key;
        if (!code) return;
        const down = e => {
            if (e.cancelable) e.preventDefault();
            initAudio();
            if (!keys[code]) handleInputDown(code);
            keys[code] = true;
        };
        const up = e => {
            if (e.cancelable) e.preventDefault();
            keys[code] = false;
        };
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });
        btn.addEventListener('touchcancel', up, { passive: false });
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
        btn.addEventListener('mouseleave', up);
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
})();
