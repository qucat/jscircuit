import assert from "assert";
import { ResistorRenderer } from "../../src/gui/renderers/ResistorRenderer.js";

describe("ResistorRenderer", () => {
  it("initializes correctly and sets image properties", () => {
    const mockContext = {}; // Minimal mock, no need for full canvas context
    const renderer = new ResistorRenderer(mockContext);

    assert.strictEqual(typeof renderer.image, "object");
    assert.strictEqual(renderer.imageLoaded, false);
    assert.strictEqual(renderer.SCALED_WIDTH, 50);
    assert.strictEqual(renderer.SCALED_HEIGHT, 20);
  });

  it("calls image.onload and sets imageLoaded to true", async () => {
    const renderer = new ResistorRenderer({});
    await renderer.initImageIfNeeded(); // Initialize the image first
    renderer.image.onload(); // simulate image load
    assert.strictEqual(renderer.imageLoaded, true);
  });
});
