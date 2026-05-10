document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const body = document.body;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        sunIcon.classList.remove('d-none');
        moonIcon.classList.add('d-none');
    } else {
        body.classList.add('dark-theme');
        sunIcon.classList.add('d-none');
        moonIcon.classList.remove('d-none');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (isDark) {
            sunIcon.classList.add('d-none');
            moonIcon.classList.remove('d-none');
        } else {
            sunIcon.classList.remove('d-none');
            moonIcon.classList.add('d-none');
        }
    });

    // --- Core Logic ---
    const shortenForm = document.getElementById('shorten-form');
    const originalUrlInput = document.getElementById('original-url');
    const shortenBtn = document.getElementById('shorten-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const btnText = shortenBtn.querySelector('span');
    const btnIcon = shortenBtn.querySelector('i');
    const resultSection = document.getElementById('result-section');
    const shortUrlLink = document.getElementById('short-url-link');
    const copyBtn = document.getElementById('copy-btn');
    const alertContainer = document.getElementById('alert-container');
    const recentUrlsBody = document.getElementById('recent-urls-body');
    const refreshBtn = document.getElementById('refresh-btn');

    const API_BASE_URL = '/api/urls';
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'notfound') {
        showAlert('The requested short link does not exist or has been removed.', 'danger');
        window.history.replaceState({}, document.title, "/");
    }

    // Load recent URLs on startup
    fetchRecentUrls();

    // Form Submit
    shortenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalUrl = originalUrlInput.value.trim();
        if (!originalUrl) return;

        setLoadingState(true);
        clearAlerts();
        resultSection.classList.add('d-none');

        try {
            const response = await fetch(`${API_BASE_URL}/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalUrl })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to shorten URL');
            }

            // Success
            const fullShortUrl = `${window.location.origin}/${data.shortCode}`;
            shortUrlLink.href = fullShortUrl;
            // Remove http/https for cleaner display
            shortUrlLink.textContent = fullShortUrl.replace(/^https?:\/\//, '');
            resultSection.classList.remove('d-none');
            
            // Focus on copy button for quick access
            copyBtn.focus();
            
            // Re-fetch recent URLs
            fetchRecentUrls();
            
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            setLoadingState(false);
        }
    });

    // Copy Button
    copyBtn.addEventListener('click', async () => {
        const urlToCopy = shortUrlLink.href;
        try {
            await navigator.clipboard.writeText(urlToCopy);
            
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            copyBtn.classList.add('text-success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('text-success');
            }, 2000);
        } catch (err) {
            showAlert('Failed to copy to clipboard. Please copy manually.', 'danger');
        }
    });

    // Refresh Button
    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('spin-animation');
        fetchRecentUrls().finally(() => {
            setTimeout(() => {
                icon.classList.remove('spin-animation');
            }, 500);
        });
    });

    // Fetch Recent URLs
    async function fetchRecentUrls() {
        try {
            const response = await fetch(`${API_BASE_URL}/recent`);
            if (!response.ok) throw new Error('Failed to fetch recent URLs');
            
            const urls = await response.json();
            renderRecentUrls(urls);
        } catch (error) {
            console.error(error);
            recentUrlsBody.innerHTML = `<tr><td colspan="4" class="text-center py-5"><div class="alert alert-dark bg-transparent border-0 text-danger m-0 fw-bold"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load recent links</div></td></tr>`;
        }
    }

    // Render Recent URLs
    function renderRecentUrls(urls) {
        if (!urls || urls.length === 0) {
            recentUrlsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-custom fw-bold py-5">No recent links found. Be the first to shorten one!</td></tr>`;
            return;
        }

        recentUrlsBody.innerHTML = urls.map(url => {
            const fullShortUrl = `${window.location.origin}/${url.shortCode}`;
            const displayShortUrl = `${window.location.host}/${url.shortCode}`;
            const date = new Date(url.createdAt).toLocaleDateString(undefined, { 
                month: 'short', day: 'numeric', year: 'numeric'
            });
            
            return `
                <tr>
                    <td class="ps-3 ps-md-4" style="max-width: 200px;">
                        <div class="text-truncate" title="${url.originalUrl}">
                            <a href="${url.originalUrl}" target="_blank" class="link-original">${url.originalUrl}</a>
                        </div>
                    </td>
                    <td>
                        <a href="${fullShortUrl}" target="_blank" class="link-short d-inline-flex align-items-center gap-1 text-truncate" style="max-width: 150px;">
                            ${displayShortUrl} <i class="bi bi-arrow-up-right" style="font-size: 0.7rem;"></i>
                        </a>
                    </td>
                    <td class="text-center">
                        <span class="clicks-badge">${url.clickCount}</span>
                    </td>
                    <td class="text-end pe-3 pe-md-4 table-date-text fs-7">${date}</td>
                </tr>
            `;
        }).join('');
    }

    // UI Helpers
    function setLoadingState(isLoading) {
        if (isLoading) {
            btnText.classList.add('d-none');
            if (btnIcon) btnIcon.classList.add('d-none');
            loadingSpinner.classList.remove('d-none');
            shortenBtn.disabled = true;
            originalUrlInput.disabled = true;
        } else {
            btnText.classList.remove('d-none');
            if (btnIcon) btnIcon.classList.remove('d-none');
            loadingSpinner.classList.add('d-none');
            shortenBtn.disabled = false;
            originalUrlInput.disabled = false;
        }
    }

    function showAlert(message, type) {
        alertContainer.innerHTML = `
            <div class="alert-custom d-flex align-items-center gap-2 shadow-sm">
                <i class="bi bi-exclamation-circle-fill"></i>
                <span>${message}</span>
            </div>
        `;
    }

    function clearAlerts() {
        alertContainer.innerHTML = '';
    }
});

// Add spin animation
if(!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-animation { display: inline-block; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    `;
    document.head.appendChild(style);
}
