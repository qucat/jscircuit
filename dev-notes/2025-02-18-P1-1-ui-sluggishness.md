# P1-1: UI Sluggishness — Low-Risk Fixes

> **Date**: 2026-02-18  
> **Branch**: `fix/P1-1-ui-sluggishness`  
> **Files changed**: `src/gui/renderers/CircuitRenderer.js`, `src/gui/adapters/GUIAdapter.js`

---

## What we changed and why

### 1. Turned off the dot grid (and made it a toggle)

**What was happening:**
Every time the screen redraws (which happens dozens of times per second), the app was drawing thousands of tiny dots to form a background grid. Think of it like this: imagine you have a sheet of graph paper with ~17,000 dots. Every time anything changes — you move the mouse, click, hover over a component — the app erases *everything* on screen and redraws it all from scratch, including all 17,000 dots, one by one.

Each dot required 3 separate drawing instructions to the browser:
1. "Start a new shape"
2. "Draw a circle here"
3. "Fill it in"

That's **~51,000 drawing instructions** just for the background grid — before any circuit component is even drawn.

**What we did:**
We turned the grid off by default (since it's just a visual aid, not essential for the circuit editor to work). We also added a switch (`setShowGrid`) so it can be turned back on later via a menu toggle if someone wants it. When it's off, those 51,000 instructions per frame simply don't happen.

---

### 2. Fixed the render deduplication (the "don't repaint 5 times when once is enough" fix)

**What was happening:**
The app already had a smart system in place to prevent unnecessary repaints. It works like this:

> "If someone asks me to repaint, don't do it immediately. Instead, put a note in a box and wait. When the browser is ready for the next screen refresh (~60 times/second), look in the box, and do one repaint."

The box is a `Set` — a JavaScript collection that automatically ignores duplicates. If you put the same item in twice, it only keeps one copy.

**The bug:** Every time the app asked for a repaint, it created a *brand new anonymous function* (think of it as a new sticky note with a unique serial number). Even though all the sticky notes said "repaint the circuit", the `Set` treated each one as different because they were different objects. So if 5 things asked for a repaint in the same frame, the box contained 5 "different" notes, and the circuit was repainted 5 times instead of once.

**What we did:**
We created one single sticky note at startup and reused it every time. Now when 5 things ask for a repaint, the `Set` sees the same sticky note 5 times and keeps only one copy. Result: **one repaint per frame, guaranteed**, no matter how many things request it.

---

### 3. Removed redundant "repaint!" calls

**What was happening:**
The app uses an event system — when something changes in the circuit data, it broadcasts an "update" event, and a listener automatically triggers a repaint. This is good design.

However, in several places the code was doing something like:

```
1. Change the circuit data       → triggers "update" event → triggers repaint
2. Explicitly call repaint()     → triggers a SECOND repaint
```

The second call was unnecessary because the first one already handled it. Before our fix #2 above, this wasn't that noticeable because the system was already broken and doing multiple repaints anyway. But now that deduplication works properly, we can clean this up.

**What we did:**
We removed 4 explicit `render()` calls that were right next to operations that already trigger a render through the event system. This means less code, and the intent is clearer: "the event system handles repaints; you don't need to ask manually."

---

## The combined effect

Before these changes, a single user action (like rotating an element during placement) could trigger **3-5 full canvas redraws in one frame**, each one drawing ~17,000 grid dots plus all circuit components. That's potentially **85,000+ wasted drawing instructions per frame**.

After these changes, the same action triggers **1 redraw per frame**, with **0 grid dots** (since grid is off). The app does far less work for the same visual result, which is why it feels more responsive.

---

## Verification

- ✅ Build passes (777.2 KB bundle)
- ✅ 448 tests passing
- ⬜ Manual browser testing pending
