---
name: product-manager-workflow
description: 'Product manager workflow for student apps. Use when identifying a user problem, researching it, interviewing users, proposing and validating solutions, drafting requirements, handing off to developers, testing with users, and measuring success.'
argument-hint: 'product idea, target users, timeline, constraints, metric goals'
user-invocable: true
---

# Product Manager Workflow

Run a complete product management cycle from problem discovery to measurable outcomes.

## When to Use
- You have an idea but are not sure what real user problem it solves.
- You need to define product requirements before development starts.
- You want a repeatable process to validate product decisions with users.

## Inputs to Collect
- Product area and context.
- Suspected user pain point.
- Candidate user segments.
- Timeline and team capacity.
- Constraints: technical, budget, policy, privacy, or school rules.

## Default Standards
- Interview minimum: 5 users minimum for early validation, 8 users preferred before final scope lock.
- Agreement threshold: at least 70% of interviewed primary users say the solution would solve their problem.
- Metrics rule: define at least 1 business or outcome metric and 1 user-experience metric.
- Handoff format: use the required developer handoff template in this skill.

## Procedure
1. Identify the core problem.
- Write a one-sentence problem statement.
- Record observed evidence that the problem is real.

2. Research the problem.
- Gather qualitative signals: interviews, comments, complaints, classroom observations.
- Gather quantitative signals if available: usage drops, errors, delays, completion rates.
- Check existing alternatives and gaps.

3. Define the user facing the problem.
- Segment likely users by role, goal, and context.
- Select primary user and secondary users.

4. Talk to users.
- Conduct short interviews with open-ended questions.
- Capture direct quotes, current workflows, blockers, and desired outcomes.
- Interview at least 5 primary users before solution commitment.

5. Find what users actually want.
- Convert interview notes into jobs-to-be-done or user needs.
- Separate must-have needs from nice-to-have preferences.

6. Propose solution options.
- Create 2 to 3 candidate solutions.
- Compare each option on user value, effort, risk, and timeline.

7. Explain the preferred solution to users.
- Present a simple concept or prototype.
- Ask users to explain back what they think it does.

8. Get user agreement on direction.
- Confirm the proposed solution addresses the target pain point.
- Capture explicit accept/reject feedback and reasons.
- Require at least 70% positive agreement from primary users before full requirements are finalized.

9. Design before writing full requirements.
- Draft user flow, wireframes, and edge-state behavior first.
- Identify assumptions and unresolved UX risks.

10. Write requirements.
- Convert validated design into clear product requirements.
- Include scope, user stories, acceptance criteria, constraints, and non-goals.

11. Hand off to developers.
- Share requirements and design artifacts.
- Confirm implementation plan, dependencies, and risks.
- Use the required handoff template so no critical implementation details are missed.

12. Test the built solution.
- Run feature, edge-case, and failure-path tests.
- Verify acceptance criteria are met.

13. Ask users to test.
- Run user validation sessions against real tasks.
- Capture friction points and unmet needs.

14. Define and track success metrics.
- Pick leading and lagging indicators.
- Set baseline, target, and review window.
- Decide go/no-go for iteration or wider release.
- Always include 1 outcome metric and 1 user-experience metric.

## Decision Points
- If evidence is weak in steps 1 to 2: run more discovery before committing to solution design.
- If user segments disagree: prioritize primary user outcomes, document tradeoffs.
- If users do not understand or accept the solution in steps 7 to 8: return to steps 5 to 6.
- If design risks are high in step 9: prototype and test before final requirements.
- If implementation exceeds capacity in step 11: reduce scope to must-have requirements.
- If fewer than 5 user interviews are complete: do not lock the solution direction.
- If agreement is below 70%: revise problem framing or solution and re-test with users.

## Completion Criteria
- Problem statement is evidence-backed and tied to a primary user.
- User interviews produced validated needs and clear priorities.
- A user-accepted solution direction is documented.
- Design artifacts exist before requirement finalization.
- Requirements include acceptance criteria and non-goals.
- Developer handoff completed with aligned scope.
- Product and user testing were executed.
- Success metrics include baseline, target, and review date.
- At least 5 interviews are completed and summarized.
- Agreement score from primary users is 70% or higher.
- At least 1 outcome metric and 1 UX metric are defined with targets.

## Developer Handoff Template
- Problem and user: who has the problem, why it matters now.
- Scope: in-scope items, out-of-scope items, and phase boundaries.
- User stories: actor, action, outcome.
- Acceptance criteria: testable pass/fail conditions per story.
- UX and states: normal, empty, loading, error, and permission-denied states.
- Data and API changes: schemas, endpoints, validation, and migration notes.
- Security and privacy: auth assumptions, data handling, and risks.
- Dependencies and sequencing: blockers, owner, and expected order.
- Test cases: happy path, edge cases, and failure paths.
- Release and rollback notes: launch checks and fallback behavior.

## Prompt Starters
- /product-manager-workflow Turn my app idea into validated requirements in 2 weeks.
- /product-manager-workflow Help me interview users and pick the best solution path.
- /product-manager-workflow Build a success metric plan for my first release.
