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
                return;
    }

        authDiv.innerHTML = `
            <a class="login-btn" id="nav-login" href="${getRelativePath('login.html')}">Login</a>
            <a class="register-btn" id="nav-register" href="${getRelativePath('register.html')}">Register</a>
        `;
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
                window.location.replace(getRequestedRedirectPath('../index.html'));
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
                window.location.replace(getRequestedRedirectPath('../index.html'));
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

window.addEventListener('pageshow', () => {
    updateNavbar();
    updateHomepageCTA();
});

(() => {
function getPostsConfig() {
    const path = window.location.pathname;

    if (path.endsWith('/index.html') || path === '/' || path.endsWith('/Web Project/')) {
        return {
            endpoint: 'php/get_items.php?limit=4',
            emptyMessage: 'No posts yet. Be the first to report a lost or found item.'
        };
    }

    if (path.endsWith('/pages/lost.html')) {
        return {
            endpoint: '../php/get_items.php?type=lost',
            emptyMessage: 'No lost items have been posted yet.'
        };
    }

    if (path.endsWith('/pages/found.html')) {
        return {
            endpoint: '../php/get_items.php?type=found',
            emptyMessage: 'No found items have been posted yet.'
        };
    }

    if (path.endsWith('/pages/all-posts.html')) {
        return {
            endpoint: '../php/get_items.php',
            emptyMessage: 'No posts have been added yet.'
        };
    }

    return null;
}

function createSkeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="post-card skeleton-card" aria-hidden="true">
        <span class="post-status skeleton-pill"></span>
        <div class="post-image-container skeleton-block skeleton-image"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="post-meta">
          <div class="skeleton-line skeleton-meta"></div>
          <div class="skeleton-line skeleton-meta short"></div>
        </div>
      </div>
    `).join('');
}

function createPostCard(item) {
    const statusClass = item.type === 'found' ? 'is-found' : 'is-lost';
    const statusLabel = item.type.toUpperCase();
    const description = item.description
        ? item.description
        : 'No description was added for this item.';
    const hasPhoto = Boolean(item.photo_path);
    const photoPath = item.photo_path
        ? getUploadPath(item.photo_path)
        : getAssetPath('no-photo.png');
    const detailsPath = getDetailsPath(item);
    const imageClass = hasPhoto ? 'post-image is-photo' : 'post-image';
    const imageContainerClass = hasPhoto ? 'post-image-container has-photo' : 'post-image-container';

    return `
      <a class="post-card" href="${detailsPath}">
        <span class="post-status ${statusClass}">${statusLabel}</span>
        <div class="${imageContainerClass}">
          <img class="${imageClass}" src="${photoPath}" alt="${item.title}" loading="lazy" decoding="async" />
        </div>
        <h3 class="post-title">${item.title}</h3>
        <p class="post-desc">${description}</p>
        <div class="post-meta">
          <div class="details-container">
            <img src="${getAssetPath('gray-location.png')}" class="location-icon" alt="Location" loading="lazy" />
            <span class="post-place">${item.location}</span><br />
          </div>
          <div class="details-container">
            <img src="${getAssetPath('calendar.png')}" class="calendar-icon" alt="Date" loading="lazy" />
            <span class="post-date">${item.date}</span>
          </div>
        </div>
      </a>
    `;
}

function withDefaultPagination(endpoint, page) {
    if (endpoint.includes('limit=')) {
        return endpoint;
    }

    const joiner = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${joiner}page=${page}&page_size=20`;
}

function getDetailsPath(item) {
    const page = item.type === 'found' ? 'found-details.html' : 'lost-details.html';
    const basePath = window.location.pathname.includes('/pages/')
        ? page
        : `pages/${page}`;

    return `${basePath}?id=${encodeURIComponent(item.id)}`;
}

function getAssetPath(filename) {
    return window.location.pathname.includes('/pages/')
        ? `../assets/images/${filename}`
        : `assets/images/${filename}`;
}

function getUploadPath(filename) {
    return window.location.pathname.includes('/pages/')
        ? `../assets/uploads/${filename}`
        : `assets/uploads/${filename}`;
}

async function loadPosts() {
    const config = getPostsConfig();
    const container = document.querySelector('.posts-container');

    if (!config || !container) return;

    container.innerHTML = createSkeletonCards(window.location.pathname.includes('/pages/') ? 6 : 4);
    container.classList.add('is-skeleton-loading');

    const initialPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
    let currentPage = Math.max(1, initialPage);

    async function fetchAndRender(page, shouldAppend) {
        const endpoint = withDefaultPagination(config.endpoint, page);
        // Add cache-busting timestamp to always get fresh data
        const cachebust = new Date().getTime();
        const url = endpoint.includes('?') ? `${endpoint}&t=${cachebust}` : `${endpoint}?t=${cachebust}`;
        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        const data = await res.json();

        if (!data.success) {
            container.classList.remove('is-skeleton-loading');
            container.innerHTML = '<p>Could not load posts right now.</p>';
            return null;
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            container.classList.remove('is-skeleton-loading');
            if (!shouldAppend) {
                container.innerHTML = `<p>${config.emptyMessage}</p>`;
            }
            return data;
        }

        container.classList.remove('is-skeleton-loading');
        const html = data.items.map(createPostCard).join('');
        container.innerHTML = shouldAppend ? container.innerHTML + html : html;
        return data;
    }

    function renderLoadMore(data) {
        const existing = document.querySelector('.load-more-btn');
        if (existing) {
            existing.remove();
        }

        if (!data || !data.pagination || !data.pagination.has_more || config.endpoint.includes('limit=')) {
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'load-more-btn';
        button.textContent = 'Load More';
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = 'Loading...';
            currentPage += 1;

            try {
                const nextData = await fetchAndRender(currentPage, true);
                renderLoadMore(nextData);
            } catch (error) {
                button.disabled = false;
                button.textContent = 'Load More';
            }
        });

        container.insertAdjacentElement('afterend', button);
    }

    try {
        const data = await fetchAndRender(currentPage, false);
        renderLoadMore(data);
    } catch (error) {
        container.classList.remove('is-skeleton-loading');
        container.innerHTML = '<p>Could not load posts right now.</p>';
    }
}

