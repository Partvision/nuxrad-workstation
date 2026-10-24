# Contributing

Keep changes limited to authored overlay code. Do not commit NUXRAD executables, recovered frontend bundles, account data, local connection details, logs, or user preferences. Install the host app separately.

Run `npm test` and `npm run build:themes` before submitting a change. For visual changes, check all six profiles in a supported NUXRAD build, keyboard access to Marketplace, per-theme settings persistence, and recovery to the original appearance. Record the host version and any limits of validation. Do not apply account-synced radar palettes as part of an automated UI check.

## Bundled plugin lifecycle

The current Marketplace is a local bundled catalog. There is no public plugin SDK or arbitrary package loader. Plugin behavior is implemented in `marketplace.js` and styling in `marketplace.css`.

- Catalog entries need a stable ID, name, description, and explicit availability.
- Install/enable must be idempotent and follow the active interface theme.
- Disable/remove must clean up owned DOM, listeners, timers, and styles while preserving native controls and unrelated user state.
- Persist only the plugin's preferences. Keep data isolated from other plugins.
- Overlay teardown and reinjection must not duplicate plugin UI or leak resources.
- Planned entries show their roadmap and cannot be installed.

UTC Clock, Field Notes, and Map Crosshair are the working examples. Notifications, MenuShift, and Sandbox need their own implementation and acceptance checks before becoming available. See `ROADMAP.md` and `THEME-FORMAT.md` for the intended contracts.
