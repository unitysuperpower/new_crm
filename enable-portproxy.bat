@echo off
REM Simple Port Forwarder - Forwards requests from network IP to Docker localhost

netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.100.38 connectport=80 connectaddress=127.0.0.1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.100.38 connectport=8080 connectaddress=127.0.0.1

netsh interface portproxy show all

echo.
echo Port forwarding activated!
echo CRM: http://192.168.100.38
echo phpMyAdmin: http://192.168.100.38:8080
echo.
pause
