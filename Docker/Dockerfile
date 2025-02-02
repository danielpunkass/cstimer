FROM alpine:latest AS build

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
RUN [[ "$DEPLOY" -eq 1 ]] && make dist || rm -rf dist/*

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
    
# Configure the host with nginx
COPY ./Docker/default-conf /etc/nginx/http.d/default.conf

ARG DEPLOY=1
RUN [[ "$DEPLOY" -eq 1 ]] || sed -i 's|/cstimer/dist|/cstimer/src|g' /etc/nginx/http.d/default.conf
RUN [[ "$DEPLOY" -eq 0 ]] || sed -i 's|index index.php|index timer.php|g' /etc/nginx/http.d/default.conf

# Expose HTTP and HTTPS
EXPOSE 80 443

ENTRYPOINT ["sh", "-c", "nginx && php-fpm"]