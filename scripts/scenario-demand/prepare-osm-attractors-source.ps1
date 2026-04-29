param(
    [Parameter(Mandatory=$false)]
    [string]$ScenarioId,

    [Parameter(Mandatory=$false)]
    [string]$Area,

    [Parameter(Mandatory=$false)]
    [string]$InputPbf,

    [Parameter(Mandatory=$false)]
    [string]$OutputGeoJson,

    [Parameter(Mandatory=$false)]
    [string]$ImageName = "open-vayra-osmium-tooling:local",

    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Resolve root path
$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path

# Validation
if (-not $OutputGeoJson -and -not $ScenarioId) {
    Write-Error "ScenarioId is required unless OutputGeoJson is explicitly provided."
    exit 1
}

if (-not $InputPbf -and -not $Area) {
    Write-Error "Area is required unless InputPbf is explicitly provided."
    exit 1
}

# Path Resolution
if (-not $InputPbf) {
    $InputPbf = Join-Path $RootPath "data\osm\${Area}.osm.pbf"
} else {
    if (-not [System.IO.Path]::IsPathRooted($InputPbf)) {
        $InputPbf = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $InputPbf))
    }
}

if (-not $OutputGeoJson) {
    $OutputGeoJson = Join-Path $RootPath "data\generated\scenario-source-material\${ScenarioId}\osm-attractors.raw.geojson"
} else {
    if (-not [System.IO.Path]::IsPathRooted($OutputGeoJson)) {
        $OutputGeoJson = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputGeoJson))
    }
}

$IntermediateDir = Split-Path -Parent $OutputGeoJson
$TempPbf = Join-Path $IntermediateDir "attractors.osm.pbf"

if ($DryRun) {
    Write-Host "DRY RUN: Resolved paths"
    Write-Host "ScenarioId: $ScenarioId"
    Write-Host "Area: $Area"
    Write-Host "InputPbf: $InputPbf"
    Write-Host "OutputGeoJson: $OutputGeoJson"
    Write-Host "ImageName: $ImageName"
    Write-Host "TempPbf: $TempPbf"
    
    if ($ImageName -eq "open-vayra-osmium-tooling:local") {
        Write-Host "DRY RUN: Would ensure default image $ImageName before extraction."
    } else {
        Write-Host "DRY RUN: Custom image $ImageName provided, skipping automatic ensure."
    }
    exit 0
}

# Create intermediate directory if it doesn't exist
if (-not (Test-Path $IntermediateDir)) {
    New-Item -ItemType Directory -Force -Path $IntermediateDir | Out-Null
}

if (-not (Test-Path $InputPbf)) {
    Write-Error "Input PBF not found at $InputPbf. Please place the raw OSM extract there."
    exit 1
}

# Ensure Docker image exists
if ($ImageName -eq "open-vayra-osmium-tooling:local") {
    Write-Host "Ensuring default Docker image exists..." -ForegroundColor Cyan
    & "$PSScriptRoot\ensure-osmium-tooling-image.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to ensure Docker image $ImageName."
        exit 1
    }
} else {
    Write-Host "Using custom Docker image $ImageName. Verifying existence..." -ForegroundColor Cyan
    try {
        $ImageId = & docker images -q $ImageName
        if ($LASTEXITCODE -ne 0 -or -not $ImageId) {
            Write-Error "Custom Docker image '$ImageName' not found locally. Please build or pull it first."
            exit 1
        }
    } catch {
        Write-Error "Failed to verify custom Docker image '$ImageName'. Is Docker running?"
        exit 1
    }
}

function Get-ContainerPath([string]$HostPath) {
    $absPath = [System.IO.Path]::GetFullPath($HostPath)
    if ($absPath -like "$RootPath*") {
        $subPath = $absPath.Substring($RootPath.Length).TrimStart("\")
        $linuxPath = $subPath.Replace("\", "/")
        return "/work/$linuxPath"
    } else {
        Write-Error "Path $HostPath is outside of root path $RootPath"
        exit 1
    }
}

$ContainerInputPbf = Get-ContainerPath $InputPbf
$ContainerTempPbf = Get-ContainerPath $TempPbf
$ContainerOutputGeoJson = Get-ContainerPath $OutputGeoJson

# Cleanup previous runs
if (Test-Path $TempPbf) { Remove-Item -Force $TempPbf }
if (Test-Path $OutputGeoJson) { Remove-Item -Force $OutputGeoJson }

Write-Host "Running osmium tags-filter (Docker)..." -ForegroundColor Cyan
docker run --rm -v "${RootPath}:/work" $ImageName tags-filter $ContainerInputPbf `
    amenity=school `
    amenity=university `
    amenity=college `
    amenity=hospital `
    amenity=clinic `
    amenity=townhall `
    office `
    shop `
    tourism=attraction `
    tourism=museum `
    leisure=sports_centre `
    leisure=stadium `
    landuse=commercial `
    landuse=retail `
    landuse=industrial `
    -o $ContainerTempPbf

if ($LASTEXITCODE -ne 0) {
    Write-Error "osmium tags-filter failed"
    exit 1
}

Write-Host "Running osmium export (Docker)..." -ForegroundColor Cyan
docker run --rm -v "${RootPath}:/work" $ImageName export $ContainerTempPbf `
    --add-unique-id=type_id `
    --overwrite `
    -f geojson `
    -o $ContainerOutputGeoJson

if ($LASTEXITCODE -ne 0) {
    Write-Error "osmium export failed"
    exit 1
}

# Cleanup temp PBF
if (Test-Path $TempPbf) { Remove-Item -Force $TempPbf }

Write-Host "OSM Attractor extract complete: $OutputGeoJson" -ForegroundColor Green

