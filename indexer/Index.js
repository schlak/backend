"use strict";

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
        // New temp index
        // doesn't overwrite actual index until fully populated
        const indexNew = [];

        // Scan entire music directory
        walk.sync(pathToIndex, function (path, stat) {
            // Only scan for audio files
            if (files.isFile(path) && files.isTypeAudio(path)) {
                // Create a unique track-id
                const trackId = Buffer.from(crypto.randomBytes(8) + Date.now())
                    .toString("base64")
                    .replace(/[^a-zA-Z0-9]/g, "");

                indexNew.push({
                    id: trackId,
                    path: path
                });
            }
        });

        // Update actual index with new one
        this.index = [...indexNew];

        // Return updated index
        return this.index;
    }
}

module.exports = new Index();
