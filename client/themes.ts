import type { PluginClientContext } from "@getpaseo/plugin/client";

/**
 * Palette derived from the uploaded Claude theme JSON (OKLCH converted to sRGB).
 * Mapping to Paseo's smaller token set:
 *   background ← canvas        foreground ← text
 *   raised     ← surfaceRaised control    ← input
 *   border     ← border        accent     ← accent
 *   ring       ← focus         sidebar    ← chrome
 *   surface3   ← messageSurface surface4  ← terminalScrollbarHover
 * Light `mutedForeground` is darkened from #898781 to #76746e so secondary
 * text reaches 4.5:1 contrast on the near-white canvas. The light surface,
 * ink, and accent follow Codex-主题.md: #fcfcfb / #141413 / #d97757.
 */
export function contributeClaudeThemes(client: PluginClientContext) {
  const removeLight = client.addTheme({
    id: "claude-soft-light",
    name: "Claude Soft Light",
    appearance: "light",
    colors: {
      background: "#fcfcfb",
      foreground: "#141413",
      raised: "#ffffff",
      control: "#e0e0df",
      border: "#e3e3e2",
      accent: "#d97757",
      mutedForeground: "#76746e",
      ring: "#c6613f",
      sidebar: "#fcfcfb",
      sidebarHover: "#f7f6f3",
      sidebarSelected: "#f1f0ec",
      surface3: "#f0f0ef",
      surface4: "#c3c2b7",
    },
  });

  const removeDark = client.addTheme({
    id: "claude-soft-dark",
    name: "Claude Soft Dark",
    appearance: "dark",
    colors: {
      background: "#151515",
      foreground: "#f9f9f7",
      raised: "#20201f",
      control: "#363635",
      border: "#2d2d2d",
      accent: "#d97757",
      mutedForeground: "#898781",
      ring: "#d97757",
      sidebar: "#0e0e0e",
      sidebarHover: "#202020",
      sidebarSelected: "#2a2a2a",
      surface3: "#212121",
      surface4: "#525252",
    },
  });

  return () => {
    removeLight();
    removeDark();
  };
}
