const router = require("express").Router();
const fs = require("fs");
const chokidar = require("chokidar");
const { files, index, metadata } = require("../indexer/API");

// Path to music
const musicDir = process.env.MUSIC_DIR || "./music";

// Populate index
let musicIndex = index.populate(musicDir);

// Populate metadata
musicIndex.forEach((track, i) => {
    metadata.basic(track.path)
        .then(trackMetadata => {
            musicIndex[i]["metadata"] = trackMetadata;
            console.log({
                id: musicIndex[i]["id"],
                title: musicIndex[i]["metadata"]["title"]
            });
        });
});

// chokidar.watch(musicDir).on("all", (event, path) => {
//     // console.log(event, path);
// });

router.get("/tracks", async (req, res, next) => {
    res.send(musicIndex.map((track) => {
        return {
            id: track.id,
            metadata: track.metadata
        }
    }));
});

/*
 * Get individual track metadata
 */
router.get("/tracks/:id", async (req, res, next) => {
    // Find track within index via id
    const track = musicIndex.find((track, array) => track.id === req.params.id);
    res.send({
        id: track.id,
        metadata: track.metadata
    });
});

/*
 * Get album cover for audio file
 */
router.get("/tracks/:id/cover", async (req, res, next) => {
    // Find track within index via id
    const track = musicIndex.find((track, array) => track.id === req.params.id);
    const cover = await metadata.cover(track.path);

    res.set("Content-Type", cover.format);
    res.send(cover.data);
});

/*
 * Stream audio file
 */
router.get("/tracks/:id/audio", async (req, res, next) => {
    // Find track within index via id
    const track = musicIndex.find((track, array) => track.id === req.params.id);

    res.set("Content-Type", "audio/flac");
    fs.createReadStream(track.path).pipe(res);
});

module.exports = router;
