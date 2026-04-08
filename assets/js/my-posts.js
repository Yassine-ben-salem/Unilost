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

async function loadMyPosts(status) {
    const container = document.querySelector('.posts-container');
    const feedback = document.querySelector('.my-posts-feedback');

    if (!container || !feedback) {
        return;
    }

    container.classList.remove('is-switching');
    container.classList.add('is-loading');
    feedback.hidden = true;
    feedback.textContent = '';

    try {
        const res = await fetch(`../php/get_my_items.php?status=${encodeURIComponent(status)}`, {
            credentials: 'same-origin'
        });
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = '<p>Could not load your posts right now.</p>';
            container.classList.remove('is-loading');
            feedback.hidden = false;
            feedback.textContent = data.message || 'Please try again in a moment.';
            return;
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            const emptyMessage = status === 'resolved'
                ? 'No resolved posts yet.'
                : 'You have not published any active posts yet.';
            container.innerHTML = `<p>${emptyMessage}</p>`;
            container.classList.remove('is-loading');
            container.classList.add('is-switching');
            return;
        }

        container.innerHTML = data.items.map(createPostCard).join('');
        container.classList.remove('is-loading');
        container.classList.add('is-switching');
    } catch (error) {
        container.innerHTML = '<p>Could not load your posts right now.</p>';
        container.classList.remove('is-loading');
    }
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const status = button.dataset.status || 'active';

            buttons.forEach((candidate) => candidate.classList.remove('active'));
            button.classList.add('active');
            loadMyPosts(status);
        });
    });
}

setupFilters();
loadMyPosts('active');
