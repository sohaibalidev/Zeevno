// ====================================================================================================
// Utility Functions
// ====================================================================================================

const fetchData = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

const capitalizeFirstLetter = string => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const formatTitle = str => {
    if (!str) return '';
    return str.replace(/-/g, ' ')
        .split(' ')
        .map(word => capitalizeFirstLetter(word))
        .join(' ');
};

// ====================================================================================================
// DOM Elements Manager
// ====================================================================================================

const getDomElements = () => ({
    productsContainer: document.querySelector('.products-container'),
    sortSelect: document.getElementById('sort'),
    filterGroups: document.querySelectorAll('.filter-group'),
    clearAllBtn: document.querySelector('.clear-all'),
    viewOptions: document.querySelectorAll('.view-options button'),
    paginationButtons: document.querySelectorAll('.pagination button'),
    pageNumbers: document.querySelector('.page-numbers'),
    categoryHeader: document.querySelector('.category-header h1'),
    categoryDescription: document.querySelector('.category-description'),
    breadcrumbs: document.querySelector('.breadcrumbs span'),
    searchInput: document.getElementById('searchQuery'),
    clearBtn: document.getElementById('clearSearch'),
    priceRange: document.getElementById('priceRange'),
    currentPriceDisplay: document.getElementById('current-price'),
    productsCount: document.getElementById('products-count'),
    categoriesFilterGroup: document.getElementById('filter-group-categories')
});

// ====================================================================================================
// Application State Manager
// ====================================================================================================

const createAppState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q') || '';

    const poppedCategory = location.href.split('/').pop()
    const categoryParam = poppedCategory !== 'category' ? poppedCategory : ''

    return {
        debounceTimer: null,
        currentProducts: [],
        filteredProducts: [],
        currentCategory: categoryParam,
        currentFilters: {
            price: [0, 10000],
            categories: categoryParam ? [categoryParam] : [],
            rating: null
        },
        currentSort: 'newest',
        currentPage: 1,
        productsPerPage: 12,
        urlParams,
        searchQuery: queryParam
    };
};

// ====================================================================================================
// Product Rendering
// ====================================================================================================

const renderProductCount = (count) => {
    const { productsCount } = getDomElements();
    if (!productsCount) return;

    if (count && count > 0) {
        productsCount.style.display = 'block';
        productsCount.textContent = `${count} ${count === 1 ? 'Product' : 'Products'} Found`;
    } else {
        productsCount.style.display = 'none';
        productsCount.textContent = '';
    }
};

const createRatingHTML = (reviews = []) => {
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
    const imageUrl = media?.primaryImage

    return `
        <div class="modern-product-container" id="${id}" tabindex="0" 
             aria-label="${name}, Price: Rs ${price}, Rating: ${reviews.length} reviews">
            <div class="modern-product-image">
                <img src="${imageUrl}" alt="${name}" loading="lazy">
                <button class="modern-cart-btn" aria-label="Add ${name} to cart">
                    <span class="modern-icon-container">
                        <svg class="modern-cart-icon" height="1em" viewBox="0 0 576 512" fill="rgb(17, 17, 17)">
                            <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
                        </svg>
                    </span>
                </button>
            </div>
            <div class="modern-details-div">
                <div class="modern-upper-border"></div>
                ${createRatingHTML(reviews)}
                <div class="modern-upper-border"></div>
                <div class="modern-product-name">${name}</div>
                <div class="modern-upper-border"></div>
                <div class="modern-product-price">Rs ${price}</div>
            </div>
            <div class="modern-lower-border"></div>
        </div>`;
};

const renderProducts = (products, container) => {
    if (!container) return;

    if (!products || products.length === 0) {
        const { searchInput } = getDomElements();
        const searchQuery = searchInput?.value.trim() || appState.searchQuery;

        container.innerHTML = searchQuery
            ? `<p class="no-products" aria-live="polite">No products found for "${searchQuery}". Try different keywords.</p>`
            : `<p class="no-products" aria-live="polite">No products match your filters. Try adjusting your criteria.</p>`;
        return;
    }

    container.innerHTML = products.map(createProductCard).join('');
    setupProductCardEvents(container);
};

