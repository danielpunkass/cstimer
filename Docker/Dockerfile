FROM alpine:latest

# Update packages and install dependencies
RUN apk update && apk upgrade && apk add --no-cache \
	make \
    openjdk17 \
    openssl \
	&& rm -rf /var/cache/apk/*

COPY . /cstimer
WORKDIR /cstimer
RUN make dist

FROM php:fpm-alpine

COPY --from=0 /cstimer /cstimer

RUN apk update && apk upgrade && apk add --no-cache \
	nginx \
    openssl \
 #    && sed -i 's/^#LoadModule status_module modules\/mod_status.so/LoadModule status_module modules\/mod_status.so/' /usr/local/apache2/conf/httpd.conf \
	&& rm -rf /var/cache/apk/*
    
# Configure the host with nginx
COPY ./Docker/default-conf /etc/nginx/http.d/default.conf

# Configure with self-trusted HTTPS cert
#RUN a2enmod ssl
# RUN echo '<VirtualHost *:443>\n\
#     DocumentRoot /var/www/html\n\
# \n\
#     SSLEngine on\n\
#     SSLCertificateFile /cstimer/apache-selfsigned.crt\n\
#     SSLCertificateKeyFile /cstimer/apache-selfsigned.key\n\
# </VirtualHost>' >> /var/lib/apache2/site/enabled_by_admin/default-ssl.conf

# Expose HTTP and HTTPS
EXPOSE 80 443

ENTRYPOINT ["sh", "-c", "nginx && php-fpm"]