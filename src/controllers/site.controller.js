const { getDB } = require('../config/dbConfig');

exports.getSiteLayoutSettings = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('site_settings');

        const doc = await collection.findOne({ type: 'layout' }, {
            projection: { _id: 0, lastUpdated: 0 }
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: 'Site layout settings not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: doc
        });
    } catch (err) {
        console.error('Failed to fetch site layout settings:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
