// ======================== PRODUCT PAGE RENDERING ========================

function generateColorDivs(variants) {
    if (!variants.hasColorOptions) return '';
    const colors = variants.availableColors
    return `
    <div class="color-label">Color</div>
    <div class="color-options-text">
        ${colors.map((color, index) => `
            <div class="color-option-text ${!index ? 'selected' : ''}" style="--coolor: ${color}" ${index === 0 ? 'selected' : ''} 
                 data-color="${color}">
                ${color}
            </div>
        `).join('')}
    </div>`;
}

/**
 * Renders the main product page
 * @param {Object} product - Product data object
 */

async function renderProduct(product) {
    const container = document.getElementById('main-section');
    container.innerHTML = await createProductHTML(product);
    document.title = `${product.name} - NexaEase`

    initColorSelection();
    initImageGallery();
    setupReviewControls();
    initCollapsibleSections()
    initFullscreen();
    setupCartButtons()
}

/**
 * Creates HTML for product page
 * @param {Object} product - Product data
 * @returns {string} HTML string
 */
async function createProductHTML(product) {
    return `
    <div class="product-page">
        ${createGalleryHTML(product)}
        ${createDetailsHTML(product)}
    </div>
    ${createBottomSection(product.specifications)}
    ${createReviewsHTML(product.reviews)}
    ${createRelatedProductsHTML(await fetchCategory(product.category))}`;
}

function createGalleryHTML(product) {
    const imageGallery = [1, 2, 3, 4].map(i => `
        <img src="${product.media.imageUrls[i - 1]}" 
             alt="${product.name} - View ${i}" 
             class="thumbnail ${i === 1 ? 'active' : ''}"
             data-index="${i}"
             loading="lazy">
    `).join('');

    return `
    <div class="product-gallery">
        <div class="main-image-container img-magnifier-container">
            <img id="main-product-image" src="${product.media.primaryImage}" 
                 alt="${product.name}" 
                 class="main-product-image zoomable-image"
                 loading="eager">
                <div class="fullscreen-modal">
                  <span class="close-fullscreen">&times;</span>
                  <img src="" alt="Fullscreen view" class="modal-content">
                </div>
            <button class="zoom-hint" aria-label="Zoom available">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                </svg>
            </button>
        </div>
        <div class="thumbnail-gallery desktop">${imageGallery}</div>
        <div class="thumbnail-gallery mobile">${imageGallery}</div>
    </div>`;
}

function createDetailsHTML(product) {
    return `
    <div class="product-details">
        <div class="product-meta">
            <h1 class="product-title">${product.name}</h1>
            ${createPriceHTML(product.pricing)}
            ${createStockHTML(product.inventory)}
            ${createRatingHTML(product.reviews)}
            ${generateColorDivs(product.variants)}
            ${createActionButtons(product.id)}
        </div>
    </div>`;
}

function createPriceHTML(pricing) {
    if (pricing.currentPrice === pricing.originalPrice) {
        return `
        <div class="price-container">
            <div class="current-price">Rs ${pricing.currentPrice.toLocaleString()}</div>
        </div>`;
    }

    const discountPercent = 100 - Math.round((pricing.currentPrice / pricing.originalPrice * 100));

    return `
    <div class="price-container">
        <div class="current-price">Rs ${pricing.currentPrice.toLocaleString()}</div>
        <div class="original-price">Rs ${pricing.originalPrice.toLocaleString()}</div>
        <div class="discount-badge">${discountPercent}% OFF</div>
    </div>`;
}

function createStockHTML(inventory, maxStock = 50) {
    const { inStock, stockQuantity } = inventory
    if (!inStock) return ''
    const percentage = Math.round((stockQuantity / maxStock) * 100);

    const [status, color, bgColor, borderColor] =
        stockQuantity <= 0 ? ["Out of Stock", "#F44336", "#FFEBEE", "#EF9A9A"] :
            percentage <= 30 ? ["Low Stock", "#4CAF50", "#E8F5E9", "#A5D6A7"] :
                ["Available", "#FF9800", "#FFF3E0", "#FFCC80"];

    return `
    <div class="nexa-stock" 
         style="color: ${color};
                background: ${bgColor};
                border: 1px solid ${borderColor};">
      ${status} (${stockQuantity} left)
    </div>`;
}

const listenerMap = new WeakMap();
const DEFAULT_INITIAL_LIMIT = 3;
const REVIEWS_INCREMENT = 5;

