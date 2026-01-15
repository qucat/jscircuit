import { GUICommand } from "./GUICommand.js";
import { Logger } from "../../utils/Logger.js";

export class ZoomCommand extends GUICommand {
    constructor(renderer, zoomFactor) {
        super();
        this.renderer = renderer;
        this.zoomFactor = zoomFactor;
    }

    execute() {
        this.renderer.scale *= this.zoomFactor;
        this.renderer.render();
    }
}
