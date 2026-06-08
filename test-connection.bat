@echo off
REM Diagnostic script to test connectivity to the CRM server

echo.
echo ========================================
echo CRM Network Diagnostic Test
echo ========================================
echo.

REM Test 1: Ping the host
echo [TEST 1] Pinging 192.168.100.38...
ping -n 1 192.168.100.38
if errorlevel 1 (
    echo ERROR: Cannot ping the host
    echo SOLUTION: Check if you're on the same Wi-Fi network
    echo.
) else (
    echo SUCCESS: Host is reachable
    echo.
)

REM Test 2: Test port 80 with telnet
echo [TEST 2] Testing port 80...
timeout /t 1 /nobreak >nul
echo open 192.168.100.38 80 | telnet
if errorlevel 1 (
    echo ERROR: Port 80 is not accessible
    echo SOLUTION: Firewall might be blocking or server is down
) else (
    echo SUCCESS: Port 80 is accessible
)

echo.
echo [TEST 3] Testing HTTP connection...
powershell -Command "(New-Object System.Net.WebClient).DownloadString('http://192.168.100.38')" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot access http://192.168.100.38
    echo SOLUTION: Server might be down or firewall blocking HTTP
) else (
    echo SUCCESS: HTTP connection works!
    echo You can access the CRM at: http://192.168.100.38
)

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
pause
