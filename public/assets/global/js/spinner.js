function initSpinner() {
    if (document.getElementById('__global-spinner-style')) return;

    const style = document.createElement('style');
    style.id = '__global-spinner-style';
    style.textContent = `
        .__inline-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .__spinner-ring {
            width: 32px;
            height: 32px;
            border: 4px solid #d1d5db;
            border-top: 4px solid #4361ee;
            border-radius: 50%;
            animation: __spin 0.6s linear infinite;
        }

        @keyframes __spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function toggleSpinner(id, show) {
    const parent = document.getElementById(id);
    if (!parent) return;

    let spinner = parent.querySelector('.__inline-spinner');

    if (show) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = '__inline-spinner';
            spinner.innerHTML = `<div class="__spinner-ring"></div>`;
            parent.prepend(spinner);
        }
    } else {
        spinner?.remove();
    }
}
