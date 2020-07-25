"use strict";

const debug = require("debug")("cache");
const fs = require("fs");
const files = require("./Files");
const metadata = require("./Metadata");

const dataDir = process.env.DATA_DIR || "./data";
const cacheDir = dataDir + "/cache" || "./data/cache";

files.mkdir(dataDir);
files.mkdir(cacheDir);

/**
 * Cache helper functions;
 */
class Cache {
    constructor() {
        this.cacheDir = cacheDir;
    }

    path() { return this.cacheDir; }
    pathFull(path) { return `${this.cacheDir}/${path}`; }

    exists(path) {
        return files.exists(this.pathFull(path));
    }

    get(path, fallback = false) {
        debug(`get: ${path}`);
        if (!this.exists(path)) return fallback;
        return fs.readFileSync(this.pathFull(path));
    }

    replace(content, name, path) {
        debug(`add: ${name}, ${path}`);
        files.mkdir(this.pathFull(path));
        fs.writeFileSync(`${this.pathFull(path)}/${name}`, content);
    }

    add(content, name, path) {
        if (!this.exists(`${path}/${name}`)) {
            this.replace(content, name, path);
        }
    }
}

module.exports = new Cache();
