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

# Start a new image to avoid the cruft of java stuff required to build above
FROM php:fpm-alpine

COPY --from=0 /cstimer /cstimer

RUN apk update && apk upgrade && apk add --no-cache \
	nginx \
    openssl \
 #    && sed -i 's/^#LoadModule status_module modules\/mod_status.so/LoadModule status_module modules\/mod_status.so/' /usr/local/apache2/conf/httpd.conf \
	&& rm -rf /var/cache/apk/*
    
# Configure the host with nginx
COPY ./Docker/default-conf /etc/nginx/http.d/default.conf

# Expose HTTP and HTTPS
EXPOSE 80 443

ENTRYPOINT ["sh", "-c", "nginx && php-fpm"]