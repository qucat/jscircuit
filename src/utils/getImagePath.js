// utils/getImagePath.js

/**
 * Maps component type names to their corresponding image file base names
 */
const TYPE_TO_IMAGE_MAP = {
    'resistor': 'R',
    'capacitor': 'C',
    'junction': 'J'
};

/**
 * Gets the base image name from a component type
 * @param {string} type - The component type (e.g., 'resistor', 'capacitor')
 * @returns {string} The base image name (e.g., 'R', 'C')
 */
function getBaseImageNameFromType(type) {
    if (!type || typeof type !== 'string') {
        throw new Error('Invalid or unknown type');
    }
    
    const normalizedType = type.toLowerCase();
    const baseName = TYPE_TO_IMAGE_MAP[normalizedType];
    
    if (!baseName) {
        throw new Error(`Invalid or unknown type: ${type}`);
    }
    
    return baseName;
}

/**
 * Generates an image path for a given component type and variant
 * @param {string} type - The component type (e.g., 'resistor', 'capacitor')
 * @param {string} variant - The image variant ('default', 'hover', 'selected', 'hover_selected')
 * @returns {string} The complete image path
 */
export function getImagePath(type, variant = 'default') {
    if (!type || typeof type !== 'string') {
        throw new Error('Invalid or unknown type');
    }
    
    const base = getBaseImageNameFromType(type);
    const suffix = variant === 'default' ? '' : `_${variant}`;
    
    // Using a relative path that works in both browser and Node.js environments
    const imagePath = `../assets/${base}${suffix}.png`;
    
    return imagePath;
}

/**
 * Gets all available image variants for a component type
 * @param {string} type - The component type
 * @returns {Object} Object containing all variant paths
 */
export function getAllImageVariants(type) {
    const variants = ['default', 'hover', 'selected', 'hover_selected'];
    const images = {};
    
    variants.forEach(variant => {
        images[variant] = getImagePath(type, variant);
    });
    
    return images;
}