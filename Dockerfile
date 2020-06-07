FROM node:14-alpine

COPY / /app
WORKDIR /app

VOLUME ["/app/music"]

RUN npm install
RUN npm install -g pm2

ENV PORT 80
ENV PORT_SOCKET 8000
EXPOSE 80
EXPOSE 8000

CMD ["pm2", "start", "index.js", "--no-daemon"]
