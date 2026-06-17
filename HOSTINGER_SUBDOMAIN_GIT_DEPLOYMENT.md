# Hostinger Subdomain Git Deployment

Use this guide to deploy the Aurea Education CRM to a Hostinger subdomain using GitHub version control.

## Current GitHub Repository

```text
https://github.com/unitysuperpower/new_crm
```

Branch:

```text
main
```

## 1. Create the Subdomain

In Hostinger hPanel:

1. Open Websites.
2. Select your domain.
3. Go to Subdomains.
4. Create the subdomain, for example:

```text
crm.your-domain.com
```

Recommended document root:

```text
/home/youruser/domains/your-domain.com/crm/public
```

If Hostinger creates the folder under `public_html`, still make sure the subdomain points to Laravel's `public` folder.

## 2. Clone the Repository

Open Hostinger Terminal or SSH and run:

```bash
cd /home/youruser/domains/your-domain.com
git clone https://github.com/unitysuperpower/new_crm.git crm
cd crm
```

If the repository is private, use a GitHub personal access token or SSH deploy key.

## 3. Install PHP Dependencies

Run:

```bash
composer install --no-dev --optimize-autoloader
```

If Hostinger has multiple PHP versions, use the PHP 8.3+ Composer command from Hostinger's terminal settings.

## 4. Build Frontend Assets

If Node.js is available on Hostinger:

```bash
npm ci
npm run build
```

If Node.js is not available on Hostinger, build locally:

```bash
npm ci
npm run build
```

Then upload only this folder to the same path on Hostinger:

```text
public/build
```

## 5. Create Production `.env`

Copy the example:

```bash
cp .env.hostinger.example .env
```

Edit `.env`:

```dotenv
APP_NAME="Aurea Education CRM"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://crm.your-domain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_hostinger_database
DB_USERNAME=your_hostinger_database_user
DB_PASSWORD=your_hostinger_database_password
```

Generate app key:

```bash
php artisan key:generate --force
```

## 6. Run Laravel Setup

```bash
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 7. Set Permissions

Make sure these folders are writable:

```text
storage
bootstrap/cache
```

Typical permissions:

```bash
chmod -R 755 storage bootstrap/cache
```

If uploads or logs fail, ask Hostinger support to give PHP write access to those folders.

## 8. Future Updates From GitHub

After pushing changes to GitHub, update Hostinger with:

```bash
cd /home/youruser/domains/your-domain.com/crm
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If Node.js is not available on Hostinger, run `npm run build` locally and upload `public/build` after `git pull`.

## 9. Important Notes

- Do not commit `.env`.
- Do not upload or commit `node_modules`.
- Do not upload or commit local Docker database volumes.
- The subdomain must point to the Laravel `public` folder.
- If the site opens a directory listing or shows Laravel files, the document root is wrong.
- If the site is blank, check that `public/build/manifest.json` exists.
- If login or sessions fail, confirm database credentials and run migrations.

