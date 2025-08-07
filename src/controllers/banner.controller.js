const { getDB } = require("../config/dbConfig");
const { ObjectId } = require('mongodb');

exports.getAllBanners = async (req, res) => {
    try {
        const db = getDB();
        const banners = await db.collection('banners')
            .find({}, { projection: { createdAt: 0 } })
            .sort({ order: 1 })
            .toArray();

        res.status(200).json({ success: true, data: banners });
    } catch (err) {
        console.error('getAllBanners error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getBannerById = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const banner = await db.collection('banners').findOne({ _id: new ObjectId(id) });

        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

        res.status(200).json({ success: true, data: banner });
    } catch (err) {
        console.error('getBannerById error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const db = getDB();
        const { imageUrl, title, order, link } = req.body;

        const newBanner = {
            imageUrl,
            title,
            order: Number(order) || 0,
            link: link || '',
            createdAt: new Date()
        };

        const result = await db.collection('banners').insertOne(newBanner);

        res.status(201).json({ success: true, data: { _id: result.insertedId, ...newBanner } });
    } catch (err) {
        console.error('createBanner error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { imageUrl, title, order, link } = req.body;

        const updateDoc = {
            ...(imageUrl && { imageUrl }),
            ...(title && { title }),
            ...(order !== undefined && { order: Number(order) }),
            ...(link && { link }),
        };

        const result = await db.collection('banners').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDoc }
        );

        if (result.matchedCount === 0)
            return res.status(404).json({ success: false, message: 'Banner not found' });

        res.status(200).json({ success: true, message: 'Banner updated successfully' });
    } catch (err) {
        console.error('updateBanner error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const result = await db.collection('banners').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0)
            return res.status(404).json({ success: false, message: 'Banner not found' });

        res.status(200).json({ success: true, message: 'Banner deleted successfully' });
    } catch (err) {
        console.error('deleteBanner error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
