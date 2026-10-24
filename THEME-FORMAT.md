# Theme package format: nuxrad-jss-theme/v1

Themes describe the whole interface presentation rather than only a color list. Bundled definitions live in `themes.js`; **Export full theme package** emits a JSON representation of the selected theme, resolved rules, settings, and radar tables.

## Package contents

- `format`, `id`, `name`, and `version`: package identity.
- `colors`: background, panel, raised surface, border, accent, foreground, and muted foreground.
- `profile`: navigation width, header height, control height, corner radius, font stack, panel surface style, and weight.
- `settings`: per-theme user overrides for interface scale, density, corners, navigation, font, motion, contrast, and radar palette choices.
- `jss`: selector-to-style-object rules, resolved for those settings.
- `palettes.BR` and `palettes.BV`: complete .pal text including product, units, Scale, Offset, and RGBA stops.

## Component style objects

The bundled compiler accepts camelCase properties, string values, numeric pixel values, unitless CSS properties, custom properties, `&` selectors, nested style rules, and media/support groups. Every generated interface rule is scoped to `html[data-nuxrad-pro="on"]`. It is a small included compiler, not the external JSS package or an arbitrary-JavaScript plugin loader.

For example:

```js
{
  "&": {
    "--ui-header-height": "52px",
    fontSize: 14
  },
  "& .nxpro-rail button": {
    minHeight: 38,
    borderRadius: 4,
    fontFamily: '"Cascadia Code", "Consolas", monospace'
  },
  "@media (max-width: 1000px)": {
    "& .nxpro-rail": { width: 76, minWidth: 76 }
  }
}
```

Theme rules can change component layout, spacing, typography, shape, borders, and surfaces. Radar pixel colors use the native palette adapter; CSS filters are not used to recolor radar data. User layout placement through the future MenuShift plugin will be a separate layer with its own reset behavior.

## Settings and palette application

Interface settings are stored in the overlay’s own local preference key. Each theme retains independent settings.

Palette preferences default to keeping the user’s existing NUXRAD tables. Choosing a bundle previews it; **Apply radar palettes** explicitly merges only the owned BR/BV tables and selections into NUXRAD’s native settings, then requests its standard color-table refresh. NUXRAD may sync these settings to its account according to its existing preference.

The adapter persists a baseline before modifying native settings, uses namespaced table keys, avoids overwriting same-name user tables, and preserves external edits during restoration. Other product selections remain untouched. BR can participate in NUXRAD’s existing derived-reflectivity fallback behavior; the overlay does not replace that native routing.

Community import, dependency/version validation, theme signing/distribution decisions, and a general plugin SDK remain roadmap work. Exported packages are portable records; this release does not automatically execute imported community code.
