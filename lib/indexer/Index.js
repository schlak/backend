"use strict";

const debug = require("debug")("indexer");
const crypto = require("crypto");
const walk = require("walkdir");
const files = require("./Files");
const metadata = require("./Metadata");

/**
 * Index helper functions;
 */
class Index {
    constructor() {
        this.index = [];
    }

    get() {
        return this.index;
    }

    populate(pathToIndex) {
        debug(`start  populate: ${pathToIndex}`);

        // New temp index
        // doesn't overwrite actual index until fully populated
        const indexNew = [];

        // Scan entire music directory
        console.log(pathToIndex);
        walk.sync(pathToIndex, function (path, stat) {
            // Only scan for audio files
            if (files.isFile(path) && files.isTypeAudio(path)) {
                // Create a unique track-id
                // -> hash the full-path to file
                const trackId = crypto.createHash("sha1").update(path).digest("hex");

                indexNew.push({
                    id: trackId,
                    path: path,
                });
            }
        });

        // Update actual index with new one
        this.index = [...indexNew];

        debug(`end    populate: ${pathToIndex}`);

        // Return updated index
        return this.index;
    }
}

module.exports = new Index();
