const Socket = require('socket.io');

const io = new Socket();

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

module.exports = io;
