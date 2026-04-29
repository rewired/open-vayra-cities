param(
    [Parameter(Mandatory=$false)]
    [string]$InputPbf = "",

    [Parameter(Mandatory=$false)]
    [string]$OutputGeoJson = "",

    [Parameter(Mandatory=$false)]
    [string]$Area = "",

    [Parameter(Mandatory=$false)]
    [string]$ImageName = "open-vayra-osmium-tooling:local",

    [Parameter(Mandatory=$false)]
    [switch]$RebuildImage = $false,

    [Parameter(Mandatory=$false)]
    [switch]$KeepIntermediate = $false
)

$ErrorActionPreference = "Stop"

# Resolve root path
$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path

Write-Host "--- OpenVayra OSM Stop Candidate Generation ---" -ForegroundColor Cyan

# 1. Rebuild image if requested
if ($RebuildImage) {
    & "$PSScriptRoot\setup-osmium-tooling.ps1" -ImageName $ImageName
}

# 2. Check Docker availability
docker version --format '{{.Server.Version}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running or not installed."
    exit 1
}

# 3. Ensure image exists
$imageCheck = docker images -q $ImageName
if ([string]::IsNullOrEmpty($imageCheck)) {
    Write-Host "Tooling image '$ImageName' not found. Running setup..." -ForegroundColor Yellow
    & "$PSScriptRoot\setup-osmium-tooling.ps1" -ImageName $ImageName
}

# 4. Resolve Paths
$IntermediateDir = ""

if (-not [string]::IsNullOrEmpty($Area)) {
    if (-not [string]::IsNullOrEmpty($InputPbf) -or -not [string]::IsNullOrEmpty($OutputGeoJson)) {
        Write-Error "Use either -Area or explicit -InputPbf/-OutputGeoJson, not both."
        exit 1
    }

    $AreaFilePath = Join-Path $RootPath "data\areas\${Area}.area.json"
    if (-not (Test-Path $AreaFilePath)) {
        Write-Error "Area configuration file not found: $AreaFilePath"
        exit 1
    }

    $AreaConfig = Get-Content $AreaFilePath -Raw | ConvertFrom-Json
    
    if (-not $AreaConfig.sourcePbfFile) { Write-Error "Missing 'sourcePbfFile' in $AreaFilePath"; exit 1 }
    if (-not $AreaConfig.stopCandidates -or -not $AreaConfig.stopCandidates.expectedGeoJsonFile) { Write-Error "Missing 'stopCandidates.expectedGeoJsonFile' in $AreaFilePath"; exit 1 }

    $InputPbf = Join-Path $RootPath $AreaConfig.sourcePbfFile
    $OutputGeoJson = Join-Path $RootPath $AreaConfig.stopCandidates.expectedGeoJsonFile
    
    if (-not (Test-Path $InputPbf)) {
        Write-Error "Source PBF not found: $InputPbf"
        exit 1
    }

    $IntermediateDir = Join-Path $RootPath "data\generated\osm\stop-candidates\${Area}"
} else {
    if ([string]::IsNullOrEmpty($InputPbf)) {
        $osmDataDir = Join-Path $RootPath "data/osm"
        $pbfFiles = Get-ChildItem -Path $osmDataDir -Filter "*.pbf" -Recurse | Where-Object { $_.Extension -eq ".pbf" -or $_.Extension -eq ".osm.pbf" }

        if ($pbfFiles.Count -eq 0) {
            Write-Error "No .osm.pbf files found in '$osmDataDir'. Please provide -InputPbf or place a PBF file in the data/osm folder."
            exit 1
        } elseif ($pbfFiles.Count -gt 1) {
            Write-Host "Multiple PBF files found in '$osmDataDir':" -ForegroundColor Yellow
            $pbfFiles | ForEach-Object { Write-Host " - $($_.FullName)" }
            Write-Error "Ambigous input. Please specify -InputPbf explicitly."
            exit 1
        } else {
            $InputPbf = $pbfFiles[0].FullName
            Write-Host "Auto-resolved input PBF: $InputPbf" -ForegroundColor Gray
        }
    } else {
        if (-not [System.IO.Path]::IsPathRooted($InputPbf)) {
            $InputPbf = (Resolve-Path $InputPbf).Path
        }
    }

    if ([string]::IsNullOrEmpty($OutputGeoJson)) {
        $OutputGeoJson = Join-Path $RootPath "apps/web/public/generated/osm-stop-candidates.geojson"
    }
}

if (-not (Test-Path $InputPbf)) {
    Write-Error "Input PBF not found: $InputPbf"
    exit 1
}

$OutputDir = Split-Path $OutputGeoJson -Parent
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

# 6. Call Build Script
Write-Host "Starting build pipeline..." -ForegroundColor Cyan
$buildScript = Join-Path $PSScriptRoot "build-stop-candidates.ps1"

$params = @{
    InputPbf = $InputPbf
    OutputGeoJson = $OutputGeoJson
    ImageName = $ImageName
}

if (-not [string]::IsNullOrEmpty($IntermediateDir)) {
    $params.Add("IntermediateDir", $IntermediateDir)
}

if ($KeepIntermediate) {
    $params.Add("KeepIntermediate", $true)
}

& $buildScript @params

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build pipeline failed."
    exit 1
}

Write-Host "`nGeneration complete." -ForegroundColor Green
Write-Host "Output: $OutputGeoJson" -ForegroundColor White
Write-Host "Run the app with: pnpm dev:web"