loadPosts();

window.addEventListener('pageshow', (event) => {
  loadPosts();
});

})();

function getDetailsAssetPath(filename) {
    return `../assets/images/${filename}`;
}

function getDetailsUploadPath(filename) {
    return `../assets/uploads/${filename}`;
}

function getStatusCopy(type) {
    if (type === 'found') {
        return {
            heading: 'Is this your item?',
            text: 'If this belongs to you, use the email below to contact the finder.'
        };
    }

    return {
        heading: 'Did you find this item?',
        text: 'If you have seen or found this item, use the email below to contact the owner.'
    };
}

function getResolvedCopy(type) {
    if (type === 'found') {
        return {
            heading: 'This found-item post has been resolved',
            text: 'The finder has already marked this item as returned to its owner.'
        };
    }

    return {
        heading: 'This lost-item post has been resolved',
        text: 'The owner has already marked this item as found.'
    };
}

function getStoredUser() {
    const raw = localStorage.getItem('unilost_user');
    return raw ? JSON.parse(raw) : null;
}

function isOwner(item) {
    const user = getStoredUser();
    return Boolean(user) && Number(user.id) === Number(item.user_id);
}

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'absolute';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(helper);
    return copied;
}

function getActionElements() {
    return {
        bar: document.querySelector('.post-confirmation-bar'),
        title: document.querySelector('.post-confirmation-title'),
        text: document.querySelector('.post-confirmation-text'),
        cancel: document.querySelector('.confirmation-cancel-btn'),
        confirm: document.querySelector('.confirmation-confirm-btn')
    };
}

