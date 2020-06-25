"use strict";

const debug = require("debug")("metadata");
const fs = require("fs");
const path = require("path");
const util = require("util");
const musicMetadata = require("music-metadata-browser");

/**
 * Audio Metadata helper functions;
 */
class Metadata {
    constructor() {}

    async get(filePath) {
        // Open file as a stream
        let fileStream = fs.createReadStream(filePath);

        // Pipe file stream into metadata parser
        // -> returns all audio metadata
        const metadata = await musicMetadata.parseNodeStream(fileStream);
        fileStream.destroy();

        debug(`get  ${this.getTag(metadata, "title")}`);

        // console.log(util.inspect(metadata, { showHidden: false, depth: null }));
        return metadata;
    }

    getTag(metadata, tag, fallback = "~") {
        switch(tag) {
            case "track":
                // Destructure track out of object
                // Fallback to '1' if no value found
                let track = metadata["common"][tag] || {"no": 1};
                track = track["no"] || 1;
                return track;

            case "title":
                // Fallback to filename
                const filename = path.basename(fallback, path.extname(fallback));
                return metadata["common"][tag] || filename;

            case "genre":
                // Destructure track out of array
                const genre = metadata["common"][tag] || [fallback];
                if (genre.length === 0) genre.push(fallback);
                return genre[0];

            case "duration":
                return metadata["format"][tag] || fallback;

            default:
                return metadata["common"][tag] || fallback;
        }
    }

    async basic(filePath) {
        const metadata = await this.get(filePath);
        return {
            track: this.getTag(metadata, "track"),
            title: this.getTag(metadata, "title", filePath),
            artist: this.getTag(metadata, "artist"),
            album_artist: this.getTag(metadata, "albumartist"),
            album: this.getTag(metadata, "album"),
            year: this.getTag(metadata, "year"),
            genre: this.getTag(metadata, "genre"),
            duration: this.getTag(metadata, "duration", 0),
        };
    }

    async cover(filePath) {
        const metadata = await this.get(filePath);
        return metadata["common"]["picture"][0];
    }
}

module.exports = new Metadata();
