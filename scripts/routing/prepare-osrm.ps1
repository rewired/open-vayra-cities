$ErrorActionPreference = "Stop"

$RootPath = (Resolve-Path ".\").Path
$OsmDir = Join-Path $RootPath "data\osm"
$OsrmDir = Join-Path $RootPath "data\routing\osrm"
$PbfFile = Join-Path $OsmDir "hamburg-latest.osm.pbf"

Write-Host "Checking for Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH."
    exit 1
}

if (-not (Test-Path $PbfFile)) {
    Write-Error "Source file not found at $PbfFile. Please run scripts\routing\download-hamburg-osm.ps1 first."
    exit 1
}

Write-Host "Ensuring data\routing\osrm directory exists..."
if (-not (Test-Path $OsrmDir)) {
    New-Item -ItemType Directory -Force -Path $OsrmDir | Out-Null
    Write-Host "Created data\routing\osrm directory."
}

# The Docker container will mount:
# - data/routing/osrm as /data (where the generated files go)
# - data/osm/hamburg-latest.osm.pbf as /data/hamburg-latest.osm.pbf (read-only input)
$DockerRunBase = "docker run -t --rm -v ""$OsrmDir:/data"" -v ""$PbfFile:/data/hamburg-latest.osm.pbf:ro"" osrm/osrm-backend"

Write-Host "Running osrm-extract..."
Invoke-Expression "$DockerRunBase osrm-extract -p /opt/car.lua /data/hamburg-latest.osm.pbf"

Write-Host "Running osrm-partition..."
Invoke-Expression "$DockerRunBase osrm-partition /data/hamburg-latest.osrm"

Write-Host "Running osrm-customize..."
Invoke-Expression "$DockerRunBase osrm-customize /data/hamburg-latest.osrm"

Write-Host "OSRM preparation complete. You can now start the routing service." -ForegroundColor Green
