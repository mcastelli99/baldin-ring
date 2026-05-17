# Generate the Baldin' Ring boss theme via ElevenLabs Music API.
# Dom Dolla style tech house track for DJ Plan B to "play" during the fight.
# Outputs to baldin-ring/assets/audio/boss_theme.mp3
#
# Run: Set-ExecutionPolicy -Scope Process Bypass -Force; & ".\generate_music.ps1"

$ErrorActionPreference = 'Stop'

$audioDir = "C:\Users\caste\OneDrive\Claude\Personal\TheChat\baldin-ring\assets\audio"
$outputPath = Join-Path $audioDir "boss_theme.mp3"
if (-not (Test-Path $audioDir)) {
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
}

# ElevenLabs key lives at parent of ai-animated-ads (per their porting protocol)
$keyPath = "C:\Users\caste\OneDrive\Claude\_secrets\elevenlabs_key.txt"
if (-not (Test-Path $keyPath)) {
    Write-Host "[ERROR] ElevenLabs API key not found at $keyPath" -ForegroundColor Red
    Write-Host "Create the file with your key (no quotes, single line)." -ForegroundColor Yellow
    exit 1
}
$apiKey = (Get-Content $keyPath -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw "ElevenLabs key file is empty"
}

# Multi-section emotional-arc prompt - per pipeline_tooling.md feedback_elevenlabs_music_multimove_prompts
$prompt = @"
Hard-hitting tech house boss battle theme at 125 BPM with a driving four-on-the-floor kick drum,
deep groovy rolling bassline, hypnotic looping hook, modern peak-time club energy,
dark warehouse atmosphere with chunky percussive stabs and crisp hi-hats.

SECTION 1 (0-20s): atmospheric intro with filtered low-end bass, building tension,
sparse rhythmic percussion, short chopped vocal one-shots, escalating pressure
that signals something big is about to drop.

SECTION 2 (20-70s): full drop, pounding kick drum, deep driving bassline,
syncopated percussive stabs, rhythmic synth hook, peak-time energy,
aggressive and confident relentless groove for an epic boss confrontation.

SECTION 3 (70-110s): harder breakdown with distorted bass, dark filter sweeps,
maximum intensity, fast pumping rhythm, the moment everything goes wrong for the player,
phase two energy, even more aggressive.

SECTION 4 (110-120s): brief tension release, final hit and loop point so the track
can repeat seamlessly.

Strictly instrumental house music. No lyrics. Brief vocal chops only.
"@

$musicLengthMs = 120000  # 2 minutes

$body = @{
    prompt          = $prompt
    music_length_ms = [int]$musicLengthMs
} | ConvertTo-Json -Depth 3

$bodyPath = Join-Path $audioDir "_body.json"
Set-Content -Path $bodyPath -Value $body -Encoding UTF8

$curlPath = "$env:SystemRoot\System32\curl.exe"
if (-not (Test-Path $curlPath)) { $curlPath = "curl.exe" }
$dataArg = "@" + $bodyPath

$rawOut = Join-Path $audioDir "_response.bin"
Write-Host ""
Write-Host "[POST] ElevenLabs /v1/music  length=${musicLengthMs}ms..." -ForegroundColor Cyan
Write-Host "Prompt: Dom Dolla / Fisher tech house, 125 BPM, 4 sections, ~2 min" -ForegroundColor DarkCyan
$t0 = Get-Date

& $curlPath -s --max-time 300 -X POST `
    "https://api.elevenlabs.io/v1/music" `
    -H "xi-api-key: $apiKey" `
    -H "Content-Type: application/json" `
    --data-binary $dataArg `
    -o $rawOut

if (-not (Test-Path $rawOut)) {
    throw "No response file - curl may have failed"
}
$size = (Get-Item $rawOut).Length
if ($size -lt 5000) {
    Write-Host "[ERROR] Response too small (${size} bytes). Likely an API error response:" -ForegroundColor Red
    Get-Content $rawOut -Raw | Write-Host
    throw "Music generation failed"
}

Move-Item -Path $rawOut -Destination $outputPath -Force
Remove-Item $bodyPath -Force -ErrorAction SilentlyContinue

$elapsed = ((Get-Date) - $t0).TotalSeconds
$sizeKB = [math]::Round($size / 1024, 1)
Write-Host ""
Write-Host "[OK] Boss theme saved: $outputPath" -ForegroundColor Green
Write-Host "     Size: ${sizeKB} KB, Generated in $([math]::Round($elapsed,1))s" -ForegroundColor Green
Write-Host ""
Write-Host "Hard refresh the game in browser. DJ Plan B will play this track during the fight." -ForegroundColor Yellow
