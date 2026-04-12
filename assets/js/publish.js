(() => {
const form = document.getElementById('post-item-form');
const titleInput = document.getElementById('item-title');
const locationEl = document.getElementById('item-location');
const dateEl = document.getElementById('item-date');
const descEl = document.getElementById('item-description');
const photoInput = document.getElementById('item-photo');
const preview = document.getElementById('photo-preview');
const placeholder = document.getElementById('photo-placeholder');
const submitBtn = document.getElementById('submit-btn');
const banner = document.getElementById('form-banner');



if (dateEl) {
    dateEl.value = new Date().toISOString().split('T')[0];
}


if (photoInput) {
    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        const uploadArea = preview?.closest('.photo-upload-area');

        if (file) {
            clearFieldError('item-photo');
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            uploadArea?.classList.add('has-image');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        } else {
            preview.style.display = 'none';
            preview.removeAttribute('src');
            uploadArea?.classList.remove('has-image');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
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

