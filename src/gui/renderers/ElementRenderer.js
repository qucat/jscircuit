// gui/renderers/ElementRenderer.js

import { getImagePath } from '../../utils/getImagePath.js';

/**
 * Base class for all element renderers
 * Provides dynamic image loading capabilities based on component type
 */
export class ElementRenderer {
    constructor(context) {
        if (new.target === ElementRenderer) {
            throw new Error("Cannot instantiate abstract class ElementRenderer directly.");
        }
        this.context = context;
        this.images = {};
        this.imageLoaded = false;
        this.loadingPromise = null;
    }

    /**
     * Initialize all image assets for a component type
     * @param {string} type - The component type (e.g., 'resistor', 'capacitor')
     * @returns {Promise} Promise that resolves when all images are loaded
     */
    initializeImageAssets(type) {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        const variants = ["default", "hover", "selected", "hover_selected"];
        
        // Check if we're in a browser environment
        if (typeof window !== 'undefined' && window.Image) {
            const loadPromises = [];

            variants.forEach(variant => {
                const imagePath = getImagePath(type, variant);
                const img = new Image();
                
                const loadPromise = new Promise((resolve, reject) => {
                    img.onload = () => {
                        this.images[variant] = img;
                        if (variant === "default") {
                            this.imageLoaded = true;
                        }
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        reject(new Error(`Failed to load image: ${imagePath}`));
                    };
                });

                img.src = imagePath;
                loadPromises.push(loadPromise);
            });

            this.loadingPromise = Promise.all(loadPromises);
        } else {
            // Node.js environment - create mock images for testing
            variants.forEach(variant => {
                const imagePath = getImagePath(type, variant);
                this.images[variant] = {
                    src: imagePath,
                    width: 50,
                    height: 50,
                    complete: true
                };
            });
            this.imageLoaded = true;
            this.loadingPromise = Promise.resolve(this.images);
        }

        return this.loadingPromise;
    }

    /**
     * Get the image for a specific variant
     * @param {string} variant - The variant name ('default', 'hover', 'selected', 'hover_selected')
     * @returns {Image|null} The loaded image or null if not loaded
     */
    getImage(variant = "default") {
        return this.images[variant] || null;
    }

    /**
     * Check if all images are loaded
     * @returns {boolean} True if all images are loaded
     */
    isImageLoaded() {
        return this.imageLoaded;
    }

    /**
     * Get the current image based on element state
     * @param {Object} state - Element state object with hover, selected properties
     * @returns {Image|null} The appropriate image for the current state
     */
    getCurrentImage(state = {}) {
        let variant = "default";
        
        if (state.hover && state.selected) {
            variant = "hover_selected";
        } else if (state.hover) {
            variant = "hover";
        } else if (state.selected) {
            variant = "selected";
        }
        
        return this.getImage(variant);
    }

    /**
     * Render the element (to be implemented by subclasses)
     * @param {Object} element - The element to render
     * @param {Object} state - Current element state
     */
    render(element, state = {}) {
        throw new Error("render method must be implemented by subclass");
    }
}