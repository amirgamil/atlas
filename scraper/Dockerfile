FROM node:16.13.1-alpine
WORKDIR /app

RUN npm install -g npm@8.1.1

COPY package.json package-lock.json /app/
RUN npm install --production

COPY dist/ /app/build

ENTRYPOINT ["node", "/app/dist/src/server.js"]
