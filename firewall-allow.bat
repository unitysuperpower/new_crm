@echo off
REM Run as Administrator to open firewall ports

echo Opening Windows Firewall for CRM access...

REM Allow port 80 (HTTP)
netsh advfirewall firewall add rule name="Allow HTTP (CRM)" dir=in action=allow protocol=tcp localport=80 enable=yes profile=any

REM Allow port 8080 (phpMyAdmin)
netsh advfirewall firewall add rule name="Allow phpMyAdmin" dir=in action=allow protocol=tcp localport=8080 enable=yes profile=any

REM Allow Docker daemon
netsh advfirewall firewall add rule name="Allow Docker" dir=in action=allow protocol=tcp localport=2375 enable=yes profile=any

echo Firewall rules added successfully!
echo Your CRM should now be accessible at: http://192.168.100.38
pause
