# Project State - Baldin' Ring

**Status:** v1 SHIPPED - finished and playable
**Last updated:** 2026-05-16

## Where Things Stand
v1 is DONE. Open `index.html` in any browser. Full game loop: Title -> Character Select (3 distinct characters with portraits + stats + special descriptions) -> Pullout Merchant shop (5 buyable items with rune currency) -> Boss Fight (Evil Bald with 5 attack types + late mechanic + fake-out + phase 2 BACK ONLINE + Harkonnen-styled body and arena) -> Win or Lose screen. All characters drawn procedurally (no external image files needed). DJ Plan B bobs to the music in his booth. The M slides in periodically with depressing Toasty-style one-liners. Web Audio SFX (no files, all generated) for hits, dodges, heals, parries, win, lose.

## Key Decisions Made
- **Tech stack:** HTML5 + Canvas + plain JavaScript. Browser game, no install.
- **Format:** Mike Tyson's Punch-Out! style stationary boss fight, with Souls weapon/healing/stamina mechanics layered on top.
- **Player count:** Solo. Pick 1 of 3 characters. No multiplayer (decided against complexity).
- **Art direction proposal:** Stylized cutouts of real friend reference photos as in-game character art. Janky charm fits the "friend group joke game" tone better than generic redraws. AWAITING USER GREENLIGHT.
- **Attack design rule:** Projectiles must visually read as actual spammed content (tweet cards, screenshots, food pics, etc), not generic energy balls.
- **"Late" mechanic:** Long wind-ups, occasional fake-out attacks, rare "catch-up combo" (boss disappears then unleashes fast multi-hit), Phase 2 at low HP = "BACK ONLINE" speedup.

## Open Questions / Blockers
1. **User needs to drop in character PNGs** for recognizable art. Two options documented in ART_GUIDE.md - raw photos (5 min) or AI-stylized via prompts (15-30 min). Game shows "art mode" indicator on title screen.
2. **Hosting** - local file share vs. static hosting (Vercel/Netlify free tier). Can decide once playable.
3. **Audio** - boss music track. SFX are wired (Web Audio generated). Background music would need an mp3 file (e.g. ElevenLabs Music API for a Harkonnen industrial track).

## Cast Photo Mapping (for reference when generating art)
- **Evil Bald**: bald guy in beige tunic photo
- **Ladder Man**: Japan photo - cap + sunglasses + blue camo Helly Hansen jacket + purple cone food
- **Generic White**: stone wall photo, left guy in black shirt
- **Slug**: rooftop/lounge photo, middle guy in NY Yankees cap + glasses + black hoodie
- **Pullout Merchant**: Kyoto Tower photo, beanie + glasses
- **DJ Plan B**: gold chains + aviator shades (appears in 2 photos)
- **The M**: stone wall photo, right guy in brown jacket + glasses + checkered shirt

## Next Steps (in order)
1. User playtests v0, gives feedback on combat feel (too fast? too slow? right amount of jank?)
2. Differentiate the 3 playable characters with distinct movesets (Ladder Man reach, Generic White block, Slug summons)
3. Replace placeholder rectangles with stylized character art (Harkonnen-treated real photos)
4. Build Pullout Merchant pre-fight shop (buy upgrades / extra flasks / weapons)
5. Build DJ Plan B + The M visual NPCs (animated, with The M's interrupt one-liners)
6. Audio (boss music track + SFX for hits, dodges, attacks)
7. Polish + create share link (Vercel/Netlify) for friends

## Things Built So Far
- Folder structure (`baldin-ring/` with `assets/ref`, `assets/img`, `assets/audio`)
- `about_this_project.md` (this folder's WHAT)
- `_project-state.md` (this file - the WHERE)
- `index.html` - canvas + page shell + controls help
- `style.css` - dark Harkonnen page styling
- `game.js` - full v0 engine:
  - State machine (title -> character select -> fight -> win/lose)
  - Input handling (A/D dodge, S block, J attack, L heal, Space confirm, 1/2/3 character pick)
  - 5 boss attack patterns (Mets / Halo / Food / RIP / Flex) with telegraphed dodge side
  - "Late" mechanic: 15% chance boss idles extra long
  - "sry was eating" fake-out: 8% chance boss winds up and cancels (punishes early dodge)
  - Phase 2 "BACK ONLINE" trigger at 40% HP (faster wind-ups + recovery)
  - Punch-Out!-style punish window (player damages boss only during recovery state)
  - Healing flask (3 charges, 1.5s vulnerable animation, +50 HP per drink)
  - Placeholder art: rectangles + bald head circles + text labels (functional, ugly, intentional)
