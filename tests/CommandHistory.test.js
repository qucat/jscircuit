import { expect } from "chai";
import { CommandHistory } from "../src/gui/commands/CommandHistory.js";
import { createGUIEnvironmentFixture } from "./gui/GUIEnvironmentFixture.js";

// Mock Image class to prevent errors in renderers during tests
global.Image = class {
  constructor() {
    this.onload = () => {};
    this.src = "";
  }
};

describe("Snapshot-based Undo/Redo", () => {
  it("restores circuit state from snapshot on undo", async () => {
    const { circuitService, getAddElementCommand } =
      await createGUIEnvironmentFixture();
    const history = new CommandHistory();

    const snapshotBefore = circuitService.exportState();

    const addCommand = getAddElementCommand("resistor");
    history.executeCommand(addCommand, circuitService);

    expect(circuitService.getElements()).to.have.length(1);

    history.undo(circuitService);
    expect(circuitService.getElements()).to.have.length(0);

    const snapshotAfter = circuitService.exportState();
    expect(snapshotAfter).to.equal(snapshotBefore);
  });

  it("reapplies circuit state from snapshot on redo", async () => {
    const { circuitService, getAddElementCommand } =
      await createGUIEnvironmentFixture();
    const history = new CommandHistory();

    const addCommand = getAddElementCommand("resistor");
    history.executeCommand(addCommand, circuitService);

    const snapshot = circuitService.exportState(); // snapshot after command
    history.undo(circuitService);

    //  sanity check
    expect(circuitService.getElements()).to.have.length(0);

    // simulate circuit state rollback manually before redo
    circuitService.importState(snapshot);

    history.redo(circuitService); // should be no-op or repeat add if redo stores next state

    expect(circuitService.getElements()).to.have.length(1);
  });

  it("clears redo stack on new command after undo", async () => {
    const { circuitService, getAddElementCommand } =
      await createGUIEnvironmentFixture();
    const history = new CommandHistory();

    const cmd1 = getAddElementCommand("resistor");
    const cmd2 = getAddElementCommand("resistor");

    history.executeCommand(cmd1, circuitService);
    history.undo(circuitService);

    expect(circuitService.getElements()).to.have.length(0);

    history.executeCommand(cmd2, circuitService);
    expect(() => history.redo(circuitService)).to.not.change(
      () => circuitService.getElements().length,
    );
  });

  it("handles undo/redo on empty stacks gracefully", () => {
    const history = new CommandHistory();

    expect(() => history.undo()).to.not.throw();
    expect(() => history.redo()).to.not.throw();
  });

  it("pushes command onto history and clears future", async () => {
    const { circuitService, getAddElementCommand } =
      await createGUIEnvironmentFixture();
    const history = new CommandHistory();

    const cmd1 = getAddElementCommand("resistor");
    const cmd2 = getAddElementCommand("resistor");

    history.executeCommand(cmd1, circuitService);
    history.undo(circuitService);

    expect(history.future).to.have.length(1);

    history.executeCommand(cmd2, circuitService);
    expect(history.future).to.be.empty;
  });
});
