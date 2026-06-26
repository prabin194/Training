FROM php:8.3-fpm-alpine AS base

WORKDIR /app

RUN apk add --no-cache \
    libpng-dev libzip-dev oniguruma-dev ghostscript freetype-dev \
    icu-dev libwebp-dev jpegoptim optipng pngquant curl

RUN docker-php-ext-install pdo_mysql mysqli mbstring exif pcntl bcmath gd zip

RUN curl -fsSL https://fnm.vercel.app/install | bash && \
    ln -s /root/.local/share/fnm/aliases/default/bin/node /usr/local/bin/node && \
    ln -s /root/.local/share/fnm/aliases/default/bin/npm /usr/local/bin/npm && \
    ln -s /root/.local/share/fnm/aliases/default/bin/npx /usr/local/bin/npx

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

FROM base AS builder

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

ENV PATH="/root/.local/share/fnm/aliases/default/bin:$PATH"

RUN npm ci && npm run build

RUN php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

FROM base AS runtime

COPY --from=builder /app/vendor /app/vendor
COPY --from=builder /app/public /app/public
COPY --from=builder /app/bootstrap /app/bootstrap

EXPOSE 9000

CMD ["php-fpm"]