function setManageFeedback(message = '', type = 'neutral') {
    const feedback = document.querySelector('.resolve-feedback');

    if (!feedback) {
        return;
    }

    window.clearTimeout(feedback.hideTimer);

    if (!message) {
        feedback.classList.remove('is-visible', 'is-hiding');
        feedback.hidden = true;
        feedback.textContent = '';
        feedback.dataset.type = '';
        return;
    }

    feedback.hidden = false;
    feedback.textContent = message;
    feedback.dataset.type = type;
    feedback.classList.remove('is-hiding');

    window.requestAnimationFrame(() => {
        feedback.classList.add('is-visible');
    });

    if (type === 'success') {
        feedback.hideTimer = window.setTimeout(() => {
            feedback.classList.remove('is-visible');
            feedback.classList.add('is-hiding');

            window.setTimeout(() => {
                feedback.hidden = true;
                feedback.classList.remove('is-hiding');
                feedback.textContent = '';
                feedback.dataset.type = '';
            }, 220);
        }, 2600);
    }
}

function hideConfirmationBar() {
    const { bar, cancel, confirm } = getActionElements();

    if (!bar || !cancel || !confirm) {
        return;
    }

    bar.classList.remove('is-visible');
    bar.classList.add('is-hiding');
    bar.dataset.intent = '';
    cancel.disabled = false;
    confirm.disabled = false;
    cancel.textContent = 'Cancel';
    confirm.textContent = 'Confirm';
    confirm.className = 'confirmation-confirm-btn';

    window.clearTimeout(bar.hideTimer);
    bar.hideTimer = window.setTimeout(() => {
        bar.hidden = true;
        bar.classList.remove('is-hiding');
    }, 220);
}

function showConfirmationBar(config) {
    const { bar, title, text, cancel, confirm } = getActionElements();

    if (!bar || !title || !text || !cancel || !confirm) {
        return;
    }

    window.clearTimeout(bar.hideTimer);
    bar.hidden = false;
    bar.classList.remove('is-hiding');
    bar.dataset.intent = config.intent;
    title.textContent = config.title;
    text.textContent = config.text;
    confirm.textContent = config.confirmLabel;
    confirm.className = `confirmation-confirm-btn ${config.confirmClass || ''}`.trim();
    cancel.textContent = 'Cancel';
    cancel.disabled = false;
    confirm.disabled = false;

    window.requestAnimationFrame(() => {
        bar.classList.add('is-visible');
    });

    cancel.onclick = () => {
        hideConfirmationBar();
        setManageFeedback('');
    };

    confirm.onclick = async () => {
        cancel.disabled = true;
        confirm.disabled = true;
        confirm.textContent = config.pendingLabel || 'Saving...';

        try {
            await config.onConfirm();
            hideConfirmationBar();
        } catch (error) {
            cancel.disabled = false;
            confirm.disabled = false;
            confirm.textContent = config.confirmLabel;
            setManageFeedback(error.message || 'Could not complete that action right now.', 'error');
        }
    };
}

function updateResolvedState(item) {
    const contactContainer = document.querySelector('.contact-container');
    const contactHeading = document.querySelector('.contact-container h3');
    const contactText = document.querySelector('.contact-container p');
    const contactEmailRow = document.querySelector('.contact-email-row');
    const contactEmailValue = document.querySelector('.contact-email-value');
    const copyEmailButton = document.querySelector('.copy-email-btn');
    const status = document.querySelector('.item-status');
    const contactCopy = getStatusCopy(item.type);
    const ownerViewing = isOwner(item);

    if (contactContainer) {
        contactContainer.hidden = ownerViewing;
    }

    if (ownerViewing) {
        return;
    }

    if (status) {
        status.textContent = item.status === 'resolved' ? 'RESOLVED' : item.type.toUpperCase();
        status.classList.remove('is-found', 'is-lost', 'is-resolved');

        if (item.status === 'resolved') {
            status.classList.add('is-resolved');
        } else {
            status.classList.add(item.type === 'found' ? 'is-found' : 'is-lost');
        }
    }

    if (item.status !== 'resolved') {
        if (contactContainer) {
            contactContainer.classList.remove('is-resolved');
        }

        if (contactHeading) {
            contactHeading.textContent = contactCopy.heading;
        }

        if (contactText) {
            contactText.textContent = contactCopy.text;
        }

        if (contactEmailRow) {
            contactEmailRow.classList.remove('is-resolved');
        }

        if (contactEmailValue) {
            contactEmailValue.textContent = item.poster_email || 'No contact email available.';
        }

        if (copyEmailButton) {
            copyEmailButton.hidden = false;
        }

        return;
    }

    const resolvedCopy = getResolvedCopy(item.type);

    if (contactContainer) {
        contactContainer.classList.add('is-resolved');
    }

    if (contactHeading) {
        contactHeading.textContent = resolvedCopy.heading;
    }

    if (contactText) {
        contactText.textContent = resolvedCopy.text;
    }

    if (contactEmailValue) {
        contactEmailValue.textContent = item.resolved_at
            ? `Resolved on ${item.resolved_at}`
            : 'This post has been resolved.';
    }

    if (copyEmailButton) {
        copyEmailButton.hidden = true;
    }

    if (contactEmailRow) {
        contactEmailRow.classList.add('is-resolved');
    }
}

