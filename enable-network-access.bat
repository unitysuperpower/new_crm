@echo off
REM This script must be run as Administrator
REM It enables Windows port forwarding for Docker CRM access

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: This script requires Administrator privileges!
    echo.
    echo Please follow these steps:
    echo 1. Right-click this file: enable-network-access.bat
    echo 2. Select "Run as administrator"
    echo 3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Enabling Network Access for CRM...
echo ============================================
echo.

REM Remove any existing rules
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=192.168.100.38 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=192.168.100.38 >nul 2>&1

REM Add new port forwarding rules
echo Adding port forwarding rules...
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.100.38 connectport=80 connectaddress=127.0.0.1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.100.38 connectport=8080 connectaddress=127.0.0.1

echo.
echo ============================================
echo Current Port Forwarding Rules:
echo ============================================
netsh interface portproxy show all

echo.
echo ============================================
echo SUCCESS!
echo ============================================
echo.
echo Your CRM is now accessible at:
echo   - CRM: http://192.168.100.38
echo   - phpMyAdmin: http://192.168.100.38:8080
echo.
echo Colleagues can access it from any device on your Wi-Fi!
echo.
pause
