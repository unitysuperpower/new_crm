# CRM Network Access Guide for Colleagues

## Your Network IP

Your CRM is now accessible to colleagues on your network at:

### **http://192.168.100.38**

---

## Quick Access for Colleagues

**From any computer on your network (192.168.100.x):**

| Service | URL | Purpose |
|---------|-----|---------|
| **CRM App** | http://192.168.100.38 | Main application (port 80) |
| **phpMyAdmin** | http://192.168.100.38:8080 | Database management |

---

## Setup Instructions for Colleagues

### Step 1: Verify Network Connection
Your colleague should be on the **same Wi-Fi or Local Network** as your machine.

Test connectivity:
```bash
ping 192.168.100.38
```

If ping works, proceed to Step 2.

### Step 2: Access the CRM
Open a browser and go to:
```
http://192.168.100.38
```

---

## How to Start/Stop the Server

### Start the CRM Server
```bash
cd D:\crm
docker compose up -d
```

### Check if Running
```bash
docker compose ps
```
All containers should show "healthy" or "Up".

### Stop the Server
```bash
docker compose stop
```

### View Logs
```bash
docker compose logs -f web
docker compose logs -f php
docker compose logs -f db
```

---

## Windows Firewall Configuration (If Needed)

If colleagues **cannot access** your machine, Windows Firewall may be blocking it.

### Allow Port 80 & 8080:

1. Open **Windows Defender Firewall** → **Allow an app through firewall**
2. Click **Change settings**
3. Click **Allow another app**
4. Select **PHP** or add port `80` manually
5. Repeat for port `8080` (phpMyAdmin)
6. Restart Docker or containers

**Or use PowerShell (Admin):**
```powershell
New-NetFirewallRule -DisplayName "Allow HTTP (CRM)" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow phpMyAdmin" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

## Database Access via phpMyAdmin

Colleagues can manage the database at:
```
http://192.168.100.38:8080
```

- **Username:** root
- **Password:** (leave blank)
- **Database:** new_crm

---

## Network Testing Checklist

✅ Colleague is on the same Wi-Fi/LAN  
✅ Ping 192.168.100.38 works  
✅ Docker containers are running (`docker compose ps`)  
✅ No Windows Firewall blocking ports 80 & 8080  
✅ Colleague can access http://192.168.100.38  

---

## Troubleshooting

**"Connection refused" or "Cannot reach server"**
- Check if containers are running: `docker compose ps`
- Check firewall rules (see above)
- Verify colleague is on the same network

**"Connection timeout"**
- Containers may be starting. Wait 2-3 minutes and retry
- Run `docker compose logs php` to check for errors

**"Port 80 already in use"**
- Another service is using port 80
- Edit `docker-compose.yml` line 11: change `"0.0.0.0:80:80"` to `"0.0.0.0:8000:80"`
- Access at: `http://192.168.100.38:8000`

**Database errors**
- Run: `docker compose exec php php artisan migrate --force`
- Check logs: `docker compose logs db`

---

## Share This IP

Send your colleagues this message:
> "You can test the CRM at: **http://192.168.100.38**"

That's it—no setup needed for them!
