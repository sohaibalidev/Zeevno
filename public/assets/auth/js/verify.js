document.addEventListener('DOMContentLoaded', async () => {
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');

    const token = window.location.pathname.split('/').pop();
    if (!token || token.length < 10) return handleError('Invalid token');

    try {
        const res = await fetch(`/api/auth/verify-link/${token}`);
        const data = await res.json();

        if (data.success) {
            show(loadingState, false);
            show(successState, true);
            notify('Verified', 'success');
        } else {
            handleError(data.message || 'Verification failed');
        }
    } catch {
        handleError('Network error');
    }

    function handleError(msg) {
        show(loadingState, false);
        if (errorMessage) errorMessage.textContent = msg;
        show(errorState, true);
        notify(msg, 'error');
    }

    function show(el, visible) {
        if (el) el.classList.toggle('hidden', !visible);
    }
});
