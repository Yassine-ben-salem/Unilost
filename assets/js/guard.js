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
            '/pages/found-details.html'
        ];
        const requiresAccessInterstitial = guardedTargets.some((target) => path.endsWith(target));

        if (requiresAccessInterstitial) {
            const redirectBase = path.split('/').pop() || 'lost.html';
            const redirect = `${redirectBase}${query || ''}`;
            const destination = isInPagesFolder ? 'access-required.html' : 'pages/access-required.html';
            window.location.replace(`${destination}?redirect=${encodeURIComponent(redirect)}`);
            return;
        }

        window.location.replace(isInPagesFolder ? 'login.html' : 'pages/login.html');
    }
})();