function buildManageCopy(item) {
    if (item.status === 'resolved') {
        return {
            text: 'This post is currently resolved. You can reactivate it if the item still needs attention.'
        };
    }

    return {
        text: item.type === 'found'
            ? 'If this item has been returned to its owner, you can mark the post as resolved or delete it.'
            : 'If this item has been returned, you can mark the post as resolved or delete it.'
    };
}

async function updateItemStatus(item, status) {
    const res = await fetch('../php/update_item_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            item_id: item.id,
            status
        })
    });
    const data = await res.json();

    if (!data.success) {
        throw new Error(data.message || 'Could not update this post right now.');
    }

    item.status = status;
    item.resolved_at = data.resolved_at || null;
    updateResolvedState(item);
    setupManageActions(item);
    setManageFeedback(
        status === 'resolved'
            ? 'Resolved successfully'
            : 'Post is active again',
        'success'
    );
}

async function deleteItem(item) {
    const res = await fetch('../php/delete_item.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            item_id: item.id
        })
    });
    const data = await res.json();

    if (!data.success) {
        throw new Error(data.message || 'Could not delete this post right now.');
    }

    window.location.href = 'my-posts.html';
}

function setupManageActions(item) {
    const manageContainer = document.querySelector('.post-manage-container');
    const manageText = document.querySelector('.post-manage-text');
    const resolveButton = document.querySelector('.resolve-post-btn');
    const deleteButton = document.querySelector('.delete-post-btn');

    if (!manageContainer || !manageText || !resolveButton || !deleteButton) {
        return;
    }

    if (!isOwner(item)) {
        manageContainer.hidden = true;
        hideConfirmationBar();
        return;
    }

    const manageCopy = buildManageCopy(item);

    manageContainer.hidden = false;
    manageText.textContent = manageCopy.text;
    resolveButton.hidden = false;
    resolveButton.disabled = false;
    deleteButton.disabled = false;
    setManageFeedback('');

    if (item.status === 'resolved') {
        resolveButton.textContent = 'Make Active Again';
        resolveButton.classList.add('is-secondary');
        resolveButton.onclick = () => {
            showConfirmationBar({
                intent: 'activate',
                title: 'Move this post back to active?',
                text: 'The post will appear in the public lists again so people can keep helping.',
                confirmLabel: 'Make Active',
                confirmClass: 'is-secondary',
                pendingLabel: 'Updating...',
                onConfirm: () => updateItemStatus(item, 'active')
            });
        };
    } else {
        resolveButton.textContent = 'Mark as Resolved';
        resolveButton.classList.remove('is-secondary');
        resolveButton.onclick = () => {
            showConfirmationBar({
                intent: 'resolve',
                title: 'Mark this post as resolved?',
                text: 'It will be removed from the public lost and found lists, but you can reactivate it later.',
                confirmLabel: 'Confirm Resolve',
                pendingLabel: 'Updating...',
                onConfirm: () => updateItemStatus(item, 'resolved')
            });
        };
    }

    deleteButton.onclick = () => {
        showConfirmationBar({
            intent: 'delete',
            title: 'Delete this post permanently?',
            text: 'This action cannot be undone. The post and its uploaded photo will be removed.',
            confirmLabel: 'Delete Post',
            confirmClass: 'is-danger',
            pendingLabel: 'Deleting...',
            onConfirm: () => deleteItem(item)
        });
    };
}

