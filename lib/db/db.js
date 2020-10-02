const { MongoClient } = require("mongodb");
const debug = require("debug")("mongodb");

/*
 * Connect to MongoDB instance
 */
async function connect(uri) {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    // const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Connect to the MongoDB cluster
    await client.connect();

    return client;
}

/*
 * Checks if MongoDB collection exists
 */
async function doesCollectionExist(db, collection) {
    const collections = await db.collections();
    if (!collections.map((c) => c.s.namespace.collection).includes(collection))
        return false;
    return true;
}

/*
 * Create MongoDB collection (if it does not already exist)
 */
async function createCollection(db, collection) {
    const collectionExists = await doesCollectionExist(db, collection);
    if (!collectionExists) {
        db.createCollection(collection, function (err, res) {
            if (err) throw err;
            debug(`collection created: ${collection}`);
        });
    }
}

/*
 * Create multiple collections
 */
async function createMultipleCollections(db, collections = []) {
    for (let c in collections) {
        await createCollection(db, collections[c]);
    }
}

/*
 * Creates required collections for bugcatch to operate
 */
async function createRequiredCollections(
    uri,
    collections = ["stats"]
) {
    const client = await connect(uri);
    const db = client.db("music-library");

    await createMultipleCollections(db, collections);

    // client.close();
}

module.exports = {
    connect,
    doesCollectionExist,
    createCollection,
    createMultipleCollections,
    createRequiredCollections
};
