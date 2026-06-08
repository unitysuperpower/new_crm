# Run this as Administrator in PowerShell to open firewall ports

Write-Host "Opening Windows Firewall for CRM access..." -ForegroundColor Green

# Allow port 80 (HTTP)
New-NetFirewallRule -DisplayName "Allow HTTP (CRM)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Profile Any -ErrorAction SilentlyContinue
Write-Host "✓ Port 80 (HTTP) - Added" -ForegroundColor Green

# Allow port 8080 (phpMyAdmin)
New-NetFirewallRule -DisplayName "Allow phpMyAdmin (CRM)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080 -Profile Any -ErrorAction SilentlyContinue
Write-Host "✓ Port 8080 (phpMyAdmin) - Added" -ForegroundColor Green

# Allow Docker Desktop communication
New-NetFirewallRule -DisplayName "Allow Docker Desktop" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 2375,2376 -Profile Any -ErrorAction SilentlyContinue
Write-Host "✓ Docker ports - Added" -ForegroundColor Green

Write-Host "`nFirewall rules configured!" -ForegroundColor Green
Write-Host "Your CRM should now be accessible at: http://192.168.100.38" -ForegroundColor Cyan
Write-Host "phpMyAdmin at: http://192.168.100.38:8080" -ForegroundColor Cyan
