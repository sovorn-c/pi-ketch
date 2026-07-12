# Ketch tool surfaces

## `ketch_search`

Use for the open web. A routine search should omit `backend`, `multi`, and `allBackends` so Ketch uses the user's configured default. For contested, multi-part, or deep research, set `allBackends: true`; Ketch translates this to `--multi=all` and dynamically queries every backend it currently considers usable. `backend` selects one provider and `multi` selects an explicit provider list; all three modes are mutually exclusive. Set `scrape: true` only when fetched content from every result is needed. Pair it with a low `limit` and explicit `maxChars`.

## `ketch_code`

Searches public OSS through grepapp, Sourcegraph, or GitHub. Use `lang` to narrow results. `regex` is accepted by grepapp and Sourcegraph only. This tool never replaces local repository navigation.

## `ketch_docs`

For ambiguous libraries:

1. Call with `resolve: true`.
2. Vet title, description, snippet count, versions, and trust score.
3. Call again with the selected `library` ID and a focused query.

Do not trust the first fuzzy match solely because its score is high.

## `ketch_scrape`

Provide exactly one of `url` or `urls`. Start with a normal scrape; when a browser is configured, Ketch can automatically detect a JavaScript-only shell. If the result is empty, incomplete, or only an application shell, retry once with `forceBrowser: true` to skip direct fetching and render through the configured browser. Browser rendering does not guarantee access through authentication, CAPTCHAs, or anti-bot controls.

Unknown pages should normally use `maxChars: 6000`. `raw` cannot be combined with `selector` or `trim`. A bare domain may resolve to `/llms.txt`; set `noLlmsTxt: true` for the actual homepage. Batch failures appear as warnings while successful pages are still returned.

## `ketch_crawl`

Use for bounded same-host exploration. Defaults are 30 pages, depth 3, and 6,000 characters per page. Pi stops crawls after three minutes and returns collected pages as partial output. Use `allow` and `deny` to narrow large sites. Large archival crawls and background crawl management are operator tasks, not agent tools.
