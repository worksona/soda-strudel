# Starting risks for Software product — review

The `agile-default` pack proposes these risks for this project. Nothing is live yet.

Edit the YAML block at the bottom to change a date, reword a title, or delete a row;
then approve the card. `project-scaffolder adopt-seeds` writes exactly what the block says.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Release scope grows sprint over sprint | high | medium | Release scope frozen at feature-complete; new stories go to the next increment. |
| One developer is the only person who understands a critical component | medium | high | Pairing and code review on that component; architecture notes in the wiki. |
| An external integration behaves differently in production | medium | high | Integrate against real sandboxes in the first sprints, not during hardening. |

<!-- seed-payload: adopt reads the YAML block below; edit it to change what is written -->

```yaml
risks:
- slug: scope-creep
  title: Release scope grows sprint over sprint
  likelihood: high
  impact: medium
  mitigation: Release scope frozen at feature-complete; new stories go to the next increment.
- slug: key-developer-dependency
  title: One developer is the only person who understands a critical component
  likelihood: medium
  impact: high
  mitigation: Pairing and code review on that component; architecture notes in the wiki.
- slug: integration-surprises
  title: An external integration behaves differently in production
  likelihood: medium
  impact: high
  mitigation: Integrate against real sandboxes in the first sprints, not during hardening.
```
