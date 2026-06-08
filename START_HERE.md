# QUICK START - Share CRM with Colleagues

## Step 1: Start Docker Containers

Open Command Prompt or PowerShell in `D:\crm` folder and run:

```bash
docker compose up -d
```

Wait 30 seconds for containers to start.

---

## Step 2: Enable Network Access (One Time Only)

**Follow these exact steps:**

1. Navigate to: `D:\crm\`
2. Find the file: `enable-network-access.bat`
3. **Right-click on it** → Select **"Run as administrator"**
4. Click **"Yes"** when Windows asks for permission
5. Wait for the command window to show success message
6. Press any key to close

That's it! The port forwarding is now enabled.

---

## Step 3: Share the IP

Tell your colleagues:

> **"You can access the CRM at: http://192.168.100.38"**

They just need:
- To be on the same Wi-Fi as my computer
- To open a web browser
- To visit: `http://192.168.100.38`

---

## Daily Usage

**To start the CRM each day:**
```bash
cd D:\crm
docker compose up -d
```

**To stop the CRM:**
```bash
docker compose stop
```

**To check if it's running:**
```bash
docker compose ps
```

---

## If Colleagues Can't Access

1. **Check if containers are running:**
   ```bash
   docker compose ps
   ```
   Should show all containers as "Up" or "Healthy"

2. **Check port forwarding is active:**
   ```bash
   netsh interface portproxy show all
   ```
   Should show two rules for ports 80 and 8080

3. **Test locally first:**
   Open browser → `http://localhost`
   If it works locally, the issue is with network access

4. **Ask colleague to ping your IP:**
   On their computer, open Command Prompt:
   ```bash
   ping 192.168.100.38
   ```
   Should show replies. If it fails → they're not on the same Wi-Fi

---

## Files You Need

- `docker-compose.yml` - Container configuration
- `enable-network-access.bat` - Port forwarding setup (run once as Admin)
- `Dockerfile.php` - PHP container definition
- `nginx/conf.d/default.conf` - Web server configuration

---

## Done!

Your colleagues can now access the CRM at **http://192.168.100.38** without any additional setup!
