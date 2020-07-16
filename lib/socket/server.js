const Socket = require("socket.io");
const debug = require("debug")("socket.io");

const io = new Socket();

// Array of user sessions
let sessions = [];

// Add new user session
function addSession(id) {
    sessions.push({
        id: id,
        playing: -1
    });
}

// Remove user's session
function removeSession(id) {
    sessions = sessions.filter(user => {
        return user.id !== id
    });
}

// Update playing track
function updatePlaying(id, track) {
    const index = sessions.findIndex(user => user.id === id);
    sessions[index].playing = track;
}

// Send array of currently playing tracks
function sendSurrentlyPlayingTracks() {
    const playing = sessions.filter(user => {
        return user.playing !== -1;
    });

    io.emit("global_tracks_playing", playing);
}

// Sent total connected user count to all users
function sendUserCount() {
    io.emit("connected_count", io.engine.clientsCount);
}

io.on("connection", (socket) => {
    debug("user connected:", socket.id);

    addSession(socket.id);
    sendSurrentlyPlayingTracks();
    sendUserCount();

    socket.on("play_track", (payload) => {
        debug("new track:", payload);

        updatePlaying(socket.id, payload.track);
        sendSurrentlyPlayingTracks();
    });

    socket.on("disconnect", () => {
        debug("user disconnected:", socket.id);

        removeSession(socket.id);
        sendSurrentlyPlayingTracks();
        sendUserCount();
    });
});

module.exports = io;
