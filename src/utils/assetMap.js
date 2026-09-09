/**
 * @file assetMap.js
 * @description
 * Static asset map for circuit element images.
 * 
 * Each import is resolved **at bundle time** by esbuild (with `--loader:.png=dataurl`),
 * so the resulting bundle contains Base64 data-URLs and needs no external `/assets/` folder.
 *
 * Only circuit element images are included here — documentation-only assets
 * (logo.png, example-challenge.png) are excluded.
 */

// ── Capacitor ──────────────────────────────────────────────
import C from '../../assets/C.png';
import C_hover from '../../assets/C_hover.png';
import C_selected from '../../assets/C_selected.png';
import C_hover_selected from '../../assets/C_hover_selected.png';

// ── Ground ─────────────────────────────────────────────────
import G from '../../assets/G.png';
import G_hover from '../../assets/G_hover.png';
import G_selected from '../../assets/G_selected.png';
import G_hover_selected from '../../assets/G_hover_selected.png';

// ── Junction ───────────────────────────────────────────────
import J from '../../assets/J.png';
import J_hover from '../../assets/J_hover.png';
import J_selected from '../../assets/J_selected.png';
import J_hover_selected from '../../assets/J_hover_selected.png';

// ── Inductor ───────────────────────────────────────────────
import L from '../../assets/L.png';
import L_hover from '../../assets/L_hover.png';
import L_selected from '../../assets/L_selected.png';
import L_hover_selected from '../../assets/L_hover_selected.png';

// ── Non-Linear Inductor ───────────────────────────────────
import N from '../../assets/N.png';
import N_hover from '../../assets/N_hover.png';
import N_selected from '../../assets/N_selected.png';
import N_hover_selected from '../../assets/N_hover_selected.png';

// ── Resistor ───────────────────────────────────────────────
import R from '../../assets/R.png';
import R_hover from '../../assets/R_hover.png';
import R_selected from '../../assets/R_selected.png';
import R_hover_selected from '../../assets/R_hover_selected.png';

/**
 * Lookup table: `ASSET_MAP[prefix][variant]` → data-URL string (in bundle)
 * or import path (resolved by the bundler).
 *
 * Prefix is the single-letter image prefix (C, G, J, L, R).
 * Variant is one of: default, hover, selected, hover_selected.
 */
export const ASSET_MAP = {
    C: { default: C, hover: C_hover, selected: C_selected, hover_selected: C_hover_selected },
    G: { default: G, hover: G_hover, selected: G_selected, hover_selected: G_hover_selected },
    J: { default: J, hover: J_hover, selected: J_selected, hover_selected: J_hover_selected },
    L: { default: L, hover: L_hover, selected: L_selected, hover_selected: L_hover_selected },
    N: { default: N, hover: N_hover, selected: N_selected, hover_selected: N_hover_selected },
    R: { default: R, hover: R_hover, selected: R_selected, hover_selected: R_hover_selected },
};
