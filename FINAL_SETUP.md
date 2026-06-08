# Final Setup: Share IP with Colleagues

## One-Time Setup (Run Once)

**Step 1: Run PowerShell as Administrator**

1. Press `Win + X` → Select **Windows Terminal (Admin)** or **PowerShell (Admin)**
2. Paste this command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; D:\crm\enable-network-access.ps1
```

3. Press Enter and wait for success message

---

## Result

After running the script, your colleagues can access the CRM at:

### **http://192.168.100.38**

They just need:
- To be on the same Wi-Fi network (192.168.100.x)
- A web browser
- Nothing else—no setup required!

---

## Start/Stop Instructions

### Start CRM (every time you want to use it)
```bash
cd D:\crm
docker compose up -d
```

### Stop CRM
```bash
docker compose stop
```

### Check Status
```bash
docker compose ps
```

---

## Share This with Colleagues

Send them this message:

> **CRM Testing Access**
> 
> You can access the CRM at: **http://192.168.100.38**
> 
> **Note:** You must be on the same Wi-Fi network.
> 
> If it doesn't load, ask me to check if the CRM is running (`docker compose ps`).

---

## Troubleshooting

**"Still can't access http://192.168.100.38"**

1. Check if containers are running:
   ```bash
   docker compose ps
   ```
   All should show "Up" or "Healthy"

2. Verify port forwarding is enabled:
   ```powershell
   netsh interface portproxy show all
   ```
   Should show forwarding rules for ports 80 and 8080

3. Test locally first:
   ```
   http://localhost
   ```
   If localhost works but network IP doesn't → port forwarding not enabled

4. Re-run the PowerShell script:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; D:\crm\enable-network-access.ps1
   ```

**"Connection refused"**
- Docker containers not running
- Run: `docker compose up -d`

**"Colleague can't reach it from their PC"**
- Make sure they're on the same Wi-Fi
- Run: `ping 192.168.100.38` on their computer
- If ping fails → network issue, not Docker

---

## To Remove Port Forwarding (if needed)

```powershell
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=192.168.100.38
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=192.168.100.38
```

---

## Done!

Your colleagues can now access the CRM by just visiting **http://192.168.100.38** on their browser!
