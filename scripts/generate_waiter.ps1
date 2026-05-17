# Generate the pompous waiter sprite for Slug's special attack.
# Outputs to baldin-ring/assets/img/sprites/waiter_sprite.png

$ErrorActionPreference = 'Stop'
$kieScriptsDir = "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts"
. (Join-Path $kieScriptsDir "kie_client.ps1")

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"
$outputPath = Join-Path $spriteDir "waiter_sprite.png"

$prompt = @"
16-bit pixel art sprite of an extremely pompous formal restaurant waiter in his 40s,
wearing a sharp black tuxedo jacket with crisp white dress shirt and black bow tie,
white cloth napkin draped over the left forearm, holding a polished silver dome cloche platter
held up high on one gloved hand like he is about to serve fine dining,
stuck-up snobby raised-eyebrow expression with a thin mustache,
upright proud posture, head tilted back slightly looking down his nose, formal proper.
SNES Donkey Kong Country style pixel art, chunky bold pixels with strong outlines,
limited color palette, painterly pixel rendering, full body standing pose,
centered subject on transparent background, NO text, NO captions.
"@

$inputData = @{ prompt = $prompt; image_size = "1:1"; output_format = "png" }
$taskId = New-KieGenerationTask -Model "google/nano-banana" -InputData $inputData
$data = Wait-KieTask -TaskId $taskId -TimeoutSeconds 180 -PollIntervalSeconds 3
$imageUrl = Get-FirstImageUrlFromResult -TaskData $data
Save-KieImage -ImageUrl $imageUrl -OutputPath $outputPath

Write-Host ""
Write-Host "[OK] Waiter sprite saved: $outputPath" -ForegroundColor Green
Write-Host "Running rembg to clean background..." -ForegroundColor Cyan

# Run rembg on the new sprite
python -c @"
from rembg import remove
import sys
src = r'$outputPath'
with open(src, 'rb') as f: inp = f.read()
out = remove(inp)
with open(src, 'wb') as f: f.write(out)
print('rembg done')
"@

Write-Host "[OK] Waiter ready" -ForegroundColor Green
