import { expect } from "chai";
import { ElementFactory } from "../../src/domain/factories/ElementFactory.js";
import { ElementRegistry } from "../../src/domain/factories/ElementRegistry.js";
import { MockElement } from "./MockElement.js";
import { Position } from "../../src/domain/valueObjects/Position.js";
import { Properties } from "../../src/domain/valueObjects/Properties.js";

describe("ElementFactory Tests", () => {
    ElementRegistry.register("MockElement", (id, nodes, label = null, properties = new Properties({})) =>
        new MockElement(id, nodes, label, properties)
    );

    beforeEach(() => {
        // Nothing to do before each test for now

    });

    afterEach(() => {
        // Reset registry after each test
        // ElementRegistry._registry = {};
    });

    it("should create an instance of a registered element", () => {
        const element = ElementFactory.create("MockElement", "E1", [
            new Position(10, 20),
            new Position(30, 40),
        ], new Properties({}), null);

        expect(element).to.be.an.instanceOf(MockElement);
        expect(element.id).to.equal("E1");
    });

    it("should throw an error when trying to create an unregistered element", () => {
        expect(() => ElementFactory.create("UnknownType", "E2", [], {}))
            .to.throw('Element type "UnknownType" is not registered.');
    });
});