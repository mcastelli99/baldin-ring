# Generate SNES-style pixel art sprites for Baldin' Ring v2 (Donkey Kong rewrite).
# Uses Nano Banana via the existing Kie.ai client.
# Strategy: image-to-image edits of the existing Souls portraits, prompting for
# 16-bit pixel art conversion. This preserves each character's identity while
# moving them into the new SNES aesthetic.
#
# Run: Set-ExecutionPolicy -Scope Process Bypass -Force; & ".\generate_sprites.ps1"

$ErrorActionPreference = 'Stop'

$kieScriptsDir = "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts"
. (Join-Path $kieScriptsDir "kie_client.ps1")
. (Join-Path $kieScriptsDir "upload_image.ps1")

$imgDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img"
$spriteDir = Join-Path $imgDir "sprites"
if (-not (Test-Path $spriteDir)) {
    New-Item -ItemType Directory -Path $spriteDir -Force | Out-Null
}

# Style suffix for all character sprite prompts (image-to-image conversion)
$pixelStyle = @"
Convert into a 16-bit pixel art sprite, SNES Donkey Kong Country / Super Mario World aesthetic.
Full body standing front-facing pose, centered subject, limited color palette,
bold dark pixel outlines, chunky readable pixels, transparent background (alpha channel).
Preserve all identifying features from the reference (face shape, hair, beard, glasses,
clothing colors, accessories like caps or chains) but stylize as classic 16-bit game sprite.
NO text, NO words, NO captions in the image.
"@

# Helper: upload local image to Kie storage and return its public URL
function Get-LocalImageUrl {
    param([string]$LocalPath)
    return Send-ImageToKie -FilePath $LocalPath -UploadPath "baldin-ring/refs"
}

# Helper: submit Nano Banana edit (image-to-image) with retry
function Submit-NanoBananaEdit {
    param([string]$Prompt, [string[]]$ImageUrls)
    $inputData = @{
        prompt = $Prompt
        image_urls = $ImageUrls
        image_size = "1:1"
        output_format = "png"
    }
    $attempt = 0
    while ($true) {
        try {
            return New-KieGenerationTask -Model "google/nano-banana-edit" -InputData $inputData
        } catch {
            $attempt++
            if ($attempt -ge 3) { throw }
            Start-Sleep ([math]::Pow(2, $attempt) * 5)
        }
    }
}

# Helper: submit Nano Banana text-to-image (for assets that don't have refs)
function Submit-NanoBananaText {
    param([string]$Prompt)
    $inputData = @{
        prompt = $Prompt
        image_size = "1:1"
        output_format = "png"
    }
    $attempt = 0
    while ($true) {
        try {
            return New-KieGenerationTask -Model "google/nano-banana" -InputData $inputData
        } catch {
            $attempt++
            if ($attempt -ge 3) { throw }
            Start-Sleep ([math]::Pow(2, $attempt) * 5)
        }
    }
}

# =====================================================================
# Phase 1: upload existing portraits to Kie storage (parallel-ish)
# =====================================================================
Write-Host ""
Write-Host "=== Uploading 7 reference portraits ===" -ForegroundColor Magenta

$portraitNames = @('evil_bald','ladder_man','generic_white','slug','pullout_merchant','dj_plan_b','the_m')
$refUrls = @{}
foreach ($name in $portraitNames) {
    $path = Join-Path $imgDir "$name.png"
    if (-not (Test-Path $path)) {
        Write-Host "[WARN] $path missing, skipping" -ForegroundColor Yellow
        continue
    }
    try {
        $url = Get-LocalImageUrl -LocalPath $path
        $refUrls[$name] = $url
    } catch {
        Write-Host "[ERROR] Upload of $name failed: $_" -ForegroundColor Red
    }
}

# =====================================================================
# Phase 2: submit character sprite generations (image-to-image with refs)
# =====================================================================
Write-Host ""
Write-Host "=== Submitting character sprite generations ===" -ForegroundColor Magenta

$spriteTasks = @()

$characterSprites = @(
    @{ Name='evil_bald_sprite'; Ref='evil_bald'; ExtraPrompt='Boss enemy sprite, taller than other characters, menacing pose with both arms raised throwing posture.' },
    @{ Name='ladder_man_sprite'; Ref='ladder_man'; ExtraPrompt='Tall lanky hero sprite, holding a small aluminum ladder.' },
    @{ Name='generic_white_sprite'; Ref='generic_white'; ExtraPrompt='Knight hero sprite, holding sword and shield.' },
    @{ Name='slug_sprite'; Ref='slug'; ExtraPrompt='Heavyset hero sprite, holding gold tickets in one hand. Keep the New York Yankees cap (navy with yellow brim and NY logo) and the black-framed glasses very clearly visible.' },
    @{ Name='pullout_merchant_sprite'; Ref='pullout_merchant'; ExtraPrompt='Shopkeeper NPC sprite, sitting with wares in front. Keep beanie and round glasses.' },
    @{ Name='dj_plan_b_sprite'; Ref='dj_plan_b'; ExtraPrompt='DJ NPC sprite at a small turntable booth. Keep gold chains and aviator sunglasses very clearly visible.' },
    @{ Name='the_m_sprite'; Ref='the_m'; ExtraPrompt='Sad NPC sprite, slumped posture, melancholic frowning expression. Keep glasses and brown jacket.' }
)

