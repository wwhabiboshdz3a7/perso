FROM node:22-alpine
RUN apk add --no-cache git && mkdir /data && chown node:node /data
WORKDIR /app
COPY package.json server.js cli.js ./
COPY lib ./lib
COPY public ./public
ENV DATA_DIR=/data PORT=8080
VOLUME /data
EXPOSE 8080
USER node
CMD ["node", "server.js"]
