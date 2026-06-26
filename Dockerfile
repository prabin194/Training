FROM php:8.3-fpm-alpine

WORKDIR /app

RUN apk add --no-cache \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    ghostscript \
    freetype-dev \
   icu-dev \
    libwebp-dev \
    jpegoptim \
    optipng \
    pngquant

RUN docker-php-ext-install pdo_mysql mysqli mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan event:cache

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]