const setupProductCardEvents = (container) => {
    if (!container) return;

    container.querySelectorAll('.modern-product-container').forEach(card => {
        // Product click handler
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.modern-cart-btn')) {
                window.location.assign(`/product/${card.id}`);
            }
        });

        // Keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                window.location.assign(`/product/${card.id}`);
            }
        });

        // Cart button handler
        const cartBtn = card.querySelector('.modern-cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await addToCart(card.id);
            });
        }
    });
};

// ====================================================================================================
// Filtering and Sorting
// ====================================================================================================

const filterProducts = (products, filters) => {
    if (!products || !Array.isArray(products)) return [];

    return products.filter(product => {
        const price = product.pricing.currentPrice ?? product.pricing.originalPrice;
        const matchesCategory = filters.categories.length === 0 ||
            filters.categories.includes(product.category);
        const matchesPrice = price >= filters.price[0] && price <= filters.price[1];
        const matchesRating = filters.rating === null ||
            (product.reviews?.length &&
                getAverageRating(product.reviews) >= filters.rating);

        return matchesCategory && matchesPrice && matchesRating;
    });
};

const sortProducts = (products, sortMethod) => {
    if (!products || !Array.isArray(products)) return [];

    const sortedProducts = [...products];

    switch (sortMethod) {
        case 'price-low':
            return sortedProducts.sort((a, b) => {
                const priceA = a.pricing.currentPrice ?? a.pricing.originalPrice;
                const priceB = b.pricing.currentPrice ?? b.pricing.originalPrice;
                return priceA - priceB;
            });

        case 'price-high':
            return sortedProducts.sort((a, b) => {
                const priceA = a.pricing.currentPrice ?? a.pricing.originalPrice;
                const priceB = b.pricing.currentPrice ?? b.pricing.originalPrice;
                return priceB - priceA;
            });

        case 'rating':
            return sortedProducts.sort((a, b) => {
                const ratingA = a.reviews.rating
                const ratingB = b.reviews.rating
                return ratingB - ratingA;
            });

        case 'newest':
        default:
            return sortedProducts.sort((a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
};

const getAverageRating = (reviews = []) => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
};

const searchProducts = (products, query) => {
    if (!query || !query.trim()) return products;
    const searchTerm = query.trim().toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(searchTerm))
};

// ====================================================================================================
// Pagination
// ====================================================================================================

const updatePagination = (totalItems, currentPage, itemsPerPage) => {
    const { pageNumbers, paginationButtons } = getDomElements();
    if (!pageNumbers || !paginationButtons) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        pageNumbers.innerHTML = '';
        return;
    }

    // Update previous/next buttons
    paginationButtons[0].disabled = currentPage === 1;
    paginationButtons[paginationButtons.length - 1].disabled = currentPage === totalPages;

    // Generate page numbers
    let pagesHTML = '';
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

    // Add first page and ellipsis if needed
    if (startPage > 1) {
        pagesHTML += `<button class="page-number" data-page="1">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="ellipsis">...</span>`;
        }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pagesHTML += `<button class="page-number ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesHTML += `<span class="ellipsis">...</span>`;
        }
        pagesHTML += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
    }

    pageNumbers.innerHTML = pagesHTML;
};

// ====================================================================================================
// Event Handlers
// ====================================================================================================

const setupEventListeners = () => {
    const {
        sortSelect,
        filterGroups,
        clearAllBtn,
        viewOptions,
        searchInput,
        clearBtn,
        priceRange,
        currentPriceDisplay,
        categoriesFilterGroup
    } = getDomElements();

    // Sort select change
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            appState.currentSort = e.target.value;
            updateAndRenderProducts();
        });
    }

    // Filter group toggles
    filterGroups.forEach(group => {
        const header = group.querySelector('.filter-header');
        if (header) {
            header.addEventListener('click', () => {
                const content = group.querySelector('.filter-content');
                const icon = header.querySelector('i');
                if (content) content.classList.toggle('active');
                if (icon) {
                    icon.classList.toggle('fa-chevron-up');
                    icon.classList.toggle('fa-chevron-down');
                }
            });
        }
    });

    // Price range filter
    if (priceRange && currentPriceDisplay) {
        priceRange.addEventListener('input', (e) => {
            const value = Math.floor(parseInt(e.target.value) / 100) * 100;
            appState.currentFilters.price[1] = value;
            currentPriceDisplay.textContent = `- ${value}`;
            updateAndRenderProducts();
        });
    }

    // Category filter checkboxes
    if (categoriesFilterGroup) {
        categoriesFilterGroup.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.id;
                if (e.target.checked) {
                    appState.currentFilters.categories.push(value);
                } else {
                    appState.currentFilters.categories = appState.currentFilters.categories.filter(cat => cat !== value);
                }
                updateAndRenderProducts();
            });
        });
    }

    // Rating filter radios
    document.querySelectorAll('.filter-content input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                appState.currentFilters.rating = parseInt(e.target.id.replace('rating', ''));
                updateAndRenderProducts();
            }
        });
    });

    // Clear all filters
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', resetFilters);
    }

    // View options
    if (viewOptions) {
        viewOptions.forEach(button => {
            button.addEventListener('click', () => {
                viewOptions.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                updateAndRenderProducts();
            });
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            appState.searchQuery = query;

            if (clearBtn) {
                clearBtn.style.opacity = query.trim() ? '1' : '0';
            }

            clearTimeout(appState.debounceTimer);
            appState.debounceTimer = setTimeout(() => {
                updateAndRenderProducts();
            }, 300);
        });

        // Enter key in search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                updateAndRenderProducts();
            }
        });
    }

    // Clear search
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                appState.searchQuery = '';
            }
            if (clearBtn) clearBtn.style.opacity = '0';
            updateAndRenderProducts();
        });
    }

    // Pagination
    document.querySelector('.pagination')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('prev-page') && appState.currentPage > 1) {
            appState.currentPage--;
            updateAndRenderProducts();
        } else if (e.target.classList.contains('next-page') &&
            appState.currentPage < Math.ceil(appState.filteredProducts.length / appState.productsPerPage)) {
            appState.currentPage++;
            updateAndRenderProducts();
        } else if (e.target.classList.contains('page-number')) {
            appState.currentPage = parseInt(e.target.dataset.page);
            updateAndRenderProducts();
        }
    });
};

// ====================================================================================================
// Data Loading
// ====================================================================================================

const loadCategory = async (categoryName) => {
    try {
        const { categoryHeader, breadcrumbs, categoryDescription, categoriesFilterGroup } = getDomElements();

        if (categoryHeader) categoryHeader.textContent = formatTitle(categoryName);
        if (breadcrumbs) breadcrumbs.textContent = formatTitle(categoryName);
        if (categoryDescription) {
            categoryDescription.textContent = `Explore our curated selection of premium ${formatTitle(categoryName)} to elevate your lifestyle.`;
        }
        // if (categoriesFilterGroup) categoriesFilterGroup.style.display = 'none';

        const res = await fetchData(`/api/categories/${categoryName}`);
        const { data } = res
        appState.currentProducts = data || [];
        appState.currentCategory = categoryName;
        appState.currentFilters.categories = [categoryName];

        updateAndRenderProducts();
    } catch (error) {
        console.error('Error loading category:', error);
        const { productsContainer } = getDomElements();
        if (productsContainer) {
            productsContainer.innerHTML = `<p class="error">Error loading products. Please try again later.</p>`;
        }
    } finally {
        toggleLoader(false);
    }
};

const loadAllCategories = async () => {
    try {
        const response = await fetchData('/api/categories');
        const { data } = response
        const { categoriesFilterGroup } = getDomElements();
        if (!categoriesFilterGroup) return;

        const filterContent = categoriesFilterGroup.querySelector('.filter-content');
        if (!filterContent) return;

        filterContent.innerHTML = data.map(({ category, totalProducts }) => `
            <div class="checkbox-item">
                <input type="checkbox" id="${category}" 
                       ${appState.currentFilters.categories.includes(category) ? 'checked' : ''}>
                <label for="${category}">${formatTitle(category)} (${totalProducts})</label>
            </div>
        `).join('');

        filterContent.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.id;
                if (e.target.checked) {
                    appState.currentFilters.categories.push(value);
                    appState.currentPage = 1;
                    updateAndRenderProducts();
                } else {
                    appState.currentFilters.categories = appState.currentFilters.categories.filter(cat => cat !== value);
                    appState.currentPage = 1;
                    updateAndRenderProducts();
                }
                updateAndRenderProducts();
            });
        });

    } catch (error) {
        console.error('Error loading categories:', error);
    }
};

const loadAllProducts = async () => {
    try {
        const { data } = await fetchData('/api/products?page=1&limit=500');
        const { products } = data
        appState.currentProducts = products || [];
        appState.currentCategory = null;
        updateAndRenderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        const { productsContainer } = getDomElements();
        if (productsContainer) {
            productsContainer.innerHTML = `<p class="error">Error loading products. Please try again later.</p>`;
        }
    } finally {
        toggleLoader(false);
    }
};

// ====================================================================================================
// Cart Functions
// ====================================================================================================

const updateCartQty = async () => {
    try {
        const cart = await fetchData("/api/cart");
        const { data: items } = cart
        updateCartQuantity(items?.length || 0);
    } catch (error) {
        console.error('Error updating cart quantity:', error);
    }
};

const addToCart = async (productId) => {
    try {
        const data = await fetchData(`/api/cart/${productId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        notify(data.message, data.type, 3, () => window.location.assign('/cart'));
        await updateCartQty();
    } catch (error) {
        console.error("Add to Cart Failed:", error);
        notify("Failed to add item to cart", "error", 3);
    }
};

