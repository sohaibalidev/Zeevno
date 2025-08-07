const footerData = {
    logo: "NexaEase",
    description: "Your one-stop shop for all the latest tech gadgets and accessories at competitive prices.",
    quickLinks: [
        { text: "Home", url: "/" },
        { text: "About Us", url: "#about" },
        { text: "Products", url: "/category" },
        { text: "Contact", url: "#contact" }
    ],
    customerService: [
        { text: "FAQs", url: "#faqs" },
        { text: "Shipping Policy", url: "#shipping-policy" },
        { text: "Return Policy", url: "#return-policy" },
        { text: "Privacy Policy", url: "#privacy-policy" }
    ],
    contactInfo: {
        address: "Gulshan E Iqbal, Karachi",
        phone: "+92 300 1234567",
        email: "info@nexaease.com"
    },
    copyright: "© 2023 NexaEase. All Rights Reserved."
};

function loadCSS(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

function createFooter(data) {
    const footer = document.createElement('footer');
    footer.className = 'footer';

    footer.innerHTML = `
    <div class="container">
      <div class="footer-container">
        <div class="footer-about">
          <a href="#" class="footer-logo">${data.logo}</a>
          <p class="footer-about">${data.description}</p>
        </div>

        <div class="footer-links">
          <h3>Quick Links</h3>
          <ul>
            ${data.quickLinks.map(link => `<li><a href="${link.url}">${link.text}</a></li>`).join('')}
          </ul>
        </div>

        <div class="footer-links">
          <h3>Customer Service</h3>
          <ul>
            ${data.customerService.map(service => `<li><a href="${service.url}">${service.text}</a></li>`).join('')}
          </ul>
        </div>

        <div class="footer-contact">
          <h3>Contact Us</h3>
          <p><i class='bx bx-map'></i> ${data.contactInfo.address}</p>
          <p><i class='bx bx-phone'></i> ${data.contactInfo.phone}</p>
          <p><i class='bx bx-envelope'></i> ${data.contactInfo.email}</p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>${data.copyright}</p>
      </div>
    </div>
  `;

    return footer;
}

async function initFooter() {
    if (document.querySelector('footer.footer')) return;

    try {
        await Promise.all([
            loadCSS('/g/css/components/footer.css'),
            loadCSS('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css')
        ]);

        const footer = createFooter(footerData);
        document.body.appendChild(footer);
    } catch (error) {
        console.error('Failed to load footer resources:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooter);
} else {
    initFooter();
}

window.footerData = footerData;