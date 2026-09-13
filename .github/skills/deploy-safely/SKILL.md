---
name: deploy-safely
description: 'Deploy student apps safely for demos and judging. Use when preparing release configs, environment secrets, HTTPS, CORS, logging, rollback plans, and post-deploy verification for the Congressional App Challenge.'
argument-hint: 'platform, stack, environment, release type'
user-invocable: true
---

# Deploy Safely

Ship a stable and secure demo build with clear rollback and verification steps.

## When to Use
- You are deploying your app for judges or testers.
- You are moving from local development to a public URL.
- You changed auth, APIs, or environment variables.

## Procedure
1. Freeze release scope.
- Tag a release commit.
- Disable unfinished features behind flags.
- Document known non-blocking issues.

2. Validate environment and secrets.
- Confirm production env vars are set.
- Rotate any leaked or previously shared keys.
- Ensure no secrets are committed in repository history.

3. Enforce production security config.
- HTTPS only and secure cookie settings.
- CORS allowlist for trusted origins only.
- Production logging without sensitive payloads.
- Disable debug and verbose error pages.

4. Run pre-deploy checks.
- Install and lock dependencies.
- Run tests and lint.
- Run dependency vulnerability scan.

5. Deploy with rollback readiness.
- Deploy current build.
- Keep previous stable version reference.
- Record exact rollback command/process.

6. Run post-deploy smoke and security checks.
- Verify homepage and core user flow.
- Test login/logout and permission boundaries.
- Confirm rate limiting and error handling behavior.
- Validate security headers and cookie flags.

7. Prepare demo-safe operations.
- Create judge-safe demo account or seeded test data.
- Add simple health check endpoint/page.
- Add support notes for temporary outage handling.

## Completion Criteria
- Public URL is stable and reachable.
- Core flow passes from clean browser session.
- No exposed secrets, debug panels, or stack traces.
- Rollback plan is documented and tested.
- Demo account and judge notes are ready.

## Prompt Starters
- /deploy-safely Prepare my React plus Express app for judge demo.
- /deploy-safely Harden my Flask deployment on Render for CAC submission.
