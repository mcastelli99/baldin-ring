# Generate the side-scroller enemy sprites: halo grunt + mets fan.
# Tombstones and billboards are procedural so we only need these two.

$ErrorActionPreference = 'Stop'
$kieScriptsDir = "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts"
. (Join-Path $kieScriptsDir "kie_client.ps1")

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"

$pixelStyle = @"
SNES Donkey Kong Country style pixel art sprite, chunky bold pixels with strong dark outlines,
limited color palette, painterly pixel rendering, full body standing pose,
centered subject on transparent background, NO text in image, NO captions.
"@

$enemies = @(
    @{
        Name = "halo_grunt_enemy"
        Prompt = "A small angry alien minion warrior, blue-skinned with a hunched posture and large breathing apparatus on its back, wielding a glowing cyan-green plasma sword in one hand, aggressive snarling expression, ready to attack. $pixelStyle"
    },
    @{
        Name = "mets_fan_enemy"
        Prompt = "A pudgy unshaven baseball superfan in a NEW YORK METS jersey (white with orange and blue accents), backwards Mets cap, holding a baseball mid-throw with arm cocked back, angry shouting expression, beer belly, sneakers, mid-pitch aggressive stance. $pixelStyle"
    }
)

foreach ($e in $enemies) {
    Write-Host "[SUBMIT] $($e.Name)" -ForegroundColor Yellow
    $inputData = @{ prompt = $e.Prompt; image_size = "1:1"; output_format = "png" }
    $taskId = New-KieGenerationTask -Model "google/nano-banana" -InputData $inputData
    $data = Wait-KieTask -TaskId $taskId -TimeoutSeconds 180 -PollIntervalSeconds 3
    $imageUrl = Get-FirstImageUrlFromResult -TaskData $data
    $outputPath = Join-Path $spriteDir "$($e.Name).png"
    Save-KieImage -ImageUrl $imageUrl -OutputPath $outputPath
}

# Run rembg on both
Write-Host ""
Write-Host "Running rembg..." -ForegroundColor Cyan
python -c @"
from rembg import remove
import os
for name in ['halo_grunt_enemy', 'mets_fan_enemy']:
    p = r'$spriteDir' + '\\' + name + '.png'
    if os.path.exists(p):
        with open(p, 'rb') as f: inp = f.read()
        out = remove(inp)
        with open(p, 'wb') as f: f.write(out)
        print(f'rembg {name} done')
"@

Write-Host "[OK] Enemy sprites ready" -ForegroundColor Green
