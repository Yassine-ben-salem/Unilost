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
          <img class="${imageClass}" src="${photoPath}" alt="${item.title}" />
        </div>
        <h3 class="post-title">${item.title}</h3>
        <p class="post-desc">${description}</p>
        <div class="post-meta">
          <div class="details-container">
            <img src="${getAssetPath('gray-location.png')}" class="location-icon" alt="Location" />
            <span class="post-place">${item.location}</span><br />
          </div>
          <div class="details-container">
            <img src="${getAssetPath('calendar.png')}" class="calendar-icon" alt="Date" />
            <span class="post-date">${item.date}</span>
          </div>
        </div>
      </a>
    `;
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

    try {
        const res = await fetch(config.endpoint);
        const data = await res.json();

        if (!data.success) {
            container.classList.remove('is-skeleton-loading');
            container.innerHTML = '<p>Could not load posts right now.</p>';
            return;
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            container.classList.remove('is-skeleton-loading');
            container.innerHTML = `<p>${config.emptyMessage}</p>`;
            return;
        }

        container.classList.remove('is-skeleton-loading');
        container.innerHTML = data.items.map(createPostCard).join('');
    } catch (error) {
        container.classList.remove('is-skeleton-loading');
        container.innerHTML = '<p>Could not load posts right now.</p>';
    }
}

loadPosts();
