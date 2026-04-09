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
    loginLink.href = buildAuthLink('login.html');
}

if (registerLink) {
    registerLink.href = buildAuthLink('register.html');
}

if (accessMessage) {
    accessMessage.textContent = `Login or Register to access ${targetLabel}.`;
}
