FROM node:20.9.0-alpine

WORKDIR /app

COPY package*.json ./

COPY apps/atomic-network/package.json ./apps/atomic-network/package.json

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "apps/atomic-network/index.js" ]