async function loadItemDetails() {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        return;
    }

    try {
        // Add cache-busting parameter to ensure fresh data
        const cachebust = new Date().getTime();
        const res = await fetch(`../php/get_items.php?id=${encodeURIComponent(itemId)}&t=${cachebust}`, {
            cache: 'no-store', // Prevent caching
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        const data = await res.json();

        if (!data.success || !data.item) {
            window.location.replace('page-not-found.html');
            return;
        }

        const item = data.item;
        const contactCopy = getStatusCopy(item.type);
        const image = document.querySelector('.item-image');
        const imageContainer = document.querySelector('.item-image-container');
        const title = document.querySelector('.item-title');
        const location = document.querySelector('.item-place');
        const date = document.querySelector('.item-date');
        const poster = document.querySelector('.poster');
        const description = document.querySelector('.item-desc');
        const contactHeading = document.querySelector('.contact-container h3');
        const contactText = document.querySelector('.contact-container p');
        const contactEmailValue = document.querySelector('.contact-email-value');
        const copyEmailButton = document.querySelector('.copy-email-btn');

        document.title = item.title;

        if (image) {
            image.src = item.photo_path
                ? getDetailsUploadPath(item.photo_path)
                : getDetailsAssetPath('no-photo.png');
            image.alt = item.title;
            image.classList.toggle('is-photo', Boolean(item.photo_path));
        }

        if (imageContainer) {
            imageContainer.classList.toggle('has-photo', Boolean(item.photo_path));
        }

        if (title) title.textContent = item.title;
        if (location) location.textContent = item.location;
        if (date) date.textContent = item.date;
        if (poster) poster.textContent = `Posted by ${item.poster_name}`;
        if (description) description.textContent = item.description || 'No description was added for this item.';
        if (contactHeading) contactHeading.textContent = contactCopy.heading;
        if (contactText) contactText.textContent = contactCopy.text;
        if (contactEmailValue && item.poster_email) {
            contactEmailValue.textContent = item.poster_email;
        }

        if (copyEmailButton && item.poster_email && !isOwner(item)) {
            copyEmailButton.addEventListener('click', async () => {
                const copied = await copyText(item.poster_email);
                copyEmailButton.textContent = copied ? 'Copied' : 'Copy failed';

                window.setTimeout(() => {
                    copyEmailButton.textContent = 'Copy';
                }, 1600);
            });
        }

        updateResolvedState(item);
        setupManageActions(item);
    } catch (error) {
        // If loading fails (network error), redirect to not found
        console.error('Error loading item details:', error);
        window.location.replace('page-not-found.html');
    }
}

loadItemDetails();

// Always reload when page is restored from back button (bfcache)
window.addEventListener('pageshow', (event) => {
  loadItemDetails();
});

(() => {
const form = document.getElementById('post-item-form');
const titleInput = document.getElementById('item-title');
const locationEl = document.getElementById('item-location');
const dateEl = document.getElementById('item-date');
const descEl = document.getElementById('item-description');
const photoInput = document.getElementById('item-photo');
const preview = document.getElementById('photo-preview');
const placeholder = document.getElementById('photo-placeholder');
const uploadArea = document.getElementById('photo-upload-area');
const submitBtn = document.getElementById('submit-btn');
const banner = document.getElementById('form-banner');
let previewObjectUrl = '';



if (dateEl) {
    dateEl.value = new Date().toISOString().split('T')[0];
}


function resetPhotoPreview() {
    if (!preview) return;

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
    }

    preview.removeAttribute('src');
    preview.style.display = 'none';
    if (uploadArea) uploadArea.classList.remove('has-image');
    if (placeholder) placeholder.style.display = 'flex';
}

function setPhotoPreview(file) {
    if (!preview || !file || !file.type.startsWith('image/')) {
        resetPhotoPreview();
        return;
    }

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);
    preview.src = previewObjectUrl;
    preview.style.display = 'block';
    if (uploadArea) uploadArea.classList.add('has-image');
    if (placeholder) placeholder.style.display = 'none';
}

if (photoInput && preview) {
    resetPhotoPreview();

    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];

        if (file) {
            clearFieldError('item-photo');
            setPhotoPreview(file);
            return;
        }

        resetPhotoPreview();
    });

    window.addEventListener('beforeunload', () => {
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = '';
        }
    });
}


