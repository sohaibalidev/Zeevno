const { getDB } = require('../config/dbConfig');

exports.allCategories = async (req, res) => {
    try {
        const db = getDB();
        const productsCollection = db.collection('products');

        const categories = await productsCollection.aggregate([
            {
                $match: {
                    category: { $exists: true, $ne: null },
                    "media.primaryImage": { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    sampleImage: { $first: "$media.primaryImage" },
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalProducts: 1,
                    sampleImage: 1
                }
            },
            {
                $sort: { category: 1 }
            }
        ]).toArray();

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Error in allCategories:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
        });
    }
}

exports.relatedProducts = async (req, res) => {
    try {
        const { productId } = req.params;

        const db = getDB();
        const productsCollection = db.collection('products');

        const currentProduct = await productsCollection.findOne(
            { id: productId },
            { projection: { category: 1 } }
        );

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
            });
        }

        const related = await productsCollection.aggregate([
            {
                $match: {
                    category: currentProduct.category,
                    id: { $ne: productId }
                }
            },
            { $sample: { size: 4 } }
        ]).toArray();

        res.json({
            success: true,
            data: related,
        });
    } catch (err) {
        console.error('Error in relatedProducts:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error. Failed to fetch related products.',
        });
    }
}

exports.productsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 1000 } = req.query;

        const db = getDB();
        const productsCollection = db.collection('products');
        const reviewsCollection = db.collection('reviews');

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await productsCollection.countDocuments({ category });

        const products = await productsCollection.find(
            { category },
            {
                projection: {
                    _id: 0,
                    metadata: 0
                }
            }
        )
            .skip(skip)
            .limit(limitNum)
            .toArray();

        const productsWithReviews = await Promise.all(
            products.map(async product => {
                const review_Ids = product.specifications?.reviewIds || [];

                const reviews = await reviewsCollection.find(
                    { reviewId: { $in: review_Ids } },
                    { projection: { _id: 0, email: 0 } }
                ).toArray();

                const { specifications, media, variants, isFeatured, inventory, createdAt, ...rest } = product;
                const rating = reviews.length > 0
                    ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length * 2) / 2
                    : 0;

                const cleanProduct = {
                    ...rest,
                    media: {
                        primaryImage: media.primaryImage
                    },
                    reviews: {
                        total: reviews.length,
                        rating: Math.round(rating * 10) / 10
                    }
                };

                return cleanProduct;
            })
        );

        res.status(200).json({
            success: true,
            pagination: {
                totalItems: total,
                currentPage: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            },
            data: productsWithReviews
        });

    } catch (err) {
        console.error('Error in productsByCategory:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
        });
    }
}
