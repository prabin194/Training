FROM php:8.3-fpm-alpine AS base

WORKDIR /app

RUN apk add --no-cache \
    libpng-dev libzip-dev oniguruma-dev ghostscript freetype-dev \
    icu-dev libwebp-dev jpegoptim optipng pngquant curl

RUN docker-php-ext-install pdo_mysql mysqli mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

FROM base AS builder

RUN apk add --no-cache nodejs npm

COPY . .

RUN cp .env.example .env || true

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN php artisan key:generate

RUN npm ci && npm run build

RUN php artisan route:cache && php artisan view:cache && php artisan event:cache

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

FROM base AS runtime

COPY --from=builder /app /app

CMD cat > .env << EOF
APP_KEY=$(grep ^APP_KEY .env | head -1)
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${RAILWAY_PUBLIC_DOMAIN:-localhost}
DB_CONNECTION=mysql
DB_HOST=${MYSQLHOST:-mysql}
DB_PORT=${MYSQLPORT:-3306}
DB_DATABASE=${MYSQLDATABASE:-railway}
DB_USERNAME=${MYSQLUSER:-root}
DB_PASSWORD=${MYSQLPASSWORD:-}
SESSION_DRIVER=file
CACHE_STORE=file
EOF
php artisan config:clear 2>/dev/null
for i in $(seq 1 30); do php artisan migrate --force 2>/dev/null && break; echo "Waiting for MySQL..." && sleep 2; done && php -S 0.0.0.0:${PORT:-8080} /app/router.php