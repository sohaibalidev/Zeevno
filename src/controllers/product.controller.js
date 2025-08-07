const { getDB } = require('../config/dbConfig');

exports.getProducts = async (req, res) => {
    try {
        const db = getDB();
        const productsCollection = db.collection('products');
        const reviewsCollection = db.collection('reviews');

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                error: 'Page and limit must be positive integers'
            });
        }

        const skip = (page - 1) * limit;
        const totalProducts = await productsCollection.countDocuments();

        if (skip >= totalProducts && totalProducts !== 0) {
            return res.status(404).json({
                success: false,
                error: 'Page exceeds total number of products'
            });
        }

        const products = await productsCollection
            .find().skip(skip).limit(limit).toArray();

        const filteredProducts = await Promise.all(products.map(async (p) => {
            const { _id, metadata, specifications, ...rest } = p;
            const { reviewIds = [], ...restSpecifications } = specifications || {};

            const reviews = await reviewsCollection
                .find({ reviewId: { $in: reviewIds } }, { projection: { _id: 0, email: 0, reviewId: 0 } })
                .toArray();

            const rating = reviews.length > 0
                ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length * 2) / 2
                : 0;

            return {
                ...rest,
                reviews: {
                    total: reviews.length,
                    rating: Math.round(rating * 10) / 10
                },
                specifications: restSpecifications,
            };
        }));

        res.json({
            success: true,
            data: {
                products: filteredProducts,
                pagination: {
                    total: totalProducts,
                    page,
                    limit,
                    totalPages: Math.ceil(totalProducts / limit),
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (err) {
        console.error('Error in getProducts:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error. Failed to fetch products.'
        });
    }
}

exports.getProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const db = getDB();
        const productsCollection = db.collection('products');
        const reviewsCollection = db.collection('reviews');

        const product = await productsCollection.findOne({ id: productId });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const review_Ids = product.specifications?.reviewIds || [];

        const reviews = await reviewsCollection.find(
            { reviewId: { $in: review_Ids } }, { projection: { _id: 0, email: 0, reviewId: 0 } }
        ).toArray();

        const { _id, createdAt, metadata, specifications, ...rest } = product;
        const { reviewIds, ...restSpecifications } = specifications

        const rating = reviews.length > 0
            ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length * 2) / 2
            : 0;

        const cleanProduct = {
            ...rest,
            specifications: restSpecifications,
            reviews: {
                total: reviews.length,
                rating: Math.round(rating * 10) / 10,
                list: reviews
            }
        }

        res.status(200).json({
            success: true,
            data: cleanProduct
        });

    } catch (err) {
        console.error('Error in getProduct:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error. Failed to fetch product.'
        });
    }
}

exports.getFeaturedProducts = async (req, res) => {
    try {
        const db = getDB()
        const productsCollection = db.collection('products')
        const reviewsCollection = db.collection('reviews');

        const products = await productsCollection
            .find(
                { isFeatured: true },
                {
                    projection: {
                        _id: 0,
                        metadata: 0
                    }
                }
            ).sort({ createdAt: -1 }).limit(10).toArray();

        const productsWithReviews = await Promise.all(
            products.map(async product => {
                const review_Ids = product.specifications?.reviewIds || [];

                const reviews = await reviewsCollection.find(
                    { reviewId: { $in: review_Ids } },
                    { projection: { _id: 0, email: 0 } }
                ).toArray();

                const { specifications, media, variants, isFeatured, inventory, createdAt, ...rest } = product;
                const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
                const rating = Math.round(avg * 2) / 2;

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

        res.send(productsWithReviews)

    } catch (error) {
        console.log('Error in getFeaturedProducts:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// --------- WILL ADD LATER ---------
exports.addProduct = async (req, res) => { }

exports.updateProduct = async (req, res) => { }

exports.deleteProduct = async (req, res) => { }
