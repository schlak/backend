"use strict";

const walk = require("walkdir");
const files = require("./Files");

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
                let epath = path.split("\\");
                epath = epath[epath.length - 1];
                indexNew.push(epath);
            }
        });

        // Update actual index with new one
        this.index = [...indexNew];
    }
}

module.exports = new Index();
