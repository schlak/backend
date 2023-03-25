FROM node:14-alpine


WORKDIR /app
ADD . .

#COPY / /app


VOLUME ["/app/music"]

RUN npm install
RUN npm install -g pm2

ENV PORT 80
ENV PORT_SOCKET 8000
EXPOSE 80
EXPOSE 8000


CMD ["pm2", "start", "bin/index.js", "--no-daemon"]
