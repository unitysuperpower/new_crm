# Run this as Administrator to enable port forwarding

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Enabling port forwarding..." -ForegroundColor Green

# Forward port 80 from network IP to localhost
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.100.38 connectport=80 connectaddress=127.0.0.1 2>$null

# Forward port 8080 from network IP to localhost
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.100.38 connectport=8080 connectaddress=127.0.0.1 2>$null

Write-Host "`nPort forwarding rules:" -ForegroundColor Green
netsh interface portproxy show all

Write-Host "`n✓ Success! Your CRM is now accessible on the network:" -ForegroundColor Green
Write-Host "  CRM: http://192.168.100.38" -ForegroundColor Cyan
Write-Host "  phpMyAdmin: http://192.168.100.38:8080" -ForegroundColor Cyan
Write-Host "`nColleagues can now access your CRM using this IP!" -ForegroundColor Green
