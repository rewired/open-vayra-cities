$ErrorActionPreference = "Stop"

$RootPath = (Resolve-Path ".\").Path
$DockerComposeDir = Join-Path $RootPath "docker\routing\osrm"
$OsrmFile = Join-Path $RootPath "data\routing\osrm\hamburg-latest.osrm"

Write-Host "Checking for Docker..."
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and -not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker or docker-compose is not installed or not in PATH."
    exit 1
}

if (-not (Test-Path $OsrmFile)) {
    Write-Error "Prepared OSRM data not found at $OsrmFile. Please run scripts\routing\prepare-osrm.ps1 first."
    exit 1
}

Push-Location $DockerComposeDir
try {
    Write-Host "Starting OSRM container via docker-compose..."
    # Support both docker-compose and docker compose
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose up -d
    } else {
        docker compose up -d
    }
    Write-Host "OSRM service is starting on http://localhost:5000" -ForegroundColor Green
} finally {
    Pop-Location
}
