const server = require("./api/server");
const io = require("./socket/server");

// Api server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n=== API listening on port ${PORT} ===\n`);
});

// Socket server
const PORT_SOCKET = process.env.PORT_SOCKET || 5001;
io.attach(PORT_SOCKET, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
});
