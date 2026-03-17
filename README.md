
<div align="center">
  <img src="assets/logo.png" alt="QuCat Logo" height="100" style="margin-bottom: 1rem;">
  
  # JSCircuit

  **Start designing quantum circuits in your browser right away with jscircuit for your simulations**
  
  [![GitHub](https://img.shields.io/badge/GitHub-View%20Source-blue?style=for-the-badge&logo=github)](https://github.com/qucat/jscircuit)
  [![App](https://img.shields.io/badge/Demo-Try%20Live-success?style=for-the-badge&logo=codesandbox)](https://qucat.github.io/jscircuit/app/jscircuit.html)
  [![Docs](https://img.shields.io/badge/Docs-Getting%20Started-orange?style=for-the-badge&logo=gitbook)](https://qucat.github.io/jscircuit/tutorial-getting-started.html)
</div>



---

**JSCircuit** is a lightweight, web-based circuit editor designed to generate netlists for **QuCat** simulations. It runs entirely in the browser, offering a modern alternative to desktop-based editors.

[**Get started right away with JSCircuit**](https://qucat.github.io/jscircuit/tutorial-getting-started.html)

### Why JSCircuit?

The project was built to solve two key challenges in the quantum circuit simulation workflow:

1.  **Accessibility & Portability**:
    Many researchers and students work in **Jupyter Notebooks** hosted on JupyterHubs or HPC clusters. JSCircuit provides a zero-installation editor that can be embedded directly into these environments, or run on any device with a modern browser.

2.  **Extensibility**:
    Built with a modular **Hexagonal Architecture**, JSCircuit makes it easy for developers to add custom circuit elements, create new visual renderers, and implement custom commands.

## Key Features

-   **Zero Installation**: Runs instantly in any modern web browser.
-   **Self-Contained**: Ships as a single HTML file— no external dependencies.
-   **QuCat Compatible**: Generates netlist files ready for QuCat simulations.
-   **Clipboard Workflow**: Copy netlists out (Ctrl+Shift+C) and paste them in (Ctrl+Shift+V).
-   **Embeddable**: Designed to work within Jupyter Notebooks and web applications.
-   **Dependency-Free**: Built with native ES6 JavaScript, requiring no heavy frameworks.
-   **Extensible**: Professional architecture allowing easy addition of new components.

## For Developers

### Local Installation

To run the project locally for development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/qucat/jscircuit.git
    cd jscircuit
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build and Serve** (development):
    ```bash
    npm run serve
    ```
    This will bundle the application and start a local server at `http://127.0.0.1:8080`.

4.  **Build Standalone** (distribution):
    ```bash
    npm run build:standalone
    ```
    Produces a single self-contained `dist/jscircuit.html` with all JS and assets inlined.
    This file can be included in the QuCat Python package or served from any static host.

### Documentation

-   **[Extension Guide](https://qucat.github.io/jscircuit/tutorial-extension-integration-tutorial.html)**: Learn how to add custom elements.
-   **[API Reference](https://qucat.github.io/jscircuit/index.html)**: Detailed code documentation.

##  Build the documentation locally
```bash
npm run docs:serve
```

## Acknowledgments

This project builds upon the original QuCat GUI developed by **Mario Gely**, which provided the foundational concepts for circuit visualization and interaction as a reference to develop this application.

We acknowledge the support of the **TU Delft Digital Competence Center** in advancing this project.

## Licensed under the MIT License.

Technische Universiteit Delft hereby disclaims all copyright interest in the program "JSCircuit" written by the Author(s).

— Prof. Paulien Herder, Dean of the faculty of Applied Sciences at TU Delft
