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

CMD for i in $(seq 1 30); do php artisan migrate --force 2>/dev/null && break; echo "Waiting for MySQL..." && sleep 2; done && php artisan serve --host=0.0.0.0 --port=$PORT