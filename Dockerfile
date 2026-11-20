FROM php:8.2-apache

# MySQL support for the LAMP stack (cURL ships with the base image; it is
# required by src/OpenRouterClient.php).
RUN docker-php-ext-install pdo pdo_mysql

# Required to process the root .htaccess (routing everything into public/).
RUN a2enmod rewrite

WORKDIR /var/www/html
