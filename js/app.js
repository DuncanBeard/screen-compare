/**
 * Main Application
 * Ties together all modules and handles app state
 */
const App = {
    screens: [],
    nextId: 1,
    arrangement: 'side-by-side',
    pixelsPerInch: 12,

    /**
     * Initialize the application
     */
    init() {
        // Initialize theme
        UI.initTheme();

        // Populate preset dropdown
        const presetSelect = document.getElementById('preset-select');
        UI.populatePresets(presetSelect);

        // Bind event listeners
        this.bindEvents();

        // Load screens from URL or localStorage
        this.loadInitialState();

        // Render saved configurations
        this.renderSavedConfigs();

        // Initial size comparison render
        this.updateSizeComparison();
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Add screen button
        document.getElementById('add-screen').addEventListener('click', () => {
            this.addScreen();
        });

        // Preset dropdown
        document.getElementById('preset-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
                e.target.value = ''; // Reset dropdown
            }
        });

        // Save button
        document.getElementById('save-config').addEventListener('click', () => {
            if (this.screens.length === 0) {
                UI.showToast('Add some screens first', 'error');
                return;
            }
            UI.showModal('save-modal');
            document.getElementById('config-name').focus();
        });

        // Share button
        document.getElementById('share-config').addEventListener('click', () => {
            if (this.screens.length === 0) {
                UI.showToast('Add some screens first', 'error');
                return;
            }
            const url = Storage.generateShareUrl(this.screens);
            document.getElementById('share-url').value = url;
            UI.showModal('share-modal');
        });

        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => {
            if (this.screens.length === 0) return;
            if (confirm('Remove all screens?')) {
                this.clearAllScreens();
            }
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            UI.toggleTheme();
        });

        // Save modal
        document.getElementById('save-confirm').addEventListener('click', () => {
            const name = document.getElementById('config-name').value.trim();
            if (!name) {
                UI.showToast('Please enter a name', 'error');
                return;
            }
            Storage.saveConfig(name, this.screens);
            UI.hideModal('save-modal');
            document.getElementById('config-name').value = '';
            this.renderSavedConfigs();
            UI.showToast('Configuration saved', 'success');
        });

        document.getElementById('save-cancel').addEventListener('click', () => {
            UI.hideModal('save-modal');
            document.getElementById('config-name').value = '';
        });

        // Share modal
        document.getElementById('copy-url').addEventListener('click', () => {
            const urlInput = document.getElementById('share-url');
            urlInput.select();
            navigator.clipboard.writeText(urlInput.value).then(() => {
                UI.showToast('URL copied to clipboard', 'success');
            }).catch(() => {
                // Fallback for older browsers
                document.execCommand('copy');
                UI.showToast('URL copied to clipboard', 'success');
            });
        });

        document.getElementById('share-cancel').addEventListener('click', () => {
            UI.hideModal('share-modal');
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UI.hideModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    UI.hideModal(modal.id);
                });
            }
            // Enter to confirm save
            if (e.key === 'Enter' && document.getElementById('save-modal').classList.contains('active')) {
                document.getElementById('save-confirm').click();
            }
        });

        // Size comparison controls
        const arrangementSelect = document.getElementById('arrangement-select');
        if (arrangementSelect) {
            arrangementSelect.addEventListener('change', (e) => {
                this.arrangement = e.target.value;
                this.updateSizeComparison();
            });
        }

        const zoomSlider = document.getElementById('size-zoom');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.pixelsPerInch = parseInt(e.target.value);
                UI.updateZoomLabel(this.pixelsPerInch);
                this.updateSizeComparison();
            });
        }
    },

    /**
     * Load initial state from URL or localStorage
     */
    loadInitialState() {
        // Check URL first
        const urlScreens = Storage.loadFromUrl();
        if (urlScreens && urlScreens.length > 0) {
            for (const screen of urlScreens) {
                this.addScreen(screen);
            }
            Storage.clearUrlParams();
            UI.showToast('Loaded shared configuration', 'info');
            return;
        }

        // Check localStorage for current session
        const savedScreens = Storage.loadCurrent();
        if (savedScreens && savedScreens.length > 0) {
            for (const screen of savedScreens) {
                this.addScreen(screen);
            }
            return;
        }

        // Add a default screen
        this.addScreen({
            name: '27" 4K Monitor',
            size: 27,
            width: 3840,
            height: 2160,
            scale: 150
        });
    },

    /**
     * Add a new screen
     * @param {Object} screenData - Optional initial data
     */
    addScreen(screenData = null) {
        const id = `screen-${this.nextId++}`;

        const screen = screenData || {
            name: 'New Screen',
            size: 27,
            width: 2560,
            height: 1440,
            scale: 100
        };

        this.screens.push({ id, ...screen });

        const card = UI.createScreenCard(
            screen,
            id,
            (cardId, updated) => this.updateScreen(cardId, updated),
            (cardId) => this.removeScreen(cardId)
        );

        document.getElementById('comparison-grid').appendChild(card);
        this.autoSave();
        this.updateSizeComparison();
    },

    /**
     * Update a screen's data
     * @param {string} id - Screen ID
     * @param {Object} data - Updated data
     */
    updateScreen(id, data) {
        const index = this.screens.findIndex(s => s.id === id);
        if (index === -1) return;

        this.screens[index] = { id, ...data };

        // Update the card's results
        const card = document.querySelector(`.screen-card[data-id="${id}"]`);
        if (card) {
            UI.updateCardResults(card, data);
        }

        this.autoSave();
        this.updateSizeComparison();
    },

    /**
     * Remove a screen
     * @param {string} id - Screen ID
     */
    removeScreen(id) {
        this.screens = this.screens.filter(s => s.id !== id);

        const card = document.querySelector(`.screen-card[data-id="${id}"]`);
        if (card) {
            card.remove();
        }

        this.autoSave();
        this.updateSizeComparison();
    },

    /**
     * Clear all screens
     */
    clearAllScreens() {
        this.screens = [];
        document.getElementById('comparison-grid').innerHTML = '';
        this.autoSave();
        this.updateSizeComparison();
    },

    /**
     * Load a preset device
     * @param {string} name - Preset name
     */
    loadPreset(name) {
        const preset = Presets.findByName(name);
        if (!preset) return;

        this.addScreen({
            name: preset.name,
            size: preset.size,
            width: preset.width,
            height: preset.height,
            scale: preset.defaultScale
        });
    },

    /**
     * Load a saved configuration (adds to existing screens)
     * @param {string} name - Configuration name
     */
    loadSavedConfig(name) {
        const screens = Storage.loadConfig(name);
        if (!screens) return;

        for (const screen of screens) {
            this.addScreen(screen);
        }
        const count = screens.length;
        UI.showToast(`Added ${count} screen${count !== 1 ? 's' : ''} from "${name}"`, 'success');
    },

    /**
     * Delete a saved configuration
     * @param {string} name - Configuration name
     */
    deleteSavedConfig(name) {
        if (confirm(`Delete "${name}"?`)) {
            Storage.deleteConfig(name);
            this.renderSavedConfigs();
            UI.showToast('Configuration deleted', 'info');
        }
    },

    /**
     * Render the saved configurations list
     */
    renderSavedConfigs() {
        const configs = Storage.getAllConfigs();
        UI.renderSavedConfigs(
            document.getElementById('saved-list'),
            configs,
            (name) => this.loadSavedConfig(name),
            (name) => this.deleteSavedConfig(name)
        );
    },

    /**
     * Auto-save current screens to localStorage
     */
    autoSave() {
        // Strip IDs before saving (they're session-specific)
        const toSave = this.screens.map(({ id, ...rest }) => rest);
        Storage.saveCurrent(toSave);
    },

    /**
     * Update the size comparison visualization
     */
    updateSizeComparison() {
        UI.renderSizeComparison(this.screens, this.arrangement, this.pixelsPerInch);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.App = App;
}
