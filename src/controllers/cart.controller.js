const { validateProductId } = require("../utils/validators");
const { getDB } = require("../config/dbConfig");

async function getProductDetails(productIds) {
    const db = getDB();
    const productsCollection = db.collection('products');
    const reviewsCollection = db.collection('reviews');

    const products = await productsCollection
        .find(
            { id: { $in: productIds } },
            { projection: { _id: 0 } }
        )
        .toArray();

    return await Promise.all(
        products.map(async product => {
            const reviewIds = product.specifications?.reviewIds || [];
            const reviews = await reviewsCollection.find(
                { reviewId: { $in: reviewIds } },
                { projection: { _id: 0, email: 0 } }
            ).toArray();

            const rating = reviews.length > 0
                ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length * 2) / 2
                : 0;

            return {
                productId: product.id,
                name: product.name,
                category: product.category,
                pricing: {
                    currentPrice: product.pricing.currentPrice,
                    originalPrice: product.pricing.originalPrice || null
                },
                inventory: {
                    stockQuantity: product.inventory.stockQuantity
                },
                media: {
                    primaryImage: product.media.primaryImage
                },
                reviews: {
                    total: reviews.length,
                    rating: Math.round(rating * 10) / 10
                }
            };
        })
    );
}

exports.getCart = async (req, res) => {
    try {
        const { user } = req;
        let cart = user.cart || [];

        if (cart.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Your cart is empty'
            });
        }

        const productIds = cart.map(item => item.productId);
        const products = await getProductDetails(productIds);

        const db = getDB();
        const usersCollection = db.collection('users');
        let cartNeedsUpdate = false;

        // Validate and update cart items
        const validatedCart = cart
            .map(cartItem => {
                const product = products.find(p => p.productId === cartItem.productId);

                // Remove items for products that no longer exist
                if (!product) {
                    cartNeedsUpdate = true;
                    return null;
                }

                // Adjust quantity if exceeds available stock
                if (cartItem.quantity > product.inventory.stockQuantity) {
                    cartNeedsUpdate = true;
                    return {
                        ...cartItem,
                        quantity: product.inventory.stockQuantity
                    };
                }

                // Remove items with zero or negative quantity
                if (cartItem.quantity < 1) {
                    cartNeedsUpdate = true;
                    return null;
                }

                return cartItem;
            })
            .filter(Boolean);

        // Update user's cart if needed
        if (cartNeedsUpdate) {
            await usersCollection.updateOne(
                { email: user.email },
                { $set: { cart: validatedCart } }
            );
        }

        // Merge cart items with product details
        const detailedCart = validatedCart.map(cartItem => {
            const product = products.find(p => p.productId === cartItem.productId);
            return {
                ...cartItem,
                ...product
            };
        });

        return res.status(200).json({
            success: true,
            data: detailedCart
        });
    } catch (error) {
        console.error('Failed to get cart:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get cart',
            message: 'We encountered an issue while loading your cart. Please try again.'
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity = 1, color, size } = req.body;

        if (!validateProductId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID',
                message: 'The product ID provided is not valid'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid quantity',
                message: 'Quantity must be at least 1'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const productsCollection = db.collection('products');
        const { user } = req;

        // Check product availability
        const product = await productsCollection.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                message: 'The product you are trying to add was not found'
            });
        }

        if (product.inventory.stockQuantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Product out of stock',
                message: 'This product is currently out of stock'
            });
        }

        // Check if already in cart
        const existingItemIndex = user.cart?.findIndex(item => item.productId === productId);

        if (existingItemIndex >= 0) {
            // Item exists, update quantity if it won't exceed stock
            const newQuantity = user.cart[existingItemIndex].quantity + quantity;

            if (newQuantity > product.inventory.stockQuantity) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient stock',
                    message: `Only ${product.inventory.stockQuantity} available in stock`
                });
            }

            await usersCollection.updateOne(
                {
                    email: user.email,
                    'cart.productId': productId
                },
                {
                    $inc: { 'cart.$.quantity': quantity },
                    ...(color && { $set: { 'cart.$.color': color } }),
                    ...(size && { $set: { 'cart.$.size': size } })
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Cart item quantity updated',
                data: {
                    productId,
                    quantity: newQuantity
                }
            });
        }

        // Add new item to cart
        const newCartItem = {
            productId,
            quantity: Math.min(quantity, product.inventory.stockQuantity),
            ...(color && { color }),
            ...(size && { size }),
            addedAt: new Date()
        };

        await usersCollection.updateOne(
            { email: user.email },
            { $push: { cart: newCartItem } }
        );

        return res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: newCartItem
        });

    } catch (error) {
        console.error('Failed to add to cart:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to add item to cart',
            message: 'We encountered an issue while adding this item to your cart. Please try again.'
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { action, quantity } = req.body;

        if (!validateProductId(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID',
                message: 'The product ID provided is not valid'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const productsCollection = db.collection('products');
        const { user } = req;

        // Find product and verify stock
        const product = await productsCollection.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                message: 'The product you are trying to update was not found'
            });
        }

        // Find cart item
        const cartItem = user.cart?.find(item => item.productId === productId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Item not in cart',
                message: 'This item was not found in your cart'
            });
        }

        let newQuantity = cartItem.quantity;
        let updateOperation = {};

        if (action) {
            // Handle increment/decrement actions
            if (!['inc', 'dec'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action',
                    message: 'The action must be either "inc" or "dec"'
                });
            }

            if (action === 'inc') {
                if (product.inventory.stockQuantity < 1) {
                    return res.status(400).json({
                        success: false,
                        error: 'Product out of stock',
                        message: 'This product is currently out of stock'
                    });
                }

                if (cartItem.quantity >= product.inventory.stockQuantity) {
                    return res.status(400).json({
                        success: false,
                        error: 'Maximum quantity reached',
                        message: `You cannot add more than ${product.inventory.stockQuantity} of this item`
                    });
                }

                newQuantity = cartItem.quantity + 1;
            } else {
                if (cartItem.quantity <= 1) {
                    return res.status(400).json({
                        success: false,
                        error: 'Minimum quantity reached',
                        message: 'Quantity cannot be less than 1'
                    });
                }

                newQuantity = cartItem.quantity - 1;
            }

            updateOperation = { $inc: { 'cart.$.quantity': action === 'inc' ? 1 : -1 } };
        } else if (quantity !== undefined) {
            // Handle direct quantity update
            if (quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid quantity',
                    message: 'Quantity must be at least 1'
                });
            }

            if (quantity > product.inventory.stockQuantity) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient stock',
                    message: `Only ${product.inventory.stockQuantity} available in stock`
                });
            }

            newQuantity = quantity;
            updateOperation = { $set: { 'cart.$.quantity': quantity } };
        } else {
            return res.status(400).json({
                success: false,
                error: 'Missing parameters',
                message: 'Either action or quantity must be provided'
            });
        }

        // Update cart item
        const result = await usersCollection.updateOne(
            {
                email: user.email,
                'cart.productId': productId
            },
            updateOperation
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Update failed',
                message: 'Failed to update the cart item'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cart item updated',
            data: {
                productId,
                quantity: newQuantity
            }
        });

    } catch (error) {
        console.error('Failed to update cart item:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update cart item',
            message: 'We encountered an issue while updating your cart. Please try again.'
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
                message: 'The product ID provided is not valid'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const { user } = req;

        const result = await usersCollection.updateOne(
            { email: user.email },
            { $pull: { cart: { productId } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
                message: 'The item was not found in your cart'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: { productId }
        });

    } catch (error) {
        console.error('Failed to remove from cart:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart',
            message: 'We encountered an issue while removing this item from your cart. Please try again.'
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');
        const { user } = req;

        const result = await usersCollection.updateOne(
            { email: user.email },
            { $set: { cart: [] } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cart already empty',
                message: 'Your cart was already empty'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: { itemCount: 0 }
        });

    } catch (error) {
        console.error('Failed to clear cart:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to clear cart',
            message: 'We encountered an issue while clearing your cart. Please try again.'
        });
    }
};