# PowerShell script to kill process using a specific port
# Usage: .\scripts\kill-port.ps1 3000

param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Checking for processes using port $Port..." -ForegroundColor Yellow

$processes = netstat -ano | findstr ":$Port"

if ($processes) {
    $pids = $processes | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Where-Object { $_ -and $_ -ne '0' } | Select-Object -Unique

    foreach ($processId in $pids) {
        try {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                $processName = $process.ProcessName
                Write-Host "Found process: PID $processId ($processName)" -ForegroundColor Red
                Write-Host "Killing process $processId..." -ForegroundColor Yellow
                taskkill /PID $processId /F 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Process $processId terminated." -ForegroundColor Green
                } else {
                    Write-Host "Failed to terminate process $processId (may require admin rights)" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "Skipping process $processId (system process or invalid)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "No process found using port $Port" -ForegroundColor Green
}

Write-Host "Port $Port is now available." -ForegroundColor Green

