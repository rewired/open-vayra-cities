param(
    [Parameter(Mandatory=$true)]
    [string]$InputPbf,

    [Parameter(Mandatory=$false)]
    [string]$OutputGeoJson = "",

    [Parameter(Mandatory=$false)]
    [string]$ImageName = "open-vayra-osmium-tooling:local",

    [Parameter(Mandatory=$false)]
    [string]$IntermediateDir = "",

    [Parameter(Mandatory=$false)]
    [switch]$KeepIntermediate = $false
)

$ErrorActionPreference = "Stop"

# Resolve root path
$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path
$ScriptDir = Join-Path $RootPath "scripts\osm"

# Resolve intermediate directory
if ([string]::IsNullOrEmpty($IntermediateDir)) {
    $IntermediateDir = Join-Path $RootPath "data\generated\osm\stop-candidates"
}

if (-not (Test-Path $IntermediateDir)) {
    New-Item -ItemType Directory -Force -Path $IntermediateDir | Out-Null
}

# Resolve output path
if ([string]::IsNullOrEmpty($OutputGeoJson)) {
    $OutputGeoJson = Join-Path $RootPath "apps\web\public\generated\osm-stop-candidates.geojson"
}

$OutputDir = Split-Path $OutputGeoJson -Parent
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

# 1. Define container paths
# We mount the repository root to /work in the container.
# We need to convert host paths to container-relative paths.

function Get-ContainerPath([string]$HostPath) {
    # Ensure we have an absolute path without requiring the file to exist
    $absPath = [System.IO.Path]::GetFullPath($HostPath)
    
    if ($absPath.StartsWith($RootPath)) {
        $subPath = $absPath.Substring($RootPath.Length).TrimStart("\")
        $linuxPath = $subPath.Replace("\", "/")
        return "/work/$linuxPath"
    } else {
        Write-Error "Path $HostPath is outside of root path $RootPath"
        exit 1
    }
}

$ContainerInputPbf = Get-ContainerPath $InputPbf
$TempPbf = Join-Path $IntermediateDir "filtered.osm.pbf"
$ContainerTempPbf = Get-ContainerPath $TempPbf
$TempGeoJsonSeq = Join-Path $IntermediateDir "output.geojsonseq"
$ContainerTempGeoJsonSeq = Get-ContainerPath $TempGeoJsonSeq

# Cleanup previous runs
if (Test-Path $TempPbf) { Remove-Item -Force $TempPbf }
if (Test-Path $TempGeoJsonSeq) { Remove-Item -Force $TempGeoJsonSeq }

# 2. Run osmium tags-filter via Docker
Write-Host "Running osmium tags-filter (Docker)..." -ForegroundColor Cyan
docker run --rm -v "${RootPath}:/work" $ImageName tags-filter $ContainerInputPbf `
    n/highway=bus_stop `
    n/public_transport=platform `
    n/public_transport=stop_position `
    -o $ContainerTempPbf

if ($LASTEXITCODE -ne 0) {
    Write-Error "osmium tags-filter failed"
    exit 1
}

# 3. Run osmium export via Docker
Write-Host "Running osmium export (Docker)..." -ForegroundColor Cyan
docker run --rm -v "${RootPath}:/work" $ImageName export $ContainerTempPbf `
    --add-unique-id=type_id `
    --overwrite `
    -f geojsonseq `
    -o $ContainerTempGeoJsonSeq

if ($LASTEXITCODE -ne 0) {
    Write-Error "osmium export failed"
    exit 1
}

# 4. Run OpenVayra normalizer on host (requires Node)
Write-Host "Running OpenVayra normalizer (Node)..." -ForegroundColor Cyan

$normalizeScript = Join-Path $ScriptDir "normalize-stop-candidates.mjs"

# Check node availability
node --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Node.js is not found on host. Node is required for the normalization step."
    exit 1
}

# Using direct execution to avoid Invoke-Expression quoting issues
node "$normalizeScript" --input "$TempGeoJsonSeq" --output "$OutputGeoJson"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Normalization failed"
    exit 1
}

# 5. Cleanup
if (-not $KeepIntermediate) {
    Write-Host "Cleaning up intermediate files..." -ForegroundColor Gray
    Remove-Item -Force $TempPbf
    Remove-Item -Force $TempGeoJsonSeq
}

Write-Host "Stop candidate extraction complete: $OutputGeoJson" -ForegroundColor Green