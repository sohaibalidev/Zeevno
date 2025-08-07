document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return console.error('Login form missing');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput?.value.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValid) {
            emailInput?.parentElement?.classList.add('error');
            emailInput?.focus();
            notify('Please enter a valid email address', 'error');
            return;
        }

        const btn = this.querySelector('.btn-primary');
        if (!btn) return;

        toggleLoading(btn, true);

        try {
            const res = await fetch(`/api/auth/send-link/${email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await res.json();
            toggleLoading(btn, false);

            if (res.ok) {
                notify('Login link sent to your email!', 'success');
                loginForm.reset();
            } else {
                notify(result.error || 'Failed to send login link', 'error');
            }
        } catch (err) {
            toggleLoading(btn, false);
            notify('Network error. Please try again.', 'error');
            console.error('Login error:', err);
        }
    });

    function toggleLoading(btn, state) {
        btn.classList.toggle('loading', state);
        btn.disabled = state;
    }
});
