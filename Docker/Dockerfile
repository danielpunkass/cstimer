FROM alpine:latest

# Update packages and install dependencies
RUN apk update && apk upgrade && apk add --no-cache \
	make \
    openjdk17 \
    openssl \
	&& rm -rf /var/cache/apk/*

COPY . /cstimer
WORKDIR /cstimer

# Either build and serve dist or serve local
ARG DEPLOY=1
RUN [[ "$DEPLOY" -eq 1 ]] && make dist || echo ""

# Start a new image to avoid the cruft of java stuff required to build above
FROM php:fpm-alpine

COPY --from=0 /cstimer /cstimer

RUN apk update && apk upgrade && apk add --no-cache \
	nginx \
    openssl \
	&& rm -rf /var/cache/apk/*
    
# Configure the host with nginx
COPY ./Docker/default-conf /etc/nginx/http.d/default.conf

ARG DEPLOY=1
RUN [[ "$DEPLOY" -eq 1 ]] || sed -i 's|/cstimer/dist|/cstimer/src|g' /etc/nginx/http.d/default.conf
RUN [[ "$DEPLOY" -eq 0 ]] || sed -i 's|index index.php|index timer.php|g' /etc/nginx/http.d/default.conf

# Expose HTTP and HTTPS
EXPOSE 80 443

ENTRYPOINT ["sh", "-c", "nginx && php-fpm"]