/**
 * @file EventEmitter.js
 * @description 
 * A lightweight event system for managing and broadcasting events within the application.
 * This class serves as a simplified alternative to Node.js' `EventEmitter`, designed
 * to work seamlessly in both **browser** and **Node.js** environments.
 * 
 *  **Role in the JSCircuit Editor:**
 * - Used by `CircuitService` to emit events when elements are added, deleted, or modified.
 * - Enables **event-driven UI updates** in `GUIAdapter`, allowing the frontend to react to changes.
 * - Provides a **decoupled** way to manage event-driven communication across modules.
 * 
 *  **Example Usage:**
 * ```js
 * const emitter = new EventEmitter();
 * emitter.on("elementAdded", (element) => console.log("New element:", element));
 * emitter.emit("elementAdded", { id: "R1", type: "resistor" });
 * ```
 */

export class EventEmitter {
    /**
     * Constructs a new EventEmitter instance.
     * Manages a collection of event listeners.
     */
    constructor() {
        /** 
         * Stores registered event callbacks.
         * @type {Object.<string, Function[]>}
         */
        this.events = {};
    }

    /**
     * Registers a new listener for the given event.
     * 
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to execute when the event is emitted.
     * 
     * @example
     * ```js
     * emitter.on("update", () => console.log("Circuit updated"));
     * ```
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Removes a specific listener from an event.
     * 
     * @param {string} event - The event name.
     * @param {Function} callback - The function to remove from the listener list.
     * 
     * @example
     * ```js
     * const handler = () => console.log("Circuit updated");
     * emitter.on("update", handler);
     * emitter.off("update", handler); // Removes the listener
     * ```
     */
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Emits an event, triggering all registered callbacks for that event.
     * 
     * @param {string} event - The event name.
     * @param {*} [data] - Optional data to pass to the event listeners.
     * 
     * @example
     * ```js
     * emitter.emit("elementAdded", { id: "R1", type: "resistor" });
     * ```
     */
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}
