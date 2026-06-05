FROM php:8.4-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    zip \
    gd \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html

ENV DB_HOST=db
ENV DB_PORT=3306
ENV DB_DATABASE=new_crm
ENV DB_USERNAME=root
ENV DB_PASSWORD=""

EXPOSE 9000

CMD ["php-fpm"]
