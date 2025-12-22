Test the JSCircuit Editor directly in your browser.

## Challenge: The LC Tank Circuit

**Goal:** Replicate the circuit described by the netlist below.

### Target Netlist
```text
C1 0 1 1e-12
L1 1 0 1e-9
```
*(A Capacitor and Inductor in parallel, connected between Ground (0) and Node 1)*

### Live Editor

<iframe src="app/jscircuit.html" width="100%" height="600px" style="border: 1px solid #ccc; border-radius: 4px;"></iframe>

### Instructions

1.  **Add a Capacitor**: Press **C** or click the Capacitor icon. Place it on the canvas.
2.  **Add an Inductor**: Press **L** or click the Inductor icon. Place it parallel to the capacitor.
3.  **Add Ground**: Press **G** to add a ground connection (Node 0).
4.  **Connect Wires**: Press **W** to draw wires connecting the components.
5.  **Verify**: Check if your circuit structure matches the parallel configuration.

---

## Next Steps

Now that you've tried the editor, learn how to extend it:

- {@tutorial extension-guide} - Overview of the extension system
- {@tutorial custom-elements} - Add your own components
