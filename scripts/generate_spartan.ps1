$ErrorActionPreference = 'Stop'
. "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts\kie_client.ps1"

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"

$enemies = @(
    @{
        Name = "spartan_enemy"
        Prompt = "A SPARTAN supersoldier from the Halo universe, full body shot, wearing iconic dark forest green Mjolnir power armor with sharp angular plating, helmet with a polarized golden-orange reflective visor, holding a battle rifle in a tactical two-handed grip, large muscular intimidating military build, slightly hunched aggressive ready stance. SNES Donkey Kong Country style pixel art sprite, chunky bold pixels with strong dark outlines, limited color palette, painterly pixel rendering, full body standing pose, centered subject on transparent background, NO text in image, NO captions."
    },
    @{
        Name = "brute_enemy"
        Prompt = "A massive aggressive ape-like Brute alien warrior, full body shot, brown-grey fur with thick segmented purple-grey armor plates on shoulders and chest, fanged snarling mouth, small angry red eyes, wielding a huge spiked gravity hammer raised overhead ready to slam, hunched gorilla-like posture, very intimidating. SNES Donkey Kong Country style pixel art sprite, chunky bold pixels with strong dark outlines, limited color palette, painterly pixel rendering, full body standing pose, centered subject on transparent background, NO text in image, NO captions."
    }
)

foreach ($e in $enemies) {
    Write-Host "[SUBMIT] $($e.Name)" -ForegroundColor Yellow
    $taskId = New-KieGenerationTask -Model "google/nano-banana" -InputData @{ prompt = $e.Prompt; image_size = "1:1"; output_format = "png" }
    $data = Wait-KieTask -TaskId $taskId -TimeoutSeconds 180 -PollIntervalSeconds 3
    $url = Get-FirstImageUrlFromResult -TaskData $data
    Save-KieImage -ImageUrl $url -OutputPath (Join-Path $spriteDir "$($e.Name).png")
}

Write-Host "Running rembg..." -ForegroundColor Cyan
python -c @"
from rembg import remove
import os
for name in ['spartan_enemy', 'brute_enemy']:
    p = r'$spriteDir' + '\\' + name + '.png'
    if os.path.exists(p):
        with open(p, 'rb') as f: inp = f.read()
        out = remove(inp)
        with open(p, 'wb') as f: f.write(out)
        print(f'rembg {name} done')
"@
Write-Host "[OK]" -ForegroundColor Green
