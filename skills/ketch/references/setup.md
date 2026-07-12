# Ketch setup and recovery

Configuration and installation are operator actions. Never perform them without explicit user approval.

## Read-only diagnosis

Use `/ketch-version`, `/ketch-config`, or `/ketch-doctor` when available. The installed binary and effective config outrank static documentation.

## Installation

If the binary is missing, propose one exact command and wait for confirmation:

```sh
brew install 1broseidon/tap/ketch
```

Alternative:

```sh
go install github.com/1broseidon/ketch@latest
```

## Missing preconditions

Ketch normally prints an exact remedy, such as a missing Context7 API key or configured browser. Explain it and ask before executing `ketch config set ...` or `ketch browser install`.

Do not expose or copy API keys into Pi settings. Ketch owns its config and credentials.

## Backend recovery

- Validation: correct the request.
- Not found: change the query or target.
- Upstream: retry once or choose another backend known to be configured.
- Precondition: stop and request operator action.
- Cancelled: reduce scope.

Do not repeatedly run `doctor` during normal research; it probes multiple external services and may return nonzero when optional backends are unconfigured.
