# CRM Testing Setup for Colleagues

## Quick Start (One Command)

Your colleague can get the CRM running with:

```bash
git clone <your-repo-url>
cd crm
docker compose up --build
```

The app will be available at **http://localhost** after about 2-3 minutes.

---

## What Gets Set Up Automatically

✅ **Database** (MySQL) - auto-initialized  
✅ **PHP/Laravel Backend** - dependencies installed  
✅ **React/TypeScript Frontend** - assets built and compiled  
✅ **Nginx Web Server** - reverse proxy configured  
✅ **phpMyAdmin** - database admin at http://localhost:8080  

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| CRM Application | http://localhost | Main app (port 80) |
| phpMyAdmin | http://localhost:8080 | Database management |
| API | http://localhost/api | REST endpoints |

---

## Environment Configuration

The app uses Docker defaults in the compose file:
- **Database:** `new_crm`
- **DB User:** `root`
- **DB Password:** (empty)
- **APP_ENV:** local
- **APP_DEBUG:** true

No additional `.env` setup is needed—your `.env` file already has the correct Docker settings.

---

## Common Colleague Tasks

### Import Sample Data
```bash
docker compose exec php php artisan db:seed
# Or import the sample CSV through the UI
```

### Run Tests
```bash
docker compose exec php php artisan test
```

### Run Migrations Fresh
```bash
docker compose exec php php artisan migrate:refresh --seed
```

### View Logs
```bash
docker compose logs -f php
docker compose logs -f web
docker compose logs -f db
```

### Access Database via CLI
```bash
docker compose exec db mysql -u root new_crm
```

### Rebuild After Code Changes
```bash
docker compose up --build
```

---

## Troubleshooting for Colleagues

**Issue:** "Connection refused" on localhost  
**Solution:** Wait 2-3 minutes for all services to start. Run `docker compose ps` to check status.

**Issue:** "Database not found" error  
**Solution:** The database auto-initializes. If needed, run:
```bash
docker compose exec php php artisan migrate --force
```

**Issue:** Frontend assets not loading (404 on /build/...)  
**Solution:** Rebuild the image:
```bash
docker compose up --build --pull always
```

**Issue:** Port 80 already in use  
**Solution:** Change in `docker-compose.yml` line 8 from `"80:80"` to `"8000:80"`, then visit http://localhost:8000

---

## Docker Commands Reference

```bash
# Start containers
docker compose up

# Start in background
docker compose up -d

# Rebuild images
docker compose build

# View running containers
docker compose ps

# View logs
docker compose logs -f

# Stop containers
docker compose stop

# Remove everything (data kept in volumes)
docker compose down

# Remove everything including data
docker compose down -v

# Execute command in PHP container
docker compose exec php <command>

# Get into PHP shell
docker compose exec php sh
```

---

## What Your Colleague Needs Installed

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (usually included with Docker Desktop)
- **Git** (to clone the repo)

That's it! No PHP, Node, MySQL, or other dependencies needed locally.

---

## File Changes Summary

- **docker-compose.yml** - Added health checks for better startup reliability
- **Dockerfile.php** - Improved with multi-stage build for frontend assets and composer
- **docker-entrypoint.sh** - Auto-setup script (optional enhancement)

Your CRM is ready for colleague testing!
