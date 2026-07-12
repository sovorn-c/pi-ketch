# pi-ketch

[![npm version](https://img.shields.io/npm/v/pi-ketch.svg)](https://www.npmjs.com/package/pi-ketch)
[![license](https://img.shields.io/npm/l/pi-ketch.svg)](./LICENSE)
[![Pi package](https://img.shields.io/badge/Pi-package-6f42c1)](https://pi.dev/packages)

**Web research tools for [Pi](https://pi.dev), powered by [Ketch](https://github.com/1broseidon/ketch).**

`pi-ketch` gives Pi native tools for live web search, public code search, library documentation, page extraction, and bounded site crawling. It wraps Ketch's stateless CLI directly, so there is no MCP daemon to manage and no long-lived process holding Ketch's page-cache lock.

## Install

First install Ketch 0.11 or newer:

```sh
brew install 1broseidon/tap/ketch
```

Then install the Pi package:

```sh
pi install npm:pi-ketch
```

Restart Pi or start a new session. The tools and bundled research skill load automatically.

### Requirements

- Pi 0.80.6 or newer
- Node.js 22.14 or newer
- Ketch 0.11 or newer available on `PATH`

If the executable has a different name or location, set `KETCH_BIN` to its absolute path.

## What it adds

| Tool | Use it for |
| --- | --- |
| `ketch_search` | Current web results, news, comparisons, and opinions |
| `ketch_scrape` | Clean Markdown or raw HTML from known URLs |
| `ketch_code` | Real-world usage examples in public OSS repositories |
| `ketch_docs` | Resolving libraries and querying Context7 documentation |
| `ketch_crawl` | Bounded, same-host site crawling with partial results |

The bundled Ketch skill teaches Pi when to use each tool, how to bound fetched content, how to recover from backend failures, and how to cite sources. Local repository search remains the job of Pi's local code tools; `ketch_code` is specifically for public repositories.

## Examples

Ask Pi naturally:

```text
Find current reporting on Go 1.26 and cite primary sources.
```

```text
Find public repositories using http.NewRequestWithContext and link to each example.
```

```text
Resolve React in Context7, then find its guidance on useEffect cleanup.
```

```text
Read https://example.com and summarize it.
```

```text
Crawl at most ten pages from this documentation site and cite the pages you used.
```

You can also name a tool explicitly and provide constraints such as `limit`, `maxChars`, or `maxPages`.

## Ketch configuration

`pi-ketch` uses Ketch's existing configuration and credentials. It does not copy API keys into Pi settings.

These read-only commands help inspect the current setup:

```text
/ketch-version
/ketch-config
/ketch-doctor
```

`ketch-doctor` probes all configured surfaces. It can return a warning when optional backends are unavailable or do not have API keys, even if your default search backend works.

Configuration changes, browser installation, cache mutation, package upgrades, and background crawl management are intentionally not exposed as agent tools. The bundled skill instructs Pi to ask before using operator commands such as `ketch config set`.

## Output and safety

`pi-ketch` applies bounds before returning external content to the model:

- Unknown pages default to 6,000 characters.
- Batch scraping accepts at most 20 URLs.
- Crawls default to 30 pages, depth 3, and 6,000 characters per page.
- Crawls stop after three minutes and preserve collected pages as partial results.
- Final output follows Pi's 50 KB / 2,000-line tool limit.
- Larger formatted output is saved to a temporary file that Pi can read on demand.

Processes are spawned without a shell, and Pi cancellation is propagated to Ketch. Free-form queries are separated from command flags with `--`.

Fetched pages are untrusted source material. They must not be treated as agent instructions.

Ketch can reach internal services available from the host. `pi-ketch` accepts only `http:` and `https:` URLs but does not claim full SSRF protection. Do not expose these tools to untrusted users on a privileged network.

## Why direct CLI instead of MCP?

Ketch is designed around short-lived, structured CLI calls. A direct adapter provides:

- native Pi schemas and renderers;
- Ketch's stable JSON output and exit-code taxonomy;
- cancellation without a protocol bridge;
- no MCP process lifecycle;
- no session-long bbolt cache lock.

The flow is deliberately small:

```text
Pi tool → ketch <surface> --json → parser → bounded Markdown → Pi
```

## Development

Clone the repository and install development dependencies:

```sh
git clone https://github.com/sovorn-c/pi-ketch.git
cd pi-ketch
npm install
npm run validate
```

Load the extension directly while developing:

```sh
pi --no-extensions -e ./src/index.ts
```

Or install the checkout as a local Pi package:

```sh
pi install "$PWD"
```

The test suite uses a fake Ketch executable, so unit tests do not require network access. Live smoke tests require an installed and configured Ketch binary.

## License

[MIT](./LICENSE)
