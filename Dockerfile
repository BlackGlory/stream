FROM denoland/deno:alpine-1.31.3 AS builder
WORKDIR /usr/src/app

RUN apk add --update --no-cache \
      # healthcheck
      curl

COPY . ./

RUN deno cache src/main.ts

ENV STREAM_HOST=0.0.0.0
ENV STREAM_PORT=8080
EXPOSE 8080
HEALTHCHECK CMD curl --fail http://localhost:8080/health || exit 1
CMD ["run", "--allow-net", "--allow-env", "src/main.ts"]
