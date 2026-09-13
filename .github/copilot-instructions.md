# Copilot Instructions

For this repository, prioritize secure-by-default implementation choices.

## Security Defaults
- Never hardcode API keys, passwords, tokens, or secrets in source files.
- Prefer environment variables and include safe placeholders when needed.
- Validate all untrusted input on server-side write and auth routes.
- Enforce authorization checks on protected routes and ownership-based resources.
- Recommend rate limiting on login and high-cost endpoints.
- Avoid logging secrets, tokens, or full sensitive payloads.

## Development Behavior
- Propose the simplest secure option that fits student-level scope.
- When adding new endpoints, include basic negative-case testing guidance.
- If a request conflicts with secure defaults, explain risk and offer a safer alternative.