function createReviewsHTML(reviews, initialLimit = DEFAULT_INITIAL_LIMIT) {
    if (!reviews?.list?.length) return `<div class="no-reviews">No reviews yet</div>`;

    const sortedReviews = [...reviews.list].sort((a, b) => b.rating - a.rating);

    const safeReviews = sortedReviews.map(r => ({
        ...r,
        review: r.review.replace(/"/g, '&quot;')
    }));
    const reviewsJSON = JSON.stringify(safeReviews)
        .replace(/</g, '\\u003c')
        .replace(/'/g, '\\u0027');

    return `
    <div class="reviews-section" data-reviews='${reviewsJSON}' data-visible="${initialLimit}">
        <div class="reviews-sort">
            <span>Sort by:</span>
            <!-- Mark "Highest" as active by default -->
            <div>            
                <button class="sort-btn active" data-sort="highest">Highest</button>
                <button class="sort-btn" data-sort="lowest">Lowest</button>
                <button class="sort-btn" data-sort="latest">Latest</button>
                <button class="sort-btn" data-sort="oldest">Oldest</button>
            </div>
        </div>
        <div class="reviews-container">
            ${sortedReviews.slice(0, initialLimit).map(renderReviewCard).join('')}
            ${sortedReviews.length > initialLimit ? `
            <div class="view-more-container">
                <button class="view-more-btn">
                    View More (+${sortedReviews.length - initialLimit})
                </button>
            </div>
            ` : ''}
        </div>
    </div>`;
}

function getSortedReviews(reviews, sortMethod) {
    switch (sortMethod) {
        case 'highest':
            return [...reviews].sort((a, b) => b.rating - a.rating);
        case 'lowest':
            return [...reviews].sort((a, b) => a.rating - b.rating);
        case 'latest':
            return [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'oldest':
            return [...reviews].sort((a, b) => new Date(a.date) - new Date(b.date));
        default:
            return [...reviews];
    }
}

function setupReviewControls() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const section = this.closest('.reviews-section');
            const container = section.querySelector('.reviews-container');
            const reviews = JSON.parse(section.dataset.reviews);
            const visible = parseInt(section.dataset.visible);

            section.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const sortedReviews = getSortedReviews(reviews, this.dataset.sort);

            container.innerHTML = sortedReviews.slice(0, visible).map(renderReviewCard).join('') +
                (reviews.length > visible ? `
                <div class="view-more-container">
                    <button class="view-more-btn">
                        View More (+${reviews.length - visible})
                    </button>
                </div>
                ` : '');

            setupViewMoreButton();
        });
    });

    setupViewMoreButton();
}

function setupViewMoreButton() {
    document.querySelectorAll('.view-more-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const section = this.closest('.reviews-section');
            const container = section.querySelector('.reviews-container');
            const reviews = JSON.parse(section.dataset.reviews);
            const currentVisible = parseInt(section.dataset.visible);
            const newVisible = currentVisible + REVIEWS_INCREMENT;

            const activeSortBtn = section.querySelector('.sort-btn.active');
            const sortMethod = activeSortBtn?.dataset.sort || 'highest';

            const sortedReviews = getSortedReviews(reviews, sortMethod);

            section.dataset.visible = newVisible;
            container.innerHTML = sortedReviews.slice(0, newVisible).map(renderReviewCard).join('') +
                (reviews.length > newVisible ? `
                <div class="view-more-container">
                    <button class="view-more-btn">
                        View More (+${reviews.length - newVisible})
                    </button>
                </div>
                ` : '');

            setupViewMoreButton();
        });
    });
}

function renderReviewCard(review) {
    const safeReview = review.review
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    return `
    <div class="review-card" data-rating="${review.rating}" data-date="${new Date(review.date).getTime()}">
        <div class="review-meta">
            <span class="reviewer-name">${review.name}</span>
            <span class="review-date">${new Date(review.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })}</span>
        </div>
        <div class="review-rating">
            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
            <span class="rating-value">${review.rating}.0</span>
        </div>
        <div class="review-text">${safeReview}</div>
    </div>`;
}

function createRatingHTML(reviews) {
    if (!reviews?.rating) return '';

    const avg = Math.round(reviews.rating * 10) / 10;
    const reviewCount = reviews.total || 0;

    return `
    <div class="product-rating" aria-label="Rating: ${avg} out of 5">
      <div class="stars" role="img">
        ${'<span class="star filled">★</span>'.repeat(Math.floor(avg))}
        ${avg % 1 >= 0.5 ? '<span class="star half-filled">★</span>' : ''}
        ${'<span class="star">★</span>'.repeat(5 - Math.floor(avg) - (avg % 1 >= 0.5 ? 1 : 0))}
        <span class="rating-count">(${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span>
      </div>
    </div>`;
}

