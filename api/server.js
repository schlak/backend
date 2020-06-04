const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const server = express();

server.use(cors());
server.use(express.json());

server.use("/", routes);

// Base root welcome message
server.get("/", (req, res) => {
    res.send({
        message: "Hello World!",
        routes: [
            "/tracks",
            "/tracks/:id",
            "/tracks/:id/cover",
            "/tracks/:id/audio"
        ]
    });
});

// Fallback server error message
server.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        message: "somthing went wrong",
        success: false,
    });
});

module.exports = server;
