# Windows Firewall Setup Guide

## Quick Fix: Open Firewall Ports

Your colleagues **cannot access** the CRM because **Windows Firewall** is blocking the connection.

### Option 1: Automatic (Easiest)

**Run PowerShell as Administrator and execute:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
D:\crm\open-firewall.ps1
```

Or right-click on `open-firewall.ps1` → "Run with PowerShell" → Click "Yes" when prompted.

### Option 2: Manual Firewall Setup

1. **Open Windows Defender Firewall** (search in Windows)
2. Click **Allow an app through firewall**
3. Click **Change settings** (top-right)
4. Click **Allow another app...**
5. Browse to `C:\Program Files\Docker\Docker\resources\bin\` and select `docker.exe`
6. Click **Add**
7. Repeat for port `80` and `8080`

### Option 3: Command Line (Admin PowerShell)

```powershell
New-NetFirewallRule -DisplayName "Allow HTTP (CRM)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Profile Any
New-NetFirewallRule -DisplayName "Allow phpMyAdmin" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080 -Profile Any
```

---

## After Firewall Fix

1. Run containers:
```bash
cd D:\crm
docker compose up -d
```

2. Test from another device on your Wi-Fi:
```
http://192.168.100.38
```

3. If still not working, restart Docker Desktop:
   - Right-click Docker icon → **Quit Docker Desktop**
   - Wait 10 seconds
   - Open Docker Desktop again
   - Run `docker compose up -d`

---

## Verify Port Access

Check if ports are open:
```powershell
netstat -ano | findstr :80
netstat -ano | findstr :8080
```

Should show `LISTENING` status.

---

## Colleague Troubleshooting

If colleague still cannot reach `http://192.168.100.38`:

1. **Verify network:**
   ```bash
   ping 192.168.100.38
   ```
   Should show replies.

2. **Check Docker is running:**
   ```bash
   docker compose ps
   ```
   All containers should show "Up" or "Healthy".

3. **Verify ports are open:**
   ```bash
   telnet 192.168.100.38 80
   ```
   Should connect (type `quit` to exit).

4. **Check firewall status:**
   ```powershell
   Get-NetFirewallProfile | Format-Table Name, Enabled
   ```

5. **Restart everything:**
   ```bash
   docker compose down -v
   docker compose up -d
   ```

---

## Still Stuck?

Try accessing from localhost first:
```
http://localhost
```

If localhost works but 192.168.100.38 doesn't → **firewall is the issue**.

Run the firewall script above to fix it.
