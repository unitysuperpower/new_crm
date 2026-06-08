@echo off
REM Start CRM and ngrok together

echo.
echo ========================================
echo Starting CRM with ngrok
echo ========================================
echo.

REM Step 1: Start Docker containers
echo [STEP 1] Starting Docker containers...
cd D:\crm
docker compose up -d
echo ✓ Docker containers started

echo.
echo [STEP 2] Waiting for containers to be ready...
timeout /t 5 /nobreak

echo.
echo [STEP 3] Starting ngrok tunnel...
echo ========================================
echo.
echo Your CRM will be accessible at the URL shown below.
echo Share this URL with your colleagues!
echo.
echo ========================================

REM Start ngrok
ngrok http 80

pause
