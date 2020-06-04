"use strict";

const fs = require("fs");
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

        // console.log(util.inspect(metadata, { showHidden: false, depth: null }));
        return metadata;
    }

    async basic(filePath) {
        const metadata = await this.get(filePath);
        return {
            track: metadata["common"]["track"],
            title: metadata["common"]["title"],
            artist: metadata["common"]["artist"],
            album: metadata["common"]["album"],
            year: metadata["common"]["year"],
            genres: metadata["common"]["genre"]
        };
    }

    async cover(filePath) {
        const metadata = await this.get(filePath);
        return metadata["common"]["picture"][0];
    }
}

module.exports = new Metadata();
