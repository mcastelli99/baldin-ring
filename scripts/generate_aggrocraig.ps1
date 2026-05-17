$ErrorActionPreference = 'Stop'
. "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts\kie_client.ps1"

$spriteDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img\sprites"

$prompt = @"
A scrawny middle-aged balding white man in his 40s with a fat round face with chubby cheeks
and a noticeable double chin, full dark brown beard, but with VERY SKINNY STICK ARMS
(thin twig-like noodle arms with no muscle definition at all, not toned, not athletic, scrawny),
narrow shoulders, slight pot belly, almost goofy mismatched proportions of fat face vs thin arms,
wearing a baggy green and white NEW YORK JETS football jersey that hangs loosely on his thin frame,
holding up a large green NEW YORK JETS team flag with a white JETS logo wielding it like a weapon
(his stick arms struggle to hold it up), sickly greenish-yellow noxious breath cloud puffing
out of his open snarling mouth, scowling red-faced angry-but-unintimidating expression,
hunched aggressive stance. The vibe is "loud and angry but clearly doesn't lift weights."
SNES Donkey Kong Country style pixel art sprite, chunky bold pixels with strong dark outlines,
limited color palette, painterly pixel rendering, full body standing pose,
centered subject on transparent background, NO text in image, NO captions.
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
