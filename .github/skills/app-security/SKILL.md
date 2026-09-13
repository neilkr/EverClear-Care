---
name: app-security
description: 'Secure student app workflow for the Congressional App Challenge. Use when hardening web or mobile apps against hackers, adding auth, preventing OWASP Top 10 issues, validating input, locking down APIs, and running quick or advanced pre-submission security checks.'
argument-hint: 'mode, app type, stack, auth method, data sensitivity'
user-invocable: true
---

# App Security

Build and ship an app with practical security controls that are realistic for a student project and strong enough to block common attacks.

## When to Use
- You are building a new app and want security built in from day one.
- You already have an app and need a hardening pass before demo or submission.
- You are adding login, user data, file uploads, or public API endpoints.
- You want a repeatable security checklist for each release.

## Inputs to Collect
- Mode: quick baseline or advanced hardening.
- App type: web, mobile, game, API, or desktop.
- Stack: frontend and backend frameworks/languages.
- Auth plan: none, email/password, OAuth, school SSO.
- Data sensitivity: public, student profile, private notes, location, files.
- Deployment target: local only, Vercel/Netlify, cloud VM, container.

## Modes
- Quick baseline: for 1 to 2 days left before demo; implement top controls and run a short verification pass.
- Advanced hardening: for 3+ days left; adds stricter auth/session controls, broader test coverage, and release gates.

## Auth Default Policy
- If private or personal data exists, login is required.
- If the app is fully public and stores no private data, login can be optional.
- Even when login is optional, apply validation, abuse prevention, and secret handling controls.

## Stack Tracks
- React and Node/Express: prioritize API middleware validation, helmet-style headers, secure cookies or token storage, and route-level authorization.
- Python Flask/FastAPI: prioritize schema validation, secure session config, dependency scanning, and strict CORS.
- Static frontend plus hosted backend API: prioritize API auth, rate limiting, CORS allowlists, and secret management in deployment settings.

## Procedure
1. Define threat model in simple terms.
- List assets: accounts, personal data, app availability.
- List likely attackers: random internet user, spam bot, prank user.
- List attack paths: login brute force, bad input, exposed secrets.
- Decide top 3 risks to fix first.

2. Set secure defaults before feature work.
- Move secrets to environment variables.
- Disable debug/dev flags in production.
- Enforce HTTPS in production and secure cookies.
- Add security headers where relevant (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- Add dependency update and vulnerability scanning commands to CI or pre-release checks.

3. Implement authentication and session safety.
- If login exists or is required by policy: hash passwords with bcrypt/argon2, never plain text.
- Add minimum password policy and optional email verification.
- Use short-lived sessions/tokens with rotation or logout invalidation.
- Protect against brute force with rate limits and lockout/backoff.
- For OAuth, validate redirect URIs and verify token issuer/audience.

4. Protect authorization paths.
- Check access on every protected API route.
- Enforce resource ownership checks (user can only edit own data).
- Deny by default when role/ownership is missing.

5. Validate and sanitize all external input.
- Validate request body, query, params, headers.
- Enforce file size/type checks for uploads.
- Use parameterized queries/ORM protections for database calls.
- Escape or sanitize untrusted content rendered in UI.

6. Add abuse and attack resistance.
- Add request rate limiting on auth and expensive endpoints.
- Add CSRF protection for cookie-based sessions.
- Add CORS allowlist (no wildcard with credentials).
- Add basic bot/spam controls on public forms.

7. Improve observability and incident response.
- Log security-relevant events (failed logins, lockouts, permission denials).
- Do not log secrets, tokens, or full sensitive payloads.
- Add simple alerts/flags for repeated suspicious actions.

8. Run security verification checks.
- Dependency scan for known vulnerabilities.
- Manual test of auth, access control, input validation, upload handling.
- Confirm secret scanning and no hardcoded keys.
- Re-test top 3 risks from threat model.
- In advanced mode, add automated negative tests for authz and invalid payloads.

9. Prepare submission-safe documentation.
- Write a short Security Notes section in project docs.
- List controls implemented and one known limitation.
- Include how judges can safely test login/demo accounts.

## Decision Points
- If no sensitive data is stored: keep auth simple, focus on input validation and abuse prevention.
- If sensitive data is stored: require auth, stricter logging hygiene, and tighter authorization checks.
- If backend is serverless/static plus API: prioritize API auth and CORS/rate limiting.
- If team is short on time: implement top 3 risk controls first, then do one verification pass.
- If mode is quick baseline: finish sections 1, 2, 5, 6, and 8 first.
- If mode is advanced hardening: complete all sections and add automated security checks in CI.

## Completion Criteria
- Top 3 risks are documented and mitigated.
- No hardcoded secrets in repo.
- Auth and authorization paths pass manual negative tests.
- Input validation exists on all write endpoints.
- Rate limiting exists on login and key public endpoints.
- Security notes are ready for demo/submission.
- Quick baseline mode: all criteria above except CI automation.
- Advanced mode: all criteria above plus automated checks for authz failures and invalid input.

## Prompt Starters
- /app-security mode quick baseline, React and Node, public data only.
- /app-security mode advanced hardening for Flask API with student profile data.
- /app-security Do a pre-submission hardening checklist for my CAC project.
