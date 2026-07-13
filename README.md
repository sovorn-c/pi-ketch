# pi-ketch

[![npm version](https://img.shields.io/npm/v/pi-ketch.svg)](https://www.npmjs.com/package/pi-ketch)
[![license](https://img.shields.io/npm/l/pi-ketch.svg)](./LICENSE)
[![Pi package](https://img.shields.io/badge/Pi-package-6f42c1)](https://pi.dev/packages/pi-ketch)

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

### Optional browser setup

Ketch can use a local headless Chromium browser for JavaScript-rendered pages. This is optional; ordinary static pages do not need it.

Install Chromium:

```sh
ketch browser install
```

The installer prints the exact `ketch config set browser ...` command for the browser it installed. Copy and run that command, then verify the setup:

```sh
ketch browser status
ketch doctor
```

The browser status should report `status: ok`. Configuring Chromium makes it available to Ketch; it does not force every page through a browser.

For a known URL, start with a normal `ketch_scrape` call. Ketch fetches the page directly and can automatically detect a JavaScript-only application shell when Chromium is configured. If the returned content is empty, incomplete, or only an application shell, retry once with `forceBrowser: true`. This skips direct fetching and renders that request through Chromium. Browser rendering does not guarantee access through authentication, CAPTCHAs, or strong anti-bot controls.

### Search backend setup

Web search needs one default backend. Brave is Ketch's default and requires an API key:

```sh
ketch config set brave_api_key <key>
```

To use another provider by default, select it once in Ketch:

```sh
ketch config set backend ddg
# Other choices: searxng, exa, firecrawl, keenable
```

Some providers need credentials or a custom URL. Use Ketch's [configuration reference](https://1broseidon.github.io/ketch/) for the current keys and provider requirements rather than adding secrets to Pi settings.

Check what Ketch can use before opening Pi:

```sh
ketch config
ketch doctor
ketch search "test query"
```

The operator chooses the backend; the agent normally does not. The bundled skill tells Pi to call `ketch_search` without `backend`, `multi`, or `allBackends`, so routine searches use your configured default. For deep or contested research, the agent may use `allBackends: true` to query every usable provider and fuse the rankings. An explicit `multi` list is reserved for a provider comparison you requested.

If another Pi extension exposes overlapping search or page-extraction tools, disable that extension in `~/.pi/agent/settings.json` to prevent duplicate tools and conflicting routing instructions. You can leave the package installed.

### Full capability setup

Configure only the surfaces you plan to use. Each row below maps an agent tool to the Ketch service behind it.

| Pi tool | Ketch capability | Starts with | Optional setup |
| --- | --- | --- | --- |
| `ketch_search` | Web search | Your configured default backend | Add more search providers for federated research. Brave and Firecrawl require API keys. |
| `ketch_scrape` | Page extraction | Direct HTTP fetching and the local page cache | Install Chromium for JavaScript-rendered pages. |
| `ketch_crawl` | Bounded site crawling | Direct HTTP fetching and the local page cache | Install Chromium for JavaScript-rendered pages. |
| `ketch_code` | Public OSS code search | grep.app | Sourcegraph needs no setup. GitHub can use `gh auth login`, `GITHUB_TOKEN`, or Ketch's `github_token`. |
| `ketch_docs` | Library documentation | Context7 | Set `context7_api_key`; this surface requires a Context7 key. |

A practical full setup is:

1. Configure and test one default search backend.
2. Add a Context7 key if you want library documentation.
3. Authenticate GitHub if you want GitHub Code Search in addition to grep.app and Sourcegraph.
4. Install Chromium if you need rendered pages.
5. Add extra search providers only if you expect to use federated research.

Run `ketch doctor` after changing configuration. It probes configured search providers, code search, Context7, the browser, and the cache. Optional services can remain unconfigured; the tools backed by them will report a precondition error when called.

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
