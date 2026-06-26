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

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN npm ci && npm run build

RUN php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

FROM base AS runtime

COPY --from=builder /app /app

CMD php artisan serve --host=0.0.0.0 --port=$PORT