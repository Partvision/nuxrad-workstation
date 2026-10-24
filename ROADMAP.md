# NUXRAD themes and plugins roadmap

This is the working scope for NUXRAD Workstation. The current release includes the theme engine and three bundled plugins. The milestones below describe future work.

## Current foundation

- The top “WORKSTATION / THEME ON” badge is removed. Marketplace stays in the left sidebar and opens with Ctrl+Shift+M.
- Focus Workspace is removed from the plugin catalog and migrated out of saved plugin selections.
- Theme packages contain JavaScript style objects for layout, typography, controls, panels, and surfaces, along with settings and reflectivity/velocity palette references.
- Six distinct profiles: Graphite analyst desk, Midnight compact instruments, Aurora spacious rounded controls, Ember squared field instruments, Amethyst floating dock, and Daylight spacious light desk.
- Each theme has saved scale, density, corners, navigation, font, motion, contrast, and radar-palette preferences.
- Native radar palettes have an explicit Apply action, .pal export, and a persisted restoration baseline. Existing palettes remain unchanged when an interface theme is applied. Native palette changes follow NUXRAD’s existing account-sync preference.
- UTC Clock, Field Notes, and Map Crosshair remain available. The three proposed plugins below are roadmap concepts, not installed features.

## Milestone 1: theme-package contract

Keep the theme engine independent of a specific appearance. A package needs identity, version, compatible host versions, interface tokens, scoped JSS-style component rules, a settings schema, defaults, and product-specific radar palettes with units and numeric ranges. The current compiler handles JavaScript style objects, nested selectors, and media/support rules; it is a small bundled engine rather than the external `jss` npm package.

Finish import validation and previews before accepting community packages. Export already includes the resolved JSS rules, settings, interface colors, and .pal tables. Apply/remove must preserve NUXRAD’s native state and user edits. Per-theme preferences should survive theme switching; UI themes must not silently change radar palettes.

Acceptance: switching profiles visibly changes navigation, density, typography, control shape, and panel treatment; settings persist; the original appearance is recoverable; palette legends and physical ranges remain correct; removing a package leaves unrelated settings intact.

## Milestone 2: In App Notifications

Give severe weather alerts and other app events a theme-aware notification center.

First slice:

- Alert inbox and toast components styled by the active theme.
- Source, severity, issue time, expiry, and a link to the native alert.
- Site/area filters and deduplication so updates do not produce repeated toasts.
- Read/dismiss state, notification history, keyboard navigation, and screen-reader announcements.
- Optional sound and quiet-hour preferences. Critical alert treatment must remain clear across themes.

Later: radar-data interruptions, download/export completion, plugin updates, and user-selected status events. Use actual source records; do not invent alerts from map colors or simulation output. Handle stale, canceled, and expired alerts explicitly.

Acceptance: the same alert update appears once, cancellations/expiry update the inbox correctly, filters match the selected area, and theme changes preserve severity contrast and readable content.

## Milestone 3: MenuShift

Let users move specific menu parts without replacing their native behavior.

First slice:

- Named docking zones for tool groups, layer controls, pane headers, and playback.
- Drag handles, snap previews, keyboard repositioning, and accessible position descriptions.
- Saved layouts per user and per theme, with user placements taking precedence over theme defaults.
- Reset one item or the whole layout. Keep a recovery command reachable even after moving menus.
- Minimum map area, responsive fallback positions, and collision handling for small windows.

Acceptance: changing a theme does not lose a custom layout, controls retain their original events, no menu can become unreachable, and Reset layout restores a usable workspace.

## Milestone 4: Sandbox research prototype

Select a bounded map area and explore an idealized atmosphere, simulated storms, and synthetic velocity couplets.

Start with a separate simulation layer and workspace, clearly labeled **SIMULATION** at all times. Preserve live radar and observations underneath. Include pause, single step, reset, reproducible seeds, and a way to leave the simulation immediately.

Research sequence:

1. Area selection, coordinate handling, overlay rendering, and deterministic playback.
2. User-controlled idealized atmosphere: wind profile, moisture, instability, and forcing parameters.
3. A documented educational cell-evolution model. State its simplifications and identify which behavior is prescribed rather than physically resolved.
4. Synthetic reflectivity and radial-velocity visualization, including the radar viewing geometry needed to interpret a couplet.
5. Validation against documented reference cases before claiming credible storm organization or rotation behavior.

This milestone is an educational simulation, not a forecast or a source of real warnings. A toy animation is not a validated atmosphere model. Fidelity, performance, and model choice remain research decisions; avoid committing to a realistic storm solver before a prototype establishes those limits.

Acceptance: simulation output cannot be confused with observations, repeated inputs reproduce the same run, numerical/performance limits are visible, and live alert handling remains separate.

## Contribution priorities

As the repository develops:

- Keep authored overlay code separate from recovered NUXRAD assets. Do not redistribute the original executable or recovered frontend bundles.
- Include a concise setup guide, compatibility matrix, theme-format example, plugin lifecycle contract, and the roadmap.
- Retain palette-adapter regression tests for preservation, restoration, units, collisions, and external edits.
- Add browser checks for theme layout differences, settings persistence, plugin cleanup, keyboard access, and supported NUXRAD versions.
- Turn the three plugin milestones into scoped issues with acceptance criteria. Keep future concepts clearly distinguished from released functionality.

Notifications, MenuShift, and Sandbox remain planned until their implementation and acceptance checks are complete.
