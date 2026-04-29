param(
    [Parameter(Mandatory=$false)]
    [string]$ImageName = "open-vayra-osmium-tooling:local",

    [Parameter(Mandatory=$false)]
    [switch]$NoBuild = $false
)

$ErrorActionPreference = "Stop"

# Resolve root path
$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path

Write-Host "--- OpenVayra Osmium Tooling Setup ---" -ForegroundColor Cyan

# 1. Ensure required directories and .gitkeep files exist
$Directories = @(
    "data/osm",
    "data/generated/osm",
    "apps/web/public/generated"
)

foreach ($DirRel in $Directories) {
    $DirPath = Join-Path $RootPath $DirRel
    if (-not (Test-Path $DirPath)) {
        Write-Host "Creating directory: $DirRel" -ForegroundColor Gray
        New-Item -ItemType Directory -Force -Path $DirPath | Out-Null
    }

    $GitKeepPath = Join-Path $DirPath ".gitkeep"
    if (-not (Test-Path $GitKeepPath)) {
        Write-Host "Creating .gitkeep in: $DirRel" -ForegroundColor Gray
        New-Item -ItemType File -Force -Path $GitKeepPath | Out-Null
    }
}

# 2. Check Docker availability
Write-Host "Checking Docker availability..." -ForegroundColor Gray
docker version --format '{{.Server.Version}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running or not installed. Docker is required for Osmium tooling."
    exit 1
}

# 3. Build Docker image
if (-not $NoBuild) {
    Write-Host "Building Docker image: $ImageName..." -ForegroundColor Cyan
    $DockerfilePath = Join-Path $RootPath "docker/osm/osmium/Dockerfile"
    $DockerContext = Join-Path $RootPath "docker/osm/osmium"

    docker build -t $ImageName -f $DockerfilePath $DockerContext
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Docker image $ImageName."
        exit 1
    }
    Write-Host "Docker image $ImageName built successfully." -ForegroundColor Green
} else {
    Write-Host "Skipping Docker image build as requested." -ForegroundColor Yellow
}

Write-Host "`nSetup complete." -ForegroundColor Green
Write-Host "You can now run OSM stop candidate generation using:"
Write-Host "./scripts/osm/start-stop-candidate-generation.ps1 -InputPbf data/osm/your-file.osm.pbf" -ForegroundColor White
