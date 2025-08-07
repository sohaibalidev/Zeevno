document.addEventListener('DOMContentLoaded', function () {
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const itemCountElement = document.querySelector('.item-count');
    const subtotalElement = document.querySelector('.summary-row:nth-child(2) span:last-child');
    const discountElement = document.querySelector('.discount');
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    const checkoutBtn = document.querySelector('.checkout-btn');

    initCart();

    cartItemsContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('plus')) {
            const cartItem = e.target.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            updateCartItem(productId, 'inc');
        }

        if (e.target.classList.contains('minus')) {
            const cartItem = e.target.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            updateCartItem(productId, 'dec');
        }

        if (e.target.classList.contains('remove-item')) {
            const cartItem = e.target.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            removeFromCart(productId);
        }
    });

    checkoutBtn.addEventListener('click', function () {
        window.location.href = '/checkout';
    });

    async function initCart() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch cart');

            const { data: cartItems } = await response.json();

            if (cartItems && cartItems.length > 0) {
                updateCartQuantity(cartItems.length || 0)
                renderCartItems(cartItems);
                updateCartSummary(cartItems);
                emptyCartMessage.style.display = 'none';
            } else {
                showEmptyCart();
            }
        } catch (error) {
            console.error('Error initializing cart:', error);
            notify('Failed to load cart', 'error');
        } finally {
            toggleLoader(false);
        }
    }

    function renderCartItems(cartItems) {
        cartItemsContainer.innerHTML = '';

        cartItems.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.productId = item.productId;

            const discountPercentage = item.originalPrice
                ? Math.round((1 - item.currentPrice / item.originalPrice) * 100)
                : 0;

            cartItem.innerHTML = `
                <div class="item-image">
                    <img src="${item.media.primaryImage}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3 class="item-title">${item.name}</h3>
                    <p class="item-description">${item.category}</p>
                    <div class="item-actions">
                        <button class="remove-item">Remove</button>
                    </div>
                </div>
                <div class="custom-style-1">
                    <div class="item-price">
                        <span class="current-price">Rs ${item.pricing.currentPrice.toLocaleString()}</span>
                        ${item.pricing.originalPrice ? `<span class="original-price">Rs ${item.pricing.originalPrice.toLocaleString()}</span>` : ''}
                        ${discountPercentage > 0 ? `<span class="discount-badge">${discountPercentage}% OFF</span>` : ''}
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                </div>
            `;

            cartItemsContainer.appendChild(cartItem);
        });
    }

    function updateCartSummary(cartItems) {
        let totalItems = 0;
        let originalTotal = 0;
        let discountedTotal = 0;
        let totalDiscount = 0;

        for (const item of cartItems) {
            const { quantity, pricing } = item;
            const { currentPrice, originalPrice } = pricing;

            if (!quantity || !currentPrice) continue;

            totalItems += quantity;
            originalTotal += (originalPrice || currentPrice) * quantity;
            discountedTotal += currentPrice * quantity;

            if (originalPrice && originalPrice > currentPrice) {
                totalDiscount += (originalPrice - currentPrice) * quantity;
            }
        }

        itemCountElement.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
        subtotalElement.textContent = `Rs ${originalTotal.toLocaleString()}`;
        discountElement.textContent = `-Rs ${totalDiscount.toLocaleString()}`;
        totalElement.textContent = `Rs ${discountedTotal.toLocaleString()}`;

        const summaryLabel = document.querySelector('.summary-row:nth-child(2) span:first-child');
        if (summaryLabel) {
            summaryLabel.textContent = `Subtotal (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`;
        }

        const discountRow = document.querySelector('.discount-row');
        if (discountRow) {
            discountRow.style.display = totalDiscount > 0 ? 'flex' : 'none';
        }

        if (typeof checkoutBtn !== 'undefined') {
            checkoutBtn.disabled = totalItems === 0;
        }
    }

    async function updateCartItem(productId, action) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) throw new Error('Failed to update cart item');

            await response.json();
            initCart()
            notify('Cart updated', 'success');
        } catch (error) {
            console.error('Error updating cart item:', error);
            notify('Failed to update cart', 'error');
        }
    }

    async function removeFromCart(productId) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to remove item from cart');

            const { data: updatedCart } = await response.json();

            if (updatedCart.length === 0) {
                showEmptyCart();
            } else {
                initCart()
            }

            notify('Item removed from cart', 'success');
        } catch (error) {
            console.error('Error removing item from cart:', error);
            notify('Failed to remove item', 'error');
        }
    }

    function showEmptyCart() {
        cartItemsContainer.innerHTML = `
        <div id="empty-cart-message" class="empty-cart">
            <h2>Your Tech Toolkit is Empty!</h2>
            <p>Looks like you haven't added anything yet. Start shopping now!</p>
            <a href="/" class="shop-now-btn">Shop Now</a>
        </div>
          `;
        emptyCartMessage.style.display = 'block';
        itemCountElement.textContent = '0 items';
        subtotalElement.textContent = 'Rs 0';
        discountElement.textContent = '-Rs 0';
        totalElement.textContent = 'Rs 0';
        document.querySelector('.summary-row:nth-child(2) span:first-child').textContent = 'Subtotal (0 items)';
        document.querySelector('.discount-row').style.display = 'none';
        checkoutBtn.disabled = true;
    }
});