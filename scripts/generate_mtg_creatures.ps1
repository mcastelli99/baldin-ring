$ErrorActionPreference = 'Stop'
. "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts\kie_client.ps1"

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"

$style = @"
Magic The Gathering style card art portrait, fantasy creature illustration painterly oil painting style,
high contrast dramatic lighting, full body or head/shoulders shot of the creature centered,
solid dark moody background, NO frame, NO text, NO card border - just the creature art panel.
"@

$creatures = @(
    @{
        Name = "mtg_lightning_bolt"
        Prompt = "A glowing red fire elemental humanoid wreathed in crackling lightning and flames, lightning bolts arcing from its body, intimidating menacing pose, fiery glowing eyes. $style"
    },
    @{
        Name = "mtg_counterspell"
        Prompt = "A robed blue wizard mage casting a spell, hands raised with blue magical runes and arcane energy swirling between fingers, hooded face partially shadowed, mystical glowing blue magic effects, fantasy MtG style. $style"
    },
    @{
        Name = "mtg_sol_ring"
        Prompt = "An ancient ornate gold magical ring artifact floating in the air, intricate runes etched on the band, glowing golden mystical aura emanating from it, treasure-like with embedded gem, fantasy magical artifact illustration. $style"
    },
    @{
        Name = "mtg_black_lotus"
        Prompt = "A single perfect dark black lotus flower in bloom, large detailed petals with dark purple-black coloring, golden center with mystical energy, sinister magical aura, fantasy illustration. $style"
    },
    @{
        Name = "mtg_giant_spider"
        Prompt = "A massive intimidating black-and-purple giant spider with eight long jointed legs, multiple gleaming red eyes, dripping fangs, menacing battle-ready stance, fantasy creature illustration. $style"
    },
    @{
        Name = "mtg_shivan_dragon"
        Prompt = "A classic ferocious red Shivan dragon breathing fire, large outstretched red and orange leathery wings, sharp horns and spikes along the spine, menacing roaring open mouth with sharp teeth, mythical fantasy creature in flight pose. $style"
    }
)

foreach ($c in $creatures) {
    Write-Host "[SUBMIT] $($c.Name)" -ForegroundColor Yellow
    $taskId = New-KieGenerationTask -Model "google/nano-banana" -InputData @{ prompt = $c.Prompt; image_size = "1:1"; output_format = "png" }
    $data = Wait-KieTask -TaskId $taskId -TimeoutSeconds 180 -PollIntervalSeconds 3
    $url = Get-FirstImageUrlFromResult -TaskData $data
    Save-KieImage -ImageUrl $url -OutputPath (Join-Path $spriteDir "$($c.Name).png")
}

# rembg to clean backgrounds
Write-Host "Running rembg..." -ForegroundColor Cyan
python -c @"
from rembg import remove
import os
names = ['mtg_lightning_bolt', 'mtg_counterspell', 'mtg_sol_ring', 'mtg_black_lotus', 'mtg_giant_spider', 'mtg_shivan_dragon']
for name in names:
    p = r'$spriteDir' + '\\' + name + '.png'
    if os.path.exists(p):
        with open(p, 'rb') as f: inp = f.read()
        out = remove(inp)
        with open(p, 'wb') as f: f.write(out)
        print(f'rembg {name} done')
"@
Write-Host "[OK]" -ForegroundColor Green
