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
    },

    // Store screen positions for free arrange mode
    screenPositions: {},
    dragState: null,
    SNAP_THRESHOLD: 10,

    /**
     * Render the size comparison visualization
     * @param {Array} screens - Array of screen objects with IDs
     * @param {string} arrangement - 'free', 'side-by-side', 'overlap-center', 'overlap-corner', or 'stacked'
     * @param {number} scaleFactor - Scale factor for rendering
     * @param {string} viewMode - 'physical' or 'digital'
     */
    renderSizeComparison(screens, arrangement, scaleFactor, viewMode = 'physical') {
        const canvas = document.getElementById('size-canvas');
        const legend = document.getElementById('size-legend');
        const viewport = document.getElementById('size-viewport');

        if (!canvas || !legend) return;

        canvas.innerHTML = '';
        legend.innerHTML = '';

        // Remove previous arrangement classes
        canvas.classList.remove('auto-arrange', 'free-arrange', 'overlap-center', 'overlap-corner', 'stacked');

        if (screens.length === 0) {
            canvas.innerHTML = '<div class="empty-state">Add screens to compare sizes</div>';
            return;
        }

        const isFreeArrange = arrangement === 'free';
        const isDigital = viewMode === 'digital';

        // Calculate dimensions for all screens based on view mode
        const screenData = screens.map((screen, index) => {
            const dims = isDigital
                ? Calculations.toDigitalDimensions(screen, scaleFactor)
                : Calculations.toScaleDimensions(screen, scaleFactor);
            const colors = Calculations.screenColor(index, screens.length);
            return { screen, dims, colors, index, isDigital };
        });

        if (isFreeArrange) {
            canvas.classList.add('free-arrange');
            this.renderFreeArrange(canvas, screenData, viewport);
        } else {
            canvas.classList.add('auto-arrange');
            if (arrangement !== 'side-by-side') {
                canvas.classList.add(arrangement);
            }
            this.renderAutoArrange(canvas, screenData, arrangement);
        }

        // Render legend
        screenData.forEach(({ screen, dims, colors, isDigital }) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const sizeInfo = isDigital
                ? `${dims.effectiveWidth} × ${dims.effectiveHeight} effective pixels`
                : `${screen.size}" diagonal (${dims.physicalWidth.toFixed(1)}" × ${dims.physicalHeight.toFixed(1)}")`;

            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${colors.main}"></span>
                <span class="legend-text">
                    <strong>${this.escapeHtml(screen.name)}</strong>
                    ${sizeInfo}
                </span>
            `;
            legend.appendChild(legendItem);
        });
    },

    /**
     * Render screens in auto-arrange modes
     */
    renderAutoArrange(canvas, screenData, arrangement) {
        // Sort by area for overlap modes (largest first, so smallest is on top)
        if (arrangement === 'overlap-center' || arrangement === 'overlap-corner') {
            screenData.sort((a, b) => (b.dims.width * b.dims.height) - (a.dims.width * a.dims.height));
        }

        screenData.forEach((data, displayIndex) => {
            const { screen, dims, colors, isDigital } = data;
            const rect = this.createScreenRect(screen, dims, colors, isDigital);

            if (arrangement === 'overlap-center' || arrangement === 'overlap-corner') {
                rect.style.zIndex = displayIndex + 1;
            }

            canvas.appendChild(rect);
        });
    },

    /**
     * Render screens in free arrange mode with drag support
     */
    renderFreeArrange(canvas, screenData, viewport) {
        const viewportRect = viewport.getBoundingClientRect();
        const padding = 20;

        screenData.forEach((data, index) => {
            const { screen, dims, colors, isDigital } = data;
            const rect = this.createScreenRect(screen, dims, colors, isDigital);
            rect.classList.add('draggable');
            rect.dataset.screenId = screen.id;

            // Get or initialize position
            let pos = this.screenPositions[screen.id];
            if (!pos) {
                // Default position: spread horizontally
                pos = {
                    x: padding + (index * (dims.width + 20)),
                    y: padding
                };
                this.screenPositions[screen.id] = pos;
            }

            rect.style.left = `${pos.x}px`;
            rect.style.top = `${pos.y}px`;
            rect.style.zIndex = index + 1;

            // Add drag handlers
            this.addDragHandlers(rect, screen.id, viewport);

            canvas.appendChild(rect);
        });
    },

    /**
     * Create a screen rectangle element
     */
    createScreenRect(screen, dims, colors, isDigital = false) {
        const rect = document.createElement('div');
        rect.className = 'screen-rect';
        rect.style.width = `${dims.width}px`;
        rect.style.height = `${dims.height}px`;
        rect.style.setProperty('--screen-color', colors.main);
        rect.style.setProperty('--screen-color-dark', colors.dark);
        rect.style.setProperty('--screen-border', colors.border);

        if (dims.width > 60 && dims.height > 40) {
            const sizeLabel = isDigital
                ? `${dims.effectiveWidth} × ${dims.effectiveHeight}`
                : `${dims.physicalWidth.toFixed(1)}" × ${dims.physicalHeight.toFixed(1)}"`;

            rect.innerHTML = `
                <span class="screen-rect-label">${this.escapeHtml(screen.name)}</span>
                <span class="screen-rect-size">${sizeLabel}</span>
            `;
        }

        return rect;
    },

    /**
     * Add drag event handlers to a screen rect
     */
    addDragHandlers(rect, screenId, viewport) {
        const onMouseDown = (e) => {
            if (e.button !== 0) return; // Only left click
            e.preventDefault();

            const viewportRect = viewport.getBoundingClientRect();
            const rectBounds = rect.getBoundingClientRect();

            this.dragState = {
                screenId,
                element: rect,
                startX: e.clientX,
                startY: e.clientY,
                initialLeft: rectBounds.left - viewportRect.left + viewport.scrollLeft,
                initialTop: rectBounds.top - viewportRect.top + viewport.scrollTop,
                viewportRect,
                viewport
            };

            rect.classList.add('dragging');

            // Bring to front
            const allRects = document.querySelectorAll('.screen-rect.draggable');
            allRects.forEach(r => r.style.zIndex = '1');
            rect.style.zIndex = '100';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.dragState) return;

            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;

            let newX = this.dragState.initialLeft + dx;
            let newY = this.dragState.initialTop + dy;

            // Apply snapping
            const snapResult = this.calculateSnap(newX, newY, this.dragState.element, this.dragState.viewport);
            newX = snapResult.x;
            newY = snapResult.y;

            // Update position
            this.dragState.element.style.left = `${newX}px`;
            this.dragState.element.style.top = `${newY}px`;

            // Show/hide snap guides
            this.updateSnapGuides(snapResult.guides);
        };

        const onMouseUp = () => {
            if (!this.dragState) return;

            const rect = this.dragState.element;
            rect.classList.remove('dragging');

            // Save position
            this.screenPositions[this.dragState.screenId] = {
                x: parseFloat(rect.style.left),
                y: parseFloat(rect.style.top)
            };

            // Hide snap guides
            this.updateSnapGuides({ horizontal: null, vertical: null });

            this.dragState = null;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        rect.addEventListener('mousedown', onMouseDown);

        // Touch support
        rect.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, preventDefault: () => e.preventDefault() });
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!this.dragState) return;
            const touch = e.touches[0];
            onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });

        document.addEventListener('touchend', onMouseUp);
    },

    /**
     * Calculate snap position based on other screens
     */
    calculateSnap(x, y, draggedRect, viewport) {
        const result = { x, y, guides: { horizontal: null, vertical: null } };
        const threshold = this.SNAP_THRESHOLD;

        const draggedWidth = draggedRect.offsetWidth;
        const draggedHeight = draggedRect.offsetHeight;

        // Dragged rect edges and center
        const draggedLeft = x;
        const draggedRight = x + draggedWidth;
        const draggedTop = y;
        const draggedBottom = y + draggedHeight;
        const draggedCenterX = x + draggedWidth / 2;
        const draggedCenterY = y + draggedHeight / 2;

        // Collect snap targets from other screens
        const snapTargetsX = [];
        const snapTargetsY = [];

        // Viewport edges and center
        const viewportWidth = viewport.clientWidth;
        const viewportHeight = viewport.clientHeight;
        snapTargetsX.push({ value: 0, type: 'edge' });
        snapTargetsX.push({ value: viewportWidth, type: 'edge' });
        snapTargetsX.push({ value: viewportWidth / 2, type: 'center' });
        snapTargetsY.push({ value: 0, type: 'edge' });
        snapTargetsY.push({ value: viewportHeight, type: 'edge' });
        snapTargetsY.push({ value: viewportHeight / 2, type: 'center' });

        // Other screen edges and centers
        const otherRects = document.querySelectorAll('.screen-rect.draggable');
        otherRects.forEach(rect => {
            if (rect === draggedRect) return;

            const left = parseFloat(rect.style.left) || 0;
            const top = parseFloat(rect.style.top) || 0;
            const width = rect.offsetWidth;
            const height = rect.offsetHeight;

            // Edges
            snapTargetsX.push({ value: left, type: 'edge' });
            snapTargetsX.push({ value: left + width, type: 'edge' });
            snapTargetsX.push({ value: left + width / 2, type: 'center' });
            snapTargetsY.push({ value: top, type: 'edge' });
            snapTargetsY.push({ value: top + height, type: 'edge' });
            snapTargetsY.push({ value: top + height / 2, type: 'center' });
        });

        // Check horizontal snapping (left, right, center of dragged)
        let bestSnapX = null;
        let bestSnapDistX = threshold;

        for (const target of snapTargetsX) {
            // Snap left edge
            const distLeft = Math.abs(draggedLeft - target.value);
            if (distLeft < bestSnapDistX) {
                bestSnapDistX = distLeft;
                bestSnapX = { offset: target.value - draggedLeft, guide: target.value };
            }

            // Snap right edge
            const distRight = Math.abs(draggedRight - target.value);
            if (distRight < bestSnapDistX) {
                bestSnapDistX = distRight;
                bestSnapX = { offset: target.value - draggedRight, guide: target.value };
            }

            // Snap center
            const distCenter = Math.abs(draggedCenterX - target.value);
            if (distCenter < bestSnapDistX) {
                bestSnapDistX = distCenter;
                bestSnapX = { offset: target.value - draggedCenterX, guide: target.value };
            }
        }

        if (bestSnapX) {
            result.x = x + bestSnapX.offset;
            result.guides.vertical = bestSnapX.guide;
        }

        // Check vertical snapping (top, bottom, center of dragged)
        let bestSnapY = null;
        let bestSnapDistY = threshold;

        for (const target of snapTargetsY) {
            // Snap top edge
            const distTop = Math.abs(draggedTop - target.value);
            if (distTop < bestSnapDistY) {
                bestSnapDistY = distTop;
                bestSnapY = { offset: target.value - draggedTop, guide: target.value };
            }

            // Snap bottom edge
            const distBottom = Math.abs(draggedBottom - target.value);
            if (distBottom < bestSnapDistY) {
                bestSnapDistY = distBottom;
                bestSnapY = { offset: target.value - draggedBottom, guide: target.value };
            }

            // Snap center
            const distCenter = Math.abs(draggedCenterY - target.value);
            if (distCenter < bestSnapDistY) {
                bestSnapDistY = distCenter;
                bestSnapY = { offset: target.value - draggedCenterY, guide: target.value };
            }
        }

        if (bestSnapY) {
            result.y = y + bestSnapY.offset;
            result.guides.horizontal = bestSnapY.guide;
        }

        return result;
    },

    /**
     * Update snap guide visibility
     */
    updateSnapGuides(guides) {
        const hGuide = document.getElementById('snap-guide-h');
        const vGuide = document.getElementById('snap-guide-v');

        if (hGuide) {
            if (guides.horizontal !== null) {
                hGuide.style.top = `${guides.horizontal}px`;
                hGuide.classList.add('visible');
            } else {
                hGuide.classList.remove('visible');
            }
        }

        if (vGuide) {
            if (guides.vertical !== null) {
                vGuide.style.left = `${guides.vertical}px`;
                vGuide.classList.add('visible');
            } else {
                vGuide.classList.remove('visible');
            }
        }
    },

    /**
     * Clear stored screen positions (called when clearing all screens)
     */
    clearScreenPositions() {
        this.screenPositions = {};
    },

    /**
     * Update zoom label
     * @param {number} scaleFactor - Current zoom level
     * @param {string} viewMode - 'physical' or 'digital'
     */
    updateZoomLabel(scaleFactor, viewMode = 'physical') {
        const label = document.getElementById('zoom-label');
        if (label) {
            if (viewMode === 'digital') {
                label.textContent = `${scaleFactor}% scale`;
            } else {
                label.textContent = `${scaleFactor} px/inch`;
            }
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UI = UI;
}
