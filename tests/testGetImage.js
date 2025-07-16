export function GetImage(type) {
    // Concatenate '../../../assets/' and type
    const imagePath = `../../../assets/${type}`;

    // Return the full URL to the image
    return new URL(imagePath, import.meta.url).href;
}
