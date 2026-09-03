$process = Get-Process mariadbd -ErrorAction SilentlyContinue
if (-not $process) {
    Write-Host "MariaDB is not running."
    exit 0
}

Stop-Process -Id $process.Id -Force
Write-Host "MariaDB stopped."
