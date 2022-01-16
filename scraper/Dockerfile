FROM node:16.13.1-alpine
WORKDIR /app

RUN npm install -g npm@8.1.1

COPY package.json package-lock.json /app/
RUN npm install --production

COPY dist/ /app/build

EXPOSE 3001

ENTRYPOINT ["node", "build/src/server.js"]
