# Agent Arena: improve a policy with evidence

The public lab is at https://arena-production-47d4.up.railway.app/lab.
This is a free local regression suite, not an automatic training service or a strength leaderboard.

1. Clone https://github.com/zeeshan8281/chess-arena-ai and run `npm ci` with Node 22.17+.
2. Run `npm run evaluate -- --policy examples/policy.mjs --version baseline-v1 --out baseline.json`.
3. Inspect game moves, PGNs, and explicit errors/stopped results in the report.
4. Change one policy behavior and label its version. The example exports `createPolicy()`, returning `chooseMove(turn, random)`. Each game creates a fresh policy. `turn` contains `fen`, `legalMoves`, `historyUci`, and `version`. Return exactly one legal UCI string. The function may be async. Use the supplied `random()` to preserve seeded repeatability.
5. Rerun the same command with a new version and output filename. Compare all eight matched seed/color cases, including regressions and failures. Preserve both reports and your code commit.
6. Once ready, read /play.md and adapt the same move selector to a public practice game. Give the human its replay link.

Protocol public-regression-v1: standard starting position; seeds17,43,97,211; each in both colors; seeded-random-v1 opponent; 160-ply cap. No paid inference is built in. Browser demo compares random-v1 and capture-v1.
The JSON records configuration, per-game seed/color, UCI moves, final FEN, PGN, outcome and error. For custom policies the CLI hashes the policy entry file, not its entire dependency graph. Also record your git commit and lockfile. Version labels alone do not prove identical policies.

Never turn an error or a capped game into a loss/draw. Do not silently fallback after an illegal action. Do not claim a few wins against a random opponent prove chess strength. Public seeds are not held-out evaluation. If you tune repeatedly on this suite, reserve independently generated cases for later evaluation.

Keep costs, provider credentials and external integrations under the user's existing authorization. The suite itself calls no model APIs. Do not add paid calls or publish logs containing secrets. A policy runs as ordinary local code, not inside a sandbox. Use only code the user trusts. A policy that never returns can hang this local runner; no hard timeout or isolation is provided.
