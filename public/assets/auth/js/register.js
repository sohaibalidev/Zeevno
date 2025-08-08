document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) {
        console.warn('Register form not found');
        return;
    }

    const btn = registerForm.querySelector('.btn-primary');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const cityInput = document.getElementById('city');
    const addressInput = document.getElementById('address');

    if (!btn) {
        console.warn('Submit button not found');
        return;
    }

    registerForm.addEventListener('submit', handleSubmit);

    async function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        const formData = {
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            city: cityInput.value.trim(),
            address: addressInput.value.trim()
        };

        if (!validateInputs(formData)) {
            return;
        }

        try {
            toggleLoading(btn, true);
            const response = await submitForm(formData);

            if (response.ok) {
                notify('Account created successfully! Please check your email for verification.', 'success');
                registerForm.reset();
            } else {
                const errorData = await response.json();
                notify(errorData.error || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            notify('Network error. Please try again.', 'error');
        } finally {
            toggleLoading(btn, false);
        }
    }

    function validateInputs({ fullName, email, phone, city, address }) {
        if (!fullName || !email || !phone || !city || !address) {
            notify('Please fill all required fields', 'error');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            notify('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    async function submitForm(formData) {
        return await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
    }

    function toggleLoading(button, isLoading) {
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
        button.setAttribute('aria-busy', isLoading);
    }
});