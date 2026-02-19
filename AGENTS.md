# spacemolt-tui

## Goal

Build a TUI-based real-time dashboard for SpaceMolt gameplay status.
**This tool is intended to be read-only. Using any endpoints other than read operations is strictly prohibited.**

## Primary References

- `docs/api.md`: SpaceMolt WebSocket/API reference
- `docs/logger.log`: Real message flow and formatting examples
- `docs/last_state_update.json`: Real `state_update` payload example

## Commands

- Install: `npm install`
- Dev run: `npm run dev`
- Dev run with map: `npm run dev -- --map`
- Dev run with event log: `npm run dev -- --log`
- Dev run with event listener: `npm run dev -- --listen-event`
- Dev run with map and event listener: `npm run dev -- --map --listen-event`
- Build web client: `npm run build:web`
- Type-check: `npm run typecheck`
- Lint: `npm run lint`
- Lint (auto-fix): `npm run lint:fix`
- Format: `npm run format`

## Behavior Rules

- Treat `state_update` as the source of truth for status panels.
- NDJSON event logging is disabled by default. Enable via `--log` flag or `event_log: true` in config. Logs are saved to `~/.spacemolt-tui/logs/YYYY-MM-DD.ndjson` (configurable via `event_log_dir`).
- Do not log `state_update` or `tick` to NDJSON event files.
- Keep a bounded in-memory event buffer for UI responsiveness.
- Use reconnect with exponential backoff + jitter.
- Handle non-TTY environments safely (avoid raw mode crashes).

## Project Structure

- `src/` — Node.js TUI app (Ink/React, `tsconfig.json`)
  - `src/ui/` — UI components (single-purpose)
  - `src/state/` — state management and message summaries
  - `src/web/server.ts` — HTTP server for map viewer (SSE + static files from `public/`)
- `web_map/` — Browser map client (TypeScript + CSS, `tsconfig.web.json`)
  - Bundled by esbuild into `public/assets/` (gitignored)
- `public/` — Static files served by the web server
  - `public/assets/` — esbuild output (gitignored, do not edit directly)

## Implementation Notes for Agents

- Prefer extending `src/state/summary.ts` for new message summaries.
- Keep UI components focused and single-purpose under `src/ui/`.
- Preserve ASCII output where possible for terminal compatibility.
- After implementing any feature, always run all three checks in order: `npm run typecheck && npm run lint && npm run format`
- Do NOT add `eslint-plugin-react` — Ink is not a DOM renderer. Only `eslint-plugin-react-hooks` applies.
- ESLint enforces `react-hooks/set-state-in-effect` (no `setState` in effects) and `react-hooks/refs` (no ref access during render). Use the "store previous props in state" pattern instead of refs+effects for deriving state from props.
- Configuration is loaded from `~/.spacemolt-tui/config.json` via `src/config.ts`. CLI args override config values. Do not use `process.env` for app settings.
- Keybindings are centralized in `src/ui/Keybinds.tsx`. Scroll handlers live in `src/hooks/useEventScroll.ts` and are wired via props in `app.tsx`.
- Web client code lives in `web_map/`, NOT in `src/`. It has its own tsconfig (`tsconfig.web.json`) with DOM types.
- Do not edit `public/assets/` directly — modify `web_map/` sources and run `npm run build:web`.

## Docs

- `docs/event-receiver-api.md`: Documentation for the event receiver API (HTTP endpoint for sending events to the TUI)

## References

- [SpaceMolt API Documentation](https://game.spacemolt.com/api.md)
