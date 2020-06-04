"use strict";

const pkg = require("../package.json");

const files = require("./Files");
const index = require("./Index");
const metadata = require("./Metadata");

/**
 * Main object to be imported - a bundle of all classes and utils
 */
module.exports = {
    pkg,
    files,
    index,
    metadata,
};
