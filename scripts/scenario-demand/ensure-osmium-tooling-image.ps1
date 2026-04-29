param(
    [Parameter(Mandatory=$false)]
    [string]$ImageName = "open-vayra-osmium-tooling:local"
)

$ErrorActionPreference = "Stop"

$RootPath = (Resolve-Path "$PSScriptRoot\..\..").Path
$DockerfilePath = Join-Path $RootPath "docker/osm/osmium/Dockerfile"
$DockerContext = Join-Path $RootPath "docker/osm/osmium"

Write-Host "Ensuring Docker image '$ImageName' exists..." -ForegroundColor Cyan

# 1. Check Docker availability
try {
    $null = & docker version --format '{{.Server.Version}}' 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker daemon is not running or Docker CLI is not installed."
        exit 1
    }
} catch {
    Write-Error "Docker command execution failed. Is Docker installed and in PATH?"
    exit 1
}

# 2. Check if image exists
$ImageId = & docker images -q $ImageName
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to query Docker images."
    exit 1
}

if ($ImageId) {
    Write-Host "Docker image '$ImageName' exists locally." -ForegroundColor Green
    exit 0
}

Write-Host "Docker image '$ImageName' not found locally. Building from source..." -ForegroundColor Yellow

# 3. Check Dockerfile
if (-not (Test-Path $DockerfilePath)) {
    Write-Error "Dockerfile missing at $DockerfilePath. Cannot build image."
    exit 1
}

# 4. Build image
Write-Host "Building local image $ImageName from $DockerfilePath..." -ForegroundColor Cyan
& docker build -t $ImageName -f $DockerfilePath $DockerContext
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build Docker image $ImageName."
    exit 1
}

Write-Host "Successfully built $ImageName." -ForegroundColor Green
