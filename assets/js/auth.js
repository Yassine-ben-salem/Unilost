function saveUser(user) {
    localStorage.setItem('unilost_user', JSON.stringify(user));
}

function getCurrentUser() {
    const raw = localStorage.getItem('unilost_user');
    return raw ? JSON.parse(raw) : null;
}

function logout() {
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const logoutPath = isInPagesFolder ? '../php/logout.php' : 'php/logout.php';

    fetch(logoutPath, {
        method: 'POST',
        credentials: 'same-origin'
    }).catch(() => {});

    localStorage.removeItem('unilost_user');
    window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
}

function getRelativePath(page) {
    return window.location.pathname.includes('/pages/') ? page : `pages/${page}`;
}

function getRequestedRedirectPath(fallback) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '';

    if (!redirect) {
        return fallback;
    }

    try {
        const parsed = new URL(redirect, window.location.href);
        const page = parsed.pathname.split('/').pop() || '';
        const allowedTargets = new Set([
            'lost.html',
            'found.html',
            'publish.html',
            'my-posts.html',
            'lost-details.html',
            'found-details.html',
            'all-posts.html'
        ]);

        if (!allowedTargets.has(page)) {
            return fallback;
        }

        return `${page}${parsed.search || ''}`;
    } catch (error) {
        return fallback;
    }
}

function setupAccountMenu() {
    const menu = document.querySelector('.nav-account-menu');
    const trigger = document.querySelector('.nav-account-trigger');

    if (!menu || !trigger) return;

    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = menu.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    menu.querySelectorAll('.nav-account-link').forEach((link) => {
        link.addEventListener('click', () => {
            menu.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target)) {
            menu.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            menu.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function updateNavbar() {
    const user = getCurrentUser();
    const authDiv = document.querySelector('.auth');
    if (!authDiv) return;

    if (user) {
        const initial = (user.name || 'U').trim().charAt(0).toUpperCase();

        authDiv.innerHTML = `
      <a class="nav-publish-btn" href="${getRelativePath('publish.html')}">+ Publish</a>
      <div class="nav-account-menu">
        <button class="nav-user-chip nav-account-trigger" type="button" aria-label="Open account menu">
          <span class="nav-user-avatar">${initial}</span>
          <span class="nav-username">${user.name}</span>
          <span class="nav-account-caret" aria-hidden="true">▾</span>
        </button>
        <div class="nav-account-dropdown">
          <a class="nav-account-link" href="${getRelativePath('my-posts.html')}">My Posts</a>
          <button class="nav-account-link nav-account-logout" type="button" onclick="logout()">Logout</button>
        </div>
      </div>
    `;

        setupAccountMenu();
    }
}

function updateHomepageCTA() {
    const user = getCurrentUser();
    const title = document.getElementById('homepage-cta-title');
    const text = document.getElementById('homepage-cta-text');
    const button = document.getElementById('homepage-cta-button');

    if (!title || !text || !button) return;

    if (user) {
        title.textContent = 'Ready to publish an item?';
        text.textContent = 'Post a lost or found item now and help the campus community reconnect with it faster.';
        button.textContent = '+ Publish Item';
        button.href = 'pages/publish.html';
        return;
    }

    title.textContent = 'Found or Lost Something?';
    text.textContent = 'Sign in to post items and help reunite belongings with their owners.';
    button.textContent = '+ Get Started';
    button.href = 'pages/login.html';
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

        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        if (!validateLogin(email, password)) return;

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        try {
            const res = await fetch('../php/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                saveUser(data.user);
                window.location.href = getRequestedRedirectPath('../index.html');
            } else {
                showBanner(data.message || 'Invalid email or password.');
            }
        } catch (err) {
            showBanner('Could not connect to the server. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign in';
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

        const name = document.getElementById('FullName').value;
        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;
        const confirm = document.getElementById('ConfirmPassword').value;

        if (!validateRegister(name, email, password, confirm)) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
            const res = await fetch('../php/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (data.success) {
                saveUser(data.user);
                window.location.href = getRequestedRedirectPath('../index.html');
            } else {
                showBanner(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            showBanner('Could not connect to the server. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
}

updateNavbar();
updateHomepageCTA();
document.documentElement.classList.add('auth-ui-ready');
