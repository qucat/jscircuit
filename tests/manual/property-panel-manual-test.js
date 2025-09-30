/**
 * Manual testing script for PropertyPanel functionality
 * This script provides functions to test PropertyPanel features programmatically
 */

// Test functions for PropertyPanel functionality
window.PropertyPanelTests = {
    
    /**
     * Test element placement and auto-open property panel
     */
    testAutoOpenOnPlacement() {
        console.log("=== Testing Auto-Open Property Panel on Placement ===");
        
        // Get the GUI adapter instance
        const guiAdapter = window.guiAdapter || window.app?.guiAdapter;
        if (!guiAdapter) {
            console.error("GUIAdapter not found!");
            return false;
        }
        
        // Check if property panel class exists
        if (typeof PropertyPanel === 'undefined') {
            console.error("PropertyPanel class not found!");
            return false;
        }
        
        console.log("✓ GUIAdapter and PropertyPanel found");
        
        // Check if handleElementDoubleClick method exists
        if (typeof guiAdapter.handleElementDoubleClick !== 'function') {
            console.error("handleElementDoubleClick method not found!");
            return false;
        }
        
        console.log("✓ handleElementDoubleClick method exists");
        return true;
    },
    
    /**
     * Test keyboard blocking functionality
     */
    testKeyboardBlocking() {
        console.log("=== Testing Keyboard Blocking ===");
        
        // Create a mock property panel instance
        const propertyPanel = new PropertyPanel();
        
        // Test keyboard handler exists
        if (typeof propertyPanel.handleKeyDown !== 'function') {
            console.error("handleKeyDown method not found!");
            return false;
        }
        
        console.log("✓ handleKeyDown method exists");
        
        // Test event blocking
        const mockEvent = {
            key: 'r',
            stopPropagation: function() { this._propagationStopped = true; },
            preventDefault: function() { this._defaultPrevented = true; },
            _propagationStopped: false,
            _defaultPrevented: false
        };
        
        // Set panel as visible for testing
        propertyPanel.isVisible = true;
        
        // Handle the key event
        propertyPanel.handleKeyDown(mockEvent);
        
        if (!mockEvent._propagationStopped) {
            console.error("Event propagation not stopped!");
            return false;
        }
        
        console.log("✓ Keyboard events properly blocked");
        return true;
    },
    
    /**
     * Test CircuitService integration
     */
    testCircuitServiceIntegration() {
        console.log("=== Testing CircuitService Integration ===");
        
        // Get the circuit service instance
        const circuitService = window.circuitService || window.app?.circuitService;
        if (!circuitService) {
            console.error("CircuitService not found!");
            return false;
        }
        
        console.log("✓ CircuitService found");
        
        // Check if updateElementProperties method exists
        if (typeof circuitService.updateElementProperties !== 'function') {
            console.error("updateElementProperties method not found!");
            return false;
        }
        
        console.log("✓ updateElementProperties method exists");
        
        // Check if getElementByID method exists
        if (typeof circuitService.getElementByID !== 'function') {
            console.error("getElementByID method not found!");
            return false;
        }
        
        console.log("✓ getElementByID method exists");
        return true;
    },
    
    /**
     * Test UpdateElementPropertiesCommand
     */
    testUpdateCommand() {
        console.log("=== Testing UpdateElementPropertiesCommand ===");
        
        // Get the GUI adapter instance
        const guiAdapter = window.guiAdapter || window.app?.guiAdapter;
        if (!guiAdapter || !guiAdapter.guiCommandRegistry) {
            console.error("GUIAdapter or command registry not found!");
            return false;
        }
        
        // Check if updateElementProperties command exists
        const command = guiAdapter.guiCommandRegistry.get('updateElementProperties');
        if (!command) {
            console.error("updateElementProperties command not found!");
            return false;
        }
        
        console.log("✓ UpdateElementPropertiesCommand found");
        
        // Check if command has required methods
        if (typeof command.setData !== 'function') {
            console.error("Command setData method not found!");
            return false;
        }
        
        if (typeof command.execute !== 'function') {
            console.error("Command execute method not found!");
            return false;
        }
        
        if (typeof command.undo !== 'function') {
            console.error("Command undo method not found!");
            return false;
        }
        
        console.log("✓ Command has all required methods");
        return true;
    },
    
    /**
     * Run all tests
     */
    runAllTests() {
        console.log("Starting PropertyPanel Manual Tests...\n");
        
        const tests = [
            this.testAutoOpenOnPlacement,
            this.testKeyboardBlocking,
            this.testCircuitServiceIntegration,
            this.testUpdateCommand
        ];
        
        let passed = 0;
        let failed = 0;
        
        tests.forEach((test, index) => {
            try {
                const result = test.call(this);
                if (result) {
                    passed++;
                    console.log(`✅ Test ${index + 1} PASSED\n`);
                } else {
                    failed++;
                    console.log(`❌ Test ${index + 1} FAILED\n`);
                }
            } catch (error) {
                failed++;
                console.error(`❌ Test ${index + 1} ERROR:`, error.message);
                console.log("");
            }
        });
        
        console.log(`=== Test Results ===`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${tests.length}`);
        
        return { passed, failed, total: tests.length };
    }
};

console.log("PropertyPanel Manual Tests loaded. Run PropertyPanelTests.runAllTests() to execute.");