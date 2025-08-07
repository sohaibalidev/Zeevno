const { MongoClient } = require('mongodb');
const config = require('./appConfig');

let db, client;

exports.connectDB = async () => {
    if (db) return db;
    try {
        client = await MongoClient.connect(config.MONGODB_URI);
        db = client.db(config.DB_NAME);
        console.log('Connected to MongoDB');
        return db;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

exports.getDB = () => {
    if (!db) throw new Error('Database not initialized');
    return db;
}