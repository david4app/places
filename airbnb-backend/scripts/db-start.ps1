$root = "$env:USERPROFILE\mariadb-portable\mariadb-12.3.3-winx64"
$dataDir = "$root\data"

if (-not (Test-Path $dataDir)) {
    Write-Error "MariaDB data directory not found at $dataDir"
    exit 1
}

$existing = Get-Process mariadbd -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "MariaDB is already running (PID $($existing.Id))."
    exit 0
}

Start-Process -FilePath "$root\bin\mariadbd.exe" -ArgumentList "--datadir=$dataDir", "--port=3306" -WindowStyle Hidden
Write-Host "MariaDB starting on port 3306..."
