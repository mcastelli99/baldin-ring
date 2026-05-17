$ErrorActionPreference = 'Stop'
. "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts\kie_client.ps1"

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"

$prompt = @"
An aggressive middle-aged balding white man in his 40s with a full dark brown beard,
wearing a green and white NEW YORK JETS football jersey, holding up a large green NEW YORK JETS
team flag with a white J-E-T-S logo as if mid-swing wielding it like a weapon, sickly
greenish-yellow noxious breath cloud puffing out of his open snarling mouth,
scowling angry red-faced expression, slightly hunched aggressive ready-to-attack stance,
bigger build heavyset. SNES Donkey Kong Country style pixel art sprite,
chunky bold pixels with strong dark outlines, limited color palette,
painterly pixel rendering, full body standing pose, centered subject on transparent background,
NO text in image, NO captions.
"@

$taskId = New-KieGenerationTask -Model "google/nano-banana" -InputData @{ prompt = $prompt; image_size = "1:1"; output_format = "png" }
$data = Wait-KieTask -TaskId $taskId -TimeoutSeconds 180 -PollIntervalSeconds 3
$url = Get-FirstImageUrlFromResult -TaskData $data
$out = Join-Path $spriteDir "aggrocraig_enemy.png"
Save-KieImage -ImageUrl $url -OutputPath $out

python -c @"
from rembg import remove
p = r'$out'
with open(p, 'rb') as f: inp = f.read()
out = remove(inp)
with open(p, 'wb') as f: f.write(out)
print('aggrocraig rembg done')
"@
Write-Host "[OK] AggroCraig ready" -ForegroundColor Green
