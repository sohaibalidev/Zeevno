document.addEventListener('DOMContentLoaded', function () {
    const cartContent = document.querySelector('.cart-content');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const retryButton = document.getElementById('retry-button');
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const itemCountElement = document.querySelector('.item-count');
    const subtotalElement = document.querySelector('.summary-row:nth-child(2) span:last-child');
    const discountElement = document.querySelector('.discount');
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const discountRow = document.querySelector('.discount-row');
    const promoInput = document.querySelector('.promo-input input');
    const applyPromoBtn = document.querySelector('.apply-btn');

    let cartState = {
        items: [],
        loading: true,
        error: null,
        promoCode: null,
        promoDiscount: 0
    };

    initCart();

    retryButton.addEventListener('click', initCart);

    cartItemsContainer.addEventListener('click', function (e) {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;

        if (
            e.target.classList.contains('plus')
            || e.target.parentElement.classList.contains('plus')
        ) {
            updateCartItem(productId, 'inc');
        } else if (
            e.target.classList.contains('minus')
            || e.target.parentElement.classList.contains('minus')
        ) {
            updateCartItem(productId, 'dec');
        } else if (
            e.target.classList.contains('remove-item')
            || e.target.parentElement.classList.contains('remove-item')
        ) {
            removeFromCart(productId);
        }
    });

    checkoutBtn.addEventListener('click', function () {
        if (cartState.items.length > 0) {
            window.location.href = '/checkout';
        }
    });

    applyPromoBtn.addEventListener('click', applyPromoCode);

    async function initCart() {
        try {
            setErrorState(false);

            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const { data: cartItems, message } = await response.json();

            cartState = {
                ...cartState,
                items: cartItems || [],
                loading: false,
                error: null
            };

            if (cartState.items.length > 0) {
                renderCart();
            } else {
                showEmptyCart();
            }

            cartContent.style.display = 'flex';

            if (message) {
                notify(message, 'info');
            }
        } catch (error) {
            console.error('Error initializing cart:', error);
            cartState.error = error.message || 'Failed to load cart';
            setErrorState(true);
            notify(cartState.error, 'error');
        } finally {
            toggleLoader(false);
        }
    }

    function renderCart() {
        renderCartItems();
        updateCartSummary();
    }

    function renderCartItems() {
        if (cartState.items.length === 0) {
            showEmptyCart();
            return;
        }

        const fragment = document.createDocumentFragment();

        cartState.items.forEach(item => {
            const cartItem = createCartItemElement(item);
            fragment.appendChild(cartItem);
        });

        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(fragment);
        emptyCartMessage.style.display = 'none';
    }

    function createCartItemElement(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.dataset.productId = item.productId;

        const hasDiscount = item.pricing?.originalPrice && item.pricing.originalPrice > item.pricing.currentPrice;
        const discountPercentage = hasDiscount
            ? Math.round((1 - item.pricing.currentPrice / item.pricing.originalPrice) * 100)
            : 0;

        const stock = item.inventory?.stockQuantity || 0;
        const isOutOfStock = stock <= 0;
        const isLowStock = stock <= 5 && stock > 0;

        cartItem.innerHTML = `
            <div class="item-image">
                <img src="${item.media?.primaryImage || '/g/imgs/placeholder-product.png'}" 
                     alt="${item.name}" 
                     onerror="this.src='/g/imgs/placeholder-product.png'">
                ${isOutOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
            </div>
            <div class="item-details">
                <h3 class="item-title">${item.name}</h3>
                ${item.category ? `<p class="item-description">${item.category}</p>` : ''}
                ${item.color ? `<p class="item-variant">Color: ${item.color}</p>` : ''}
                ${item.size ? `<p class="item-variant">Size: ${item.size}</p>` : ''}
                ${isLowStock ? `<p class="low-stock">Only ${stock} left in stock!</p>` : ''}
                <div class="item-actions">
                    <button class="remove-item">
                        <i class='bx bx-trash'></i> <span> Remove </span>
                    </button>
                </div>
            </div>
            <div class="custom-style-1">
                <div class="item-price">
                    <span class="current-price">Rs ${item.pricing?.currentPrice?.toLocaleString() || '0'}</span>
                    ${hasDiscount ? `
                        <span class="original-price">Rs ${item.pricing.originalPrice.toLocaleString()}</span>
                        <span class="discount-badge">${discountPercentage}% OFF</span>
                    ` : ''}
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn minus" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class='bx bx-minus'></i>
                    </button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" ${item.quantity >= stock ? 'disabled' : ''}>
                        <i class='bx bx-plus'></i>
                    </button>
                </div>
            </div>
        `;

        return cartItem;
    }

    function updateCartSummary() {
        const summary = calculateCartSummary();

        itemCountElement.textContent = `${summary.totalItems} ${summary.totalItems === 1 ? 'item' : 'items'}`;
        subtotalElement.textContent = `Rs ${summary.originalTotal.toLocaleString()}`;

        if (cartState.promoDiscount > 0) {
            discountElement.textContent = `-Rs ${summary.totalDiscount.toLocaleString()}`;
            discountRow.style.display = 'flex';

            if (!document.querySelector('.promo-discount-row')) {
                const promoRow = document.createElement('div');
                promoRow.className = 'summary-row promo-discount-row';
                promoRow.innerHTML = `
                    <span>Promo Code (${cartState.promoCode})</span>
                    <span class="promo-discount">-Rs ${cartState.promoDiscount.toLocaleString()}</span>
                `;
                discountRow.after(promoRow);
            } else {
                document.querySelector('.promo-discount').textContent = `-Rs ${cartState.promoDiscount.toLocaleString()}`;
            }
        } else {
            discountElement.textContent = `-Rs ${summary.totalDiscount.toLocaleString()}`;
            discountRow.style.display = summary.totalDiscount > 0 ? 'flex' : 'none';
            const promoRow = document.querySelector('.promo-discount-row');
            if (promoRow) promoRow.remove();
        }

        const finalTotal = summary.discountedTotal - cartState.promoDiscount;
        totalElement.textContent = `Rs ${Math.max(0, finalTotal).toLocaleString()}`;

        document.querySelector('.summary-row:nth-child(2) span:first-child').textContent =
            `Subtotal (${summary.totalItems} ${summary.totalItems === 1 ? 'item' : 'items'})`;

        checkoutBtn.disabled = summary.totalItems === 0 || cartState.items.some(item =>
            (item.inventory?.stockQuantity || 0) <= 0
        );
    }

    function calculateCartSummary() {
        let totalItems = 0;
        let originalTotal = 0;
        let discountedTotal = 0;
        let totalDiscount = 0;

        cartState.items.forEach(item => {
            const { quantity, pricing } = item;
            const currentPrice = pricing?.currentPrice || 0;
            const originalPrice = pricing?.originalPrice || currentPrice;

            totalItems += quantity;
            originalTotal += originalPrice * quantity;
            discountedTotal += currentPrice * quantity;

            if (originalPrice > currentPrice) {
                totalDiscount += (originalPrice - currentPrice) * quantity;
            }
        });

        return {
            totalItems,
            originalTotal,
            discountedTotal,
            totalDiscount
        };
    }

    async function updateCartItem(productId, action) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const { data: updatedItem, message } = await response.json();

            cartState.items = cartState.items.map(item => {
                if (item.productId === productId) {
                    return {
                        ...item,
                        quantity: updatedItem.quantity
                    };
                }
                return item;
            });

            renderCart();
            notify(message || 'Cart updated', 'success');
        } catch (error) {
            console.error('Error updating cart item:', error);
            notify(error.message || 'Failed to update cart', 'error');
        }
    }

    async function removeFromCart(productId) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const { data: updatedItem, message } = await response.json();

            console.log(cartState)

            cartState.items = cartState.items.filter(item => {
                return item.productId !== updatedItem.productId;
            });

            renderCart();
            notify(message || 'Item removed from cart', 'success');
        } catch (error) {
            console.error('Error removing item from cart:', error);
            notify(error.message || 'Failed to remove item', 'error');
        }
    }

    async function applyPromoCode() {
        const promoCode = promoInput.value.trim();
        if (!promoCode) return;

        try {
            const response = await fetch('/api/promo/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ promoCode })
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const { discountAmount, message } = await response.json();

            cartState = {
                ...cartState,
                promoCode,
                promoDiscount: discountAmount || 0
            };

            updateCartSummary();
            notify(message || 'Promo code applied successfully!', 'success');
        } catch (error) {
            console.error('Error applying promo code:', error);
            notify(error.message || 'Failed to apply promo code', 'error');
            promoInput.value = '';
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

        resetCartSummary();
        resetPromoCode();
    }

    function resetCartSummary() {
        itemCountElement.textContent = '0 items';
        subtotalElement.textContent = 'Rs 0';
        discountElement.textContent = '-Rs 0';
        totalElement.textContent = 'Rs 0';
        document.querySelector('.summary-row:nth-child(2) span:first-child').textContent = 'Subtotal (0 items)';
        discountRow.style.display = 'none';

        const promoRow = document.querySelector('.promo-discount-row');
        if (promoRow) promoRow.remove();

        checkoutBtn.disabled = true;
    }

    function resetPromoCode() {
        promoInput.value = '';
        cartState.promoCode = null;
        cartState.promoDiscount = 0;
    }

    function setErrorState(hasError) {
        errorState.style.display = hasError ? 'flex' : 'none';
        cartContent.style.display = hasError ? 'none' : 'flex';
    }

    async function getErrorMessage(response) {
        try {
            const errorData = await response.json();
            return errorData.message || errorData.error || 'An error occurred';
        } catch {
            return 'An error occurred';
        }
    }
});