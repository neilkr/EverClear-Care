---
name: demo-testing
description: 'Prepare Congressional App Challenge demos with functional and abuse-path testing. Use when validating happy paths, edge cases, auth/authorization behavior, and demo reliability before recording the video.'
argument-hint: 'stack, key features, demo flow, risk focus'
user-invocable: true
---

# Demo Testing

Validate that your app works for judges and resists common misuse during demos.

## When to Use
- Before recording the demo video.
- After major feature or auth changes.
- Before final submission freeze.

## Procedure
1. Define the demo script.
- List the exact 2 to 4 minute flow.
- Identify must-pass checkpoints.

2. Build test matrix.
- Happy paths for each checkpoint.
- Edge cases for empty/invalid input.
- Abuse paths for unauthorized access attempts.

3. Run functional checks.
- Fresh account flow if applicable.
- Returning user flow.
- Error and recovery flow.

4. Run security behavior checks.
- Attempt direct access to protected routes.
- Submit malformed payloads.
- Trigger rate limits safely and confirm response.
- Verify no sensitive data appears in UI errors.

5. Run reliability checks.
- Test on mobile and desktop viewport.
- Repeat full demo flow twice from clean session.
- Verify load times are acceptable for live narration.

6. Capture evidence for submission confidence.
- Save screenshots or notes for each checkpoint.
- Record known limitations with mitigation notes.
- Finalize a no-surprises demo script.

## Completion Criteria
- All must-pass checkpoints succeed twice.
- Abuse-path checks behave safely.
- Error states are understandable and non-sensitive.
- Demo script is timed and reproducible.

## Prompt Starters
- /demo-testing Build a final pre-video test checklist for my app.
- /demo-testing Validate auth and edge cases for my Node API plus React frontend.
