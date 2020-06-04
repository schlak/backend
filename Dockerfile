FROM node:14-alpine

COPY / /app
WORKDIR /app

VOLUME ["/app/music"]

RUN npm install
RUN npm install -g pm2

ENV PORT 80
EXPOSE 80

CMD ["pm2", "start", "index.js", "--no-daemon"]