document.querySelectorAll('.type-option input').forEach(radio => {
    radio.addEventListener('change', () => {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        radio.nextElementSibling.classList.add('active');
        clearFieldError('type-lost');
    });
});



function showFieldError(id, msg) {
    clearFieldError(id);
    const el = document.getElementById(id);
    const err = document.createElement('p');
    err.className = 'field-error';
    err.id = `err-${id}`;
    err.textContent = msg;

    if (el) {
        const wrapper = el.closest('div') || el.parentElement;
        wrapper.insertAdjacentElement('afterend', err);
    }
}

function clearFieldError(id) {
    const existing = document.getElementById(`err-${id}`);
    if (existing) existing.remove();
}

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
}

function showBanner(msg, type = 'error') {
    if (!banner) return;
    banner.className = `auth-banner ${type}`;
    banner.textContent = msg;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearBanner() {
    if (!banner) return;
    banner.className = '';
    banner.textContent = '';
}


// ── VALIDATE ────────────────────────────────────
function validate() {
    let valid = true;

    const type = document.querySelector('input[name="type"]:checked')?.value;
    if (!type) {
        showFieldError('type-lost', 'Please select Lost or Found.');
        valid = false;
    }

    if (!titleInput.value.trim()) {
        showFieldError('item-title', 'Title is required.');
        valid = false;
    }

    if (!locationEl.value.trim()) {
        showFieldError('item-location', 'Location is required.');
        valid = false;
    }

    if (!dateEl.value) {
        showFieldError('item-date', 'Date is required.');
        valid = false;
    }

    if (!photoInput.files[0]) {
        showFieldError('item-photo', 'Photo is required.');
        valid = false;
    }

    return valid;
}


// ── SUBMIT ──────────────────────────────────────
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();
        clearBanner();

        if (!validate()) return;

        const formData = new FormData();
        formData.append('type',        document.querySelector('input[name="type"]:checked').value);
        formData.append('title',       titleInput.value.trim());
        formData.append('location',    locationEl.value.trim());
        formData.append('date',        dateEl.value);
        formData.append('description', descEl.value.trim());

        if (photoInput.files[0]) {
            formData.append('photo', photoInput.files[0]);
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        try {
            const res = await fetch('../php/post_item.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                const type = formData.get('type');
                const itemId = result.item.id;
                // Redirect to the detail page of the newly created post
                const detailPage = type === 'lost' ? 'lost-details.html' : 'found-details.html';
                window.location.href = `${detailPage}?id=${itemId}`;
            } else {
                showBanner(result.message || 'Failed to post item. Please try again.');
            }
        } catch (err) {
            showBanner('Could not connect to the server. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Item';
        }
    });
}

})();

