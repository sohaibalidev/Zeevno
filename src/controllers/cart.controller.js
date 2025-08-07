const { validateProductId } = require("../utils/validators");
const { getDB } = require("../config/dbConfig");

exports.getCart = async (req, res) => {
    try {
        const { user } = req;
        const cart = user.cart || [];

        if (cart.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const db = getDB();
        const productsCollection = db.collection('products');
        const reviewsCollection = db.collection('reviews');

        const productIds = cart.map(item => item.productId);
        const products = await productsCollection
            .find(
                { id: { $in: productIds } },
                { projection: { _id: 0 } }
            )
            .toArray();

        const productsWithReviews = await Promise.all(
            products.map(async product => {
                const reviewIds = product.specifications?.reviewIds || [];

                const reviews = await reviewsCollection.find(
                    { reviewId: { $in: reviewIds } },
                    { projection: { _id: 0, email: 0 } }
                ).toArray();

                const rating = reviews.length > 0
                    ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length * 2) / 2
                    : 0;

                const cleanProduct = {
                    id: product.id,
                    category: product.category,
                    name: product.name,
                    pricing: product.pricing,
                    stock: product.inventory.stockQuantity,
                    media: {
                        primaryImage: product.media.primaryImage
                    },
                    reviews: {
                        total: reviews.length,
                        rating: Math.round(rating * 10) / 10
                    }
                };

                return cleanProduct;
            })
        );

        const detailedCart = cart.map(cartItem => {
            const product = productsWithReviews.find(p => p.id === cartItem.productId);
            const { id, ...rest } = product
            return product
                ? {
                    ...cartItem,
                    ...rest
                }
                : cartItem;
        });

        return res.status(200).json({ success: true, data: detailedCart });
    } catch (error) {
        console.error('Failed to get cart:', error);
        return res.status(500).json({ success: false, error: 'Failed to get cart' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const color = req.body.color || null;

        if (!validateProductId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID',
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const { user } = req;
        const { email } = user;

        const alreadyInCart = user.cart?.some(item => item.productId === productId);

        if (alreadyInCart) {
            return res.status(200).json({
                success: true,
                message: 'Item already in cart',
            });
        }

        await usersCollection.updateOne(
            { email },
            { $push: { cart: { productId, ...(color && { color }), quantity: 1 } } }
        );

        return res.status(201).json({
            success: true,
            message: 'Item added to cart',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Failed to add item to cart',
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { action } = req.body;

        if (!validateProductId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID',
            });
        }

        if (!['inc', 'dec'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action',
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const { email } = req.user;

        const update = action === 'inc'
            ? { $inc: { 'cart.$.quantity': 1 } }
            : { $inc: { 'cart.$.quantity': -1 } };

        const result = await usersCollection.updateOne(
            { email, 'cart.productId': productId },
            update
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cart item updated',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Failed to update cart item',
        });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!validateProductId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID',
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const { email } = req.user;

        const result = await usersCollection.updateOne(
            { email },
            { $pull: { cart: { productId } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart',
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');
        const { email } = req.user;

        await usersCollection.updateOne(
            { email },
            { $set: { cart: [] } }
        );

        res.status(200).json({
            success: true,
            message: 'Cart cleared',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart',
        });
    }
};
