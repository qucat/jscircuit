/**
 * Tests for QuCat format detection based on component spans
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { QucatNetlistAdapter } from '../../src/infrastructure/adapters/QucatNetlistAdapter.js';

describe('QuCat Format Detection', () => {
    describe('Real-world Example Tests', () => {
        it('should detect v1.0 format from the provided example netlist', () => {
            const exampleNetlist = `C;-3,0;-2,0;1.0e+00;
L;-3,1;-2,1;1.0e+00;
W;-3,0;-3,1;;
W;-2,0;-2,1;;
W;-3,1;-3,2;;
W;-3,2;-2,2;;
W;-2,1;-2,2;;`;

            const lines = exampleNetlist.trim().split('\n').filter(line => line.trim());
            const result = QucatNetlistAdapter._detectFormatByComponentSpans(lines);
            
            expect(result.version).to.equal('v1.0');
            expect(result.componentCount).to.equal(2); // C and L
            expect(result.dominantSpan).to.equal(1);
            expect(result.confidence).to.equal(100);
            expect(result.spans).to.deep.equal([1]); // Only 1-unit spans
        });

        it('should import the example netlist correctly as v1.0', () => {
            const exampleNetlist = `C;-3,0;-2,0;1.0e+00;
L;-3,1;-2,1;1.0e+00;
W;-3,0;-3,1;;
W;-2,0;-2,1;;
W;-3,1;-3,2;;
W;-3,2;-2,2;;
W;-2,1;-2,2;;`;

            const elements = QucatNetlistAdapter.importFromString(exampleNetlist);
            
            expect(elements).to.have.length(7);
            
            // Check capacitor conversion: v1.0 (-3,0)-(-2,0) should become pixel coordinates  
            const capacitor = elements.find(el => el.type === 'capacitor');
            expect(capacitor).to.exist;
            
            // v1.0 coordinates (-3,0)-(-2,0) should be:
            // (-3,0) -> (-15,0) v2.0 -> (-150,0) pixels  
            // (-2,0) -> (-10,0) v2.0 -> (-100,0) pixels
            expect(capacitor.nodes[0].x).to.equal(-150);
            expect(capacitor.nodes[0].y).to.equal(0);
            expect(capacitor.nodes[1].x).to.equal(-100);
            expect(capacitor.nodes[1].y).to.equal(0);
            
            // Check inductor conversion
            const inductor = elements.find(el => el.type === 'inductor');
            expect(inductor).to.exist;
            
            // v1.0 coordinates (-3,1)-(-2,1) should be:
            // (-3,1) -> (-15,5) v2.0 -> (-150,50) pixels
            // (-2,1) -> (-10,5) v2.0 -> (-100,50) pixels  
            expect(inductor.nodes[0].x).to.equal(-150);
            expect(inductor.nodes[0].y).to.equal(50);
            expect(inductor.nodes[1].x).to.equal(-100);
            expect(inductor.nodes[1].y).to.equal(50);
        });
    });

    describe('Component-based Format Detection', () => {
        it('should detect v1.0 format from 1-interval components', () => {
            const v1NetlistLines = [
                'R;0,0;1,0;1000;R1',      // Horizontal resistor, 1 unit span
                'C;2,1;2,2;1e-6;C1',     // Vertical capacitor, 1 unit span  
                'L;-1,-1;0,-1;1e-3;L1',  // Horizontal inductor, 1 unit span
                'W;1,0;2,1;;',           // Wire (ignored in detection)
                'G;-2,0;-2,0;;'          // Ground (ignored in detection)
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(v1NetlistLines);
            
            expect(result.version).to.equal('v1.0');
            expect(result.componentCount).to.equal(3);
            expect(result.dominantSpan).to.equal(1);
            expect(result.confidence).to.equal(100);
            expect(result.reasoning).to.contain('3/3 components span 1 interval');
        });

        it('should detect v2.0 format from 5-interval components', () => {
            const v2NetlistLines = [
                'R;0,0;5,0;1000;R1',      // Horizontal resistor, 5 unit span
                'C;10,5;10,10;1e-6;C1',  // Vertical capacitor, 5 unit span
                'L;-5,-5;0,-5;1e-3;L1',  // Horizontal inductor, 5 unit span
                'W;5,0;10,5;;',          // Wire (ignored)
                'J;15,0;15,0;;'          // Junction (ignored)
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(v2NetlistLines);
            
            expect(result.version).to.equal('v2.0');
            expect(result.componentCount).to.equal(3);
            expect(result.dominantSpan).to.equal(5);
            expect(result.confidence).to.equal(100);
            expect(result.reasoning).to.contain('3/3 components span 5 intervals');
        });

        it('should handle mixed spans and prefer v2.0 when 5-interval components present', () => {
            const mixedNetlistLines = [
                'R;0,0;5,0;1000;R1',      // v2.0 style (5 units)
                'C;10,0;11,0;1e-6;C1',   // v1.0 style (1 unit)  
                'L;20,0;25,0;1e-3;L1',   // v2.0 style (5 units)
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(mixedNetlistLines);
            
            expect(result.version).to.equal('v2.0');
            expect(result.componentCount).to.equal(3);
            expect(result.confidence).to.be.greaterThan(50);
            expect(result.reasoning).to.contain('v2.0-style 5-interval components');
        });

        it('should handle mixed spans and prefer v1.0 when only 1-interval components present', () => {
            const mixedNetlistLines = [
                'R;0,0;1,0;1000;R1',      // v1.0 style (1 unit)
                'C;10,0;11,0;1e-6;C1',   // v1.0 style (1 unit)
                'L;20,0;22,0;1e-3;L1',   // Non-standard (2 units)
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(mixedNetlistLines);
            
            expect(result.version).to.equal('v1.0');
            expect(result.componentCount).to.equal(3);
            expect(result.reasoning).to.contain('v1.0-style 1-interval components');
        });

        it('should fallback to v2.0 when no components found', () => {
            const noComponentsLines = [
                'W;0,0;5,5;;',    // Wire only
                'G;10,10;10,10;;', // Ground only
                'J;15,15;15,15;;'  // Junction only
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(noComponentsLines);
            
            expect(result.version).to.equal('v2.0');
            expect(result.componentCount).to.equal(0);
            expect(result.confidence).to.equal(50);
            expect(result.reasoning).to.contain('No components found - fallback to latest version');
        });

        it('should fallback to v2.0 for ambiguous spans', () => {
            const ambiguousLines = [
                'R;0,0;3,0;1000;R1',      // 3 unit span
                'C;10,0;14,0;1e-6;C1',   // 4 unit span
                'L;20,0;22,0;1e-3;L1',   // 2 unit span
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(ambiguousLines);
            
            expect(result.version).to.equal('v2.0');
            expect(result.componentCount).to.equal(3);
            expect(result.reasoning).to.contain('fallback to latest');
        });

        it('should handle vertical components correctly', () => {
            const verticalComponents = [
                'R;0,0;0,1;1000;R1',      // Vertical resistor, 1 unit span
                'C;5,10;5,15;1e-6;C1',   // Vertical capacitor, 5 unit span
                'L;10,0;10,1;1e-3;L1',   // Vertical inductor, 1 unit span
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(verticalComponents);
            
            expect(result.componentCount).to.equal(3);
            expect(result.spans).to.include(1);
            expect(result.spans).to.include(5);
        });

        it('should calculate Manhattan distance for diagonal components', () => {
            const diagonalComponents = [
                'R;0,0;1,1;1000;R1',      // Diagonal: |1-0| + |1-0| = 2
                'C;5,5;7,8;1e-6;C1',     // Diagonal: |7-5| + |8-5| = 5  
            ];

            const result = QucatNetlistAdapter._detectFormatByComponentSpans(diagonalComponents);
            
            expect(result.componentCount).to.equal(2);
            expect(result.spans).to.include(2);
            expect(result.spans).to.include(5);
        });
    });

    describe('Integration with importFromString', () => {
        let consoleLogSpy, consoleWarnSpy;

        beforeEach(() => {
            // Capture console output for testing
            consoleLogSpy = [];
            consoleWarnSpy = [];
            
            const originalLog = console.log;
            const originalWarn = console.warn;
            
            console.log = (...args) => {
                consoleLogSpy.push(args.join(' '));
                originalLog(...args);
            };
            
            console.warn = (...args) => {
                consoleWarnSpy.push(args.join(' '));
                originalWarn(...args);
            };
        });

        it('should log format detection results when importing v1.0 content', () => {
            const v1Content = `R;0,0;1,0;1000;R1
C;2,1;2,2;1e-6;C1
W;1,0;2,1;;`;

            const elements = QucatNetlistAdapter.importFromString(v1Content);
            
            expect(elements).to.have.length(3);
            expect(consoleLogSpy.some(log => log.includes('v1.0'))).to.be.true;
            expect(consoleLogSpy.some(log => log.includes('100% confidence'))).to.be.true;
        });

        it('should log format detection results when importing v2.0 content', () => {
            const v2Content = `R;0,0;5,0;1000;R1
C;10,5;10,10;1e-6;C1
W;5,0;10,5;;`;

            const elements = QucatNetlistAdapter.importFromString(v2Content);
            
            expect(elements).to.have.length(3);
            expect(consoleLogSpy.some(log => log.includes('v2.0'))).to.be.true;
            expect(consoleLogSpy.some(log => log.includes('100% confidence'))).to.be.true;
        });

        it('should warn when no components found', () => {
            const wireOnlyContent = `W;0,0;5,5;;
W;5,5;10,10;;`;

            const elements = QucatNetlistAdapter.importFromString(wireOnlyContent);
            
            expect(elements).to.have.length(2);
            expect(consoleWarnSpy.some(warn => warn.includes('No primitive components found'))).to.be.true;
        });
    });

    describe('Coordinate Conversion Based on Detected Format', () => {
        it('should convert v1.0 coordinates correctly', () => {
            const v1Content = `R;0,0;1,0;1000;R1`;

            const elements = QucatNetlistAdapter.importFromString(v1Content);
            const resistor = elements[0];

            // v1.0 coordinates (0,0)-(1,0) should be scaled 5x and converted to pixels
            // (0,0) -> (0,0) -> (0,0) pixels
            // (1,0) -> (5,0) -> (50,0) pixels
            expect(resistor.nodes[0].x).to.equal(0);
            expect(resistor.nodes[0].y).to.equal(0);
            expect(resistor.nodes[1].x).to.equal(50);
            expect(resistor.nodes[1].y).to.equal(0);
        });

        it('should convert v2.0 coordinates correctly', () => {
            const v2Content = `R;0,0;5,0;1000;R1`;

            const elements = QucatNetlistAdapter.importFromString(v2Content);
            const resistor = elements[0];

            // v2.0 coordinates (0,0)-(5,0) should be directly converted to pixels
            // (0,0) -> (0,0) pixels
            // (5,0) -> (50,0) pixels  
            expect(resistor.nodes[0].x).to.equal(0);
            expect(resistor.nodes[0].y).to.equal(0);
            expect(resistor.nodes[1].x).to.equal(50);
            expect(resistor.nodes[1].y).to.equal(0);
        });

        it('should handle mixed format detection correctly', () => {
            // This has mixed spans but v2.0 wins
            const mixedContent = `R;0,0;5,0;1000;R1
C;10,0;11,0;1e-6;C1`;

            const elements = QucatNetlistAdapter.importFromString(mixedContent);
            
            expect(elements).to.have.length(2);
            
            // Both should be treated as v2.0 coordinates
            const resistor = elements[0];
            const capacitor = elements[1];
            
            expect(resistor.nodes[1].x).to.equal(50);    // (5,0) -> 50 pixels
            expect(capacitor.nodes[1].x).to.equal(110);  // (11,0) -> 110 pixels
        });
    });
});