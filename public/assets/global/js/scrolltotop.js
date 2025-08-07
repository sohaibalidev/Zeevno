(() => {
    const style = `
    .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 999px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 14px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: var(--transition);
        z-index: 9999;
        font-size: 16px;
    }

    .scroll-to-top i {
        font-size: 20px;
        line-height: 1;
    }

    .scroll-to-top.show {
        opacity: 1;
        visibility: visible;
    }

    .scroll-to-top:hover {
        background: var(--primary-dark);
    }
    `;

    const css = document.createElement('style');
    css.textContent = style;
    document.head.appendChild(css);

    const btn = document.createElement('button');
    btn.className = 'scroll-to-top';
    btn.innerHTML = `<i class='bx bx-chevron-up'></i><span>Scroll To Top</span>`;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
})();
