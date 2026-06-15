# Aurea CRM - Office Network Access Guide

Your CRM is now live and ready for testing with your colleagues on the office network.

## Access URLs

Replace `192.168.100.38` with your server's IP address if different.

### Main CRM Application
- **URL:** `http://192.168.100.38:80`
- **Port:** 80 (HTTP)
- **Access:** Open in any browser on the office network

### Database Management (phpMyAdmin)
- **URL:** `http://192.168.100.38:9090`
- **Port:** 9090
- **Username:** `root`
- **Password:** (empty - no password needed)
- **Database:** `new_crm`

## System Architecture

- **Web Server:** Nginx (port 80)
- **Application Server:** PHP-FPM (port 9000, internal only)
- **Database:** MySQL 8.0 (port 3306, internal only)
- **Admin Tool:** phpMyAdmin (port 9090)

## For Your Colleagues

### First Time Access
1. Open a browser on any office computer
2. Go to `http://192.168.100.38:80` for the main CRM
3. If you need database access, go to `http://192.168.100.38:9090`

### Troubleshooting Connection Issues

If colleagues cannot access the application:

1. **Check Server is Running**
   ```bash
   docker ps
   ```
   All containers should show "Up" status.

2. **Verify Network Connectivity**
   - Ping the server: `ping 192.168.100.38`
   - Check if ports are open from your office network

3. **Check Container Logs**
   ```bash
   docker logs new_web
   docker logs new_php
   ```

4. **Restart Services**
   ```bash
   cd D:\crm
   docker-compose restart
   ```

## Environment Details

- **Application:** Laravel + React
- **Frontend Build:** Vite
- **PHP Version:** 8.4-FPM
- **MySQL Version:** 8.0
- **Node.js Build Tools:** Included in docker-compose

## Stop/Start Commands

**Stop All Services:**
```bash
cd D:\crm
docker-compose down
```

**Start All Services:**
```bash
cd D:\crm
docker-compose up -d
```

**View Live Logs:**
```bash
cd D:\crm
docker-compose logs -f
```

## Network Security Notes

- The application is accessible to anyone on your office network at the specified IP and port
- No authentication is required at the network level
- For production, add firewall rules to restrict access to specific office IPs/ranges
- Consider adding SSL/TLS certificates for HTTPS

## Database Access

- **Host:** `db` (internal)
- **Port:** 3306
- **Database Name:** `new_crm`
- **Username:** `root`
- **Password:** (empty)

The database persists in Docker volumes and survives container restarts.

## Next Steps

1. Share the main URL (`http://192.168.100.38:80`) with your colleagues
2. Have them test core features
3. Monitor logs if issues occur: `docker-compose logs -f`
4. Report issues with specific features for debugging

---

**Setup Date:** Now Live ✓
**Status:** Ready for Testing
