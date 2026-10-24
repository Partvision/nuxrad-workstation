# NUXRAD Themes & Marketplace

A reversible interface layer for NUXRAD on Windows, with six complete interface themes, theme settings, radar palettes, and a bundled plugin marketplace. This is an independent community project and is not affiliated with NUXRAD. Install NUXRAD separately; this repository contains the authored overlay only.

## Open

Install Node.js 24 or later, then download or clone this repository and keep its files together. No npm dependencies are required. Double-click **Start NUXRAD Workstation.vbs**, or run `npm start` from this folder. The launcher finds Node.js on PATH, with the standard Windows installation path as a fallback.

If NUXRAD is already running through this launcher, it reuses the local connection. If you started the ordinary app, fully quit it through the menu or system tray first; closing its window can leave its background process running. Diagnostics are in `status.json` and `launcher.log`.

## Themes and settings

Open **Marketplace** under **Personalize** on the left sidebar, or press **Ctrl+Shift+M**. The top Workstation badge is removed.

The six themes now contain component style rules and distinct interface profiles:

| Theme | Interface profile |
| --- | --- |
| Graphite | Balanced labeled analyst desk |
| Midnight | Compact icon rail and monospaced instruments |
| Aurora | Spacious navigation and soft pill controls |
| Ember | Dense squared instruments and condensed headings |
| Amethyst | Floating panels and a slim icon dock |
| Daylight | Spacious light desk with wide labeled navigation |

Choose **Settings** on a theme card to customize scale, density, corners, navigation, fonts, motion, and contrast. Preferences are saved separately for each theme. **Apply interface settings** changes the interface and preserves radar palettes.

These are JavaScript style-object packages with scoped component rules, compiled by the included engine. They do not depend on the external `jss` npm library. See **THEME-FORMAT.md** for the package contract.

## Radar palette bundles

Each theme includes suggested reflectivity and radial-velocity tables. Theme settings offers Classic Radar, High Contrast, and Teal & Amber packs, with numeric previews and product units. Reflectivity uses BR/dBZ; radial velocity uses BV/m/s.

Native radar palettes change only when you select a pack and click **Apply radar palettes**. They follow NUXRAD’s existing account-sync setting. **Restore previous palettes** restores the baseline where the overlay still owns the selection, preserving subsequent user edits. **Export REF .pal**, **Export VEL .pal**, and **Export full theme package** save portable copies.

The palette adapter was checked against NUXRAD 5.43.0’s actual read-only store interface. Apply/restore preservation and units were tested with a fake store; the live UI verification deliberately did not mutate native account-synced palette settings.

## Plugins and roadmap

Available now: UTC Clock, Field Notes, and Map Crosshair. Focus is removed from both the catalog and saved selections.

Planned cards describe **In App Notifications**, **MenuShift**, and **Sandbox**. They cannot be installed yet. See [ROADMAP.md](ROADMAP.md) for scope, milestones, and acceptance criteria.

## Recovery and verification

**Use original appearance** in Marketplace restores NUXRAD’s original styling; Marketplace remains available on the left and through Ctrl+Shift+M. Native palette restoration has its own explicit control.

The launcher checks known executable hashes. A later NUXRAD update may require a compatibility review. Its WebView2 connection is local to this computer and the extra browser arguments apply only to the launched app process.

The launcher enables a loopback WebView2 debugging port for its NUXRAD process. Local programs can access that debugging connection while NUXRAD is running; fully quit NUXRAD when finished. Local diagnostics and connection details are ignored by Git.

| Host version | Validation |
| --- | --- |
| NUXRAD 5.42.0 | Original overlay and launcher checked; recognized executable hash |
| NUXRAD 5.43.0 | 21 live UI checks, six layout profiles, persistence, exports, plugin migration, and read-only palette bridge |

Live verification preserved native radar palettes. Palette mutation and restore behavior were tested against a fake store. Compatibility with other builds is unverified; the launcher refuses unknown executable hashes.

## Development

Run `npm test` for the theme engine and palette adapter regression checks. Run `npm run build:themes` after changing theme definitions or palette exports; commit the generated files in `theme-packages/` and `palettes/` too. CI runs these checks and verifies generated packages stay current.

See [CONTRIBUTING.md](CONTRIBUTING.md) for project boundaries and the bundled plugin lifecycle. Community package import and arbitrary third-party plugin execution are future work.
