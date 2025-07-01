import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import image from "@rollup/plugin-image";

export default {
    input: "src/gui/main.js", // Entry point
    output: {
        file: "dist/bundle.js", // Output bundled file
        format: "esm", // Browser-compatible output
        name: "CircuitDesigner", // Global variable name
        sourcemap: true,
        inlineDynamicImports: true, // Inline dynamic imports to avoid issues with code splitting
    },
    preserveEntrySignatures: false, //  Prevent facade chunk warning and code splitting issues
    plugins: [
        image(),
        terser(), // Minify the output
        copy({
            targets: [
                { src: "assets/*", dest: "dist/assets" }
            ]
        })
    ]
};
