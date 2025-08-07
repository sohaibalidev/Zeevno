const navbarData = {
    logo: {
        main: "Nexa",
        highlight: "Ease",
        href: "/"
    },
    menuItems: [
        { text: "Home", url: "/" },
        { text: "Categories", url: "/category" },
        { text: "On Sale", url: "#on-sale" },
        { text: "Contact", url: "#contact" },
    ],
    icons: [
        { icon: "bx bx-search", href: "/search" },
        { icon: "bx bx-cart", href: "/cart" },
        { icon: "bx bx-user", href: "/user" }
    ]
};

function loadCSS(href) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) return resolve();

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

function createNavbar(data) {
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    nav.innerHTML = `
        <div class="container navbar-container">
            <a href="${data.logo.href}" class="logo">${data.logo.main}<span>${data.logo.highlight}</span></a>

            <button class="mobile-menu-btn" id="mobileMenuBtn">
                <i class='bx bx-menu'></i>
            </button>

            <div class="nav-links" id="navLinks">
                ${data.menuItems.map(item =>
        `<a href="${item.url}">${item.text}</a>`
    ).join('')}
            </div>

            <div class="nav-icons">
                ${data.icons.map(icon => {
        if (icon.href === '/cart') {
            return `<div class="cart-icon-container">
                            <i class='${icon.icon}' data-href="${icon.href}"></i>
                            <span class="cart-quantity">0</span>
                        </div>`;
        }
        return `<i class='${icon.icon}' data-href="${icon.href}"></i>`;
    }).join('')}
            </div>
        </div>
    `;

    return nav;
}

async function initNavbar() {
    if (document.querySelector('nav.navbar')) return;

    try {
        await Promise.all([
            loadCSS('/g/css/components/navbar.css'),
            loadCSS('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css')
        ]);

        const navbar = createNavbar(navbarData);
        document.body.insertBefore(navbar, document.body.firstChild);

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-icons i').forEach(icon => {
            icon.addEventListener('click', () => {
                const href = icon.dataset.href;
                location.assign(href)
            });
        });

        updateCartQuantity();
    } catch (error) {
        console.error('Failed to load navbar resources:', error);
    }
}

function updateCartQuantity(quantity = 0) {
    const cartQuantityElement = document.querySelector('.cart-quantity');
    if (cartQuantityElement) {
        cartQuantityElement.textContent = quantity;
        cartQuantityElement.style.display = quantity >= 0 ? 'flex' : 'none';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

window.navbarData = navbarData;
window.updateCartQuantity = updateCartQuantity;