function createActionButtons(id) {
    return `
    <div class="product-actions">
        <button onclick='addToCart(${id}, ${window.selectedColor})' class="add-to-cart-btn" id="addToCartBtn">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            Add to Cart
        </button>
    </div>`;
}

function createDescriptionHTML(description) {
    if (!description) return ''
    return `
    <div class="details-section">
        <div class="section-header">
            <h3 class="section-title">Product Details</h3>
            <span class="toggle-arrow">\uea50</span>
        </div>
        <div class="section-content">
            <div class="description-content">${description.replace(/\n/g, '<br>')}</div>
        </div>
    </div>`;
}

function createFeaturesHTML(features) {
    if (!features || !features.length) return ''
    return `
    <div class="details-section">
        <div class="section-header">
            <h3 class="section-title">Features</h3>
            <span class="toggle-arrow">\uea50</span>
        </div>
        <div class="section-content">
            <ul class="feature-list">
                ${features.map(feature => `<li><span>${feature}</span></li>`).join("\n")}
            </ul>
        </div>
    </div>`;
}

function createOthersHTML(technicalSpecs) {
    if (!technicalSpecs) return ''
    return `
    <div class="details-section">
        <div class="section-header">
            <h3 class="section-title">Specifications</h3>
            <span class="toggle-arrow">\uea50</span>
        </div>
        <div class="section-content">
            <ul class="feature-list">
                ${Object.entries(technicalSpecs).map(([key, value]) =>
        `<li><span class="feature-name">${key}:</span> <span class="feature-value">${value}</span></li>`
    ).join("\n")}
            </ul>
        </div>
    </div>`;
}

function createWhatsInBoxHTML(packageContents) {
    if (!packageContents) return ''
    return `
    <div class="details-section">
        <div class="section-header">
            <h3 class="section-title">What's In The Box</h3>
            <span class="toggle-arrow">\uea50</span>
        </div>
        <div class="section-content">
            <ul class="feature-list">
                <li><span>${packageContents}</span></li>
            </ul>
        </div>
    </div>`;
}

function createBottomSection(specifications) {
    return `
    <div class='bottom-section'>    
        ${createDescriptionHTML(specifications.description)}
        ${createFeaturesHTML(specifications.keyFeatures)}
        ${createOthersHTML(specifications.technicalSpecs)}
        ${createWhatsInBoxHTML(specifications.packageContents)}
    </div>
    `;
}

