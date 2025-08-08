document.addEventListener('DOMContentLoaded', initApp);

const config = {
    productsPerPage: 8,
    bannersAutoAdvanceInterval: 4000,
    currentPage: 1
};

const state = {
    currentBannerIndex: 0,
    totalBanners: 0,
    bannersInterval: null,
    totalProductPages: 1
};

async function initApp() {
    try {
        initSpinner()
        await Promise.all([loadBanners(), loadProducts(), loadFeaturedProducts(), updateCartIcon()]);
        renderCategories(await fetchCategories())
        setupEventListeners();
    } catch (err) {
        handleGlobalError(err);
    } finally {
        toggleLoader(false);
    }
}

function setupEventListeners() {
    document.addEventListener('click', e => {
        if (e.target.closest('.add-to-cart, .modern-cart-btn')) return;

        const product = e.target.closest('.modern-product-container');
        if (product) location.assign(`/product/${product.dataset.id}`);

        if (e.target.closest('.pagination button')) {
            handlePaginationClick(e.target);
        }
    });


    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
}

function handleClick(e) {
    const productDiv = e.target.closest('.modern-product-container');
    if (productDiv) return handleAddToCart(productDiv.dataset.id);

    const indicator = e.target.closest('.indicator');
    if (indicator) return goToSlide(+indicator.dataset.index);

    if (e.target.closest('#prevBtn')) goToSlide(state.currentBannerIndex - 1);
    if (e.target.closest('#nextBtn')) goToSlide(state.currentBannerIndex + 1);
}

function handleSubmit(e) {
    const form = e.target.closest('.newsletter-form');
    if (form) {
        e.preventDefault();
        handleNewsletterSubmit(form);
    }
}

async function handleNewsletterSubmit(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value.trim();

    if (!email || !isValidEmail(email)) {
        notify('Please enter a valid email address', 'error');
        emailInput?.focus();
        return;
    }

    try {
        const res = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.success) {
            notify(data.message || 'Subscribed successfully!', 'success');
            form.reset();
        } else {
            notify(data.error || 'Subscription failed.', 'error');
        }
    } catch (err) {
        console.error(err);
        notify('Something went wrong. Please try again later.', 'error');
    }
}

async function loadBanners() {
    try {
        const res = await fetch('/api/banners');
        if (!res.ok) throw new Error('Banner fetch failed');

        const { success, data } = await res.json();
        if (!success || !Array.isArray(data)) throw new Error('Invalid banner data');

        renderBanners(data);
        initCarousel(data.length);
    } catch (err) {
        console.error('Banner loading failed:', err);
        notify('Failed to load banners', 'error');
        throw err;
    }
}

