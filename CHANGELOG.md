# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-20

> Post-Alpha P1 milestone — all critical items from the Alpha review resolved.  
> Also includes P3-5 (arrow key element movement).

### Added

- **P1-3 — Import Netlist from Clipboard** (`0d8f064`)
  - New `PasteNetlistFromClipboardCommand` with modal dialog (textarea for pasting)
  - Keyboard shortcut: Ctrl+Shift+V
  - Parses via `QucatNetlistAdapter.importFromString()`, replaces current circuit
  - Full undo support — restores previous circuit state
  - Success/error notifications matching existing UX pattern
  - Added "Paste Netlist..." to File menu in `gui.config.yaml`
  - 6 new tests: parse, round-trip, undo, error, and non-browser fallback

- **P1-4 — Self-Contained Bundled HTML** (`b9e563f`)
  - New `scripts/bundle-html.mjs` produces `dist/jscircuit.html` (192 KB)
  - All JS and PNG assets inlined as Base64 data-URLs — zero external dependencies
  - Works via `file://`, `python -m http.server`, or inside a pip wheel
  - New `npm run build:standalone` script for distribution builds
  - New `src/utils/assetMap.js` — static import map resolved at build time by esbuild
  - Custom ESM test loader (`tests/png-loader.mjs`) to stub `.png` imports in Node

- **P3-5 — Arrow Keys Move Selected Elements**
  - Bare arrow keys nudge selected elements by one grid unit (10px)
  - Added `nudgeElements(ids, dx, dy)` to `CircuitService`
  - Registered `nudgeRight`, `nudgeLeft`, `nudgeUp`, `nudgeDown` commands
  - Ctrl+arrow keys still rotate (unchanged)
  - Full undo support via `exportState`/`importState`
  - 10 new tests covering all directions, multi-element, undo, edge cases

- **Notification component** (`src/gui/components/Notification.js`)
  - Reusable notification system extracted from clipboard command
  - Shared by both Copy and Paste netlist commands

- **Landing page** (`index.html`)
  - Simple entry point for the project root

### Changed

- **P1-1 — Rendering Speed & UI Sluggishness** (`6a4fd75`, `c4aec64`)
  - Grid rendering off by default; added `setShowGrid()` toggle
  - Fixed render deduplication — stable bound reference for `RenderScheduler` Set
  - Removed 4 redundant `render()` calls in GUIAdapter (event system already triggers them)
  - Consolidated all canvas event listeners in GUIAdapter (single owner)
  - Removed duplicate `initEventListeners()` from `CircuitRenderer`
  - Wired wheel→zoom, MMB pan, hover, dblclick, mouseleave through GUIAdapter
  - Cleaned up `dispose()` with stable `_boundPerformRender` reference
  - Removed dead `panStartX`/`panStartY` code

- **P1-2 — Rotation About Anchor Point** (`ab76f66`)
  - Single element: node[0] stays fixed, node[1] swings around it (QuCat convention)
  - Uses `Math.round` on trig for exact 90° increments
  - Multi-element: rotates around bounding-box centre
  - All positions snapped to `GRID_SPACING` after rotation
  - Orientation normalised to 0–359 via `((n%360)+360)%360`
  - `rotateElement()` now delegates to `rotateElements()`
  - Placement rotation (`rotatePlacingElement`) uses same node[0]-as-anchor convention
  - Fixed selection state sync in `CircuitRenderer` — `setSelectedElement()` clears Set,
    `setSelectedElements()` clears singular; prevents phantom entries causing silent no-ops

- **Refactored `getImagePath`**: Pure lookup from `ASSET_MAP` instead of runtime
  environment detection (`isNode()`, dynamic `import()`, `import.meta.url` fallbacks)

- **Refactored `CopyNetlistToClipboardCommand`**: Extracted notification logic into
  shared `Notification` component

- **Menu CSS polish**: Wider dropdown (min-width 280px), tighter padding and gap,
  single-line layout for all items including shortcuts

### Removed

- `CITATION.cff` — removed from repository
- Dead code: duplicate event listeners, unused pan variables

### Testing

- **Test Coverage**: 464 tests (all passing ✅), up from 448 in v1.1.0
- **New tests**: 6 for paste-netlist, 10 for nudge/arrow-key movement
- **Updated**: Rotation tests adjusted for anchor-point convention
- **New**: `tests/png-loader.mjs` — custom ESM loader for Node.js test environment

### Performance

- **Rendering**: Grid off by default eliminates ~30% of draw calls for empty canvases
- **Event loop**: 4 fewer redundant renders per interaction cycle
- **Render dedup**: `RenderScheduler` now correctly deduplicates with stable references
- **Single event owner**: No duplicate listeners firing on the same canvas events
- **Bundle Size**: 192 KB standalone HTML (down from 777 KB dev bundle + separate assets)
- **Interaction**: Consistent 60 fps on mid-range laptops with ≤ 50 elements
- **Load Time**: Near-instant in standalone mode (no external asset fetches)

---

## [1.1.0] - 2026-01-15

### Added

- **Clipboard Export for Netlist**: New "Copy Netlist" menu option (Ctrl+Shift+C)
  - Copy circuit netlist directly to system clipboard
  - Supports both modern Clipboard API and legacy browsers with fallback
  - Instant feedback with success/error notifications
  - Perfect for sharing circuits via messaging and collaboration tools

- **Shift Key Modifier Support**: Enhanced keyboard shortcut handling
  - Better modifier key combinations for advanced users
  - Foundation for more complex keyboard interactions

