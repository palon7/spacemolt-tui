# Event Receiver API

HTTP API for sending log events from external tools (coding agents, etc.) to the TUI dashboard event stream.

## Getting Started

Start the app with the `--listen-event` flag.

```bash
npm run dev -- --listen-event
```

Can be combined with `--map`.

```bash
npm run dev -- --map --listen-event
```

The port is configurable via the `SPACEMOLT_WEB_PORT` environment variable (default: `3001`).

## Endpoint

### `POST /api/events`

Send an event to the TUI event stream.

**URL:** `http://localhost:3001/api/events`

**Content-Type:** `application/json`

#### Request Body

| Field   | Type   | Required | Description                                                                                                            |
| ------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `title` | string | Yes      | Event title. Displayed in the type column of the TUI (truncated to 12 characters).                                     |
| `body`  | string | No       | Event body. Displayed in the summary column of the TUI. Defaults to empty string if omitted.                           |
| `color` | string | No       | Display color for the event type column. Defaults to `blueBright` if omitted. See [Valid Colors](#valid-colors) below. |

#### Response

**Success (201):**

```json
{ "ok": true }
```

**Validation Error (400):**

```json
{ "error": "title is required and must be a non-empty string" }
```

**Invalid Color (400):**

```json
{ "error": "invalid color. Valid colors: black, red, green, ..." }
```

**JSON Parse Error (400):**

```json
{ "error": "invalid JSON" }
```

**Endpoint Disabled (404):**

Returned when the app is started without the `--listen-event` flag.

## Examples

### Basic

```bash
curl -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title": "Build Done", "body": "Successfully compiled src/index.ts"}'
```

### Title Only

```bash
curl -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title": "Deploy Started"}'
```

### With Color

```bash
curl -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title": "Error", "body": "Build failed: src/index.ts", "color": "red"}'
```

### Claude Code Hook

Example of sending events from a Claude Code hook script:

```bash
curl -s -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d "{\"title\": \"Tool\", \"body\": \"$TOOL_NAME executed\"}"
```

## TUI Display

Events are displayed as follows:

```
[14:23:05] Build Done    | Successfully compiled src/index.ts
```

- The `title` value is shown in the type column (truncated to 12 characters)
- The `body` value is shown in the summary column
- Displayed in `blueBright` color by default (overridable via `color` field)
- Filter category is `me`

## Valid Colors

The following color names are accepted for the `color` field:

**Base:** `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray` (`grey`)

**Bright:** `redBright`, `greenBright`, `yellowBright`, `blueBright`, `magentaBright`, `cyanBright`, `whiteBright`

## Internals

- Event type: `ext_action` (fixed)
- `title` is stored in `EventEntry.label` and used as the display type name
- Events are also recorded in the NDJSON event log (`event.log.ndjson`)
