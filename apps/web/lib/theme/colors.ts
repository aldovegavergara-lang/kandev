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
  bg: "#1d1f24",
  fg: "#f6f6f1",
  card: "#2a2d36",
  border: "#454953",
  hover: "#404550",
  popover: "#30343d",
  lineHighlight: "#2a2d36",
  lineNumber: "#969ba5",
  lineNumberActive: "#c0c3ca",
  selection: "#354d90",
  selectionInactive: "#394251",
  cursor: "#f6f6f1",
  scrollbarShadow: "#00000000",
  scrollbarThumb: "#64646480",
  scrollbarThumbHover: "#82828299",
  scrollbarThumbActive: "#828282bb",
} as const;

// ---------------------------------------------------------------------------
// Core palette — light
// ---------------------------------------------------------------------------
export const LIGHT = {
  bg: "#edede5",
  fg: "#1d1f24",
  card: "#ffffff",
  lineHighlight: "#dfdfd8",
  lineNumber: "#60656e",
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