- **Improved Property Panel Architecture**:
  - Modularized configuration system
  - Single source of truth (gui.config.yaml)
  - Better maintainability and extensibility

### Changed

- **Zero External Dependencies**: Eliminated runtime fetch calls for configuration
  - Configuration now embedded in bundle
  - Faster startup (eliminates ~100-150ms network delay)
  - Works completely offline
  - Better widget deployment compatibility
  - Improved security posture

- **Standardized Element Type Naming**: All element types now consistently lowercase
  - Improved consistency across codebase
  - Better integration with custom extensions
  - More predictable API behavior

- **Reduced Component Label Font Size**: Improved visual clarity
  - Font size reduced from 12px to 9px
  - Reduced visual clutter in circuit drawings
  - Better readability with optimized positioning

### Improved

- **Documentation Enhancements**:
  - Complete "Getting Started" guide
  - Comprehensive extension tutorial with practical examples
  - Improved code examples throughout documentation
  - Better GitHub Pages integration

- **Performance Monitoring**:
  - Added comprehensive performance assessment documentation
  - Identified optimization opportunities for future releases
  - Baseline metrics established for 500+ element circuits

- **CI/CD Improvements**:
  - GitHub Actions automation for documentation deployment
  - Consistent build process across environments

### Fixed

- Fixed GitHub Pages asset paths for documentation links
- Improved DOM cleanup in notification system (prevents "node not child" errors)
- Better error handling in clipboard operations for unsupported environments
- Corrected image paths in Getting Started tutorial

### Security

- Removed external configuration file dependencies
- Reduced attack surface by embedding all configuration
- Better security for browser-based widget deployment

### Performance

- Bundle Size: 777 KB (minified)
- Load Time: < 1 second (previously ~100-150ms slower due to config fetch)
- Hover Detection: O(log n) with spatial indexing
- Tested with 500+ element circuits
- Memory usage stable across long sessions

### Testing

- **Test Coverage**: 448 tests (all passing ✅)
- **New Tests**: 6 dedicated tests for clipboard export feature
- **Performance Benchmarks**: All targets met
- **Browser Compatibility**: Modern browsers + IE11 fallback for clipboard

### Browser Support

- Chrome/Chromium: Full support (Clipboard API)
- Firefox: Full support (Clipboard API)
- Safari: Full support (Clipboard API)
- Edge: Full support (Clipboard API)
- Internet Explorer 11: Fallback support (execCommand)

---

## [1.0.0] - 2025-12-01

### Initial Release

- Full circuit editor with drag-and-drop support
- Support for resistors, capacitors, inductors, junctions, wires, and grounds
- Property panel for component configuration
- Keyboard shortcuts for common operations
- Netlist import/export (file-based)
- Responsive canvas with zoom and pan
- Undo/redo history
- Comprehensive test suite (448 tests)
- GitHub Pages documentation
- Jupyter notebook widget integration
- QuCat Python library integration

### Features

- Modular hexagonal architecture with DDD principles
- Advanced spatial indexing for efficient element detection
- Performance optimizations for large circuits (500+ elements)
- Extensible element registry system
- Customizable property panels
- Export-focused design for QuCat integration

---

## Version Legend

- **[1.2.0]** - Current version (Post-Alpha P1 milestone)
- **[1.1.0]** - Alpha review baseline
- **[1.0.0]** - Initial stable release

---

## Upgrade Path

### From 1.0.0 to 1.1.0

**No breaking changes!** Upgrade is safe and recommended.

```bash
npm install qucat-circuit-generator@latest
```

**New in 1.1.0**:
- Copy netlist to clipboard with Ctrl+Shift+C
- Faster startup (no external config files)
- Better offline support
- Improved documentation

**Migration Notes**:
- If you have custom configurations that rely on external files, they will need to be updated
- All menu configurations should now reference gui.config.yaml instead of menu.config.yaml
- No changes required to custom elements or extensions

---

## Future Roadmap (v1.3.0+)

### Next (P2 — Widget Integration)

- [ ] P2-1: Encapsulate as widget with `qucat.GUI_js` class (postMessage / Comm protocol)
- [ ] P2-2: Remote compatibility (JupyterHub / Binder / SSH tunnels)

### GUI Tweaks (P3 — can be parallelised with P2)

- [ ] P3-1: macOS scroll / zoom / pan (pinch-to-zoom, two-finger pan)
- [ ] P3-2: Keyboard shortcut conflicts on macOS
- [ ] P3-3: Property panel popup UX (auto-focus, remove spinners, remove Cancel)
- [ ] P3-4: Ground element cursor alignment
- [ ] P3-5: Arrow keys move selected elements
- [ ] P3-6: R-key placement bug

### Long-term (Future)

- [ ] Dark mode support
- [ ] Internationalization (i18n)
- [ ] Additional export formats (SPICE, JSON schema)
- [ ] Web Worker offloading
- [ ] NPM publishing

---

## Known Issues & Limitations

### Current Limitations

- Bundle size at upper limit (777 KB) - consider code splitting for future releases
- Clipboard export not available in very old browsers (requires Clipboard API or execCommand)
- No real-time collaboration yet

### Workarounds

- For older browsers: Use the file-based export (Save Netlist) as alternative
- For large circuits: Split into multiple smaller circuits to manage complexity

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues and submitting pull requests.

---

## Support

- 📚 **Documentation**: https://jurra.github.io/qucat-circuit-generator/
- 🐛 **Issue Tracker**: https://github.com/jurra/qucat-circuit-generator/issues
- 💬 **Discussions**: https://github.com/jurra/qucat-circuit-generator/discussions

---

## License

ISC - See LICENSE file for details
