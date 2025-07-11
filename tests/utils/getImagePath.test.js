import { expect } from 'chai';
import { getImagePath, getAllImageVariants } from '../../src/utils/getImagePath.js';

describe("getImagePath", () => {
    it("resolves default image path from type name", () => {
        const path = getImagePath("resistor");
        expect(path).to.contain("R.png");
        expect(path).to.contain("../assets/");
    });

    it("resolves hover image path correctly", () => {
        const path = getImagePath("resistor", "hover");
        expect(path).to.contain("R_hover.png");
        expect(path).to.contain("../assets/");
    });

    it("resolves selected image path correctly", () => {
        const path = getImagePath("capacitor", "selected");
        expect(path).to.contain("C_selected.png");
        expect(path).to.contain("../assets/");
    });

    it("resolves hover_selected image path correctly", () => {
        const path = getImagePath("junction", "hover_selected");
        expect(path).to.contain("J_hover_selected.png");
        expect(path).to.contain("../assets/");
    });

    it("throws if type is empty or unknown", () => {
        expect(() => getImagePath("")).to.throw("Invalid or unknown type");
        expect(() => getImagePath("unknown")).to.throw("Invalid or unknown type");
        expect(() => getImagePath(null)).to.throw("Invalid or unknown type");
        expect(() => getImagePath(undefined)).to.throw("Invalid or unknown type");
    });

    it("resolves all image variants for a valid type", () => {
        const variants = ["default", "hover", "selected", "hover_selected"];
        const paths = variants.map(v => getImagePath("junction", v));
        
        expect(paths).to.deep.equal([
            "../assets/J.png",
            "../assets/J_hover.png",
            "../assets/J_selected.png",
            "../assets/J_hover_selected.png"
        ]);
    });

    it("is case insensitive for type names", () => {
        const lowerPath = getImagePath("resistor");
        const upperPath = getImagePath("RESISTOR");
        const mixedPath = getImagePath("Resistor");
        
        expect(lowerPath).to.equal(upperPath);
        expect(lowerPath).to.equal(mixedPath);
    });
});

describe("getAllImageVariants", () => {
    it("returns all variants for a valid type", () => {
        const variants = getAllImageVariants("resistor");
        
        expect(variants).to.have.property("default");
        expect(variants).to.have.property("hover");
        expect(variants).to.have.property("selected");
        expect(variants).to.have.property("hover_selected");
        
        expect(variants.default).to.contain("R.png");
        expect(variants.hover).to.contain("R_hover.png");
        expect(variants.selected).to.contain("R_selected.png");
        expect(variants.hover_selected).to.contain("R_hover_selected.png");
    });

    it("works for all supported component types", () => {
        const resistorVariants = getAllImageVariants("resistor");
        const capacitorVariants = getAllImageVariants("capacitor");
        const junctionVariants = getAllImageVariants("junction");
        
        expect(resistorVariants.default).to.contain("R.png");
        expect(capacitorVariants.default).to.contain("C.png");
        expect(junctionVariants.default).to.contain("J.png");
    });
});