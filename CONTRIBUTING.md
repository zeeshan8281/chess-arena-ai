# Contribute to AI Chess Arena

Bring a chess-playing idea, or bring evidence about how chess-playing systems behave. You do not need an API key to propose either.

**Today, contributions enter through reviewed GitHub issues and pull requests. Submitting an issue does not upload, execute, deploy, or automatically rank an agent.** The runner currently accepts only the agents registered in `src/agents.ts`. Public visitors cannot spend the operator's inference budget.

## 1. Submit an agent or strategy

[Open an agent proposal](https://github.com/zeeshan8281/chess-arena-ai/issues/new?template=agent-proposal.yml), or [open a general issue](https://github.com/zeeshan8281/chess-arena-ai/issues/new) if the template is unavailable. Include:

- A short name, author, and source/license information.
- What changes: model, exact prompt, search policy, tool access, or combination.
- Exact model identifier and settings; disclose engine assistance and legal-move assistance.
- Expected resources: time per move, output-token limit, approximate cost, external services.
- Reproduction instructions, a commit hash, and example legal UCI output such as `e2e4`.
- Known failure cases and any evidence already collected. A negative result is welcome.

For code, fork this repository, make a branch, and open a pull request against the default branch. Keep the first change small enough to inspect. Do not send executable uploads to the public website; there is no sandboxed submission service yet.

### Where changes belong

| Change | Current implementation | What to check |
| --- | --- | --- |
| Local move policy | `src/agents.ts`: registry and `localMove` | Legal moves, terminal positions, promotions, predictable test RNG |
| Prompt or hosted-model behavior | `src/openrouter.ts`: `openRouterMove`, `parseMove` | Exact legal JSON, deadlines, body limits, usage accounting, no hidden retries |
| Scheduling or turn execution | `src/worker.ts` | Lease ownership, cancellation, failure records, restart behavior |
| Match persistence or budget | `src/arena.ts`, `src/store.ts` | Atomic writes, reservations, stale replies, concurrent requests |
| Chess adjudication | `src/rules.ts` | A focused regression test; do not convert uncertain results into wins/draws |
| Public controls | `src/http.ts`, `app/api/matches/` | Same-origin restrictions and operator authorization |

Adding a registry entry alone is insufficient for a new execution mechanism: `src/worker.ts` currently distinguishes local agents by the `local-` prefix and otherwise calls OpenRouter. Review the complete dispatch path. The existing OpenRouter adapter uses one common prompt for both registered model agents; configurable community prompts are a proposal, not an existing feature.

## 2. Contribute a reproducible chess study

[Open a research proposal](https://github.com/zeeshan8281/chess-arena-ai/issues/new?template=research-proposal.yml). Start with one testable question, for example: “Does showing legal moves reduce invalid outputs?” or “Does a prompt change improve performance at the same token budget?”

Include the hypothesis, baseline, exact input positions/openings, both-color schedule, sample size, exclusion rules, and measurements before running the experiment. Separate wins/draws/losses from invalid replies, timeouts, cancellations, and move-limit stops. A stopped game is not a draw.

An evidence PR should contain a short report plus the data and instructions needed to reproduce it:

- Exact code commit, model/provider identifiers, prompt, settings, run dates, and declared engine/tool assistance.
- Position or opening list with source, license, and split rules; randomness seeds where supported.
- PGNs, machine-readable game outcomes, and per-attempt latency/token/cost data. Remove credentials and personal data.
- Analysis code, environment/setup instructions, completed-game and failure counts, and uncertainty estimates where justified.
- Limitations, contrary observations, and a clear distinction between findings and hypotheses.

Read [the research agenda](research/REPORT.md) before choosing a first study. Those study designs are proposals. Existing game exports do not by themselves capture every item in a reproducibility bundle, and the current random baseline is not a seeded experiment runner.

## Local development and checks

Use Node **22.17 or newer** and PostgreSQL. From the repository root:

```sh
npm ci
cp .env.example .env.local
```

Set `ARENA_TEST_DATABASE_URL` in `.env.local` to an isolated database named `arena_validation`. Never use production data for tests. The example port `55439` is a local example, not a database installer. Model calls additionally require your own `OPENROUTER_API_KEY`; local agents do not.

Run the web server and worker in separate terminals:

```sh
npm run dev
```

```sh
npm run worker
```

Open http://127.0.0.1:3217. Start with the two local agents. To run the database tests, export the connection string in your shell; `npm test` does not automatically load `.env.local`:

```sh
export ARENA_TEST_DATABASE_URL=postgresql://127.0.0.1:55439/arena_validation
npm test
npm run typecheck
npm run build
```

Tests create records in that dedicated database. For a change to non-trivial logic, add a focused regression test under `test/`. Describe exactly what passed in the PR; do not claim a live-provider test from a mocked provider test.

## Review and acceptance

Maintainers review correctness, resource limits, evidence, and scope before merging or running a proposal. Review acceptance does not guarantee a tournament slot or a rating. All current matches remain **unrated**; local engines and hosted models must remain visibly identified. Arbitrary dead-position adjudication and a complete tournament-rules service are unfinished.

Keep keys in local environment files or the deployment secret store. Never include keys in issues, PGNs, screenshots, logs, or commits. For a suspected credential leak or exploitable issue, avoid publishing the secret or exploit details in a public issue; use GitHub private vulnerability reporting if enabled. This project does not yet promise a managed security-response process.

Not implemented: automatic community-agent execution, uploaded-code sandboxing, research job scheduling, or statistically validated public ratings. Contributions currently use human-reviewed issues and PRs.
