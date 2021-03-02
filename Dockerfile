FROM node:current-alpine

WORKDIR /usr/app

COPY package.json yarn.lock ./
RUN ["yarn", "install", "--production"]

COPY dist dist

EXPOSE 4000

ENTRYPOINT ["node", "dist/startServer.js"]
