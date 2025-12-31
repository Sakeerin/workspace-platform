# PowerShell script to setup .env file
# Usage: .\scripts\setup-env.ps1

$envFile = ".env"
$envExample = ".env.example"

Write-Host "Setting up environment variables..." -ForegroundColor Yellow

# Check if .env exists
if (!(Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "ERROR: .env.example not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ".env file already exists" -ForegroundColor Cyan
}

# Generate JWT secrets if not set
$crypto = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtSecretBytes = New-Object byte[] 32
$refreshSecretBytes = New-Object byte[] 32
$crypto.GetBytes($jwtSecretBytes)
$crypto.GetBytes($refreshSecretBytes)
$jwtSecret = [Convert]::ToBase64String($jwtSecretBytes)
$refreshSecret = [Convert]::ToBase64String($refreshSecretBytes)

# Read current .env
$envContent = Get-Content $envFile -Raw

# Check if JWT_SECRET is set
if ($envContent -notmatch "JWT_SECRET=.*[^\s]") {
    Write-Host "JWT_SECRET not set, generating..." -ForegroundColor Yellow
    if ($envContent -match "JWT_SECRET=") {
        $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
    } else {
        $envContent += "`nJWT_SECRET=$jwtSecret"
    }
    Write-Host "Generated JWT_SECRET" -ForegroundColor Green
} else {
    Write-Host "JWT_SECRET already set" -ForegroundColor Cyan
}

# Check if JWT_REFRESH_SECRET is set
if ($envContent -notmatch "JWT_REFRESH_SECRET=.*[^\s]") {
    Write-Host "JWT_REFRESH_SECRET not set, generating..." -ForegroundColor Yellow
    if ($envContent -match "JWT_REFRESH_SECRET=") {
        $envContent = $envContent -replace "JWT_REFRESH_SECRET=.*", "JWT_REFRESH_SECRET=$refreshSecret"
    } else {
        $envContent += "`nJWT_REFRESH_SECRET=$refreshSecret"
    }
    Write-Host "Generated JWT_REFRESH_SECRET" -ForegroundColor Green
} else {
    Write-Host "JWT_REFRESH_SECRET already set" -ForegroundColor Cyan
}

# Write back to .env
Set-Content -Path $envFile -Value $envContent -NoNewline

Write-Host "`nEnvironment setup complete!" -ForegroundColor Green
Write-Host "Please review and update other variables in .env as needed." -ForegroundColor Yellow

