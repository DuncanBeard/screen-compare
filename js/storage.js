/**
 * Storage Module
 * Handles localStorage and URL encoding/decoding for configurations
 */
const Storage = {
    STORAGE_KEY: 'screenPpiConfigs',
    CURRENT_KEY: 'screenPpiCurrent',

    /**
     * Save a named configuration to localStorage
     * @param {string} name - Configuration name
     * @param {Array} screens - Array of screen objects
     */
    saveConfig(name, screens) {
        const configs = this.getAllConfigs();
        configs[name] = {
            screens,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    },

    /**
     * Get all saved configurations
     * @returns {Object} All saved configurations
     */
    getAllConfigs() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading configs:', e);
            return {};
        }
    },

    /**
     * Load a specific configuration
     * @param {string} name - Configuration name
     * @returns {Array|null} Screen array or null
     */
    loadConfig(name) {
        const configs = this.getAllConfigs();
        return configs[name]?.screens || null;
    },

    /**
     * Delete a configuration
     * @param {string} name - Configuration name
     */
    deleteConfig(name) {
        const configs = this.getAllConfigs();
        delete configs[name];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    },

    /**
     * Save current working screens (auto-save)
     * @param {Array} screens - Array of screen objects
     */
    saveCurrent(screens) {
        try {
            localStorage.setItem(this.CURRENT_KEY, JSON.stringify(screens));
        } catch (e) {
            console.error('Error saving current screens:', e);
        }
    },

    /**
     * Load current working screens
     * @returns {Array|null} Screen array or null
     */
    loadCurrent() {
        try {
            const data = localStorage.getItem(this.CURRENT_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading current screens:', e);
            return null;
        }
    },

    /**
     * Encode screens to a URL-safe string
     * @param {Array} screens - Array of screen objects
     * @returns {string} Base64 encoded string
     */
    encodeToUrl(screens) {
        // Minify the screen data for shorter URLs
        const minified = screens.map(s => ({
            n: s.name,
            s: s.size,
            w: s.width,
            h: s.height,
            sc: s.scale
        }));
        const json = JSON.stringify(minified);
        // Use base64 encoding
        return btoa(encodeURIComponent(json));
    },

    /**
     * Decode screens from URL parameter
     * @param {string} encoded - Base64 encoded string
     * @returns {Array|null} Screen array or null
     */
    decodeFromUrl(encoded) {
        try {
            const json = decodeURIComponent(atob(encoded));
            const minified = JSON.parse(json);
            return minified.map(s => ({
                name: s.n,
                size: s.s,
                width: s.w,
                height: s.h,
                scale: s.sc
            }));
        } catch (e) {
            console.error('Error decoding URL:', e);
            return null;
        }
    },

    /**
     * Generate a shareable URL
     * @param {Array} screens - Array of screen objects
     * @returns {string} Full URL with encoded screens
     */
    generateShareUrl(screens) {
        const encoded = this.encodeToUrl(screens);
        const url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('screens', encoded);
        return url.toString();
    },

    /**
     * Load screens from URL if present
     * @returns {Array|null} Screen array or null
     */
    loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('screens');
        if (encoded) {
            return this.decodeFromUrl(encoded);
        }
        return null;
    },

    /**
     * Clear URL parameters without reloading
     */
    clearUrlParams() {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
    },

    /**
     * Export all configurations as JSON
     * @returns {string} JSON string
     */
    exportAll() {
        const configs = this.getAllConfigs();
        return JSON.stringify(configs, null, 2);
    },

    /**
     * Import configurations from JSON
     * @param {string} jsonStr - JSON string
     * @returns {boolean} Success status
     */
    importAll(jsonStr) {
        try {
            const configs = JSON.parse(jsonStr);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
            return true;
        } catch (e) {
            console.error('Error importing configs:', e);
            return false;
        }
    },

    /**
     * Save theme preference
     * @param {string} theme - 'light' or 'dark'
     */
    saveTheme(theme) {
        localStorage.setItem('screenPpiTheme', theme);
    },

    /**
     * Load theme preference
     * @returns {string|null} Theme or null
     */
    loadTheme() {
        return localStorage.getItem('screenPpiTheme');
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}
