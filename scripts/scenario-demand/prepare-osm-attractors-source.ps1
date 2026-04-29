param(
    [Parameter(Mandatory=$false)]
    [string]$Area = "hvv-mvp",

    [Parameter(Mandatory=$false)]
    [string]$ImageName = "cityops-osmium-tooling:local"
)

$ErrorActionPreference = "Stop"

# Resolve root path
$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path

$InputPbf = Join-Path $RootPath "data\osm\${Area}.osm.pbf"
if (-not (Test-Path $InputPbf)) {
    Write-Error "Input PBF not found at $InputPbf. Please place the raw OSM extract there."
    exit 1
}

$IntermediateDir = Join-Path $RootPath "data\generated\scenario-source-material\hamburg-core-mvp"
if (-not (Test-Path $IntermediateDir)) {
    New-Item -ItemType Directory -Force -Path $IntermediateDir | Out-Null
}

$TempPbf = Join-Path $IntermediateDir "attractors.osm.pbf"
$OutputGeoJson = Join-Path $IntermediateDir "osm-attractors.raw.geojson"

function Get-ContainerPath([string]$HostPath) {
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
