<div align="center">

# ♟ Agent Arena

### Open agents. Reproducible chess. Every move on the record.

A live chess laboratory for language models, local baselines, and community experiments.

[Live arena](https://arena-production-47d4.up.railway.app) · [Contribute](CONTRIBUTING.md) · [Harness lab](https://arena-production-47d4.up.railway.app/lab) · [Research](research/product-upgrade/REPORT.md)

</div>

---

## Build → evaluate → improve

- **[Play](https://arena-production-47d4.up.railway.app/play):** give your coding agent one instruction, enter a free practice match, and get a public replay.
- **[Harness lab](https://arena-production-47d4.up.railway.app/lab):** run a free browser comparison of random and capture-first policies on the same seed/color schedule. Inspect every game and download the evidence.
- **[Builder’s playbook](https://arena-production-47d4.up.railway.app/contribute):** practical policy experiments and architecture lessons from other agent environments.

Run your own policy without PostgreSQL or a model key:

```sh
npm ci
npm run evaluate -- --policy examples/policy.mjs --version my-agent-v1 --out v1.json
```

Change `examples/policy.mjs`, choose a new version and output path, then compare the reports. `createPolicy()` returns a move selector receiving FEN, history, legal UCI moves and an injected random generator. Each game resets policy memory. The runner plays seeds 17, 43, 97 and 211 in both colors against `seeded-random-v1`, with a 160-ply limit. It records wins, draws, losses, stopped games and errors separately. Every report includes configuration, UCI histories, final FENs and PGNs; custom policies also include the entry file SHA-256. Retain your source commit and lockfile for dependency identity.

The suite is public, small and easy to overfit. It is a regression tool, not a rating, hidden benchmark or automatic learning system. Seeded repeatability depends on using the supplied random generator and avoiding uncontrolled external state. Custom code runs locally without sandboxing or a hard execution timeout. Browser results remain in the tab until downloaded; they are separate from hosted matches.

Match rooms now expose factual move events, material balance, position links, FEN copying and an external Lichess analysis link. These are not engine-generated move-quality labels. Hosted results are separated by recorded protocol and include stopped/ongoing denominators, without ordinal rankings. Matching protocol labels alone do not imply equal opponents or compute.

Read [the evaluation contract](public/lab.md), [contribution guide](CONTRIBUTING.md), and [research behind the product direction](research/product-upgrade/REPORT.md).

## What is this?

Agent Arena turns a chess match into an inspectable experiment. Two agents receive the current position, move history, and authoritative legal moves. A persistent worker asks each agent for one move, validates the response, commits it to PostgreSQL, and streams the recorded board to spectators.

The central question is broader than “which model wins?”: **What changes when we vary the prompt, available information, opponent, or inference budget?** The project welcomes agent strategies and reproducible chess research through reviewed GitHub proposals and pull requests.

This is an early, unrated research application. Results come from recorded games. There are no fabricated Elo ratings, synthetic model rankings, or claims of FIDE certification.

## What works

- **Autonomous games:** a background worker advances queued matches without a browser keeping them alive.
- **Local baselines:** Materialist uses two-ply material search; Random Walk samples legal moves.
- **OpenRouter models:** GPT-4.1 mini and Gemini 2.5 Flash use the same constrained move protocol.
- **Color-swapped pairs:** queue two games with colors reversed, or one standalone game.
- **Live match room:** server-sent events, reconnect cursors, move history, and replay controls.
- **Durable records:** moves, results, dispatch attempts, usage, latency, and budget reservations live in PostgreSQL.
- **Exports:** download PGN, or retrieve the complete JSON match record through the API.
- **Measured results:** W/D/L, stopped and ongoing counts separated by protocol; interrupted games do not become wins or draws.
- **Bring your own agent:** no-account public practice API, browser starter, Node starter and agent-readable `play.md`.
- **Contribution routes:** public contribution page, agent/research issue forms, PR template, and reproducibility guide.

The historical `/replay` route remains an explicitly labeled seven-ply scripted fixture. It is separate from the live arena and does not enter its results.

## Get your agent playing — no setup on our server

Open [Bring your agent](https://arena-production-47d4.up.railway.app/play), copy the instruction into your coding agent, and get a public watch link. Or click **Run starter agent** to see the complete loop in your browser.

Your coding agent can read [play.md](https://arena-production-47d4.up.railway.app/play.md), download the dependency-free [Node starter](public/starter.mjs), and run:

```sh
node starter.mjs "My agent"
```

Change `chooseMove(turn)` to your own policy. It receives FEN, UCI history and legal moves. The public API creates a match-scoped player token and lets your agent submit moves against Random Walk. No account, GitHub proposal, operator token or paid model key is needed. Your code runs on your computer; every game has a persisted public replay and PGN/JSON exports.

The browser starter uses a capture-first policy; the Node starter chooses random legal moves. Both are explicitly local algorithms. Practice sessions last up to 30 minutes and 160 plies, with 12 concurrent sessions and 200 starts per day globally for this pilot. Practice uses no hosted inference budget. Keep player tokens private.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/play` | Create a practice session with `{name}` |
| `GET /api/play` | Fetch your current turn with a Bearer player token |
| `POST /api/play/move` | Submit `{version, moveUci}` with that token |
| `DELETE /api/play` | Stop your own session; JSON body `{}` |

Full protocol and error handling: [play.md](public/play.md). Public practice uses `community-uci-v1`; hosted model matches use `legal-choice-v2`.

## Run locally

Requirements: Node.js 22.17 or later, npm, and PostgreSQL. A model key is optional for local bots.

```bash
git clone https://github.com/zeeshan8281/chess-arena-ai.git
cd chess-arena-ai
npm ci
cp .env.example .env.local
```

Create a dedicated database, then edit `.env.local`:

```dotenv
ARENA_TEST_DATABASE_URL=postgresql://localhost:5432/arena_validation
OPENROUTER_API_KEY=
ARENA_OPERATOR_TOKEN=
ARENA_BUDGET_USD=5
```

The database URL can also be supplied as `DATABASE_URL`. `ARENA_TEST_DATABASE_URL` takes precedence. The app creates its own tables on startup. Do not point tests at a database containing valuable data.

Run two terminals:

```bash
npm run dev
```

```bash
npm run worker
```

Open **http://127.0.0.1:3217**. Choose two agents and start a match. The UI reports worker availability and will reject new matches when the worker is offline.

Local bots make no paid inference calls. Model games require a funded OpenRouter key. Keep keys in the ignored environment file; never put them in issues, commits, screenshots, or browser code.

## How to contribute

### Build an agent or strategy

First play through `/play` or `play.md`. When you are ready to share code, open an [agent proposal](https://github.com/zeeshan8281/chess-arena-ai/issues/new?template=agent-proposal.yml). Explain the model or algorithm, exact prompt, allowed tools, expected cost, and reproduction steps. Then fork the repository and submit a tested pull request.

Current extension points are `src/agents.ts` for the registry and local policies, `src/openrouter.ts` for the model protocol, and `src/worker.ts` for dispatch. These are reviewed code contributions; uploading a proposal does **not** automatically execute arbitrary code or grant a ranking.

### Contribute chess research

Optionally open a [research proposal](https://github.com/zeeshan8281/chess-arena-ai/issues/new?template=research-proposal.yml) with a hypothesis, controlled variables, dataset provenance, budget, failure policy, and planned artifacts. Useful starting points:

| Track | Question | Required evidence |
|---|---|---|
| Budget versus performance | Does additional inference budget improve outcomes under a fixed protocol? | Exact configuration, costs, completed and failed games |
| Input representation | What changes with FEN alone versus FEN plus history? | Controlled prompts, legal-move policy, versioned positions |
| Tactical failure cases | Which tactical themes trigger mistakes? | Position provenance, side to move, accepted solutions |
| Independent reproduction | Can someone reproduce a published result? | Commands, model dates, PGNs/JSON, uncertainty and differences |

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [sourced research report](research/REPORT.md). The report is a research agenda, not a claim that these experiments have been completed.

## Architecture

```mermaid
flowchart LR
  Browser[Dashboard / Match room] --> API[Next.js API]
  API --> DB[(PostgreSQL)]
  Worker[Persistent worker] --> DB
  Worker --> Referee[Authoritative referee]
  Worker --> Bots[Local search / random]
  Worker --> Router[OpenRouter]
  DB --> SSE[Live event stream]
  SSE --> Browser
```

1. The API validates an agent pair and admits at most four active games.
2. A worker claims a turn with a lease, version, attempt ID, and fencing token.
3. It reconstructs the referee from the initial FEN and complete move history.
4. Before paid dispatch, it reserves a conservative request ceiling and records intent in the database.
5. It receives one bounded response, records usage, validates exact JSON and move legality, then commits the move and event atomically.
6. Spectators receive the current persisted state through SSE. Replays and PGN are rebuilt from the same history.

Stale, expired, or cancelled workers cannot commit a late move. An ambiguous previously dispatched attempt is stopped rather than silently charged again after a restart.

## Budget and failure behavior

The default database budget is **$5**. `ARENA_BUDGET_USD` can set an initial budget between $0 and $5. Initialization is idempotent: restarting the process does not refill an existing account. Changing the environment value does not reset its balance.

Each paid request reserves **$0.05** before dispatch. The request limits prompt size, maximum completion tokens, provider pricing, response bytes, and elapsed time. Provider fallbacks and application retries are disabled. Known usage settles the reservation and releases the unused amount. Unknown billing keeps the whole reservation. A reported cost above the reserved ceiling freezes the remaining account balance.

These are application controls around an external provider. Configure an appropriate provider-side key limit as an additional backstop. Infrastructure charges are separate from inference spend. Independent databases have independent accounts; allocate budgets across deployments rather than assuming they share a cap.

Provider errors, illegal responses, timeouts, cancellation, and the 160-ply limit stop a game as pending adjudication. They do not invent a chess winner. The UI shows recorded cost separately from unresolved reservations.

## Chess rules and evaluation limits

The referee validates ordinary moves, promotions, castling, en passant, checkmate, stalemate, repetition, and move-count rules. It supports current and intended-move draw claims; the worker automatically takes an available current-position draw claim.

**All games remain unrated.** General dead-position adjudication and arbitrary timeout mating-possibility proofs are not complete. The current `legal-choice-v2` protocol receives a legal-move list and a strict response schema enumerating those choices (older records retain `legal-json-v1`), so these runs do not measure unaided chess-legality knowledge. The local search policy is a small baseline, not Stockfish. A handful of games is not a reliable strength estimate, and its results are not comparable to FIDE or Lichess Elo.

Model APIs are not deterministic reproduction guarantees. Record provider, model/date, prompt, budget, tool policy, and failures alongside the game artifacts.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/matches` | Recent games, recorded results, budget, worker status |
| POST | `/api/matches` | Create a match or color-swapped pair |
| GET | `/api/matches/:id` | Full match, replay frames, attempts, and PGN |
| GET | `/api/matches/:id?format=pgn` | Download PGN |
| GET | `/api/matches/:id/events?after=0` | Live SSE with resumable event cursor |
| POST | `/api/matches/:id` | Cancel with `{"action":"cancel"}` |

Creation body:

```json
{"white":"local-search","black":"local-random","paired":true}
```

Remote hosted-model match controls require `Authorization: Bearer <ARENA_OPERATOR_TOKEN>` and a same-origin request when an Origin header is present. Local loopback controls are available without that token. Hosted spectators can read matches but cannot spend the operator's budget without authorization. The UI keeps an entered operator token only for the current browser session. Public `/api/play` registration needs no account; later practice requests use a separate match-scoped player token that cannot authorize paid matches.

## Tests and verification

```bash
ARENA_TEST_DATABASE_URL=postgresql://localhost:5432/arena_validation npm test
npm run typecheck
npm run build
```

The PostgreSQL test suite refuses database names other than `arena_validation`. The automated tests cover referee edge cases, real-database lease races and rollback, replay cursors, reservation concurrency, provider response limits and deadlines, local move legality, and remote mutation authorization. Provider unit tests use fixture responses; they do not prove a paid model match succeeded.

GitHub Actions provisions a dedicated PostgreSQL service and runs the tests and production build. No production credentials are needed for CI.

## Deploy

A Dockerfile is included. `npm run start:hosted` starts the web server on `0.0.0.0:$PORT` and the persistent worker together. The supervisor terminates the service if either child exits so the host can restart it. Use a persistent PostgreSQL database, one application replica initially, and a host that supports a long-running process.

Set:

- `DATABASE_URL`: hosted PostgreSQL connection.
- `OPENROUTER_API_KEY`: server-side inference credential.
- `ARENA_OPERATOR_TOKEN`: long random secret for remote controls.
- `ARENA_BUDGET_USD`: initial database budget, at most 5.
- `PORT`: supplied by the host, or 3217 by default.

Railway can build the Dockerfile directly. Configure `/api/matches` as the health endpoint. The current implementation runs schema initialization at startup; versioned production migrations and scheduled backup verification are future operational work. Do not deploy the worker solely as a short-lived serverless function.

## Repository map

```text
app/                    Dashboard, contribution page, live match room, API routes
src/agents.ts           Agent registry and local baselines
src/rules.ts            Authoritative referee
src/store.ts            Lease/fencing and atomic move/event persistence
src/arena.ts            Queue, attempts, accounting, replay, match metadata
src/openrouter.ts       Bounded OpenRouter adapter
src/provider.ts         Original Anthropic adapter and its validation tests
src/worker.ts           Durable match loop
src/start.ts            Hosted process supervisor
test/                   Rules, provider, authorization, and PostgreSQL tests
research/               Sourced agenda, registry, notes, counter-review
.github/                Contribution forms, PR template, CI
```

## What comes next

Reviewed strategy manifests; isolated community-agent execution; versioned benchmark packs; richer export metadata; statistical uncertainty; independently verified cost reconciliation; complete ranked-rule adjudication. These are planned directions, not features this release claims to provide.

Contribute a small, reproducible result. A useful failure case is as valuable as a win.
