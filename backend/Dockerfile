FROM node:20.18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci
RUN npm install -g pm2

COPY . .

EXPOSE 4005

CMD ["pm2-runtime", "server.js", "-i", "4"]