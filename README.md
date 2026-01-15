
<div align="center">
  <img src="assets/logo.png" alt="QuCat Logo" height="100" style="margin-bottom: 1rem;">
  
  # JSCircuit

  **Start designing quantum circuits in your browser right away with jscircuit for your simulations**
  
  [![GitHub](https://img.shields.io/badge/GitHub-View%20Source-blue?style=for-the-badge&logo=github)](https://github.com/jurra/qucat-circuit-generator)
  [![App](https://img.shields.io/badge/Demo-Try%20Live-success?style=for-the-badge&logo=codesandbox)](https://jurra.github.io/qucat-circuit-generator/app/jscircuit.html)
  [![Docs](https://img.shields.io/badge/Docs-Getting%20Started-orange?style=for-the-badge&logo=gitbook)](https://jurra.github.io/qucat-circuit-generator/tutorial-getting-started.html)
</div>



---

**JSCircuit** is a lightweight, web-based circuit editor designed to generate netlists for **QuCat** simulations. It runs entirely in the browser, offering a modern alternative to desktop-based editors.

### Why JSCircuit?

The project was built to solve two key challenges in the quantum circuit simulation workflow:

1.  **Accessibility & Portability**:
    Many researchers and students work in **Jupyter Notebooks** hosted on JupyterHubs or HPC clusters. JSCircuit provides a zero-installation editor that can be embedded directly into these environments, or run on any device with a modern browser.

2.  **Extensibility**:
    Built with a modular **Hexagonal Architecture**, JSCircuit makes it easy for developers to add custom circuit elements, create new visual renderers, and implement custom commands.

## Key Features

-   **Zero Installation**: Runs instantly in any modern web browser.
-   **QuCat Compatible**: Generates netlist files ready for QuCat simulations.
-   **Embeddable**: Designed to work within Jupyter Notebooks and web applications.
-   **Dependency-Free**: Built with native ES6 JavaScript, requiring no heavy frameworks.
-   **Extensible**: Professional architecture allowing easy addition of new components.

## For Developers

### Local Installation

To run the project locally for development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jurra/qucat-circuit-generator.git
    cd qucat-circuit-generator
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build and Serve**:
    ```bash
    npm run serve
    ```
    This will bundle the application and start a local server at `http://127.0.0.1:8080`.

### Documentation

-   **[Extension Guide](https://jurra.github.io/qucat-circuit-generator/tutorial-extension-guide.html)**: Learn how to add custom elements.
-   **[Architecture](https://jurra.github.io/qucat-circuit-generator/tutorial-overview.html)**: Understand the system design.
-   **[API Reference](https://jurra.github.io/qucat-circuit-generator/index.html)**: Detailed code documentation.

##  Build the documentation locally
```bash
npm run docs:serve
```

## Licensed under the MIT License.

Technische Universiteit Delft hereby disclaims all copyright interest in the program "JSCircuit" written by the Author(s).

— Prof. Paulien Herder, Dean of the faculty of Applied Sciences at TU Delft