const createRelatedRatingHTML = (reviews = []) => {
    const reviewCount = reviews.total;
    const averageRating = reviews.rating

    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
        <div class="product-rating" aria-label="Rating: ${averageRating} out of 5">
            <div class="stars" role="img">
                ${'<span class="star filled">★</span>'.repeat(fullStars)}
                ${hasHalfStar ? '<span class="star half-filled">★</span>' : ''}
                ${'<span class="star">★</span>'.repeat(emptyStars)}
                <span class="rating-count">(${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>
        </div>`;
};

const createProductCard = (product) => {
    const { id, media, name, pricing, reviews = [] } = product;
    const { currentPrice, originalPrice } = pricing;
    const price = currentPrice ?? originalPrice;
    const imageUrl = media?.primaryImage || '/fallback-image.jpg'; // fallback if needed

    return `
        <div class="modern-product-container" id="${id}" tabindex="0" 
             aria-label="${name}, Price: Rs ${price}, Rating: ${reviews.length} reviews">
            <div class="modern-product-image">
                <img src="${imageUrl}" alt="${name}" loading="lazy">
                <button class="modern-cart-btn" data-id=${id} aria-label="Add ${name} to cart">
                    <span class="modern-icon-container">
                        <svg class="modern-cart-icon" height="1em" viewBox="0 0 576 512" fill="rgb(17, 17, 17)">
                            <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
                        </svg>
                    </span>
                </button>
            </div>
            <div class="modern-details-div">
                <div class="modern-upper-border"></div>
                ${createRelatedRatingHTML(reviews)}
                <div class="modern-upper-border"></div>
                <div class="modern-product-name">${name}</div>
                <div class="modern-upper-border"></div>
                <div class="modern-product-price">Rs ${price}</div>
            </div>
            <div class="modern-lower-border"></div>
        </div>`;
};

function createRelatedProductsHTML(categoryData) {
    if (!categoryData?.data?.length) return '';

    return `
    <section class="related-products-section">
        <div class="section-header">
            <h2>You May Also Like</h2>
            <a href="/category/${categoryData.data[0].category.toLowerCase()}" class="view-all">View All</a>
        </div>
        <div class="products-container">
            <!-- Products will be rendered here by JavaScript -->
            ${categoryData?.data.slice(0, 6).map(createProductCard).join('')}
        </div>
    </section>`;
}
// ======================== IMAGE GALLERY ========================

function initImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('mouseover', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImage.src = thumb.src;
            mainImage.alt = thumb.alt;
        });
    });
}

function initColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option-text');
    [...document.querySelectorAll('.color-options-text [selected]')].forEach(
        el => window.selectedColor = el.dataset.color
    );

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            window.selectedColor = option.dataset.color;
        });
    });
}

function initFullscreen() {
    const zoomableImages = document.querySelectorAll('.zoomable-image');
    const modal = document.querySelector('.fullscreen-modal');
    const modalImg = document.querySelector('.modal-content');
    const closeBtn = document.querySelector('.close-fullscreen');

    if (!modal || !modalImg || !closeBtn) {
        console.warn('Fullscreen modal elements not found');
        return;
    }

    function openFullscreen(imgSrc) {
        modal.style.display = 'flex';
        modalImg.src = imgSrc;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
    }

    function closeFullscreen() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleKeyDown);
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') closeFullscreen();
    }

    zoomableImages.forEach(img => {
        img.addEventListener('click', function () {
            openFullscreen(this.src);
        });
    });

    closeBtn.addEventListener('click', closeFullscreen);

    modal.addEventListener('click', function (e) {
        if (e.target === this) closeFullscreen();

    });

    return function cleanup() {
        zoomableImages.forEach(img => { img.removeEventListener('click', openFullscreen); });
        closeBtn.removeEventListener('click', closeFullscreen);
        modal.removeEventListener('click', closeFullscreen);
        document.removeEventListener('keydown', handleKeyDown);
    };
}

function initCollapsibleSections() {
    const sections = document.querySelectorAll('.details-section');

    sections.forEach(section => {
        const content = section.querySelector('.section-content');
        content.style.maxHeight = '0';
    });

    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', toggleSection);
    });

    if (sections.length > 0) {
        sections[0].classList.add('active');
        sections[0].querySelector('.section-content').style.maxHeight = '1000px';
    }
}

function toggleSection() {
    const section = this.parentElement;
    const content = section.querySelector('.section-content');
    section.classList.toggle('active');
    if (section.classList.contains('active')) content.style.maxHeight = content.scrollHeight + 'px';
    else content.style.maxHeight = '0';
}

// ======================== CATEGORY PAGE RENDERING ========================

function setupCartButtons() {
    const cartBtn = document.querySelectorAll('.modern-cart-btn');
    cartBtn.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await addToCart(btn.dataset.id);
        });
    })
}

function navigateToProduct(productId) {
    location.assign(`/product/${productId}`);
}

// ======================== MAIN INITIALIZATION ========================

async function initializePage() {
    try {
        updateCartIcon()

        const segments = location.pathname.split('/').filter(Boolean);
        const productId = segments[segments.length - 1];

        if (productId) {
            const product = await fetchProduct(productId);
            await renderProduct(product);

            setupMobileCartButtonBehavior();

            toggleLoader(false)
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

function setupMobileCartButtonBehavior() {
    const mobileWidth = 768;
    if (window.innerWidth > mobileWidth) return;

    const cartButtons = document.querySelectorAll('.CartBtn');

    function checkForCentering() {
        cartButtons.forEach(button => {
            const isCentered = isElementInVerticalCenter(button);
            button.classList.toggle('centered', isCentered);
        });
    }

    window.addEventListener('scroll', checkForCentering);
    window.addEventListener('resize', checkForCentering);
    checkForCentering();
}

function isElementInVerticalCenter(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const middleOfViewport = windowHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const tolerance = 100;

    return Math.abs(elementCenter - middleOfViewport) <= tolerance;
}

// ======================== API FUNCTIONS ========================

async function fetchProduct(productId) {
    const response = await fetch(`/api/products/${productId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch product");
    }

    const responseObj = await response.json()
    const product = responseObj.data
    return product;
}

async function fetchCategory(category) {
    const response = await fetch(`/api/categories/${category}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch category");
    }

    return response.json();
}

async function addToCart(productId, color = null) {
    try {
        const res = await fetch(`/api/cart/${productId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(color ? { color } : {}),
        });

        const data = await res.json();

        if (res.status === 401 && data.redirect)
            return location.assign(`/${data.redirect}`);

        await updateCartIcon();
        notify(data.message, data.type, 3, () => location.assign('/cart'));
    } catch (err) {
        if (err.message.includes("401")) {
            location.assign("/auth");
        } else {
            notify('Something Went Wrong', 'alert');
            console.error("Failed to add to cart:", err);
        }
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

// ======================== INITIALIZE PAGE ========================

window.addEventListener('DOMContentLoaded', initializePage);