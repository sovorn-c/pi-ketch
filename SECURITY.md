# Security policy

## Supported versions

`pi-ketch` is a small community package and supports only its latest npm release.

| Version | Security fixes |
| --- | --- |
| Latest npm release | Yes |
| Older releases | No |

Before reporting a problem, confirm the installed version with:

```sh
npm view pi-ketch version
node -p "require('$HOME/.pi/agent/npm/node_modules/pi-ketch/package.json').version"
```

## Report a vulnerability

Do not open a public issue for a suspected vulnerability. Use [GitHub private vulnerability reporting](https://github.com/sovorn-c/pi-ketch/security/advisories/new).

Include enough information to reproduce and assess the report:

- the `pi-ketch`, Pi, Ketch, Node.js, and operating-system versions
- the affected tool and parameters, with secrets removed
- expected and observed behavior
- a minimal reproduction or proof of concept
- the likely impact
- whether the behavior also occurs when running Ketch directly

Maintainers will respond and coordinate a fix on a best-effort basis. Please allow time for investigation before publishing details.

## Reporting scope

Report problems here when they are caused by the Pi adapter, including:

- command or argument injection
- a URL validation bypass
- credentials or sensitive local data appearing in tool output
- failures in output bounds, crawl limits, cancellation, or timeout enforcement that create a security impact
- unsafe temporary-file handling
- misleading agent guidance that causes a concrete security boundary to be bypassed

If a direct Ketch CLI command reproduces the vulnerability, report it privately to the [Ketch maintainers](https://github.com/1broseidon/ketch/security) as well. Vulnerabilities in Pi itself belong in the [Pi repository](https://github.com/badlogic/pi-mono). Provider account and API issues should be reported to that provider.

The following are usually operational problems rather than vulnerabilities:

- a missing API key or optional backend
- an unreachable self-hosted service
- a search provider returning poor or unexpected results
- authentication, CAPTCHA, rate-limit, or anti-bot failures
- a target page returning malicious or inaccurate text without escaping the documented untrusted-content boundary

## Security boundaries

### Package execution

Pi packages run with the user's permissions. `pi-ketch` launches the configured Ketch executable directly, without a shell, and places free-form query input after `--`. The `KETCH_BIN` environment variable is operator-controlled and must point to a trusted executable.

### Network access and SSRF

Scrape and crawl inputs accept only absolute HTTP and HTTPS URLs. This protocol check is not complete SSRF protection. Ketch can reach loopback addresses, private networks, cloud metadata services, and other HTTP services available from the host.

Do not expose these tools to untrusted users on a privileged network. Use network isolation or a sandbox when stronger outbound-access controls are required.

### Untrusted content

Search results and fetched pages are untrusted data. They may contain prompt injection, misleading instructions, or hostile markup. Agents must use the content as research material and must not treat it as system or operator instructions.

### Credentials and configuration

`pi-ketch` uses Ketch's existing configuration, environment variables, and supported credential sources such as the `gh` CLI. It does not copy API keys into Pi settings. Do not include credentials in prompts, bug reports, test fixtures, screenshots, or committed configuration.

### Browser rendering

Forced browser rendering starts the Chromium executable configured in Ketch. Browser rendering does not bypass authentication, CAPTCHAs, or strong anti-bot controls. Keep Chromium updated and do not configure an untrusted browser binary.

### Cache and temporary output

Ketch maintains a local page cache. When formatted output exceeds Pi's visible limit, `pi-ketch` may save the full result to a temporary file so Pi can read it later. Cached pages and temporary files can contain sensitive fetched content. Avoid scraping private pages unless the host and local storage are trusted, and remove sensitive cache or temporary data according to your operating environment's policy.
