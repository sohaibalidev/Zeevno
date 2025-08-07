const { MongoClient } = require('mongodb');
const config = require('./appConfig');

let db;

async function connectDB() {
    if (db) return db;

    try {
        const client = await MongoClient.connect(config.MONGODB_URI);
        db = client.db(config.DB_NAME);
        console.log('Connected to MongoDB');
        return db;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

function getDB() {
    if (!db) throw new Error('Database not initialized');
    return db;
}

module.exports = { connectDB, getDB };