/**
 * Screen PPI Calculations Module
 */
const Calculations = {
    /**
     * Calculate the diagonal pixel count
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {number} Diagonal in pixels
     */
    diagonalPixels(width, height) {
        return Math.sqrt(width * width + height * height);
    },

    /**
     * Calculate Pixels Per Inch (PPI)
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @param {number} diagonalInches - Screen diagonal in inches
     * @returns {number} PPI value
     */
    ppi(width, height, diagonalInches) {
        if (diagonalInches <= 0) return 0;
        return this.diagonalPixels(width, height) / diagonalInches;
    },

    /**
     * Calculate effective resolution after scaling
     * @param {number} width - Native width in pixels
     * @param {number} height - Native height in pixels
     * @param {number} scalePercent - Scaling percentage (e.g., 150 for 150%)
     * @returns {{width: number, height: number}} Effective resolution
     */
    effectiveResolution(width, height, scalePercent) {
        const scaleFactor = scalePercent / 100;
        return {
            width: Math.round(width / scaleFactor),
            height: Math.round(height / scaleFactor)
        };
    },

    /**
     * Calculate effective PPI after scaling
     * @param {number} nativePpi - Native PPI
     * @param {number} scalePercent - Scaling percentage
     * @returns {number} Effective PPI
     */
    effectivePpi(nativePpi, scalePercent) {
        return nativePpi / (scalePercent / 100);
    },

    /**
     * Calculate aspect ratio in simplified form
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {string} Aspect ratio (e.g., "16:9")
     */
    aspectRatio(width, height) {
        const gcd = this.gcd(width, height);
        const ratioW = width / gcd;
        const ratioH = height / gcd;

        // Common aspect ratios lookup for cleaner display
        const commonRatios = {
            '16:9': [[16, 9], [1920, 1080], [2560, 1440], [3840, 2160], [7680, 4320]],
            '16:10': [[16, 10], [8, 5], [1920, 1200], [2560, 1600], [2880, 1800]],
            '21:9': [[21, 9], [64, 27], [43, 18]],
            '32:9': [[32, 9]],
            '4:3': [[4, 3]],
            '3:2': [[3, 2]],
        };

        // Check if it matches a common ratio
        for (const [name, ratios] of Object.entries(commonRatios)) {
            for (const [w, h] of ratios) {
                if (ratioW === w && ratioH === h) {
                    return name;
                }
            }
        }

        // Return calculated ratio
        return `${ratioW}:${ratioH}`;
    },

    /**
     * Greatest common divisor
     */
    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    },

    /**
     * Calculate physical screen dimensions
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @param {number} diagonalInches - Screen diagonal in inches
     * @returns {{width: number, height: number}} Physical dimensions in inches
     */
    physicalDimensions(width, height, diagonalInches) {
        const diagonalPx = this.diagonalPixels(width, height);
        const ppi = this.ppi(width, height, diagonalInches);

        if (ppi === 0) return { width: 0, height: 0 };

        return {
            width: width / ppi,
            height: height / ppi
        };
    },

    /**
     * Get PPI quality rating
     * @param {number} ppi - The PPI value
     * @returns {string} Rating: 'low', 'medium', or 'high'
     */
    ppiRating(ppi) {
        if (ppi < 100) return 'low';
        if (ppi < 150) return 'medium';
        return 'high';
    },

    /**
     * Calculate what the screen is "equivalent to" at a given scaling
     * For example, 4K at 150% is equivalent to 1440p in usable space
     * @param {number} effectiveWidth - Effective width after scaling
     * @param {number} effectiveHeight - Effective height after scaling
     * @returns {string|null} Description of equivalent resolution
     */
    equivalentResolution(effectiveWidth, effectiveHeight) {
        const resolutions = [
            { name: '8K UHD', w: 7680, h: 4320 },
            { name: '5K', w: 5120, h: 2880 },
            { name: '4K UHD', w: 3840, h: 2160 },
            { name: '1440p (QHD)', w: 2560, h: 1440 },
            { name: '1200p', w: 1920, h: 1200 },
            { name: '1080p (Full HD)', w: 1920, h: 1080 },
            { name: '900p', w: 1600, h: 900 },
            { name: '720p (HD)', w: 1280, h: 720 },
        ];

        // Find the closest resolution
        let closest = null;
        let closestDiff = Infinity;

        for (const res of resolutions) {
            const diff = Math.abs(effectiveWidth - res.w) + Math.abs(effectiveHeight - res.h);
            if (diff < closestDiff && diff < 200) { // Within 200 pixels total
                closestDiff = diff;
                closest = res;
            }
        }

        return closest ? closest.name : null;
    },

    /**
     * Get scaling factor description for macOS-style "looks like" display
     * @param {number} nativeWidth - Native width
     * @param {number} nativeHeight - Native height
     * @param {number} effectiveWidth - Effective width
     * @param {number} effectiveHeight - Effective height
     * @returns {string} Description like "Retina 2x" or scaling ratio
     */
    scalingDescription(nativeWidth, nativeHeight, effectiveWidth, effectiveHeight) {
        const scaleX = nativeWidth / effectiveWidth;
        const scaleY = nativeHeight / effectiveHeight;
        const avgScale = (scaleX + scaleY) / 2;

        if (Math.abs(avgScale - 2) < 0.1) return 'Retina 2x';
        if (Math.abs(avgScale - 3) < 0.1) return 'Retina 3x';
        if (Math.abs(avgScale - 1) < 0.1) return 'Native (1x)';

        return `${avgScale.toFixed(2)}x pixel density`;
    },

    /**
     * Calculate all metrics for a screen
     * @param {Object} screen - Screen configuration
     * @returns {Object} All calculated metrics
     */
    calculateAll(screen) {
        const { width, height, size, scale } = screen;

        const nativePpi = this.ppi(width, height, size);
        const effective = this.effectiveResolution(width, height, scale);
        const effPpi = this.effectivePpi(nativePpi, scale);
        const aspect = this.aspectRatio(width, height);
        const physical = this.physicalDimensions(width, height, size);
        const equivalent = this.equivalentResolution(effective.width, effective.height);
        const scalingDesc = this.scalingDescription(width, height, effective.width, effective.height);
        const rating = this.ppiRating(effPpi);

        // PPI bar percentage (based on 0-300 PPI range)
        const ppiBarPercent = Math.min(100, (nativePpi / 300) * 100);

        return {
            nativePpi: Math.round(nativePpi),
            effectiveResolution: effective,
            effectivePpi: Math.round(effPpi),
            aspectRatio: aspect,
            physicalWidth: physical.width.toFixed(1),
            physicalHeight: physical.height.toFixed(1),
            equivalent,
            scalingDescription: scalingDesc,
            ppiRating: rating,
            ppiBarPercent
        };
    },

    /**
     * Calculate pixel dimensions for to-scale rendering
     * @param {Object} screen - Screen configuration
     * @param {number} pixelsPerInch - Scale factor (pixels per inch on screen)
     * @returns {Object} Pixel dimensions for rendering
     */
    toScaleDimensions(screen, pixelsPerInch) {
        const physical = this.physicalDimensions(screen.width, screen.height, screen.size);
        return {
            width: Math.round(physical.width * pixelsPerInch),
            height: Math.round(physical.height * pixelsPerInch),
            physicalWidth: physical.width,
            physicalHeight: physical.height
        };
    },

    /**
     * Generate distinct colors for screen visualization
     * @param {number} index - Screen index
     * @param {number} total - Total number of screens
     * @returns {Object} Color values
     */
    screenColor(index, total) {
        const hues = [210, 150, 340, 45, 280, 180, 15, 240];
        const hue = hues[index % hues.length];
        const saturation = 65;
        const lightness = 50;

        return {
            main: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            dark: `hsl(${hue}, ${saturation}%, ${lightness - 15}%)`,
            border: `hsl(${hue}, ${saturation}%, ${lightness - 25}%)`
        };
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Calculations = Calculations;
}