(function () {
    const raw  = localStorage.getItem('unilost_user');
    const user = raw ? JSON.parse(raw) : null;
    const path = window.location.pathname;
    const query = window.location.search;

    if (!user) {
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const guardedTargets = [
            '/pages/lost.html',
            '/pages/found.html',
            '/pages/all-posts.html',
            '/pages/lost-details.html',
            '/pages/found-details.html',
            '/pages/page-not-found.html',
            '/pages/my-posts.html',
            '/pages/publish.html'
        ];
        const requiresAccessInterstitial = guardedTargets.some((target) => path.endsWith(target));

        if (!requiresAccessInterstitial) {
            return;
        }

        const redirectBase = path.split('/').pop() || 'lost.html';
        const redirect = `${redirectBase}${query || ''}`;
        const destination = isInPagesFolder ? 'access-required.html' : 'pages/access-required.html';
        window.location.replace(`${destination}?redirect=${encodeURIComponent(redirect)}`);
    }
})();
(() => {
function getAssetPath(filename) {
    return `../assets/images/${filename}`;
}

function getUploadPath(filename) {
    return `../assets/uploads/${filename}`;
}

function getDetailsPath(item) {
    const page = item.type === 'found' ? 'found-details.html' : 'lost-details.html';
    return `${page}?id=${encodeURIComponent(item.id)}`;
}

function createSkeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="post-card skeleton-card" aria-hidden="true">
        <div class="post-card-meta">
          <span class="post-status skeleton-pill"></span>
          <span class="skeleton-line skeleton-meta short"></span>
        </div>
        <div class="post-image-container skeleton-block skeleton-image"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="post-meta">
          <div class="skeleton-line skeleton-meta"></div>
          <div class="skeleton-line skeleton-meta short"></div>
        </div>
      </div>
    `).join('');
}

function formatResolvedDate(value) {
    if (!value) {
        return '';
    }

    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function createPostCard(item) {
    const statusClass = item.status === 'resolved'
        ? 'is-resolved'
        : item.type === 'found'
            ? 'is-found'
            : 'is-lost';
    const statusLabel = item.status === 'resolved' ? 'RESOLVED' : item.type.toUpperCase();
    const description = item.description || 'No description was added for this item.';
    const hasPhoto = Boolean(item.photo_path);
    const photoPath = item.photo_path ? getUploadPath(item.photo_path) : getAssetPath('no-photo.png');
    const imageClass = hasPhoto ? 'post-image is-photo' : 'post-image';
    const imageContainerClass = hasPhoto ? 'post-image-container has-photo' : 'post-image-container';
    const resolvedDate = item.status === 'resolved' && item.resolved_at
        ? `<span class="post-resolved-date">Resolved ${formatResolvedDate(item.resolved_at)}</span>`
        : '';

    return `
      <a class="post-card" href="${getDetailsPath(item)}">
        <div class="post-card-meta">
          <span class="post-status ${statusClass}">${statusLabel}</span>
          ${resolvedDate}
        </div>
        <div class="${imageContainerClass}">
          <img class="${imageClass}" src="${photoPath}" alt="${item.title}" />
        </div>
        <h3 class="post-title">${item.title}</h3>
        <p class="post-desc">${description}</p>
        <div class="post-meta">
          <div class="details-container">
            <img src="${getAssetPath('gray-location.png')}" class="location-icon" alt="Location" />
            <span class="post-place">${item.location}</span>
          </div>
          <div class="details-container">
            <img src="${getAssetPath('calendar.png')}" class="calendar-icon" alt="Date" />
            <span class="post-date">${item.date}</span>
          </div>
        </div>
      </a>
    `;
}

const myPostsState = {
    cache: {
        active: null,
        resolved: null
    },
    currentStatus: null,
    isFirstLoad: true,
    scrollY: 0
};

function rememberScrollPosition() {
    myPostsState.scrollY = window.scrollY || window.pageYOffset || 0;
}

function restoreScrollPosition() {
    window.requestAnimationFrame(() => {
        window.scrollTo({
            top: myPostsState.scrollY,
            left: 0,
            behavior: 'auto'
        });
    });
}

function renderPosts(status, items) {
    const container = document.querySelector('.posts-container');
    const feedback = document.querySelector('.my-posts-feedback');

    if (!container || !feedback) {
        return;
    }

    feedback.hidden = true;
    feedback.textContent = '';

    if (!Array.isArray(items) || items.length === 0) {
        const emptyMessage = status === 'resolved'
            ? 'No resolved posts yet.'
            : 'You have not published any active posts yet.';
        container.innerHTML = `<p>${emptyMessage}</p>`;
        container.classList.remove('is-loading', 'is-fetching');
        container.classList.add('is-switching');
        restoreScrollPosition();
        return;
    }

    container.innerHTML = items.map(createPostCard).join('');
    container.classList.remove('is-loading', 'is-fetching');
    container.classList.add('is-switching');
    restoreScrollPosition();
}

async function loadMyPosts(status) {
    const container = document.querySelector('.posts-container');
    const feedback = document.querySelector('.my-posts-feedback');

    if (!container || !feedback) {
        return;
    }

    myPostsState.currentStatus = status;
    container.classList.remove('is-switching');

    if (myPostsState.isFirstLoad) {
        container.classList.add('is-loading');
        container.innerHTML = createSkeletonCards(4);
    } else if (myPostsState.cache[status]) {
        renderPosts(status, myPostsState.cache[status]);
        return;
    } else {
        container.classList.add('is-fetching');
    }

    feedback.hidden = true;
    feedback.textContent = '';

    try {
        const res = await fetch(`../php/get_my_items.php?status=${encodeURIComponent(status)}`, {
            credentials: 'same-origin'
        });
        const data = await res.json();

        if (myPostsState.currentStatus !== status) {
            return;
        }

        if (!data.success) {
            container.innerHTML = '<p>Could not load your posts right now.</p>';
            container.classList.remove('is-loading', 'is-fetching');
            feedback.hidden = false;
            feedback.textContent = data.message || 'Please try again in a moment.';
            restoreScrollPosition();
            return;
        }

        myPostsState.cache[status] = Array.isArray(data.items) ? data.items : [];
        renderPosts(status, myPostsState.cache[status]);
    } catch (error) {
        if (myPostsState.currentStatus !== status) {
            return;
        }

        container.innerHTML = '<p>Could not load your posts right now.</p>';
        container.classList.remove('is-loading', 'is-fetching');
        restoreScrollPosition();
    } finally {
        myPostsState.isFirstLoad = false;
    }
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const status = button.dataset.status || 'active';

            if (status === myPostsState.currentStatus) {
                return;
            }

            rememberScrollPosition();
            buttons.forEach((candidate) => candidate.classList.remove('active'));
            button.classList.add('active');
            loadMyPosts(status);
        });
    });
}

setupFilters();
loadMyPosts('active');

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    myPostsState.cache.active = null;
    myPostsState.cache.resolved = null;
    loadMyPosts(myPostsState.currentStatus || 'active');
  }
});

})();

function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '';

    try {
        const parsed = new URL(redirect, window.location.href);
        const page = parsed.pathname.split('/').pop() || '';
        const allowedPages = new Set([
            'lost.html',
            'found.html',
            'lost-details.html',
            'found-details.html',
            'all-posts.html'
        ]);

        if (allowedPages.has(page)) {
            return `${page}${parsed.search || ''}`;
        }
    } catch (error) {
        //back to the default page.
    }

    return 'lost.html';
}

function buildAuthLink(page) {
    const redirect = getRedirectTarget();
    return `${page}?redirect=${encodeURIComponent(redirect)}`;
}

const loginLink = document.getElementById('access-login-link');
const registerLink = document.getElementById('access-register-link');
const accessMessage = document.getElementById('access-message');
const redirectTarget = getRedirectTarget();
const targetLabel = redirectTarget.startsWith('found-details.html')
    ? 'this found item'
    : redirectTarget.startsWith('lost-details.html')
        ? 'this lost item'
        : redirectTarget.startsWith('all-posts.html')
            ? 'all posts'
        : redirectTarget.startsWith('found.html')
            ? 'found items'
            : 'lost items';

if (loginLink) {
    const loginHref = buildAuthLink('login.html');
    loginLink.href = loginHref;
    loginLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.replace(loginHref);
    });
}

if (registerLink) {
    const registerHref = buildAuthLink('register.html');
    registerLink.href = registerHref;
    registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.replace(registerHref);
    });
}

if (accessMessage) {
    document.querySelectorAll('a.login-btn[href="login.html"], a.register-btn[href="register.html"]').forEach((link) => {
        const href = link.classList.contains('login-btn')
            ? buildAuthLink('login.html')
            : buildAuthLink('register.html');

        link.href = href;
        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.replace(href);
        });
    });
}

if (accessMessage) {
    accessMessage.textContent = `Login or Register to access ${targetLabel}.`;
}
