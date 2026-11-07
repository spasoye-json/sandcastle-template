# sandcastle-template — AFK agent loops on @ai-hero/sandcastle

Copy template for running unattended coding agents against a GitHub repo's
triaged issue queue, built on [`@ai-hero/sandcastle`](https://www.npmjs.com/package/@ai-hero/sandcastle).
Two consumption styles ship side by side:

- **Local runners** — `npm run agent` (`.sandcastle/main.ts`, serial drain with
  objective lint+test gate, correctness verifier, review↔fix loop, secret scan,
  metrics) and `npm run agent:parallel` (`.sandcastle/run.ts`, plan → implement →
  review across up to 4 issues at once, no auto-merge). Agents run in throwaway
  Docker sandboxes, and the objective gate (`npm ci`, lint, tests) runs in a
  throwaway container on the same image, so agent-written code never executes
  on the host. The host `gh` does all GitHub reads and writes and the container
  never sees a GitHub token. If the gate is red after the review↔fix loop, the
  runner withholds the push, comments on the PR, and labels the issue
  `ready-for-human`.
- **GitHub Actions runners** — five label-triggered workflows
  (`.github/workflows/agent-*.yml` → `.sandcastle/agent-workflows/*`):
  `agent:explore`, `agent:implement`, `agent:review`, `agent:update-branch`,
  plus a PR-comment-driven implement-pr flow. The three `pull_request_target`
  workflows (review, implement-pr, update-branch) check out `.sandcastle`
  tooling and the lockfile from the base branch, install and run it from
  outside the workspace, and treat the PR checkout as data only. There is no
  root `npm ci` on the PR checkout, so agents install repo dependencies
  themselves when running checks. Before the agent starts, each workflow
  script deletes `GH_TOKEN` and `GITHUB_TOKEN` from its environment so
  injected issue or PR text cannot direct the agent to use them. The one
  exception is update-branch, whose agent investigates with `gh` mid-run and
  therefore keeps the token, so that flow retains residual trust in PR
  content.
- **The `agent:auto` loop:** put `agent:auto` on an issue, and the agents
  take it to a PR that waits for your review. Implement opens the PR and puts
  `agent:auto` on it. Each review run then waits for CI on the new head and
  runs `.sandcastle/agent-workflows/auto/continue.sh`. The PR is green when
  CI passes, the review finds every acceptance criterion met, and the review
  has no open change request. A green PR gets `agent:ready`. A PR that is not
  green gets a round comment with the unmet criteria and the failed CI log,
  and `agent:implement` starts the fix agent, which hands back to the review.
  After `AGENT_AUTO_MAX_ROUNDS` fix rounds, 3 by default, the PR gets
  `agent:blocked`. Put `agent:auto` on an open PR to start the loop at the
  review. Remove the label to stop the loop after the current run. The loop
  needs `AGENT_PAT`. Set the repo variable `AGENT_CI_WORKFLOW` when your CI
  workflow file is not `ci.yml`. Without that file, the loop does not wait
  for CI.

Everything project-specific lives in exactly three consumer-edited files:

| File | Holds |
|---|---|
| `.sandcastle/sandcastle.config.ts` | repo slug, base branch, gate dir/commands, labels, branch prefix |
| `.sandcastle/PROJECT.md` | the project map injected into prompts: layout, docs, check commands, known pre-existing failures |
| `.sandcastle/CODING_STANDARDS.md` | house rules the reviewer and implementer enforce |

## Install

1. Copy into your project (files live at three top-level paths):

   ```bash
   npx degit spasoye-json/sandcastle-template /tmp/sc
   cp -r /tmp/sc/.sandcastle /tmp/sc/.github /tmp/sc/docs .
   ```

2. Merge the `devDependencies` and the `agent` / `agent:parallel` /
   `typecheck` scripts from this template's `package.json` into your root
   `package.json`, then `npm install`. (Keep `tsconfig.json` too if your repo
   does not already typecheck `.sandcastle/`.)

3. Edit `.sandcastle/sandcastle.config.ts` — set `repo`, `base`, `testDir`,
   `gateCommands`. Write `.sandcastle/PROJECT.md` and
   `.sandcastle/CODING_STANDARDS.md` for your project.

4. `cp .sandcastle/.env.example .sandcastle/.env` and set
   `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`) — used by the local runners.

5. Create the labels (see `docs/agents/triage-labels.md`): the triage trio
   `ready-for-agent` / `claude-working` / `ready-for-human` for the local
   runners, and `agent:explore` / `agent:implement` / `agent:review` /
   `agent:update-branch` / `agent:auto` (+ state labels `agent:in-progress`,
   `agent:blocked`, `agent:ready`) for the Actions runners. The loop creates
   `agent:ready` when it is missing.

6. For the Actions runners, add repo secrets: `CLAUDE_CODE_OAUTH_TOKEN`, and
   `AGENT_PAT` (a PAT that authors PRs so `GITHUB_TOKEN`'s own-PR-approval
   restrictions don't bite). Workflows fall back to `GITHUB_TOKEN`, but label
   events created with `GITHUB_TOKEN` never trigger other workflows, so
   without `AGENT_PAT` the implement flow cannot auto-start the review. It
   still applies the `agent:review` label and posts a PR comment, and a human
   must remove and re-add the label to run the review.

7. Provide agent skills at `.claude/skills/` in your repo — the local runners
   vendor that directory into each sandbox worktree (`copyToWorktree`), and the
   prompts assume a test-first implementer and a strict reviewer skill exist.

8. Local runners need Docker (the sandbox image builds on first run via
   sandcastle's docker provider).

## Environment

- `GH_REPO` overrides `config.repo` (the Actions workflows set it from
  `github.repository` automatically).
- `BASE_BRANCH` overrides `config.base` (the Actions workflows set it from the
  repo's default branch automatically).
- `TEST_DIR` overrides `config.testDir`.

## Pinned Claude Code version

Claude Code is pinned to `2.1.205` so upgrades are deliberate. To bump it,
change the version in `.sandcastle/Dockerfile` (the sandbox image for the
local runners) and in all five `.github/workflows/agent-*.yml` files.

## Verify the template standalone

```bash
npm ci && npm run typecheck
```

## Layout

```
.sandcastle/sandcastle.config.ts   the config seam (edit per project)
.sandcastle/PROJECT.md             project map injected into prompts (edit per project)
.sandcastle/CODING_STANDARDS.md    house rules (edit per project)
.sandcastle/main.ts                serial local runner (gate, verify, review loop, metrics)
.sandcastle/run.ts                 parallel local runner (plan → implement → review)
.sandcastle/lib.ts                 guardrail helpers (gate, secret scan, labels, metrics)
.sandcastle/*.md                   prompt files for the local runners
.sandcastle/agent-workflows/       GitHub Actions runners (one dir per flow + shared/)
.github/workflows/agent-*.yml      label-triggered workflow wiring
docs/agents/triage-labels.md       the label contract
```
