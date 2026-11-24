# Local installation security review · 2026-11-24

This review covers the public fork's web board, Go backend and agentctl, CLI defaults, plugin SDK, JavaScript workspace and native desktop dependency lock. The supported local deployment uses a browser on the same computer as the server.

## Privacy and access changes

- The CLI binds to loopback. The backend rejects a network bind without authentication. The server container enables authentication. Complete first-admin setup privately before exposing the service.
- In single-user mode the server validates the HTTP Host, including WebSocket upgrades. The production board uses its own origin. Development allows the loopback Vite server to use a separate port.
- OTLP export requires an explicitly configured collector. Remote collectors require HTTPS, redirects are refused, and W3C baggage is no longer forwarded. Trace events retain correlation IDs, labels and sizes. Protocol bodies, tool content, raw ACP errors and command arguments were removed from the reviewed instrumentation. Local debug logs have a separate lifecycle and can contain sensitive data.
- Scheduled application and managed CLI version checks, automatic pricing refresh, startup CLI model discovery and GitHub quota checks at startup are opt-in. Startup checks for ambient GitHub credentials require a saved active host connection or the background-lookup setting. Manual updates contact their release source. Repository sync, installed plugins, user-configured notifications and hosted models have their own network behavior.
- The board blocks remote images and omits the HTTP referrer. External avatars and remotely hosted Markdown images may therefore be missing.
- New profiles default to requesting approval for the reviewed Codex and Copilot flags. Auggie workspace indexing requires explicit selection. Existing profile settings are preserved.
- SQLite creates private files and directories on Unix and tightens legacy database and journal permissions. The operating-system user still controls the database, logs and running agents.

## Verification and limits

| Surface | Result |
| --- | --- |
| Native Go services and public plugin SDK | Updated compiler, MCP and transitive dependencies. The original native server and agentctl produced 18 and 16 findings respectively. The rebuilt binaries and a source scan of the updated plugin SDK each reported zero findings. |
| Web production dependencies | `pnpm audit --prod` reports zero critical, high or moderate findings. It reports a low finding for `cli` without an affected dependency path. The workspace directory is named `cli`, its published package is `kandev`, and the lock contains no npm package named `cli`. |
| Development dependencies | The full pnpm audit still reports moderate findings affecting `glob` and `minimatch` through OpenCode development dependencies and lint tooling. The available fixes require major-version migrations for those consumers. |
| Native desktop | Updated four Rust crates, passed 122 Rust tests and compiled the macOS desktop feature. OSV still identifies an unsound iterator in `glib 0.18.5` via GTK3 on Linux. The macOS dependency tree excludes this crate. Five other crates in the cross-platform lock have maintenance notices. |
| Credentials | Scanned the tracked source snapshot and reviewed candidate locations. Findings included test credentials, documented examples, PEM format markers and identifiers. Gitleaks found no matches in the fork-only commit range or in the hardening patch. Credentials were never submitted to a provider for verification. |

An isolated first launch with an empty home directory and a recording HTTP proxy made no proxied HTTP or HTTPS requests during startup and the following ten seconds. The local browser smoke test loaded the board and connected its WebSocket. During the observation window Chrome made no off-machine requests. This covered the idle board. A separate installation with a saved active GitHub CLI connection had a backend TLS socket to an address that resolved for api.github.com. The tests did not capture all subprocess traffic or exercise every integration.

An agent launched directly on the host can access resources available to its OS account. A working folder controls its starting directory. For untrusted work, choose an isolated executor and grant repository-scoped credentials. Installed plugins, user-selected provider CLIs and authenticated network deployments need a deployment-specific review.

See the [operating guidance](public/security.md), [configuration reference](public/configuration.md), [Go vulnerability scanner](https://go.dev/doc/security/vuln/) and [Linux glib advisory](https://rustsec.org/advisories/RUSTSEC-2024-0429.html).
