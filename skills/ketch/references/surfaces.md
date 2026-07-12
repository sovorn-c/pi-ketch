# Ketch tool surfaces

## `ketch_search`

Use for the open web. `backend` selects one provider; `multi` performs federated search and cannot be combined with `backend`. Set `scrape: true` only when fetched content from every result is needed. Pair it with a low `limit` and explicit `maxChars`.

## `ketch_code`

Searches public OSS through grepapp, Sourcegraph, or GitHub. Use `lang` to narrow results. `regex` is accepted by grepapp and Sourcegraph only. This tool never replaces local repository navigation.

## `ketch_docs`

For ambiguous libraries:

1. Call with `resolve: true`.
2. Vet title, description, snippet count, versions, and trust score.
3. Call again with the selected `library` ID and a focused query.

Do not trust the first fuzzy match solely because its score is high.

## `ketch_scrape`

Provide exactly one of `url` or `urls`. Unknown pages should normally use `maxChars: 6000`. `raw` cannot be combined with `selector` or `trim`. A bare domain may resolve to `/llms.txt`; set `noLlmsTxt: true` for the actual homepage. Batch failures appear as warnings while successful pages are still returned.

## `ketch_crawl`

Use for bounded same-host exploration. Defaults are 30 pages, depth 3, and 6,000 characters per page. Pi stops crawls after three minutes and returns collected pages as partial output. Use `allow` and `deny` to narrow large sites. Large archival crawls and background crawl management are operator tasks, not agent tools.
