import { ElementRenderer } from "./ElementRenderer.js";
import { getImagePath } from '../../utils/getImagePath.js';

/**
 * Base class for renderers that use images with hover states
 */
export class ImageRenderer extends ElementRenderer {
    constructor(context, elementType, scaledWidth = 50, scaledHeight = 20) {
        super(context);
        this.elementType = elementType;
        this.image = null;
        this.imageLoaded = false;
        this.imageLoading = false;
        this.hoverImage = null;
        this.hoverImageLoaded = false;
        this.hoverImageLoading = false;
        this.isHovered = false;

        // Define proper dimensions for the element image
        this.SCALED_WIDTH = scaledWidth;
        this.SCALED_HEIGHT = scaledHeight;
    }

    async initImageIfNeeded(loadHover = false) {
        // Load normal image
        if (!this.image && !this.imageLoading) {
            this.imageLoading = true;
            try {
                if (typeof Image !== 'undefined') {
                    this.image = new Image();
                    this.image.onload = () => {
                        this.imageLoaded = true;
                        // Trigger a re-render when the image loads
                        if (this.context && this.context.canvas) {
                            const event = new CustomEvent('renderer:imageLoaded', { 
                                detail: { type: this.elementType } 
                            });
                            document.dispatchEvent(event);
                        }
                    };

                    const imagePath = await getImagePath(this.elementType);
                    this.image.src = imagePath;
                }
            } catch (error) {
                console.warn(`Error loading ${this.elementType} image:`, error);
            } finally {
                this.imageLoading = false;
            }
        }

        // Load hover image if requested
        if (loadHover && !this.hoverImage && !this.hoverImageLoading) {
            this.hoverImageLoading = true;
            try {
                if (typeof Image !== 'undefined') {
                    this.hoverImage = new Image();
                    this.hoverImage.onload = () => {
                        this.hoverImageLoaded = true;
                        // Trigger a re-render when the hover image loads
                        if (this.context && this.context.canvas) {
                            const event = new CustomEvent('renderer:imageLoaded', { 
                                detail: { type: `${this.elementType}_hover` } 
                            });
                            document.dispatchEvent(event);
                        }
                    };

                    const hoverImagePath = await getImagePath(this.elementType, "hover");
                    this.hoverImage.src = hoverImagePath;
                }
            } catch (error) {
                console.warn(`Error loading ${this.elementType} hover image:`, error);
            } finally {
                this.hoverImageLoading = false;
            }
        }
    }

    async init() {
        await this.initImageIfNeeded();
    }

    /**
     * Get the appropriate image based on hover state
     */
    getCurrentImage() {
        return this.isHovered && this.hoverImageLoaded ? this.hoverImage : this.image;
    }

    /**
     * Check if the current image is ready to render
     */
    isImageReady() {
        return this.isHovered && this.hoverImageLoaded ? this.hoverImageLoaded : this.imageLoaded;
    }

    /**
     * Draw the image with proper aspect ratio
     */
    drawImage(x, y, rotation = 0) {
        const currentImage = this.getCurrentImage();
        if (!this.isImageReady() || !currentImage) return false;

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

        this.context.save();
        this.context.translate(x, y);
        if (rotation !== 0) {
            this.context.rotate(rotation);
        }
        this.context.drawImage(
            currentImage,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        this.context.restore();
        
        return true;
    }

    /**
     * Render element with hover state
     * @param {Object} element - The element to render
     * @param {boolean} isHovered - Whether the element is being hovered
     */
    renderElementWithHover(element, isHovered) {
        // Set hover state and ensure hover image is loaded if needed
        this.isHovered = isHovered;
        if (isHovered && !this.hoverImage && !this.hoverImageLoading) {
            this.initImageIfNeeded(true); // Load hover image
        }
        this.renderElement(element);
    }

    // Check if a point is within the element bounds
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
