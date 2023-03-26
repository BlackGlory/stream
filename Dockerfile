FROM node:16-alpine AS builder
WORKDIR /usr/src/app
COPY package.json yarn.lock ./

RUN yarn install \
 && yarn cache clean

COPY . ./

RUN yarn build \
 && yarn bundle

FROM node:16-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY package.json yarn.lock ./

RUN yarn install --production \
 && yarn cache clean \
 && apk add --update --no-cache \
      # healthcheck
      curl

COPY . ./

ENV STREAM_HOST=0.0.0.0
ENV STREAM_PORT=8080
EXPOSE 8080
HEALTHCHECK CMD curl --fail http://localhost:8080/health || exit 1
ENTRYPOINT ["yarn"]
CMD ["--silent", "start"]
