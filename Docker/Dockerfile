FROM alpine:latest AS build

# Update packages and install dependencies
RUN apk update && apk upgrade && apk add --no-cache \
	make \
    openjdk21 \
    openssl \
	&& rm -rf /var/cache/apk/*

COPY . /cstimer
WORKDIR /cstimer

# Either build and serve dist or serve local
ARG DEPLOY=1
RUN if [[ "$DEPLOY" -eq 1 ]]; then \
        echo "=== Building production dist files ===" && \
        mkdir -p dist/css dist/js dist/lang && \
        make all && \
        echo "=== Build completed successfully ===" && \
        ls -la dist/ && \
        echo "=== Dist contents ==="; \
    else \
        echo "Development mode - clearing dist files" && \
        rm -rf dist/*; \
    fi

# Start a new image to avoid the cruft of java stuff required to build above
FROM php:fpm-alpine

COPY --from=build /cstimer/dist /cstimer/dist
COPY --from=build /cstimer/src /cstimer/src
COPY --from=build /cstimer/Docker/ssl-selfsigned.crt /cstimer/Docker/ssl-selfsigned.crt
COPY --from=build /cstimer/Docker/ssl-selfsigned.key /cstimer/Docker/ssl-selfsigned.key

RUN apk update && apk upgrade && apk add --no-cache \
	nginx \
    openssl \
	&& rm -rf /var/cache/apk/* \
	&& find /bin -type f ! -name "sed" ! -name "sh" ! -name "busybox" -exec rm -v {} + \
	&& find /usr/bin -type f ! -name "sed" ! -name "sh" -exec rm -v {} +

# Optimize PHP-FPM for faster startup and better cold start performance
RUN echo "pm = static" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "pm.max_children = 3" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "pm.start_servers = 3" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "pm.process_idle_timeout = 60s" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "request_terminate_timeout = 300s" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/www.conf
    
# Configure the host with nginx (Cloud Run optimized)
COPY ./Docker/default-conf /etc/nginx/http.d/default.conf

# Add health check endpoint
RUN echo '<?php http_response_code(200); echo "OK"; ?>' > /cstimer/dist/health.php \
    && echo '<?php http_response_code(200); echo "OK"; ?>' > /cstimer/src/health.php

ARG DEPLOY=1
RUN [[ "$DEPLOY" -eq 1 ]] || sed -i 's|/cstimer/dist|/cstimer/src|g' /etc/nginx/http.d/default.conf
RUN [[ "$DEPLOY" -eq 0 ]] || sed -i 's|index index.php|index timer.php|g' /etc/nginx/http.d/default.conf

# Expose HTTP only (Cloud Run handles HTTPS)
EXPOSE 80

ENTRYPOINT ["sh", "-c", "nginx && php-fpm"]