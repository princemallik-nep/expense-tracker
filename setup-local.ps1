# setup-local.ps1
# Run this once to set up your local PostgreSQL database
# Open PowerShell and run: .\setup-local.ps1

Write-Host ""
Write-Host "ExpenseTrack - Local Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "PostgreSQL not found on PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor White
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Run the installer (keep default port 5432)" -ForegroundColor White
    Write-Host "  3. Remember the password you set for the 'postgres' user" -ForegroundColor White
    Write-Host "  4. Re-run this script after installation" -ForegroundColor White
    exit 1
}

Write-Host "PostgreSQL found." -ForegroundColor Green

# Prompt for postgres password
$pgPassword = Read-Host "Enter your PostgreSQL password (for user 'postgres')" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# Set env for psql
$env:PGPASSWORD = $pgPasswordPlain

# Create database
Write-Host ""
Write-Host "Creating database 'expensetrack'..." -ForegroundColor Cyan
psql -U postgres -c "CREATE DATABASE expensetrack;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created." -ForegroundColor Green
} else {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Yellow
}

# Create .env file
$envPath = Join-Path $PSScriptRoot "backend\.env"
if (Test-Path $envPath) {
    Write-Host ""
    Write-Host ".env already exists, skipping..." -ForegroundColor Yellow
} else {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
    $envContent = @"
DATABASE_URL=postgresql://postgres:$pgPasswordPlain@localhost:5432/expensetrack
JWT_SECRET=$jwtSecret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
"@
    Set-Content -Path $envPath -Value $envContent
    Write-Host ""
    Write-Host ".env file created at backend\.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. npm run install:all" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host ""
