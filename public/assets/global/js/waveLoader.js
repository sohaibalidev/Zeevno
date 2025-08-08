const loaderConfig = {
    cssPath: '/g/css/waveLoader.css',
    textParts: [
        { text: 'Zeevno', color: '#0a369d' },
    ],
    dotCount: 4,
    fadeDuration: 200
};

(function loadLoaderCSS() {
    try {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = loaderConfig.cssPath;
        cssLink.onerror = () => console.error('Loader CSS failed to load');
        document.head.appendChild(cssLink);
    } catch (e) {
        console.error('Error loading loader CSS:', e);
    }
})();

function createLoader(config) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';

    const loaderText = document.createElement('span');
    loaderText.className = 'loader-text';

    config.textParts.forEach(part => {
        const span = document.createElement('span');
        span.style.color = part.color;
        span.textContent = part.text;
        loaderText.appendChild(span);
    });

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dots-loader';

    for (let i = 0; i < config.dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotsContainer.appendChild(dot);
    }

    overlay.appendChild(loaderText);
    overlay.appendChild(dotsContainer);

    return overlay;
}

window.toggleLoader = function (show = true) {
    let loader = document.getElementById('loading-overlay');

    if (show) {
        if (!loader) {
            if (!document.body) {
                return setTimeout(() => toggleLoader(show), 50);
            }
            loader = createLoader(loaderConfig);
            document.body.insertBefore(loader, document.body.firstChild);
        }
        loader.classList.remove('fade-out');
        loader.style.display = 'flex';
    } else if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, loaderConfig.fadeDuration);
    }
};

(function init() {
    if (document.readyState === 'loading') {
        toggleLoader(true);
    }
})();