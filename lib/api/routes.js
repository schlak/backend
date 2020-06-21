const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const cron = require("cron");
const sharp = require("sharp");
const mime = require("mime-types")
const { findIndex } = require("lodash");
const { files, index, metadata } = require("../indexer/API");

// Path to music
const musicDir = process.env.MUSIC_DIR || "./music";

// Populate index
let musicIndex = [];
populateIndexAndMetadata();

// Re-index every 12 hours
// cron stamps:
// -> 0 */12 * * * : every 12 hours
const reIndex = new cron.CronJob("0 */12 * * *", function() {
    populateIndexAndMetadata();
}, null, true, "Europe/London");
reIndex.start();

/*
 * Returns all tracks
 */
router.get("/tracks", isIndexComplete(), async (req, res, next) => {
    res.send(
        musicIndex.map((track) => {
            return {
                id: track.id,
                metadata: track.metadata,
            };
        })
    );
});

/*
 * Returns individual track metadata
 */
router.get("/tracks/:id", isIndexComplete(), validateTrackId(), async (req, res, next) => {
    // Find track within index via id
    const track = musicIndex.find((track, array) => track.id === req.params.id);
    res.send({
        id: track.id,
        metadata: track.metadata,
    });
});

/*
 * Returns album cover for audio file
 */
router.get("/tracks/:id/cover/:size?", async (req, res, next) => {
    let cover;

    try {
        // Find track within index via id
        const track = musicIndex.find((track, array) => track.id === req.params.id);
        cover = await metadata.cover(track.path);
    } catch (error) {
        // Load placeholder image
        cover = {};
        cover.data = fs.readFileSync("./assets/image-placeholder.jpg");
    }

    if (req.params.size) {
        // Resize image on-the-fly
        const size = parseInt(req.params.size);
        const resizedCover = await sharp(cover.data)
            .resize(size, size)
            .jpeg({ quality: 88 })
            .toBuffer();
        cover.data = resizedCover;
    }

    res.set("Content-Type", cover.format);
    res.send(cover.data);
});

/*
 * Returns all tracks sorted into albums
 */
router.get("/albums", isIndexComplete(), async (req, res, next) => {
    const albums = [];

    // Loop each track
    // populate albums array
    musicIndex.forEach((track, i) => {
        let found = false;

        // Loop albums array
        // Search for matching album data
        albums.forEach((album, i) => {
            if (track.metadata.album === album.album &&
                track.metadata.album_artist === album.album_artist) {
                    albums[i].tracks.push({
                        id: track.id,
                        metadata: track.metadata
                    });

                    found = true;
            }
        });

        // If nothing found
        // create new album
        if (!found) {
            return albums.push({
                album: track.metadata.album,
                album_artist: track.metadata.album_artist,
                year: track.metadata.year,
                tracks: [
                    {
                        id: track.id,
                        metadata: track.metadata
                    }
                ]
            });
        }
    });

    res.send(albums);
});

/*
 * Stream audio file
 */
router.get("/tracks/:id/audio", validateTrackId(), async (req, res, next) => {
    // Find track within index via id
    const track = musicIndex.find((track, array) => track.id === req.params.id);
    const mimeType = mime.contentType(path.extname(track.path));

    res.set("Content-Type", mimeType);
    fs.createReadStream(track.path).pipe(res);
});

/*
 * Check if track-id exists within the index
 * stops the request and returns an error message
 */
function validateTrackId() {
    return (req, res, next) => {
        if (req.params && req.params.id) {
            if (findIndex(musicIndex, { id: req.params.id }) !== -1) {
                next();
            } else {
                res.status(400).json({
                    error: "invalid track-id",
                    msg: "try getting all tracks: /tracks"
                });
            }
        } else {
            res.status(400).json({
                error: "invalid track-id",
                msg: "try getting all tracks: /tracks"
            });
        }
    };
}

/*
 * Check if index is complete: prevents incomplete data being sent
 * stop request if false
 */
function isIndexComplete() {
    return (req, res, next) => {
        if (musicIndex[musicIndex.length - 1].metadata) {
            next();
        } else {
            res.status(500).json([]);
        }
    };
}

/*
 * Populate full index
 * index + metadata
 */
function populateIndexAndMetadata() {
    // Index
    musicIndex = index.populate(musicDir);

    // Populate metadata
    musicIndex.forEach((track, i) => {
        metadata.basic(track.path).then((trackMetadata) => {
            musicIndex[i]["metadata"] = trackMetadata;
        });
    });
}

module.exports = router;
