---
name: requirements-writing
description: 'Write clear product requirements for student apps. Use when converting validated designs into user stories, acceptance criteria, non-goals, dependencies, and developer-ready implementation scope.'
argument-hint: 'feature name, user segment, timeline, constraints'
user-invocable: true
---

# Requirements Writing

Convert validated product intent into unambiguous, testable developer requirements.

## When to Use
- User problem and solution direction are already validated.
- You are preparing implementation handoff to developers.
- Scope creep is starting and boundaries are needed.

## Procedure
1. Define requirement context.
- Problem summary, user segment, and release objective.

2. Write scope boundaries.
- In-scope items.
- Out-of-scope items.
- Timebox or phase constraints.

3. Create user stories.
- Format: As a [user], I want [action], so that [outcome].
- Limit first release to must-have stories.

4. Add acceptance criteria.
- Each story must have testable pass/fail conditions.
- Cover normal flow and edge behavior.

5. Define UX states.
- Normal, loading, empty, error, and permission-denied states.

6. Define data and API expectations.
- Inputs, outputs, validation rules, and error responses.

7. Capture non-functional requirements.
- Performance, reliability, accessibility, and security expectations.

8. Record dependencies and risks.
- Technical dependencies, blockers, assumptions, and fallback plans.

9. Final handoff review.
- Confirm developers can estimate and implement without ambiguity.

## Required Output Template
- Problem and user
- Release goal
- Scope and non-goals
- User stories
- Acceptance criteria
- UX states
- Data and API notes
- Non-functional requirements
- Dependencies and risks
- Open questions

## Decision Points
- If a story cannot be tested: rewrite acceptance criteria.
- If scope exceeds timeline: move lower-priority stories out of current phase.
- If key dependency is uncertain: add explicit risk and fallback behavior.

## Completion Criteria
- All stories include testable acceptance criteria.
- Scope and non-goals are explicit.
- UX and API behavior are fully described.
- Handoff has no unresolved blockers.

## Prompt Starters
- /requirements-writing Write developer-ready requirements for my login and profile feature.
- /requirements-writing Turn this validated design into user stories and acceptance criteria.
