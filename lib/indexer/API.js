"use strict";

const files = require("./Files");
const index = require("./Index");
const metadata = require("./Metadata");
const cache = require("./Cache");

/**
 * Main object to be imported - a bundle of all classes and utils
 */
module.exports = {
    files,
    index,
    metadata,
    cache
};
