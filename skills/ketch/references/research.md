# Deep research workflow

Use this workflow when a question is contested, time-sensitive, multi-part, or requires corroboration.

## Plan

Before calling tools, define a small budget:

- 2–4 distinct search queries
- 3–6 pages to inspect
- 4,000–8,000 characters per page
- At most one backend retry per failed query

## Execute

1. Use `ketch_search` with `allBackends: true` so Ketch queries every search backend it currently considers usable; do not hardcode backend names.
2. Search with narrowly varied queries rather than repeating synonyms.
3. Deduplicate hosts and select sources deliberately.
4. Prefer primary sources plus one independent corroborating source.
5. Scrape only selected URLs unless every result is genuinely needed. Retry once with `forceBrowser: true` only when a normal scrape returns empty, incomplete, or JavaScript-shell content.
6. Use `ketch_code` to verify claims about real-world adoption.
7. Use `ketch_docs` for library contracts rather than relying on blog summaries.
8. Check warnings and partial failures after every batch or crawl.

## Synthesize

- Attach a URL to each substantive external claim.
- Attribute disagreement rather than averaging it away.
- Separate facts, interpretations, and unknowns.
- Mention important sources that could not be retrieved.
- Do not cite search-result descriptions as if the underlying page had been verified when precision matters.
