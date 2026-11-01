# Starting milestones for Software product — review

The `agile-default` pack proposes these milestones for this project. Nothing is live yet.

Edit the YAML block at the bottom to change a date, reword a title, or delete a row;
then approve the card. `project-scaffolder adopt-seeds` writes exactly what the block says.

| Milestone | Due | Phase | Done when |
|---|---|---|---|
| Discovery complete | 2026-11-13 | 01-discovery | Problem, users and first release scope agreed; first sprint backlog ready |
| First sprint demo | 2026-11-27 | 02-build-loops | Working software demonstrated to the sponsor or users |
| First release feature-complete | — (70%) | 02-build-loops | Every story in the release scope done or explicitly deferred |
| Hardening complete | — (end-2w) | 03-hardening | No open blocker defects; performance and security checks passed |
| First release | — (end) | 04-release | Released to users; release notes published |

**Undated:** these rows could not be dated because a date is missing from the manifest.
Set it and re-seed, or type the date into the block below:

- feature-complete: needs project.start_date and project.end_date
- hardening-complete: needs project.end_date
- first-release: needs project.end_date

<!-- seed-payload: adopt reads the YAML block below; edit it to change what is written -->

```yaml
milestones:
- slug: discovery-complete
  title: Discovery complete
  due: '2026-11-13'
  due_expression: start+2w
  phase: 01-discovery
  acceptance: Problem, users and first release scope agreed; first sprint backlog ready
- slug: first-sprint-demo
  title: First sprint demo
  due: '2026-11-27'
  due_expression: start+4w
  phase: 02-build-loops
  acceptance: Working software demonstrated to the sponsor or users
- slug: feature-complete
  title: First release feature-complete
  due: null
  due_expression: 70%
  phase: 02-build-loops
  acceptance: Every story in the release scope done or explicitly deferred
- slug: hardening-complete
  title: Hardening complete
  due: null
  due_expression: end-2w
  phase: 03-hardening
  acceptance: No open blocker defects; performance and security checks passed
- slug: first-release
  title: First release
  due: null
  due_expression: end
  phase: 04-release
  acceptance: Released to users; release notes published
```
