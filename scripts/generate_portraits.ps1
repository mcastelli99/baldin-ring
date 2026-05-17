# Generate 7 stylized Souls-portrait character images for Baldin' Ring.
# Uses Nano Banana (text-to-image) via the existing Kie.ai client from ai-animated-ads/.
# Outputs land in baldin-ring/assets/img/ where the game auto-loads them.
#
# Run pattern (per ai-animated-ads protocol):
#   Set-ExecutionPolicy -Scope Process Bypass -Force; & ".\generate_portraits.ps1"

$ErrorActionPreference = 'Stop'

# Dot-source the reusable Kie client + upload helpers from ai-animated-ads
$kieScriptsDir = "C:\Users\caste\OneDrive\Claude\ai-animated-ads\scripts"
. (Join-Path $kieScriptsDir "kie_client.ps1")
. (Join-Path $kieScriptsDir "upload_image.ps1")

$outputDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\img"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Universal style suffix applied to every prompt
$styleSuffix = @"
dark fantasy souls-like character portrait, painterly oil-painting style with visible brushstrokes,
Harkonnen industrial brutalist atmosphere, dim amber and red lighting, dramatic chiaroscuro shadow,
3/4 angle bust shot, dark stone background with subtle red glow,
cinematic moody lighting, baked-in shadow, NOT photorealistic.
NO text in scene, NO captions, NO subtitles, NO floating words, NO overlay labels.
"@

# Per-character prompts. Each describes the visual identity in detail so the portrait
# is recognizable as that character even without an image reference.
$characters = @(
    @{
        Name = "evil_bald"
        Label = "Evil Bald (boss)"
        Prompt = @"
A menacing bald white male villain in his 30s-40s, intimidating sneer with glowing red eyes,
dark heavy Harkonnen-style ceremonial robe with tarnished bronze chestplate,
sharp metal spike pauldrons on both shoulders, oppressive industrial fantasy atmosphere,
dim red lighting from below, looming threatening posture, the BOSS of the arena.
$styleSuffix
"@
    },
    @{
        Name = "ladder_man"
        Label = "Ladder Man"
        Prompt = @"
A tall lanky white male warrior in his 30s, lean angular face with light stubble,
wearing a black baseball cap pulled low and rectangular black sunglasses,
dressed in a green camo puffer tactical jacket over a dark shirt,
holding an aluminum extension ladder casually slung over one shoulder as his weapon,
slightly confused goofy goon-fighter posture with a tilted head.
$styleSuffix
"@
    },
    @{
        Name = "generic_white"
        Label = "Generic White"
        Prompt = @"
A standard generic white male souls-like knight protagonist in his 30s,
short brown hair, full thick brown beard, average build, neutral plain expression,
wearing dark plate armor over chainmail, holding a longsword in one hand and
a round wooden shield with iron rim in the other,
the most generic possible default RPG hero appearance.
$styleSuffix
"@
    },
    @{
        Name = "slug"
        Label = "Slug"
        Prompt = @"
A confident heavyset white male warrior in his 30s,
wearing a NEW YORK YANKEES baseball cap (navy blue crown with bright yellow brim and
a white interlocking NY logo on the front - this exact cap design is essential),
thick rectangular black-framed prescription glasses, a dark goatee,
dressed in a black hoodie, smug self-assured smirk,
holding a fan of gleaming gold UFC fight tickets in one hand spread like playing cards.
$styleSuffix
"@
    },
    @{
        Name = "pullout_merchant"
        Label = "Pullout Merchant"
        Prompt = @"
A Black male shopkeeper character in his 30s-40s, full dark beard,
wearing a black knit beanie pulled down low and round wire-rim glasses,
dressed in a dark grey hooded jacket, sitting cross-legged with various small mysterious
wares laid out before him, tired but warm wise expression,
souls-like merchant NPC, dim warm candlelight from below.
$styleSuffix
"@
    },
    @{
        Name = "dj_plan_b"
        Label = "DJ Plan B"
        Prompt = @"
A confident heavyset Filipino-American male character in his 30s-40s,
wearing thick gold cuban link chains layered around his neck,
gold-framed aviator sunglasses with brown tinted lenses,
a dark zip-up hoodie, large studio headphones around his neck,
slight knowing smile, leaning slightly forward, DJ at his decks.
$styleSuffix
"@
    },
    @{
        Name = "the_m"
        Label = "The M"
        Prompt = @"
A melancholic white male character in his 30s, full dark beard,
wearing rectangular black-framed prescription glasses,
dressed in a brown jacket over a green checkered flannel shirt,
sad downturned mouth, deeply resigned tired expression, looking sideways with hollow eyes,
the saddest NPC in the realm.
$styleSuffix
"@
    }
)

# Helper: submit Nano Banana text-to-image with retry
function Submit-Portrait {
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

# Phase 1: submit all 7 in parallel (Kie is async - fire all then wait)
Write-Host ""
Write-Host "=== Submitting 7 portrait generations ===" -ForegroundColor Magenta
$tasks = @()
foreach ($char in $characters) {
    Write-Host ""
    Write-Host "[SUBMIT] $($char.Label)" -ForegroundColor Yellow
    try {
        $taskId = Submit-Portrait -Prompt $char.Prompt
        $tasks += [PSCustomObject]@{
            Name = $char.Name
            Label = $char.Label
            TaskId = $taskId
            OutputPath = Join-Path $outputDir "$($char.Name).png"
            Status = 'pending'
        }
    } catch {
        Write-Host "[ERROR] Failed to submit $($char.Label): $_" -ForegroundColor Red
        $tasks += [PSCustomObject]@{
            Name = $char.Name
            Label = $char.Label
            TaskId = $null
            OutputPath = Join-Path $outputDir "$($char.Name).png"
            Status = 'submit_failed'
        }
    }
    Start-Sleep -Seconds 1  # gentle throttle
}

# Phase 2: poll each in turn, download as ready
Write-Host ""
Write-Host "=== Waiting on results and downloading ===" -ForegroundColor Magenta
foreach ($task in $tasks) {
    if ($task.Status -eq 'submit_failed') {
        Write-Host "[SKIP] $($task.Label) - submit failed earlier" -ForegroundColor Red
        continue
    }
    Write-Host ""
    Write-Host "[WAIT] $($task.Label) (taskId=$($task.TaskId))" -ForegroundColor Cyan
    try {
        $data = Wait-KieTask -TaskId $task.TaskId -TimeoutSeconds 300 -PollIntervalSeconds 4
        $imageUrl = Get-FirstImageUrlFromResult -TaskData $data
        Save-KieImage -ImageUrl $imageUrl -OutputPath $task.OutputPath
        $task.Status = 'done'
        Write-Host "[OK] $($task.Label) -> $($task.OutputPath)" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] $($task.Label) failed: $_" -ForegroundColor Red
        $task.Status = 'failed'
    }
}

# Summary
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Magenta
$tasks | ForEach-Object {
    $color = if ($_.Status -eq 'done') { 'Green' } else { 'Red' }
    Write-Host "$($_.Status.ToUpper()): $($_.Label)" -ForegroundColor $color
}
$successCount = ($tasks | Where-Object { $_.Status -eq 'done' }).Count
Write-Host ""
Write-Host "$successCount / $($tasks.Count) portraits generated successfully" -ForegroundColor $(if ($successCount -eq $tasks.Count) { 'Green' } else { 'Yellow' })
