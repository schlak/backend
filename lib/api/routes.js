const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const crypto = require("crypto");
// const chokidar = require("chokidar");
const cron = require("cron");
const sharp = require("sharp");
const mime = require("mime-types");
const { findIndex } = require("lodash");
const { files, index, metadata, cache } = require("../indexer/API");

// Path to music
const musicDir = process.env.MUSIC_DIR || "./music";

// Populate index
let musicIndex = [];
populateIndexAndMetadata();

// Re-index every 12 hours
// cron stamps:
// -> 0 */12 * * * : every 12 hours
// -> 0 0 * * *    : at 00:00
const reIndex = new cron.CronJob(
    "0 0 * * *",
    function () {
        cache.replace(JSON.stringify(musicIndex), "metadata.json", ".");
        populateIndexAndMetadata();
    },
    null,
    true,
    "Europe/London"
);
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
                stats: track.stats,
            };
        })
    );
});

/*
 * Returns individual track metadata
 */
router.get(
    "/tracks/:id",
    isIndexComplete(),
    validateTrackId(),
    async (req, res, next) => {
        // Find track within index via id
        const track = musicIndex.find(
            (track, array) => track.id === req.params.id
        );
        res.send({
            id: track.id,
            metadata: track.metadata,
        });
    }
);

router.post(
    "/tracks/:id/addToPlaylist/:playlist",
    isIndexComplete(),
    validateTrackId(),
    async (req, res, next) => {
        // Find track within index via id
        const track = musicIndex.find(
            (track, array) => track.id === req.params.id
        );
        track.metadata.playlistCollection.push(req.params.playlist)
        // Cache tracks index + metadata + stats
        cache.replace(JSON.stringify(musicIndex), "metadata.json", ".");
        console.log(track);
        res.send({
            id: track.id,
            metadata: track.metadata,
        });
    }
);

router.post(
    "/tracks/:id/removeFromPlaylist/:playlist",
    isIndexComplete(),
    validateTrackId(),
    async (req, res, next) => {
        // Find track within index via id
        const track = musicIndex.find(
            (track, array) => track.id === req.params.id
        );
        track.metadata.playlistCollection = track.metadata.playlistCollection.filter(assignedPlaylist => { req.params.playlist !== assignedPlaylist })
        // Cache tracks index + metadata + stats
        cache.replace(JSON.stringify(musicIndex), "metadata.json", ".");
        console.log(track);
        res.send({
            id: track.id,
            metadata: track.metadata,
        });
    }
);

/*
 * Returns album cover for audio file
 */
router.get("/tracks/:id/cover/:size?", async (req, res, next) => {
    let cover;
    let albumId = "image-placeholder";

    try {
        // Find track within index via id
        const track = musicIndex.find(
            (track, array) => track.id === req.params.id
        );
        albumId = crypto.createHash("sha1").update(track.metadata.album + track.metadata.album_artist).digest("hex");

        if (cache.exists(`${albumId}/image.jpg`)) {
            cover = { format: "image/jpg" };
            cover.data = cache.get(`${albumId}/image.jpg`);
        } else {
            cover = await metadata.cover(track.path);

            // if (!cover) throw "track does not have a cover";

            cache.add(cover.data, `image.jpg`, albumId);
        }
    } catch (error) {
        // Load placeholder image
        cover = { format: "image/jpg" };
        cover.data = fs.readFileSync("./assets/image-placeholder.jpg");
    }

    if (req.params.size) {
        // Resize image on-the-fly
        if (cache.exists(`${albumId}/${req.params.size}.jpg`)) {
            cover.data = cache.get(`${albumId}/${req.params.size}.jpg`);
        } else {
            const size = parseInt(req.params.size);
            const resizedCover = await sharp(cover.data)
                .resize(size, size)
                .jpeg({ quality: 90 })
                .toBuffer();
            cover.data = resizedCover;

            cache.add(cover.data, `${req.params.size}.jpg`, albumId);
        }
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
            if (
                track.metadata.album === album.album &&
                track.metadata.album_artist === album.album_artist
            ) {
                albums[i].tracks.push({
                    id: track.id,
                    metadata: track.metadata,
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
                genre: track.metadata.genre,
                year: track.metadata.year,
                tracks: [
                    {
                        id: track.id,
                        metadata: track.metadata,
                    },
                ],
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
    const trackIndex = findIndex(musicIndex, { id: req.params.id });
    const track = musicIndex[trackIndex];
    const filePath = track.path;

    let mimeType = mime.contentType(path.extname(filePath));
    if (mimeType === "audio/x-flac") mimeType = "audio/flac";

    // Update stats
    track.stats = {
        timesPlayed: track.stats.timesPlayed + 1,
        lastPlayed: Date.now(),
    };

    let stat = fs.statSync(filePath);
    let total = stat.size;
    if (req.headers.range) {
        let range = req.headers.range;
        let parts = range.replace(/bytes=/, "").split("-");
        let partialstart = parts[0];
        let partialend = parts[1];

        let start = parseInt(partialstart, 10);
        let end = partialend ? parseInt(partialend, 10) : total - 1;
        let chunksize = end - start + 1;
        let readStream = fs.createReadStream(filePath, {
            start: start,
            end: end,
        });
        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": mimeType,
        });
        readStream.pipe(res);
    } else {
        res.writeHead(200, {
            "Content-Length": total,
            "Content-Type": mimeType,
        });
        fs.createReadStream(filePath).pipe(res);
    }
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
                    msg: "try getting all tracks: /tracks",
                });
            }
        } else {
            res.status(400).json({
                error: "invalid track-id",
                msg: "try getting all tracks: /tracks",
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
async function populateIndexAndMetadata() {
    // Index
    musicIndex = index.populate(musicDir);

    // Load cached index data
    const cachedIndex = JSON.parse(cache.get("metadata.json", "[]"));
    const playlistPresets = JSON.parse(cache.get("playlistPreset.json", "[]"));

    // Populate metadata
    for (i = 0; i < musicIndex.length; i++) {
        const track = musicIndex[i];

        // Find track in cache
        const cacheTrackIndex = findIndex(cachedIndex, { id: track.id });

        // Use cache if exists
        if (cacheTrackIndex !== -1) {
            musicIndex[i].metadata = cachedIndex[cacheTrackIndex].metadata;
            musicIndex[i].stats = cachedIndex[cacheTrackIndex].stats;
        }

        // Fetch metadata live if no cache (time and resource heavy)
        if (!musicIndex[i].metadata || !musicIndex[i].stats) {
            // Extract full track metadata
            const trackMetadata = await metadata.basic(track.path, playlistPresets);


            musicIndex[i]["metadata"] = trackMetadata;
            musicIndex[i]["stats"] = {
                timesPlayed: 0,
                lastPlayed: -1,
            };

            const albumId = crypto
                .createHash("sha1")
                .update(trackMetadata.album + trackMetadata.album_artist)
                .digest("hex");

            if (!cache.exists(`${albumId}/image.jpg`)) {
                metadata
                    .cover(track.path)
                    .then((cover) => {
                        if (cover) {
                            cache.add(cover.data, "image.jpg", albumId);
                        }
                    })
                    .catch((error) => { });
            }
        }
    }

    // Cache tracks index + metadata + stats
    cache.replace(JSON.stringify(musicIndex), "metadata.json", ".");
}

module.exports = router;
