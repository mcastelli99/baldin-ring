# Baldin' Ring - Art Guide

The game auto-loads character portraits from `assets/img/` if PNG files with the correct names are present. If they're missing, it falls back to procedural shapes. So you can add or upgrade art any time.

A dark "Harkonnen" tint filter is applied at runtime to whatever you drop in, so even raw photos look like they belong in the dim arena.

---

## Required filenames

Drop all of these in `assets/img/` (the folder already exists):

| Filename | Character | What works best |
|---|---|---|
| `evil_bald.png` | Evil Bald (boss) | Head + shoulders, looking forward or 3/4. Tall format (~3:4) |
| `ladder_man.png` | Ladder Man | Head + shoulders. Square or ~3:4 |
| `generic_white.png` | Generic White | Head + shoulders. Square or ~3:4 |
| `slug.png` | Slug | Head + shoulders. KEEP the Yankees cap + glasses |
| `pullout_merchant.png` | Pullout Merchant | Upper body, KEEP beanie + glasses |
| `dj_plan_b.png` | DJ Plan B | Head + shoulders. KEEP chains + aviator shades |
| `the_m.png` | The M | Head + shoulders |

**Dimensions:** anything from 400x400 to 1200x1500 works. Game scales automatically. Transparent background (PNG with alpha) looks best - if the source has a background, it'll show as a rectangle behind the character. To remove backgrounds quickly: [remove.bg](https://www.remove.bg) (free, drag and drop, takes 5 seconds per image).

---

## Path 1: Just use the raw photos (5 minutes)

The exact photos you uploaded to me in our chat are what you want. Steps:

1. Find those photos on your phone / computer (wherever you uploaded them from)
2. Crop each one down to the relevant person (head + shoulders ideally)
3. Optional but nice: run each through [remove.bg](https://www.remove.bg) for transparent background
4. Save them as PNG with the filenames above into `C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\`
5. Refresh the game in browser

The Harkonnen filter will tint them so they fit the dark arena vibe.

---

## Path 2: AI-stylized Souls portraits (15-30 minutes)

For the most baller version. Run each reference photo through your AI image gen tool (Nano Banana, Flux, Midjourney, ChatGPT, whatever you have) with the prompt for that character. The prompts are designed to preserve identifying features while restyling to dark fantasy.

Save outputs with the filenames above.

### Universal style suffix
Append this to every prompt for consistency:

> oil painting style, painterly brushstrokes, dark Harkonnen industrial atmosphere, dim red and amber lighting, dramatic shadow, oppressive mood, dark background, fantasy game character portrait, 3/4 view, cinematic lighting, NOT photorealistic

### Per-character prompts

**evil_bald.png**
> A menacing bald villain in dark Harkonnen-style armor with metal spikes on the shoulders and a heavy red robe, glowing red eyes, sneering expression. Reference the bald man from the photo - preserve facial features and proportions. He is the boss of the arena, intimidating and powerful. [universal style suffix]

**ladder_man.png**
> A tall lanky warrior in a green tactical camo jacket and black baseball cap with sunglasses, lean face, holding an aluminum ladder as a weapon. Reference the man from the photo wearing the camo jacket - preserve facial features. Mid-action goon brawler pose. [universal style suffix]

**generic_white.png**
> A generic souls-like knight protagonist - white guy with a short brown beard, in dark plate armor, holding a longsword and shield. Default RPG hero look, almost too plain. Reference the bearded man from the photo - preserve facial features. [universal style suffix]

**slug.png**
> A confident heavyset warrior wearing a NEW YORK YANKEES cap (navy with yellow brim, NY logo in white) and rectangular black-framed glasses, dark hoodie, goatee, smug expression, throwing gold UFC tickets like playing cards. Reference the man from the photo wearing the Yankees cap and glasses - preserve facial features, KEEP THE CAP and KEEP THE GLASSES. [universal style suffix]

**pullout_merchant.png**
> A hooded shopkeeper character sitting cross-legged, wearing a black beanie and round wire-rim glasses, full dark beard, dark jacket. Surrounded by mysterious wares and faint candlelight. Reference the bearded man in the beanie from the photo - preserve facial features, KEEP THE BEANIE and KEEP THE GLASSES. [universal style suffix]

**dj_plan_b.png**
> A confident DJ character at a turntable booth wearing big gold cuban chains and aviator sunglasses with a Lacoste-style hoodie, headphones around his neck, head tilted back smiling. Reference the man with gold chains and aviator shades from the photo - preserve facial features, KEEP THE CHAINS and KEEP THE SHADES. [universal style suffix]

**the_m.png**
> A melancholic character in a brown jacket and rectangular black-framed glasses, full dark beard, looking tired and resigned, slight downturn at the mouth. Reference the bearded man in the brown jacket and glasses from the photo - preserve facial features, KEEP THE GLASSES. [universal style suffix]

---

## How to know if it worked

When you launch the game (`index.html`), the title screen shows an "art mode" line at the bottom:
- `art mode: procedural fallback` - no PNGs loaded, using shapes
- `art mode: 4/7 portraits loaded` - partial; missing ones still use shapes
- `art mode: full portrait set loaded` - all 7 loaded, you're done

You can mix and match. Drop 1 PNG in, only Evil Bald gets the upgrade. Drop all 7 in, full picture.

---

## Troubleshooting

**"I dropped the files in but nothing changed"**
- Filenames must match exactly (lowercase, with underscores, .png extension)
- Hard refresh the browser with `Ctrl + Shift + R` to bust the cache
- Check the file is actually .png and not .jpg or .heic (rename if needed - though true conversion via Paint or an online tool is safer)

**"The image looks washed out / too red"**
- That's the Harkonnen filter doing its job. If you hate it, tell me and I'll add a toggle.

**"Background of the photo is showing as a square"**
- Run it through [remove.bg](https://www.remove.bg) to get a transparent background, re-save, drop back in
