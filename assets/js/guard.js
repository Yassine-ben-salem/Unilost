(function () {
    const raw  = localStorage.getItem('unilost_user');
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        window.location.replace(isInPagesFolder ? 'login.html' : 'pages/login.html');
    }
})();