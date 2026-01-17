/**
 * Device Presets Database
 * Comprehensive collection of screens with their specifications
 */
const Presets = {
    categories: [
        {
            name: 'MacBooks',
            devices: [
                { name: 'MacBook Air 13" (M2/M3)', size: 13.6, width: 2560, height: 1664, defaultScale: 200 },
                { name: 'MacBook Air 15" (M2/M3)', size: 15.3, width: 2880, height: 1864, defaultScale: 200 },
                { name: 'MacBook Pro 14" (M3/M4)', size: 14.2, width: 3024, height: 1964, defaultScale: 200 },
                { name: 'MacBook Pro 16" (M3/M4)', size: 16.2, width: 3456, height: 2234, defaultScale: 200 },
                { name: 'MacBook Pro 13" (Intel)', size: 13.3, width: 2560, height: 1600, defaultScale: 200 },
                { name: 'MacBook Pro 15" (Intel)', size: 15.4, width: 2880, height: 1800, defaultScale: 200 },
            ]
        },
        {
            name: 'iMacs & Apple Displays',
            devices: [
                { name: 'iMac 24" (M1/M3)', size: 23.5, width: 4480, height: 2520, defaultScale: 200 },
                { name: 'iMac 27" 5K (Intel)', size: 27, width: 5120, height: 2880, defaultScale: 200 },
                { name: 'Studio Display 27"', size: 27, width: 5120, height: 2880, defaultScale: 200 },
                { name: 'Pro Display XDR 32"', size: 32, width: 6016, height: 3384, defaultScale: 200 },
            ]
        },
        {
            name: 'Windows Laptops',
            devices: [
                { name: 'Dell XPS 13" FHD+', size: 13.4, width: 1920, height: 1200, defaultScale: 125 },
                { name: 'Dell XPS 13" OLED 3.5K', size: 13.4, width: 3456, height: 2160, defaultScale: 200 },
                { name: 'Dell XPS 15" FHD+', size: 15.6, width: 1920, height: 1200, defaultScale: 125 },
                { name: 'Dell XPS 15" OLED 3.5K', size: 15.6, width: 3456, height: 2160, defaultScale: 175 },
                { name: 'Dell XPS 17" 4K', size: 17, width: 3840, height: 2400, defaultScale: 175 },
                { name: 'ThinkPad X1 Carbon 14" 2.8K', size: 14, width: 2880, height: 1800, defaultScale: 175 },
                { name: 'ThinkPad X1 Carbon 14" 4K', size: 14, width: 3840, height: 2400, defaultScale: 200 },
                { name: 'Surface Laptop 13.5"', size: 13.5, width: 2256, height: 1504, defaultScale: 150 },
                { name: 'Surface Laptop 15"', size: 15, width: 2496, height: 1664, defaultScale: 150 },
                { name: 'Surface Laptop Studio 14.4"', size: 14.4, width: 2400, height: 1600, defaultScale: 150 },
                { name: 'HP Spectre x360 14" OLED', size: 14, width: 2880, height: 1800, defaultScale: 175 },
                { name: 'HP Spectre x360 16" 4K', size: 16, width: 3840, height: 2400, defaultScale: 175 },
                { name: 'ASUS ZenBook 14" OLED', size: 14, width: 2880, height: 1800, defaultScale: 175 },
                { name: 'Razer Blade 14" QHD', size: 14, width: 2560, height: 1440, defaultScale: 150 },
                { name: 'Razer Blade 15" FHD 360Hz', size: 15.6, width: 1920, height: 1080, defaultScale: 100 },
                { name: 'Razer Blade 15" QHD 240Hz', size: 15.6, width: 2560, height: 1440, defaultScale: 125 },
                { name: 'Razer Blade 15" 4K OLED', size: 15.6, width: 3840, height: 2160, defaultScale: 175 },
                { name: 'Framework 13.5" 2256x1504', size: 13.5, width: 2256, height: 1504, defaultScale: 150 },
                { name: 'Framework 16" 2560x1600', size: 16, width: 2560, height: 1600, defaultScale: 150 },
            ]
        },
        {
            name: 'External Monitors - 24"',
            devices: [
                { name: '24" 1080p', size: 24, width: 1920, height: 1080, defaultScale: 100 },
                { name: '24" 1440p', size: 24, width: 2560, height: 1440, defaultScale: 100 },
                { name: '24" 4K', size: 24, width: 3840, height: 2160, defaultScale: 150 },
                { name: 'LG UltraFine 24" 4K', size: 23.7, width: 3840, height: 2160, defaultScale: 150 },
            ]
        },
        {
            name: 'External Monitors - 27"',
            devices: [
                { name: '27" 1080p', size: 27, width: 1920, height: 1080, defaultScale: 100 },
                { name: '27" 1440p (QHD)', size: 27, width: 2560, height: 1440, defaultScale: 100 },
                { name: '27" 4K', size: 27, width: 3840, height: 2160, defaultScale: 150 },
                { name: '27" 5K', size: 27, width: 5120, height: 2880, defaultScale: 200 },
                { name: 'Dell UltraSharp 27" 4K', size: 27, width: 3840, height: 2160, defaultScale: 150 },
                { name: 'LG UltraFine 27" 5K', size: 27, width: 5120, height: 2880, defaultScale: 200 },
                { name: 'Samsung ViewFinity S8 27"', size: 27, width: 3840, height: 2160, defaultScale: 150 },
            ]
        },
        {
            name: 'External Monitors - 32"',
            devices: [
                { name: '32" 1080p', size: 32, width: 1920, height: 1080, defaultScale: 100 },
                { name: '32" 1440p (QHD)', size: 32, width: 2560, height: 1440, defaultScale: 100 },
                { name: '32" 4K', size: 32, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'Dell UltraSharp 32" 4K', size: 31.5, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'LG 32UN880 UltraFine 32" 4K', size: 31.5, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'Samsung Smart Monitor M8 32" 4K', size: 32, width: 3840, height: 2160, defaultScale: 125 },
            ]
        },
        {
            name: 'Ultrawide Monitors',
            devices: [
                { name: '34" Ultrawide 1440p', size: 34, width: 3440, height: 1440, defaultScale: 100 },
                { name: '34" Ultrawide 5K2K', size: 34, width: 5120, height: 2160, defaultScale: 150 },
                { name: '38" Ultrawide 1600p', size: 38, width: 3840, height: 1600, defaultScale: 100 },
                { name: '40" Ultrawide 5K2K', size: 40, width: 5120, height: 2160, defaultScale: 125 },
                { name: '49" Super Ultrawide 1440p', size: 49, width: 5120, height: 1440, defaultScale: 100 },
                { name: 'LG 34WK95U 34" 5K2K', size: 34, width: 5120, height: 2160, defaultScale: 150 },
                { name: 'Dell U3423WE 34" WQHD', size: 34, width: 3440, height: 1440, defaultScale: 100 },
                { name: 'LG 38WN95C 38" Curved', size: 37.5, width: 3840, height: 1600, defaultScale: 100 },
                { name: 'Samsung Odyssey G9 49"', size: 49, width: 5120, height: 1440, defaultScale: 100 },
                { name: 'Samsung Odyssey OLED G9 49"', size: 49, width: 5120, height: 1440, defaultScale: 100 },
            ]
        },
        {
            name: 'Gaming Monitors',
            devices: [
                { name: '24.5" 1080p 360Hz', size: 24.5, width: 1920, height: 1080, defaultScale: 100 },
                { name: '27" 1080p 240Hz', size: 27, width: 1920, height: 1080, defaultScale: 100 },
                { name: '27" 1440p 165Hz', size: 27, width: 2560, height: 1440, defaultScale: 100 },
                { name: '27" 1440p 240Hz', size: 27, width: 2560, height: 1440, defaultScale: 100 },
                { name: '27" 4K 144Hz', size: 27, width: 3840, height: 2160, defaultScale: 150 },
                { name: '32" 4K 144Hz', size: 32, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'ASUS ROG Swift PG27AQDM 27" OLED', size: 26.5, width: 2560, height: 1440, defaultScale: 100 },
                { name: 'LG 27GR95QE 27" OLED', size: 26.5, width: 2560, height: 1440, defaultScale: 100 },
                { name: 'Samsung Odyssey OLED G8 32" 4K', size: 32, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'ASUS ROG Swift PG32UCDM 32" OLED 4K', size: 31.5, width: 3840, height: 2160, defaultScale: 125 },
                { name: 'Alienware AW3423DWF 34" OLED', size: 34, width: 3440, height: 1440, defaultScale: 100 },
            ]
        },
        {
            name: 'iPads',
            devices: [
                { name: 'iPad Pro 11" (M4)', size: 11, width: 2420, height: 1668, defaultScale: 200 },
                { name: 'iPad Pro 13" (M4)', size: 13, width: 2752, height: 2064, defaultScale: 200 },
                { name: 'iPad Air 11" (M2)', size: 10.86, width: 2360, height: 1640, defaultScale: 200 },
                { name: 'iPad Air 13" (M2)', size: 12.9, width: 2732, height: 2048, defaultScale: 200 },
                { name: 'iPad 10.9" (10th gen)', size: 10.9, width: 2360, height: 1640, defaultScale: 200 },
                { name: 'iPad mini 8.3" (6th gen)', size: 8.3, width: 2266, height: 1488, defaultScale: 200 },
            ]
        },
        {
            name: 'TVs (as monitors)',
            devices: [
                { name: '42" OLED 4K (LG C2/C3)', size: 42, width: 3840, height: 2160, defaultScale: 100 },
                { name: '48" OLED 4K (LG C2/C3)', size: 48, width: 3840, height: 2160, defaultScale: 100 },
                { name: '55" OLED 4K', size: 55, width: 3840, height: 2160, defaultScale: 100 },
                { name: '65" OLED 4K', size: 65, width: 3840, height: 2160, defaultScale: 100 },
            ]
        },
        {
            name: 'Common Resolutions (27")',
            devices: [
                { name: '27" 720p', size: 27, width: 1280, height: 720, defaultScale: 100 },
                { name: '27" 1080p', size: 27, width: 1920, height: 1080, defaultScale: 100 },
                { name: '27" 1440p', size: 27, width: 2560, height: 1440, defaultScale: 100 },
                { name: '27" 4K', size: 27, width: 3840, height: 2160, defaultScale: 150 },
                { name: '27" 5K', size: 27, width: 5120, height: 2880, defaultScale: 200 },
                { name: '27" 8K', size: 27, width: 7680, height: 4320, defaultScale: 300 },
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
