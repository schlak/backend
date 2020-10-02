const { MongoClient } = require("mongodb");
const database = require("./db");
const debug = require("debug")("database:actions");

/*
 * Init Database
 */
async function initDatabase(uri) {
    // Create required collections
    await database.createRequiredCollections(uri);
}

/*
 * Fetch stats
 */
async function fetchStats(uri) {
    const client = await database.connect(uri);
    const db = client.db("music-library");

    // Search db for all stats
    return await db
        .collection("stats")
        .find({}).toArray();
}

/*
 * Update track stats
 */
async function updateTrackStats(uri, track) {
    const client = await database.connect(uri);
    const db = client.db("music-library");

    // Search db if track object exists
    const trackDB = await db
        .collection("stats")
        .findOne({ uid: track.id });

    if (trackDB) {
        // Update track stats
        db.collection("stats").updateOne(
            { uid: track.id },
            { $set: {
                timesPlayed: trackDB.timesPlayed + 1,
                lastPlayed: Date.now()
            } }
        );

    } else {
        // Add track to db (if track not found in db)
        debug("track added to stats collection");
        db.collection("stats").insertOne({
            uid: track.id,
            timesPlayed: 1,
            lastPlayed: Date.now()
        });
    }
}

module.exports = {
    initDatabase,
    fetchStats,
    updateTrackStats
};