// ====================================================================================================
// Main Functions
// ====================================================================================================

const resetFilters = () => {
    const { priceRange, searchInput, clearBtn, currentPriceDisplay } = getDomElements();

    if (priceRange) {
        priceRange.value = 10000;
        currentPriceDisplay.textContent = '- 10000'
        appState.currentFilters.price = [0, 10000];
    }

    appState.currentFilters.categories = appState.currentCategory ? [appState.currentCategory] : [];

    appState.currentFilters.rating = null;
    document.querySelectorAll('.filter-content input[type="radio"]').forEach(input => {
        input.checked = false;
    });

    if (searchInput) {
        searchInput.value = '';
        appState.searchQuery = '';
    }
    if (clearBtn) clearBtn.style.opacity = '0';

    document.querySelectorAll('.filter-content input[type="checkbox"]').forEach(input => {
        input.checked = appState.currentFilters.categories.includes(input.id);
    });

    updateAndRenderProducts();
};

const updateAndRenderProducts = () => {
    const searchedProducts = searchProducts(appState.currentProducts, appState.searchQuery);

    const filteredProducts = filterProducts(searchedProducts, appState.currentFilters);
    appState.filteredProducts = filteredProducts;

    const sortedProducts = sortProducts(filteredProducts, appState.currentSort);

    const startIdx = (appState.currentPage - 1) * appState.productsPerPage;
    const paginatedProducts = sortedProducts.slice(startIdx, startIdx + appState.productsPerPage);

    // Update UI
    renderProductCount(filteredProducts.length);
    renderProducts(paginatedProducts, getDomElements().productsContainer);
    updatePagination(filteredProducts.length, appState.currentPage, appState.productsPerPage);
};

// ====================================================================================================
// Initialization
// ====================================================================================================

const appState = createAppState();

const init = async () => {
    try {
        await updateCartQty();

        const { categoryHeader, searchInput, clearBtn } = getDomElements();

        if (categoryHeader) categoryHeader.style.display = 'none';

        if (appState.currentCategory) {
            appState.currentFilters.categories.push(appState.currentCategory);
        }

        await Promise.all([
            loadAllCategories(),
            loadAllProducts()
        ]);

        if (appState.searchQuery) {
            if (searchInput) searchInput.value = appState.searchQuery;
            if (clearBtn) clearBtn.style.opacity = '1';
        }

        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        toggleLoader(false);
    }
};


document.addEventListener('DOMContentLoaded', init);