---
name: release-metrics
description: 'Define and track release success metrics for student apps. Use when selecting outcome and UX metrics, setting baselines and targets, creating review cadence, and deciding iterate or scale after launch.'
argument-hint: 'release goal, user segment, timeline, data sources'
user-invocable: true
---

# Release Metrics

Create a practical measurement plan so product decisions are evidence-based after release.

## When to Use
- Before launch to define success targets.
- After launch to review real performance.
- When deciding whether to iterate, rollback, or expand.

## Defaults
- Minimum metrics: 1 outcome metric and 1 user-experience metric.
- Baseline required before judging success.
- Review cadence: daily for first 3 days, then weekly.

## Procedure
1. Define release objective.
- One sentence objective tied to user value.

2. Choose success metrics.
- Outcome metric examples: task completion rate, activation rate, retention.
- UX metric examples: time-to-complete, error rate, satisfaction score.

3. Define metric formulas.
- Specify numerator, denominator, and data source for each metric.

4. Set baseline and target.
- Baseline from pre-release or pilot data.
- Target with timeframe and confidence assumptions.

5. Add guardrail metrics.
- Track harmful side effects like crashes, auth failures, or support complaints.

6. Define review cadence and owners.
- Who checks each metric and when.
- Trigger thresholds for action.

7. Decide actions from results.
- If target met: scale or expand.
- If near target: iterate focused improvements.
- If below guardrails: hotfix or rollback decision.

## Decision Points
- If no baseline exists: run a short pilot to establish one.
- If data source is unreliable: simplify instrumentation before launch.
- If metrics conflict: prioritize user safety and core outcome metric.

## Completion Criteria
- Objective, metrics, formulas, and data sources are documented.
- Baseline and target are set for each required metric.
- Guardrails and action thresholds are defined.
- Owners and review schedule are assigned.

## Prompt Starters
- /release-metrics Define launch metrics for my first student app release.
- /release-metrics Build a weekly review plan and go/no-go thresholds.
