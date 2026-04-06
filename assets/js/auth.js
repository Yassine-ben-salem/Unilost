function saveUser(user) {
    localStorage.setItem('unilost_user', JSON.stringify(user));
}

function getCurrentUser() {
    const raw = localStorage.getItem('unilost_user');
    return raw ? JSON.parse(raw) : null;
}

function logout() {
    localStorage.removeItem('unilost_user');
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
}

function updateNavbar() {
    const user    = getCurrentUser();
    const authDiv = document.querySelector('.auth');
    if (!authDiv) return;

    if (user) {
        authDiv.innerHTML = `
      <span class="nav-username">${user.name}</span>
      <button class="login-btn logout-btn" onclick="logout()">Logout</button>
    `;
    }
}

function showError(fieldId, message) {
    clearError(fieldId);
    const field = document.getElementById(fieldId);
    if (!field) return;
    const err = document.createElement('p');
    err.className   = 'field-error';
    err.textContent = message;
    field.closest('div').insertAdjacentElement('afterend', err);
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const next = field.closest('div').nextElementSibling;
    if (next && next.classList.contains('field-error')) next.remove();
}

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
}

/************************** Validation ******************************/

function isValidEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}

function validateLogin(email, password) {
    let valid = true;

    if (!email.trim()) {
        showError('Email', 'Email is required.');
        valid = false;
    } else if (!isValidEmail(email)) {
        showError('Email', 'Please enter a valid email address.');
        valid = false;
    }

    if (!password) {
        showError('Password', 'Password is required.');
        valid = false;
    }

    return valid;
}


function validateRegister(name, email, password, confirm) {
    let valid = true;

    if (!name.trim()) {
        showError('FullName', 'Full name is required.');
        valid = false;
    }

    if (!email.trim()) {
        showError('Email', 'Email is required.');
        valid = false;
    } else if (!isValidEmail(email)) {
        showError('Email', 'Please enter a valid email address.');
        valid = false;
    }

    if (!password) {
        showError('Password', 'Password is required.');
        valid = false;
    } else if (password.length < 8) {
        showError('Password', 'Password must be at least 8 characters.');
        valid = false;
    }

    if (!confirm) {
        showError('ConfirmPassword', 'Please confirm your password.');
        valid = false;
    } else if (password !== confirm) {
        showError('ConfirmPassword', 'Passwords do not match.');
        valid = false;
    }

    return valid;
}
function showBanner(message, type = 'error') {
    removeBanner();
    const banner = document.createElement('p');
    banner.id          = 'auth-banner';
    banner.className   = `auth-banner ${type}`;
    banner.textContent = message;
    const form = document.querySelector('.register-form');
    if (form) form.insertAdjacentElement('beforebegin', banner);
}

function removeBanner() {
    const existing = document.getElementById('auth-banner');
    if (existing) existing.remove();
}

/************************** Login ******************************/

const loginForm = document.querySelector('#ConfirmPassword') === null
    && document.querySelector('#Email') !== null
    && document.querySelector('.register-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();
        removeBanner();

        const email    = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        if (!validateLogin(email, password)) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.disabled    = true;
        btn.textContent = 'Logging in...';

        try {
            const res  = await fetch('../php/login.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                saveUser(data.user);
                window.location.href = '../index.html';
            } else {
                showBanner(data.message || 'Invalid email or password.');
            }
        } catch (err) {
            showBanner('Could not connect to the server. Please try again.');
        }
    });
}

/************************** Register *******************************/

const registerForm = document.getElementById('ConfirmPassword') !== null
    && document.querySelector('.register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();
        removeBanner();

        const name     = document.getElementById('FullName').value;
        const email    = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;
        const confirm  = document.getElementById('ConfirmPassword').value;

        if (!validateRegister(name, email, password, confirm)) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.disabled    = true;
        btn.textContent = 'Creating account...';

        try {
            const res  = await fetch('../php/register.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (data.success) {
                saveSession(data.user);
                window.location.href = '../index.html';
            } else {
                showBanner(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            showBanner('Could not connect to the server. Please try again.');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Create Account';
        }
    });
}

updateNavbar();