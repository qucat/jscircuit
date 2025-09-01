import assert from 'assert';
import { getImagePath } from '../src/utils/getImagePath.js';

describe("getImagePath (Node version)", () => {
  it("returns a mock path for resistor hover", async () => {
    const result = await getImagePath("resistor", "hover");
    assert.strictEqual(result, "/assets/R_hover.png");
  });
});

describe("getImagePath", () => {
  it("resolves default image path for resistor", async () => {
    const path = await getImagePath("resistor");
    assert.ok(typeof path === "string");
    assert.ok(path.includes("R.png"));
  });

  it("resolves hover_selected image path for resistor", async () => {
    const path = await getImagePath("resistor", "hover_selected");
    assert.ok(path.includes("R_hover_selected.png"));
  });

  it("resolves hover image path for capacitor", async () => {
    const path = await getImagePath("capacitor", "hover");
    assert.ok(path.includes("C_hover.png"));
  });

  it("resolves selected image path for junction", async () => {
    const path = await getImagePath("junction", "selected");
    assert.ok(path.includes("J_selected.png"));
  });

  it("throws an error for empty type", async () => {
    await assert.rejects(() => getImagePath(""), /Invalid or unknown type/);
  });

  it("throws an error for non-string type", async () => {
    await assert.rejects(() => getImagePath(null), /Invalid or unknown type/);
    await assert.rejects(() => getImagePath({}), /Invalid or unknown type/);
  });

  it("defaults to default variant if none is given", async () => {
    const path = await getImagePath("ground");
    assert.ok(path.includes("G.png"));
  });

  it("resolves all image variants for a given type", async () => {
    const type = "junction";
    const variants = ["default", "hover", "selected", "hover_selected"];
    const expectedSuffixes = [
      "J.png",
      "J_hover.png",
      "J_selected.png",
      "J_hover_selected.png",
    ];

    const paths = await Promise.all(variants.map(v => getImagePath(type, v)));

    paths.forEach((path, idx) => {
      assert.ok(path.includes(expectedSuffixes[idx]));
    });
  });
});
