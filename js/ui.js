/**
 * UI Module
 * Handles DOM manipulation and rendering
 */
const UI = {
    /**
     * Create a screen card element
     * @param {Object} screen - Screen configuration
     * @param {string} id - Unique ID for the card
     * @param {Function} onUpdate - Callback when screen values change
     * @param {Function} onRemove - Callback when remove button clicked
     * @returns {HTMLElement} The card element
     */
    createScreenCard(screen, id, onUpdate, onRemove) {
        const card = document.createElement('div');
        card.className = 'screen-card';
        card.dataset.id = id;

        const metrics = Calculations.calculateAll(screen);

        card.innerHTML = `
            <div class="card-header">
                <input type="text" value="${this.escapeHtml(screen.name)}"
                       placeholder="Screen name" class="screen-name"
                       aria-label="Screen name">
                <button class="btn-remove" aria-label="Remove screen">&times;</button>
            </div>
            <div class="card-inputs">
                <div class="input-row">
                    <label>Size</label>
                    <input type="number" class="input input-small screen-size"
                           value="${screen.size}" step="0.1" min="1" max="100"
                           aria-label="Screen size in inches">
                    <span class="separator">inches</span>
                </div>
                <div class="input-row">
                    <label>Resolution</label>
                    <input type="number" class="input input-small screen-width"
                           value="${screen.width}" step="1" min="1"
                           aria-label="Width in pixels">
                    <span class="separator">&times;</span>
                    <input type="number" class="input input-small screen-height"
                           value="${screen.height}" step="1" min="1"
                           aria-label="Height in pixels">
                </div>
                <div class="input-row">
                    <label>Scaling</label>
                    <select class="select screen-scale" aria-label="Display scaling">
                        <option value="100" ${screen.scale === 100 ? 'selected' : ''}>100%</option>
                        <option value="125" ${screen.scale === 125 ? 'selected' : ''}>125%</option>
                        <option value="150" ${screen.scale === 150 ? 'selected' : ''}>150%</option>
                        <option value="175" ${screen.scale === 175 ? 'selected' : ''}>175%</option>
                        <option value="200" ${screen.scale === 200 ? 'selected' : ''}>200%</option>
                        <option value="225" ${screen.scale === 225 ? 'selected' : ''}>225%</option>
                        <option value="250" ${screen.scale === 250 ? 'selected' : ''}>250%</option>
                        <option value="300" ${screen.scale === 300 ? 'selected' : ''}>300%</option>
                    </select>
                </div>
            </div>
            <div class="card-results">
                ${this.createResultsHtml(metrics, screen)}
            </div>
        `;

        // Event listeners
        const nameInput = card.querySelector('.screen-name');
        const sizeInput = card.querySelector('.screen-size');
        const widthInput = card.querySelector('.screen-width');
        const heightInput = card.querySelector('.screen-height');
        const scaleSelect = card.querySelector('.screen-scale');
        const removeBtn = card.querySelector('.btn-remove');

        const handleChange = () => {
            const updated = {
                name: nameInput.value,
                size: parseFloat(sizeInput.value) || 1,
                width: parseInt(widthInput.value) || 1,
                height: parseInt(heightInput.value) || 1,
                scale: parseInt(scaleSelect.value)
            };
            onUpdate(id, updated);
        };

        nameInput.addEventListener('input', handleChange);
        sizeInput.addEventListener('input', handleChange);
        widthInput.addEventListener('input', handleChange);
        heightInput.addEventListener('input', handleChange);
        scaleSelect.addEventListener('change', handleChange);

        removeBtn.addEventListener('click', () => onRemove(id));

        return card;
    },

    /**
     * Create the results HTML for a card
     * @param {Object} metrics - Calculated metrics
     * @param {Object} screen - Screen configuration
     * @returns {string} HTML string
     */
    createResultsHtml(metrics, screen) {
        const ppiColor = metrics.ppiRating === 'high' ? 'var(--ppi-high)' :
                        metrics.ppiRating === 'medium' ? 'var(--ppi-medium)' : 'var(--ppi-low)';

        let equivalentHtml = '';
        if (metrics.equivalent && screen.scale !== 100) {
            equivalentHtml = `
                <div class="equivalent-display">
                    At ${screen.scale}% scaling, this is equivalent to a
                    <strong>${metrics.equivalent}</strong> display in usable space,
                    but with <strong>${metrics.scalingDescription}</strong> sharpness.
                </div>
            `;
        }

        return `
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-label">Native PPI</span>
                    <span class="result-value ppi-${metrics.ppiRating}">${metrics.nativePpi}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Effective PPI</span>
                    <span class="result-value">${metrics.effectivePpi}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Effective Res</span>
                    <span class="result-value">${metrics.effectiveResolution.width} &times; ${metrics.effectiveResolution.height}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Aspect Ratio</span>
                    <span class="result-value">${metrics.aspectRatio}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Physical Size</span>
                    <span class="result-value">${metrics.physicalWidth}" &times; ${metrics.physicalHeight}"</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Scaling</span>
                    <span class="result-value">${metrics.scalingDescription}</span>
                </div>
                <div class="ppi-bar-container">
                    <div class="ppi-bar-label">PPI relative to max (300)</div>
                    <div class="ppi-bar">
                        <div class="ppi-bar-fill" style="width: ${metrics.ppiBarPercent}%; background-color: ${ppiColor}"></div>
                    </div>
                </div>
                ${equivalentHtml}
            </div>
        `;
    },

    /**
     * Update the results section of a card
     * @param {HTMLElement} card - The card element
     * @param {Object} screen - Updated screen configuration
     */
    updateCardResults(card, screen) {
        const metrics = Calculations.calculateAll(screen);
        const resultsDiv = card.querySelector('.card-results');
        resultsDiv.innerHTML = this.createResultsHtml(metrics, screen);
    },

    /**
     * Populate the preset dropdown
     * @param {HTMLSelectElement} select - The select element
     */
    populatePresets(select) {
        select.innerHTML = '<option value="">Load Preset...</option>';

        for (const category of Presets.categories) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category.name;

            for (const device of category.devices) {
                const option = document.createElement('option');
                option.value = device.name;
                option.textContent = `${device.name} (${device.width}x${device.height})`;
                optgroup.appendChild(option);
            }

            select.appendChild(optgroup);
        }
    },

    /**
     * Render saved configurations list
     * @param {HTMLElement} container - The container element
     * @param {Object} configs - Saved configurations
     * @param {Function} onLoad - Callback when load clicked
     * @param {Function} onDelete - Callback when delete clicked
     */
    renderSavedConfigs(container, configs, onLoad, onDelete) {
        const names = Object.keys(configs);

        if (names.length === 0) {
            container.innerHTML = '<div class="empty-state">No saved configurations yet</div>';
            return;
        }

        container.innerHTML = '';

        for (const name of names) {
            const config = configs[name];
            const item = document.createElement('div');
            item.className = 'saved-item';

            const screenCount = config.screens.length;
            const savedDate = new Date(config.savedAt).toLocaleDateString();

            item.innerHTML = `
                <div class="saved-item-info">
                    <span class="saved-item-name">${this.escapeHtml(name)}</span>
                    <span class="saved-item-meta">${screenCount} screen${screenCount !== 1 ? 's' : ''} - ${savedDate}</span>
                </div>
                <div class="saved-item-actions">
                    <button class="btn btn-sm btn-primary load-btn">Add</button>
                    <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                </div>
            `;

            item.querySelector('.load-btn').addEventListener('click', () => onLoad(name));
            item.querySelector('.delete-btn').addEventListener('click', () => onDelete(name));

            container.appendChild(item);
        }
    },

    /**
     * Show a modal
     * @param {string} modalId - The modal element ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Hide a modal
     * @param {string} modalId - The modal element ID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', or 'info'
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-hover);
            z-index: 300;
            animation: fadeIn 0.2s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Initialize theme based on saved preference or system
     */
    initTheme() {
        const saved = Storage.loadTheme();
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.saveTheme(newTheme);
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UI = UI;
}
