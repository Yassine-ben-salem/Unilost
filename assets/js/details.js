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
        const res = await fetch(`../php/get_items.php?id=${encodeURIComponent(itemId)}`);
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
        // Keep the placeholder content if loading fails.
    }
}

loadItemDetails();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    loadItemDetails();
  }
});

