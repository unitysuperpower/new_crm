# Hostinger cPanel Deployment Guide

This guide prepares the Aurea Education CRM for Hostinger/cPanel hosting.

## Server Requirements

- PHP 8.3 or newer
- MySQL 8 or MariaDB
- Composer 2
- Node.js 22 or newer for building assets
- PHP extensions commonly required by Laravel: `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `hash`, `mbstring`, `openssl`, `pdo`, `pdo_mysql`, `session`, `tokenizer`, `xml`

## Recommended Folder Layout

Keep the Laravel application outside the public web folder.

```text
/home/youruser/aurea-crm
/home/youruser/aurea-crm/app
/home/youruser/aurea-crm/bootstrap
/home/youruser/aurea-crm/config
/home/youruser/aurea-crm/public
/home/youruser/aurea-crm/resources
/home/youruser/aurea-crm/storage
```

Set the domain document root to:

```text
/home/youruser/aurea-crm/public
```

If Hostinger does not let you change the document root, contact Hostinger support and ask them to point the domain or subdomain document root to the Laravel `public` directory.

## Local Build Before Upload

Run these commands on your computer before uploading:

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
```

Upload the full project after the build is complete, including:

- `app`
- `bootstrap`
- `config`
- `database`
- `public`
- `resources`
- `routes`
- `storage`
- `vendor`
- `composer.json`
- `composer.lock`
- `artisan`
- built files inside `public/build`

Do not upload:

- `node_modules`
- local `.env` with development credentials
- `.git`
- Docker-only files if the hosting account does not use Docker

## Create Database in Hostinger

1. Open Hostinger hPanel.
2. Go to Databases.
3. Create a MySQL database.
4. Create a database user and password.
5. Assign the user to the database.
6. Copy the database name, username, password, and host.

## Production `.env`

Create `.env` in the project root on Hostinger.

```dotenv
APP_NAME="Aurea Education CRM"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_TIMEZONE=Asia/Karachi

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

MAIL_MAILER=log
MAIL_FROM_ADDRESS=no-reply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
```

Generate the application key on the server:

```bash
php artisan key:generate --force
```

## First Server Commands

Run these commands from the project root:

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

If the site was cached with old settings, clear and rebuild:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## File Permissions

The web server must be able to write to:

```text
storage
bootstrap/cache
```

If Hostinger File Manager shows permission issues, set directories to `755` and files to `644`. If logs, uploads, or cache still fail, ask Hostinger support to confirm PHP has write access to `storage` and `bootstrap/cache`.

## Cron Job

Add this Hostinger cron job to run Laravel scheduled tasks:

```bash
* * * * * cd /home/youruser/aurea-crm && php artisan schedule:run >> /dev/null 2>&1
```

If Hostinger only supports interval-based cron, choose every minute if available.

## Queue Worker

This CRM currently uses the database queue connection. On basic shared hosting, long-running queue workers may not be available. If needed, process queued jobs manually:

```bash
php artisan queue:work --stop-when-empty
```

For production automation, use a Hostinger VPS or a hosting plan that supports persistent workers.

## Deployment Update Checklist

For every new release:

```bash
php artisan down
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

If frontend files changed, rebuild locally with `npm run build` and upload the new `public/build` folder.

## Troubleshooting

### 500 Error

Check `storage/logs/laravel.log`. Most 500 errors are caused by missing `.env`, wrong database credentials, missing `APP_KEY`, or unwritable `storage`.

### Blank Page After Upload

Confirm `public/build/manifest.json` exists. If it is missing, run `npm run build` locally and upload `public/build`.

### CSS or JavaScript Not Loading

Confirm the domain document root points to `public`. Also confirm `APP_URL` matches the live domain with `https://`.

### Route Not Found

Confirm `public/.htaccess` exists and Apache rewrite rules are enabled.

### Login or Session Problems

Confirm `SESSION_DRIVER=database`, run `php artisan migrate --force`, then clear cache with `php artisan optimize:clear`.

