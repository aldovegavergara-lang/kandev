/**
 * Centralized theme color palette.
 *
 * Change colors here to affect Monaco editor, Pierre diffs, xterm terminal,
 * and any other component that references these values.
 *
 * CSS variables in globals.css (--background, --foreground, --card, etc.)
 * define the same palette for Tailwind / CSS consumers. Keep them in sync
 * when changing values here.
 */

// ---------------------------------------------------------------------------
// Core palette — dark
// ---------------------------------------------------------------------------
export const DARK = {
  bg: "#211b2c",
  fg: "#f6efff",
  card: "#30273c",
  border: "#52425e",
  hover: "#45334f",
  popover: "#32283e",
  lineHighlight: "#30273c",
  lineNumber: "#8e7b9b",
  lineNumberActive: "#c1b2ce",
  selection: "#644273",
  selectionInactive: "#44384f",
  cursor: "#f6efff",
  scrollbarShadow: "#00000000",
  scrollbarThumb: "#64646480",
  scrollbarThumbHover: "#82828299",
  scrollbarThumbActive: "#828282bb",
} as const;

// ---------------------------------------------------------------------------
// Core palette — light
// ---------------------------------------------------------------------------
export const LIGHT = {
  bg: "#faf7fc",
  fg: "#281d30",
  card: "#ffffff",
  lineHighlight: "#f0eaf4",
  lineNumber: "#85748e",
  lineNumberActive: "#555555",
} as const;

// ---------------------------------------------------------------------------
// Git diff colors (shared across Monaco, Pierre, CSS --git-addition/deletion)
// ---------------------------------------------------------------------------
export const DIFF_COLORS = {
  addition: "#3fb950", // GitHub addition green
  deletion: "#f47067", // GitHub deletion red (rgb(244, 112, 103))
  /** Alpha variants for Monaco diff backgrounds */
  additionTextBg: "#3fb95040",
  deletionTextBg: "#f4706740",
  additionLineBg: "#3fb95015",
  deletionLineBg: "#f4706715",
} as const;

// ---------------------------------------------------------------------------
// Font stack
// ---------------------------------------------------------------------------
// i18n-exempt: CSS font-family stack and metrics, not copy.
export const FONT = {
  mono: '"Monaspace Neon", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  size: 12,
  lineHeight: 20,
} as const;

// ---------------------------------------------------------------------------
// Pierre diffs — Shiki syntax-highlighting themes
// ---------------------------------------------------------------------------
export const PIERRE_THEME = {
  dark: "github-dark-high-contrast" as const,
  light: "github-light" as const,
};
