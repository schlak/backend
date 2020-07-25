"use strict";

const fs = require("fs");

/**
 * File helper functions;
 */
class Files {
    constructor() {}

    /**
     * Check if a file/directory exists (synchronously)
     */
    exists(path) {
        if (fs.existsSync(path)) return true;
        return false;
    }

    /**
     * Check if item is a file
     */
    isFile(path) {
        return this.exists(path) && fs.lstatSync(path).isFile();
    }

    /**
     * Check if item is a directory
     */
    isDirectory(path) {
        return this.exists(path) && fs.lstatSync(path).isDirectory();
    }

    /**
     * Create individual directory (synchronously)
     *
     * @param {String}   path            Path of directory to create
     */
    mkdir(path) {
        // Create directory if it does not exist
        if (!this.isDirectory(path)) fs.mkdirSync(path);
    }

    /**
     * Check if file is a music file
     */
    isTypeAudio(path) {
        // Filter for music file extensions
        if (
            path.substr(path.length - 5) === ".flac" ||
            path.substr(path.length - 4) === ".mp3" ||
            path.substr(path.length - 4) === ".ogg"
        ) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = new Files();
