param(
    [Parameter(Mandatory=$false)]
    [string]$InputPbf = "",

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

$RootPath = (Resolve-Path ".\").Path

$OutputDir = Join-Path $RootPath "apps\web\public\generated"

if ($InputPbf -eq "") {
    $InputPbf = Join-Path $RootPath "data\osm\hamburg-latest.osm.pbf"
}

if ($OutputPath -eq "") {
    $OutputPath = Join-Path $OutputDir "osm-stop-candidates.geojson"
}

if (-not (Test-Path $InputPbf)) {
    Write-Error "Input PBF not found at $InputPbf. Please provide a valid path to an OSM PBF file."
    exit 1
}

$OutputPathParent = Split-Path $OutputPath -Parent
if (-not (Test-Path $OutputPathParent)) {
    New-Item -ItemType Directory -Force -Path $OutputPathParent | Out-Null
}

$ScriptFile = Join-Path $RootPath "scripts\osm\extract-candidates.js"

Write-Host "Running/OSM extraction..." -ForegroundColor Cyan

$nodeCmd = "node $ScriptFile --input `"$InputPbf`" --output `"$OutputPath`""

Invoke-Expression $nodeCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Extraction failed with exit code $LASTEXITCODE"
    exit 1
}

Write-Host "Stop candidate extraction complete." -ForegroundColor Green