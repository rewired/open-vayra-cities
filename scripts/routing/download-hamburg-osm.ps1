$ErrorActionPreference = "Stop"

$RootPath = (Resolve-Path ".\").Path
$OsmDir = Join-Path $RootPath "data\osm"
$PbfUrl = "https://download.geofabrik.de/europe/germany/hamburg-latest.osm.pbf"
$Md5Url = "https://download.geofabrik.de/europe/germany/hamburg-latest.osm.pbf.md5"
$PbfFile = Join-Path $OsmDir "hamburg-latest.osm.pbf"
$Md5File = Join-Path $OsmDir "hamburg-latest.osm.pbf.md5"

Write-Host "Checking for data\osm directory..."
if (-not (Test-Path $OsmDir)) {
    New-Item -ItemType Directory -Force -Path $OsmDir | Out-Null
    Write-Host "Created data\osm directory."
}

Write-Host "Downloading hamburg-latest.osm.pbf from Geofabrik..."
Invoke-WebRequest -Uri $PbfUrl -OutFile $PbfFile
Write-Host "Downloaded hamburg-latest.osm.pbf."

Write-Host "Downloading MD5 checksum..."
Invoke-WebRequest -Uri $Md5Url -OutFile $Md5File
Write-Host "Downloaded MD5 checksum."

Write-Host "Verifying checksum..."
$ExpectedHash = (Get-Content $Md5File).Split(" ")[0].Trim()
$ActualHash = (Get-FileHash -Path $PbfFile -Algorithm MD5).Hash.ToLower()

if ($ExpectedHash -eq $ActualHash) {
    Write-Host "Checksum verification successful: $ActualHash" -ForegroundColor Green
} else {
    Write-Error "Checksum verification failed! Expected: $ExpectedHash, Actual: $ActualHash"
}
