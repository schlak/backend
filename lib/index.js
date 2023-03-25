const http = require("http");
const app = require("./api/server");
const io = require("./socket/server");

const server = http.createServer(app);
const ioServer = io.listen(server);

// Api server
const PORT = process.env.PORT || 800;
//console.log(process.env)
//process.env['DATA_DIR'] = process.env.DATA_DIR || "";
process.env['MUSIC_DIR'] = process.env.MUSIC_DIR; 
server.listen(PORT, () => {
    console.log(`\n=== API listening on port ${PORT} ===\n`);
});

