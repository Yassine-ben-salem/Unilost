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

function updateResolvedState(item) {
    const contactContainer = document.querySelector('.contact-container');
    const contactHeading = document.querySelector('.contact-container h3');
    const contactText = document.querySelector('.contact-container p');
    const contactEmailRow = document.querySelector('.contact-email-row');
    const contactEmailValue = document.querySelector('.contact-email-value');
    const copyEmailButton = document.querySelector('.copy-email-btn');
    const undoButton = document.querySelector('.undo-resolve-btn');
    const contactCopy = getStatusCopy(item.type);

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

        if (undoButton) {
            undoButton.remove();
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

function renderUndoResolveButton(item) {
    const user = getStoredUser();
    const contactContainer = document.querySelector('.contact-container');
    const existingButton = document.querySelector('.undo-resolve-btn');

    if (existingButton) {
        existingButton.remove();
    }

    if (!contactContainer || !user || Number(user.id) !== Number(item.user_id) || item.status !== 'resolved') {
        return;
    }

    const undoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.className = 'undo-resolve-btn';
    undoButton.textContent = 'Make Active Again';

    undoButton.addEventListener('click', async () => {
        const confirmed = window.confirm('Undo this resolved status and return the post to the public lists?');

        if (!confirmed) {
            return;
        }

        undoButton.disabled = true;
        undoButton.textContent = 'Saving...';

        try {
            const res = await fetch('../php/update_item_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: item.id,
                    status: 'active'
                })
            });
            const data = await res.json();

            if (!data.success) {
                undoButton.disabled = false;
                undoButton.textContent = 'Undo Resolve';
                return;
            }

            item.status = 'active';
            item.resolved_at = null;
            updateResolvedState(item);
            setupResolveButton(item);
        } catch (error) {
            undoButton.disabled = false;
            undoButton.textContent = 'Undo Resolve';
        }
    });

    contactContainer.appendChild(undoButton);
}

function setupResolveButton(item) {
    const user = getStoredUser();
    const manageContainer = document.querySelector('.post-manage-container');
    const manageText = document.querySelector('.post-manage-text');
    const resolveButton = document.querySelector('.resolve-post-btn');
    const resolveFeedback = document.querySelector('.resolve-feedback');

    if (!manageContainer || !manageText || !resolveButton || !resolveFeedback) {
        return;
    }

    if (!user || Number(user.id) !== Number(item.user_id)) {
        manageContainer.hidden = true;
        return;
    }

    manageContainer.hidden = false;

    if (item.status === 'resolved') {
        manageContainer.hidden = true;
        renderUndoResolveButton(item);
        return;
    }

    renderUndoResolveButton(item);
    manageContainer.hidden = false;
    resolveButton.hidden = false;
    resolveButton.disabled = false;
    resolveButton.textContent = 'Mark as Resolved';
    resolveFeedback.hidden = true;
    resolveFeedback.textContent = '';

    resolveButton.onclick = async () => {
        const confirmed = window.confirm('Mark this post as resolved? It will be removed from the public lists.');

        if (!confirmed) {
            return;
        }

        resolveButton.disabled = true;
        resolveButton.textContent = 'Saving...';
        resolveFeedback.hidden = true;
        resolveFeedback.textContent = '';

        try {
            const res = await fetch('../php/update_item_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: item.id,
                    status: 'resolved'
                })
            });
            const data = await res.json();

            if (!data.success) {
                resolveFeedback.hidden = false;
                resolveFeedback.textContent = data.message || 'Could not update this post right now.';
                resolveButton.disabled = false;
                resolveButton.textContent = 'Mark as Resolved';
                return;
            }

            item.status = 'resolved';
            item.resolved_at = data.resolved_at || item.resolved_at;
            updateResolvedState(item);
            setupResolveButton(item);
        } catch (error) {
            resolveFeedback.hidden = false;
            resolveFeedback.textContent = 'Could not connect to the server. Please try again.';
            resolveButton.disabled = false;
            resolveButton.textContent = 'Mark as Resolved';
        }
    };
}

async function loadItemDetails() {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        return;
    }

    try {
        const res = await fetch(`../php/get_items.php?id=${encodeURIComponent(itemId)}`);
        const data = await res.json();

        if (!data.success || !data.item) {
            return;
        }

        const item = data.item;
        const contactCopy = getStatusCopy(item.type);
        const image = document.querySelector('.item-image');
        const imageContainer = document.querySelector('.item-image-container');
        const status = document.querySelector('.item-status');
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

        if (status) {
            status.textContent = item.type.toUpperCase();
            status.classList.remove('is-found', 'is-lost');
            status.classList.add(item.type === 'found' ? 'is-found' : 'is-lost');
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
        if (copyEmailButton && item.poster_email) {
            copyEmailButton.addEventListener('click', async () => {
                const copied = await copyText(item.poster_email);
                copyEmailButton.textContent = copied ? 'Copied' : 'Copy failed';

                window.setTimeout(() => {
                    copyEmailButton.textContent = 'Copy';
                }, 1600);
            });
        }

        updateResolvedState(item);
        setupResolveButton(item);
    } catch (error) {
        // Keep the placeholder content if loading fails.
    }
}

loadItemDetails();
