# Contributing to pi-ketch

`pi-ketch` is a small adapter between Pi and the Ketch CLI. Contributions should stay focused on that boundary: tool schemas, argument construction, process handling, bounded output, Pi rendering, and the bundled research skill.

## Before you start

Open an issue before beginning a broad feature or behavioral change. Small bug fixes, tests, and documentation corrections can go directly to a pull request.

Reproduce backend behavior with the Ketch CLI when possible. If the same problem occurs in a direct Ketch command, it probably belongs in the [Ketch repository](https://github.com/1broseidon/ketch). Include that reproduction when opening an issue here so maintainers can confirm which project owns the fix.

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](./SECURITY.md) instead.

## Development setup

You need:

- Node.js 22.14 or newer
- Pi 0.80.6 or newer for manual integration testing
- Ketch 0.11 or newer for optional live tests

Clone the repository and install dependencies:

```sh
git clone https://github.com/sovorn-c/pi-ketch.git
cd pi-ketch
npm install
```

Run the complete local check:

```sh
npm run validate
```

This runs the TypeScript checker, unit tests, and `npm pack --dry-run`.

## Repository layout

- `src/tools/`: Pi tool definitions and Ketch argument builders
- `src/schemas.ts`: tool input schemas and limits
- `src/ketch.ts`: process execution, cancellation, timeouts, and crawl streaming
- `src/output.ts`: output bounds and temporary-file handling
- `src/format.ts`: model-facing Markdown formatting
- `src/render.ts`: Pi TUI rendering
- `skills/ketch/`: agent routing and research guidance
- `test/`: argument, process, and output tests

## Testing changes

The unit tests use a fake Ketch executable. They do not require network access, credentials, Chromium, or a configured Ketch installation.

Add or update tests when changing:

- tool parameters or defaults
- generated CLI arguments
- validation and incompatible-option rules
- exit-code handling
- cancellation or timeout behavior
- crawl and output bounds
- formatted result shapes

Live tests are optional and should remain small. Use low result counts, short crawls, and public test pages. Never add API keys, tokens, local configuration, cache data, or machine-specific browser paths to the repository.

To load the checkout directly in Pi:

```sh
pi --no-extensions -e ./src/index.ts
```

Useful operator checks include:

```sh
ketch version
ketch doctor
```

A failed optional backend is not automatically a `pi-ketch` failure. Confirm that the backend is configured, then reproduce the call with Ketch directly.

## Change guidelines

- Keep tool inputs bounded and preserve the limits in `src/schemas.ts`.
- Spawn commands without a shell and keep free-form input after `--`.
- Preserve cancellation, timeout, and Ketch exit-code behavior.
- Accept only HTTP and HTTPS URLs for scrape and crawl inputs.
- Treat fetched content as untrusted data, not agent instructions.
- Keep routine search provider-neutral. The operator chooses the default backend; agents should not hardcode one.
- Separate operator setup instructions from agent behavior in documentation and skills.
- Avoid adding another service SDK when Ketch already exposes the capability through its CLI.

## Pull requests

Before submitting a pull request:

1. Keep the change focused and explain the user-visible behavior.
2. Add tests for changed behavior or explain why no test is needed.
3. Run `npm run validate`.
4. Update the README or bundled skill when tool behavior changes.
5. Confirm that no credentials, local paths, generated archives, or cache files are included.

Maintainers handle version bumps, npm publishing, and release tags. Contributors should not change the package version unless a maintainer asks them to.
