const Socket = require("socket.io");
const debug = require("debug")("socket.io");

const io = new Socket();

// Sent total connected user count to all users
function sendUserCount() {
    io.emit("connected_count", io.engine.clientsCount);
}

io.on("connection", (socket) => {
    debug("user connected:", socket.id);

    sendUserCount();

    socket.on("disconnect", () => {
        debug("user disconnected:", socket.id);

        sendUserCount();
    });
});

module.exports = io;