foreach ($s in $characterSprites) {
    if (-not $refUrls.ContainsKey($s.Ref)) {
        Write-Host "[SKIP] $($s.Name) - no ref URL" -ForegroundColor Yellow
        continue
    }
    Write-Host ""
    Write-Host "[SUBMIT] $($s.Name)" -ForegroundColor Yellow
    $prompt = "$($s.ExtraPrompt) $pixelStyle"
    try {
        $taskId = Submit-NanoBananaEdit -Prompt $prompt -ImageUrls @($refUrls[$s.Ref])
        $spriteTasks += [PSCustomObject]@{
            Name = $s.Name
            TaskId = $taskId
            OutputPath = Join-Path $spriteDir "$($s.Name).png"
            Status = 'pending'
        }
    } catch {
        Write-Host "[ERROR] Submit failed: $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

# =====================================================================
# Phase 3: submit environment/projectile/background asset generations (text-to-image)
# =====================================================================
Write-Host ""
Write-Host "=== Submitting environment + projectile generations ===" -ForegroundColor Magenta

$textAssets = @(
    @{ Name='spam_mets'; Prompt='16-bit pixel art sprite of a glowing orange-and-blue baseball tweet card, like a New York Mets social media post, square frame with NY blue and orange colors, SNES Donkey Kong Country aesthetic, chunky pixels, bold outlines, transparent background, centered, NO text inside the card just the orange and blue color blocks.' },
    @{ Name='spam_halo'; Prompt='16-bit pixel art sprite of a glowing green energy sword from the Halo video game, classic plasma sword shape with cyan-green blade and dark handle, SNES Donkey Kong Country aesthetic, chunky pixels, bold outlines, transparent background, centered.' },
    @{ Name='spam_food'; Prompt='16-bit pixel art sprite of a plate of food, looks like a steak or burger meal viewed from above, brown and red food colors, white plate, SNES Donkey Kong Country aesthetic, chunky pixels, bold outlines, transparent background, centered.' },
    @{ Name='spam_rip'; Prompt='16-bit pixel art sprite of a grey tombstone with the letters R.I.P. carved on it, classic cartoony grave marker, SNES Donkey Kong Country aesthetic, chunky pixels, bold outlines, transparent background, centered.' },
    @{ Name='spam_flex'; Prompt='16-bit pixel art sprite of a heavy black dumbbell weight, two metal plates on a bar, SNES Donkey Kong Country aesthetic, chunky pixels, bold outlines, transparent background, centered.' },
    @{ Name='platform_tile'; Prompt='16-bit pixel art tileable horizontal platform tile, dark grey brutalist concrete with red edge highlights and metal rivets, Donkey Kong arcade style girder beam, SNES quality, chunky pixels, bold outlines, square format, edges that tile seamlessly horizontally.' },
    @{ Name='ladder_tile'; Prompt='16-bit pixel art vertical ladder tile, golden metal ladder with side rails and horizontal rungs, classic Donkey Kong arcade ladder, SNES aesthetic, chunky pixels, bold outlines, transparent background between the rungs, tileable vertically.' },
    @{ Name='background_arena'; Prompt='16-bit pixel art background scene of a dark brutalist Harkonnen industrial arena interior, looming dark stone walls with red glowing braziers, oppressive moody atmosphere, deep shadow with red and amber accents, distant silhouettes of bald spectator heads in the crowd, no foreground action just the backdrop, SNES Donkey Kong Country aesthetic, painterly pixel art background, wide landscape format.' }
)

$textTasks = @()
foreach ($a in $textAssets) {
    Write-Host ""
    Write-Host "[SUBMIT] $($a.Name)" -ForegroundColor Yellow
    try {
        $taskId = Submit-NanoBananaText -Prompt $a.Prompt
        $textTasks += [PSCustomObject]@{
            Name = $a.Name
            TaskId = $taskId
            OutputPath = Join-Path $spriteDir "$($a.Name).png"
            Status = 'pending'
        }
    } catch {
        Write-Host "[ERROR] Submit failed: $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

# =====================================================================
# Phase 4: poll + download all
# =====================================================================
$allTasks = $spriteTasks + $textTasks
Write-Host ""
Write-Host "=== Waiting on $($allTasks.Count) results ===" -ForegroundColor Magenta

foreach ($task in $allTasks) {
    Write-Host ""
    Write-Host "[WAIT] $($task.Name)" -ForegroundColor Cyan
    try {
        $data = Wait-KieTask -TaskId $task.TaskId -TimeoutSeconds 300 -PollIntervalSeconds 4
        $imageUrl = Get-FirstImageUrlFromResult -TaskData $data
        Save-KieImage -ImageUrl $imageUrl -OutputPath $task.OutputPath
        $task.Status = 'done'
    } catch {
        Write-Host "[ERROR] $($task.Name) failed: $_" -ForegroundColor Red
        $task.Status = 'failed'
    }
}

# Summary
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Magenta
$allTasks | ForEach-Object {
    $color = if ($_.Status -eq 'done') { 'Green' } else { 'Red' }
    Write-Host "$($_.Status.ToUpper()): $($_.Name)" -ForegroundColor $color
}
$successCount = ($allTasks | Where-Object { $_.Status -eq 'done' }).Count
Write-Host ""
Write-Host "$successCount / $($allTasks.Count) assets generated" -ForegroundColor $(if ($successCount -eq $allTasks.Count) { 'Green' } else { 'Yellow' })
