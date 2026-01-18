/**
 * Device Presets Database
 * Generic size/resolution combinations
 */
const Presets = {
    categories: [
        {
            name: 'Laptops - 13"',
            devices: [
                { name: '13" 1080p', size: 13.3, width: 1920, height: 1080, defaultScale: 125 },
                { name: '13" 1600p', size: 13.3, width: 2560, height: 1600, defaultScale: 200 },
                { name: '13" Retina (2560x1664)', size: 13.6, width: 2560, height: 1664, defaultScale: 200 },
                { name: '13" 4K', size: 13.3, width: 3840, height: 2160, defaultScale: 200 },
            ]
        },
        {
            name: 'Laptops - 14"',
            devices: [
                { name: '14" 1080p', size: 14, width: 1920, height: 1080, defaultScale: 100 },
                { name: '14" 1200p', size: 14, width: 1920, height: 1200, defaultScale: 125 },
                { name: '14" 1440p', size: 14, width: 2560, height: 1440, defaultScale: 150 },
                { name: '14" 1800p (2880x1800)', size: 14, width: 2880, height: 1800, defaultScale: 175 },
                { name: '14" Retina (3024x1964)', size: 14.2, width: 3024, height: 1964, defaultScale: 200 },
                { name: '14" 4K', size: 14, width: 3840, height: 2400, defaultScale: 200 },
            ]
        },
        {
            name: 'Laptops - 15-16"',
            devices: [
                { name: '15" 1080p', size: 15.6, width: 1920, height: 1080, defaultScale: 100 },
                { name: '15" 1200p', size: 15.6, width: 1920, height: 1200, defaultScale: 125 },
                { name: '15" 1440p', size: 15.6, width: 2560, height: 1440, defaultScale: 125 },
                { name: '15" Retina (2880x1864)', size: 15.3, width: 2880, height: 1864, defaultScale: 200 },
                { name: '15" 4K', size: 15.6, width: 3840, height: 2160, defaultScale: 175 },
                { name: '16" 1600p (2560x1600)', size: 16, width: 2560, height: 1600, defaultScale: 150 },
                { name: '16" Retina (3456x2234)', size: 16.2, width: 3456, height: 2234, defaultScale: 200 },
                { name: '16" 4K', size: 16, width: 3840, height: 2400, defaultScale: 175 },
                { name: '17" 4K', size: 17, width: 3840, height: 2400, defaultScale: 175 },
            ]
        },
        {
            name: 'Monitors - 24"',
            devices: [
                { name: '24" 1080p', size: 24, width: 1920, height: 1080, defaultScale: 100 },
                { name: '24" 1200p', size: 24, width: 1920, height: 1200, defaultScale: 100 },
                { name: '24" 1440p', size: 24, width: 2560, height: 1440, defaultScale: 100 },
                { name: '24" 4K', size: 24, width: 3840, height: 2160, defaultScale: 150 },
                { name: '24" 4.5K (iMac)', size: 23.5, width: 4480, height: 2520, defaultScale: 200 },
            ]
        },
        {
            name: 'Monitors - 27"',
            devices: [
                { name: '27" 1080p', size: 27, width: 1920, height: 1080, defaultScale: 100 },
                { name: '27" 1440p', size: 27, width: 2560, height: 1440, defaultScale: 100 },
                { name: '27" 4K', size: 27, width: 3840, height: 2160, defaultScale: 150 },
                { name: '27" 5K', size: 27, width: 5120, height: 2880, defaultScale: 200 },
            ]
        },
        {
            name: 'Monitors - 32"',
            devices: [
                { name: '32" 1080p', size: 32, width: 1920, height: 1080, defaultScale: 100 },
                { name: '32" 1440p', size: 32, width: 2560, height: 1440, defaultScale: 100 },
                { name: '32" 4K', size: 32, width: 3840, height: 2160, defaultScale: 125 },
                { name: '32" 6K (Pro Display)', size: 32, width: 6016, height: 3384, defaultScale: 200 },
            ]
        },
        {
            name: 'Ultrawide Monitors',
            devices: [
                { name: '34" UW 1440p (3440x1440)', size: 34, width: 3440, height: 1440, defaultScale: 100 },
                { name: '34" UW 5K2K (5120x2160)', size: 34, width: 5120, height: 2160, defaultScale: 150 },
                { name: '38" UW 1600p (3840x1600)', size: 38, width: 3840, height: 1600, defaultScale: 100 },
                { name: '40" UW 5K2K (5120x2160)', size: 40, width: 5120, height: 2160, defaultScale: 125 },
                { name: '49" Super UW (5120x1440)', size: 49, width: 5120, height: 1440, defaultScale: 100 },
            ]
        },
        {
            name: 'Tablets',
            devices: [
                { name: '8" Tablet (2266x1488)', size: 8.3, width: 2266, height: 1488, defaultScale: 200 },
                { name: '10" Tablet 1080p', size: 10.1, width: 1920, height: 1200, defaultScale: 150 },
                { name: '11" Tablet (2388x1668)', size: 11, width: 2388, height: 1668, defaultScale: 200 },
                { name: '11" Tablet (2420x1668)', size: 11, width: 2420, height: 1668, defaultScale: 200 },
                { name: '13" Tablet (2732x2048)', size: 12.9, width: 2732, height: 2048, defaultScale: 200 },
                { name: '13" Tablet (2752x2064)', size: 13, width: 2752, height: 2064, defaultScale: 200 },
            ]
        },
        {
            name: 'TVs as Monitors',
            devices: [
                { name: '42" 4K', size: 42, width: 3840, height: 2160, defaultScale: 100 },
                { name: '48" 4K', size: 48, width: 3840, height: 2160, defaultScale: 100 },
                { name: '55" 4K', size: 55, width: 3840, height: 2160, defaultScale: 100 },
                { name: '65" 4K', size: 65, width: 3840, height: 2160, defaultScale: 100 },
            ]
        }
    ],

    /**
     * Get all presets as a flat array
     * @returns {Array} All device presets
     */
    getAll() {
        const all = [];
        for (const category of this.categories) {
            for (const device of category.devices) {
                all.push({
                    ...device,
                    category: category.name
                });
            }
        }
        return all;
    },

    /**
     * Find a preset by name
     * @param {string} name - Device name
     * @returns {Object|null} Device preset or null
     */
    findByName(name) {
        for (const category of this.categories) {
            const found = category.devices.find(d => d.name === name);
            if (found) return { ...found, category: category.name };
        }
        return null;
    },

    /**
     * Search presets by query
     * @param {string} query - Search query
     * @returns {Array} Matching presets
     */
    search(query) {
        const q = query.toLowerCase();
        return this.getAll().filter(device =>
            device.name.toLowerCase().includes(q) ||
            device.category.toLowerCase().includes(q)
        );
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Presets = Presets;
}