function renderBanners(banners) {
    const inner = document.getElementById('carouselInner');
    const indicators = document.getElementById('carouselIndicators');
    if (!inner || !indicators) return;

    document.getElementById('carousel-controls').onclick = (e) => {
        if (e.target.id !== 'carousel-controls') return;

        const current = document.querySelectorAll('.carousel-item')[state.currentBannerIndex];
        const href = current?.dataset.href;
        if (href) location.assign(href);
    };

    inner.innerHTML = banners.map((b, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''}" data-href=${b.href || '#'}>
            <img src="${b.url}" 
                 alt="${b.alt || `Banner ${i + 1}`}" 
                 loading="lazy" 
                 onclick="location.href='${b.href || '#'}'">
        </div>
    `).join('');

    indicators.innerHTML = banners.map((_, i) => `
        <div class="indicator ${i === 0 ? 'active' : ''}" 
             data-index="${i}" 
             aria-label="Go to slide ${i + 1}"
             aria-current="${i === 0}">
        </div>
    `).join('');
}

function initCarousel(count) {
    if (count <= 1) return;
    state.totalBanners = count;
    const carousel = document.getElementById('carouselInner');

    ['mouseenter', 'focusin'].forEach(e =>
        carousel.addEventListener(e, pauseCarousel));
    ['mouseleave', 'focusout'].forEach(e =>
        carousel.addEventListener(e, resumeCarousel));

    resumeCarousel();
}

function goToSlide(index) {
    state.currentBannerIndex = (index + state.totalBanners) % state.totalBanners;

    const currentBanner = document.querySelectorAll('.carousel-item')[state.currentBannerIndex];
    const href = currentBanner?.dataset.href;

    document.getElementById('carousel-controls').onclick = (e) => {
        if (e.target.id === 'carousel-controls' && href) {
            location.assign(href);
        }
    };

    document.getElementById('carouselInner').style.transform =
        `translateX(-${state.currentBannerIndex * 100}%)`;

    document.querySelectorAll('.indicator').forEach((el, i) => {
        el.classList.toggle('active', i === state.currentBannerIndex);
        el.setAttribute('aria-current', i === state.currentBannerIndex);
    });

    resumeCarousel();
}

function pauseCarousel() {
    clearInterval(state.bannersInterval);
}

function resumeCarousel() {
    pauseCarousel();
    if (state.totalBanners > 1) {
        state.bannersInterval = setInterval(
            () => goToSlide(state.currentBannerIndex + 1),
            config.bannersAutoAdvanceInterval
        );
    }
}

async function loadProducts(page = 1) {
    try {
        config.currentPage = page;
        const res = await fetch(`/api/products?page=${page}&limit=${config.productsPerPage}`);
        if (!res.ok) throw new Error('Product fetch failed');

        const result = await res.json();
        const { products } = result.data
        const { totalPages } = result.data.pagination

        if (!Array.isArray(products)) throw new Error('Invalid product data');

        state.totalProductPages = totalPages;
        renderProducts(products);
        renderPagination(totalPages, page);
    } catch (err) {
        console.error('Product loading failed:', err);
        notify('Failed to load products', 'error');
        throw err;
    }
}

async function updateCartIcon() {
    try {
        const res = await fetch("/api/cart", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const { data } = await res.json();
        const qty = Array.isArray(data) ? data.length : 0;

        updateCartQuantity(qty);
    } catch (err) {
        console.error("Error updating cart quantity:", err);
    }
}

function renderProducts(products) {
    const wrapper = document.querySelector('.products-grid');
    if (!wrapper) return;

    wrapper.innerHTML = products.length ? products.map((p, i) => `
        <div class="modern-product-container" data-id="${p.id}" tabindex="0"
             aria-label="${p.name}, Price: Rs ${p.pricing.currentPrice.toLocaleString()}, Rating: ${p.reviews.total} reviews">
            <div class="modern-product-image">
                <img src="${p.media.primaryImage}" 
                     alt="${p.name}" 
                     loading="lazy"
                     onerror="this.src='/images/placeholder-product.png'">
                <button class="modern-cart-btn" aria-label="Add ${p.name} to cart">
                    <span class="modern-icon-container">${cartIconSVG()}</span>
                </button>
            </div>
            <div class="modern-details-div">
                <div class="modern-upper-border"></div>
                ${renderRatingStars(p.reviews)}
                <div class="modern-upper-border"></div>
                <div class="modern-product-name">${escapeHTML(p.name)}</div>
                <div class="modern-upper-border"></div>
                <div class="modern-product-price">Rs ${p.pricing.currentPrice.toLocaleString()}</div>
            </div>
            <div class="modern-lower-border"></div>
        </div>
    `).join('') : '<div class="no-products">No products available</div>';
}

function renderPagination(totalPages, currentPage) {
    const pagination = document.querySelector('.pagination');
    if (!pagination || totalPages <= 1) {
        pagination?.classList.add('hidden');
        return;
    }

    pagination.classList.remove('hidden');

    let paginationHTML = '';
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
        const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    if (currentPage > 1) {
        paginationHTML += `<button data-page="${currentPage - 1}">←</button>`;
    }

    if (startPage > 1) {
        paginationHTML += `<button data-page="1">1</button>`;
        if (startPage > 2) paginationHTML += `<span class="ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button ${i === currentPage ? 'class="active"' : ''} data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<span class="ellipsis">...</span>`;
        paginationHTML += `<button data-page="${totalPages}">${totalPages}</button>`;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<button data-page="${currentPage + 1}">→</button>`;
    }

    pagination.innerHTML = paginationHTML;
}

async function handlePaginationClick(button) {
    const page = parseInt(button.dataset.page);
    if (!page || page === config.currentPage) return;

    clearProductsGrid()
    toggleSpinner('spinner-div', true);
    scrollToTop();
    await loadProducts(page);
    toggleSpinner('spinner-div', false);
}

function clearProductsGrid() {
    document.getElementById('products-grid').innerHTML = ''
}

async function loadFeaturedProducts() {
    try {
        const res = await fetch('/api/products/featured');
        if (!res.ok) throw new Error('Featured products fetch failed');

        const products = await res.json();
        if (!Array.isArray(products)) throw new Error('Invalid featured product data');

        renderFeaturedProducts(products);
    } catch (err) {
        console.error('Featured product loading failed:', err);
        notify('Failed to load featured products', 'error');
        throw err;
    }
}

async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: 'Could not load categories'
        };
    }
}

function renderCategories(categories) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    const categoriesToShow = categories.data.slice(0, 5);

    categoriesGrid.innerHTML = categoriesToShow.map(category => `
    <a href="/category/${category.category}" class="category-card">
      <div class="category-image-container">
        <img 
          src="${category.sampleImage}" 
          alt="${category.category}" 
          class="category-image"
          loading="lazy"
        />
      </div>
      <div class="category-info">
        <h3 class="category-name">${category.category.replace(/-/g, ' ')}</h3>
        <p class="category-count">${category.totalProducts} products</p>
      </div>
    </a>
  `).join('');
}

function renderFeaturedProducts(products) {
    const wrapper = document.querySelector('.featured-products');
    if (!wrapper) return;

    wrapper.innerHTML = products.length ? products.map((p, i) => `
        <div class="modern-product-container" data-id="${p.id}" tabindex="0"
             aria-label="${p.name}, Price: Rs ${p.pricing.currentPrice.toLocaleString()}, Rating: ${p.reviews.total} reviews">
            <div class="modern-product-image">
                <img src="${p.media.primaryImage}" 
                     alt="${p.name}" 
                     loading="lazy"
                     onerror="this.src='/images/placeholder-product.png'">
                <button class="modern-cart-btn" aria-label="Add ${p.name} to cart">
                    <span class="modern-icon-container">${cartIconSVG()}</span>
                </button>
            </div>
            <div class="modern-details-div">
                <div class="modern-upper-border"></div>
                ${renderRatingStars(p.reviews)}
                <div class="modern-upper-border"></div>
                <div class="modern-product-name">${escapeHTML(p.name)}</div>
                <div class="modern-upper-border"></div>
                <div class="modern-product-price">Rs ${p.pricing.currentPrice.toLocaleString()}</div>
            </div>
            <div class="modern-lower-border"></div>
        </div>
    `).join('') : '<div class="no-products">No featured products available</div>';
}

function renderRatingStars({ rating = 0, total = 0 }) {
    const avg = Math.round(rating * 10) / 10;
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
    <div class="product-rating" aria-label="Rating: ${avg} out of 5">
        <div class="stars" role="img">
            ${'<span class="star filled">★</span>'.repeat(fullStars)}
            ${hasHalfStar ? '<span class="star half-filled">★</span>' : ''}
            ${'<span class="star">★</span>'.repeat(emptyStars)}
            <span class="rating-count">(${total} ${total === 1 ? 'review' : 'reviews'})</span>
        </div>
    </div>`;
}

async function handleAddToCart(id) {
    try {
        const res = await fetch(`/api/cart/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const data = await res.json();

        notify(data.message, data.type, 3, () => location.assign('/cart'));
        await updateCartIcon();
    } catch (error) {
        console.error("Add to Cart Failed:", error);
        notify("Failed to add item to cart", "error", 3);
    }
}

function handleGlobalError(error) {
    console.error('Application error:', error);
    notify('Something went wrong. Please try again later.', 'error');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

function cartIconSVG() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>`;
}

function scrollToTop() {
    window.scrollTo({
        top: document.querySelector('.products').offsetTop - 100,
        behavior: 'smooth'
    });
}