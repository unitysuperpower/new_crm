#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database..."
until php -r "
try {
    new PDO('mysql:host=db;port=3306', 'root', '');
    echo 'Database is ready!';
    exit(0);
} catch (PDOException \$e) {
    echo 'Connecting to database...';
    exit(1);
}" 2>/dev/null; do
    sleep 2
done

# Install composer dependencies
if [ ! -f "vendor/autoload.php" ]; then
    echo "Installing composer dependencies..."
    composer install --no-dev --optimize-autoloader
fi

# Generate application key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Seed database (optional - uncomment if you have seeders)
# php artisan db:seed

# Build frontend assets if not already built
if [ ! -d "public/build" ]; then
    echo "Building frontend assets..."
    npm run build
fi

echo "Setup complete! CRM is ready for testing."
php-fpm
