import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

/**
 * Base class for element renderers that use images with hover/selected states
 * Handles generic image loading, state management, and rendering logic
 */
export class ImageElementRenderer extends ElementRenderer {
    constructor(context, elementType, scaledWidth, scaledHeight) {
        super(context);
        this.elementType = elementType;
        this.SCALED_WIDTH = scaledWidth;
        this.SCALED_HEIGHT = scaledHeight;
        
        // Image state management
        this.images = {
            default: { image: null, loaded: false, loading: false },
            hover: { image: null, loaded: false, loading: false },
            selected: { image: null, loaded: false, loading: false }
        };
        
        this.isHovered = false;
        this.isSelected = false;
    }

    /**
     * Get the appropriate image based on current state
     */
    getCurrentImage() {
        if (this.isSelected && this.images.selected.loaded) {
            return this.images.selected.image;
        }
        if (this.isHovered && this.images.hover.loaded) {
            return this.images.hover.image;
        }
        if (this.images.default.loaded) {
            return this.images.default.image;
        }
        return null;
    }

    /**
     * Check if the current image is ready to be rendered
     */
    isCurrentImageReady() {
        if (this.isSelected && this.images.selected.loaded) {
            return true;
        }
        if (this.isHovered && this.images.hover.loaded) {
            return true;
        }
        return this.images.default.loaded;
    }

    /**
     * Load an image variant (default, hover, selected)
     */
    async loadImageVariant(variant = "default") {
        const imageState = this.images[variant];
        if (imageState.image || imageState.loading) return;

        imageState.loading = true;
        try {
            if (typeof Image !== 'undefined') {
                imageState.image = new Image();
                imageState.image.onload = () => {
                    imageState.loaded = true;
                    // Trigger a re-render when the image loads
                    if (this.context && this.context.canvas) {
                        const event = new CustomEvent('renderer:imageLoaded', { 
                            detail: { type: this.elementType, variant } 
                        });
                        document.dispatchEvent(event);
                    }
                };

                const imagePath = await getImagePath(this.elementType, variant);
                imageState.image.src = imagePath;
            }
        } catch (error) {
            console.warn(`Error loading ${this.elementType} ${variant} image:`, error);
        } finally {
            imageState.loading = false;
        }
    }

    /**
     * Initialize default image if needed
     */
    async initImageIfNeeded() {
        if (!this.images.default.image && !this.images.default.loading) {
            await this.loadImageVariant("default");
        }
    }

    /**
     * Render element with image, handling aspect ratio and positioning
     */
    renderElementImage(element, midX, midY) {
        const currentImage = this.getCurrentImage();
        
        if (this.isCurrentImageReady() && currentImage) {
            // Maintain aspect ratio and center the image
            const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
            let drawWidth, drawHeight;
            
            if (aspectRatio > 1) {
                // Image is wider than tall
                drawWidth = this.SCALED_WIDTH;
                drawHeight = this.SCALED_WIDTH / aspectRatio;
            } else {
                // Image is taller than wide or square
                drawHeight = this.SCALED_HEIGHT;
                drawWidth = this.SCALED_HEIGHT * aspectRatio;
            }
            
            this.context.drawImage(
                currentImage,
                midX - drawWidth / 2,
                midY - drawHeight / 2,
                drawWidth,
                drawHeight,
            );
            return true; // Image was rendered
        }
        return false; // Image not ready, should render fallback
    }

    /**
     * Render element with hover state
     */
    renderElementWithHover(element, isHovered) {
        // Set hover state and ensure hover image is loaded if needed
        this.isHovered = isHovered;
        if (isHovered && !this.images.hover.image && !this.images.hover.loading) {
            this.loadImageVariant("hover"); // Load hover image asynchronously
        }
        this.renderElement(element);
    }

    /**
     * Render element with selected state
     */
    renderElementWithSelected(element, isSelected) {
        // Set selected state and ensure selected image is loaded if needed
        this.isSelected = isSelected;
        if (isSelected && !this.images.selected.image && !this.images.selected.loading) {
            this.loadImageVariant("selected"); // Load selected image asynchronously
        }
        this.renderElement(element);
    }

    /**
     * Render element with both hover and selected states
     */
    renderElementWithState(element, isHovered, isSelected) {
        this.isHovered = isHovered;
        this.isSelected = isSelected;
        
        // Load images as needed
        if (isHovered && !this.images.hover.image && !this.images.hover.loading) {
            this.loadImageVariant("hover");
        }
        if (isSelected && !this.images.selected.image && !this.images.selected.loading) {
            this.loadImageVariant("selected");
        }
        
        this.renderElement(element);
    }

    /**
     * Check if a point is within the element bounds
     */
    isPointInBounds(mouseX, mouseY, elementMidX, elementMidY) {
        const halfWidth = this.SCALED_WIDTH / 2;
        const halfHeight = this.SCALED_HEIGHT / 2;
        
        return (
            mouseX >= elementMidX - halfWidth &&
            mouseX <= elementMidX + halfWidth &&
            mouseY >= elementMidY - halfHeight &&
            mouseY <= elementMidY + halfHeight
        );
    }
}
