# Baldin' Ring

## What This Is
A browser-playable parody boss fight in the style of Mike Tyson's Punch-Out! crossed with Elden Ring. Made as an inside joke for the user's group chat. One screen, one boss, one weapon select, one healing flask, three playable characters.

The premise: "Evil Bald" is a chat-spamming villain who bombards the player with physical embodiments of the links and pics he posts (Mets tweets, Halo screenshots, food selfies, RIP posts, gym flexes). Player picks one of three characters (Ladder Man, Generic White, Slug) to take him on solo.

## Quality Bar
Personal joke game for a private group chat. Charm over polish. Playable + funny beats clean + generic. Friends-only audience, no public ship.

## Files
| File | What It Is | When to Read It |
|---|---|---|
| `index.html` | Game entry point, loads canvas + scripts | When changing page structure |
| `game.js` | Core game logic (state, render loop, input, combat) | When adding/changing gameplay |
| `style.css` | Page styling + HUD layout | When adjusting visual UI |
| `design.md` | Character + attack pattern reference (TBD) | When building art or new mechanics |
| `assets/ref/` | Reference photos of friends | When designing or regenerating character art |
| `assets/img/` | Final game art (sprites, backgrounds, projectiles) | When loading visuals in code |
| `assets/audio/` | Music + SFX | When wiring sound |

## Key Concepts
- **Punch-Out! frame:** stationary 1v1 boss fight, fixed camera, you dodge left / right / duck + block + counter in attack windows
- **Souls layer:** weapon select, healing flask (limited charges), stamina bar, phase change at low HP
- **The Late mechanic:** Evil Bald is historically late to the chat, so his attacks have long wind-ups, occasional fake-outs ("sorry guys was eating"), and a rare "catch-up combo" where he disappears then unleashes a fast multi-hit. Phase 2 = "BACK ONLINE" speedup at low HP.
- **Spam-as-attack:** projectiles must visually READ as actual posts (tweet card, screenshot frame, food pic plate, RIP card, gym selfie), not generic energy balls
- **Real friend faces:** characters use stylized cutouts of real reference photos. Half the joke.

## Cast
- **Evil Bald** - boss. Bald, brutalist Harkonnen-style robe/armor. Spams pics/links as projectiles. Late.
- **Ladder Man** - playable. Tall, lanky white guy, goon brawler. Wields a literal ladder. "?" projectile specials. Reach + slow recovery. Reference: blue camo Helly Hansen jacket + cap + sunglasses photo, eating Japanese street food.
- **Generic White** - playable. Default souls archetype, sword + shield. The joke is how plain he is. Reference: stone wall photo, left guy in black shirt.
- **Slug** - playable. NY Yankees cap + prescription glasses + black hoodie (preserve hat + glasses in art). Currency-based summons: UFC tickets like Gambit cards, expensive meat waiter adds, cash stacks.
- **Pullout Merchant** - NPC shop. Pre-fight gear / upgrades. Beanie + glasses.
- **DJ Plan B** - NPC ambiance. Lower-corner DJ booth, head-bobbing to boss music. Gold chains + shades.
- **The M** - NPC interrupt. Slides into screen mid-fight Toasty-style with depressing one-liners ("Why does this keep happening?", "Today... is the worst day of my life.").

## Setting
Dune / Harkonnen brutalist stadium. Dark monolithic architecture, oppressive red lighting, a sea of bald spectators in the crowd. Boss center, first-person player view, DJ booth lower-left, Pullout Merchant accessible pre-fight only.

## Tech Stack
- HTML5 + Canvas + plain JavaScript (no framework)
- Runs in any modern browser, no install
- Hosting TBD (local file share or static hosting via Vercel/Netlify)

## Naming
- Game title: **Baldin' Ring** (apostrophe intentional)
- Boss name: **Evil Bald**
