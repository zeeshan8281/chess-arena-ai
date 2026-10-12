# Deployment verification — 13 October 2026

This is a targeted implementation and integration check, not a full security audit or a statistically meaningful chess benchmark.

## Code and runtime

Application commit: `ca4595f` (public onboarding), following `4666803` (strict legal-move model schema). Railway deployment `5d171fec-a0aa-4935-b4d3-13cfb6e0e666` reported SUCCESS. GitHub checks for `ca4595f` passed: https://github.com/zeeshan8281/chess-arena-ai/actions/runs/38306249018 .

- 46 tests passed, including isolated PostgreSQL tests for atomic queue admission, accounting, cancellation fencing, public session tokens, concurrent public move submission, legal-move validation, expiry, practice capacity and request-origin checks.
- Production Next build and TypeScript passed.
- Local production server and worker ran against the dedicated local database; the Railway server and worker ran against hosted PostgreSQL.
- Public `/play`, `/play.md`, and `/starter.mjs` returned HTTP 200 with appropriate content types.

## First-time onboarding

The deployed browser flow was exercised without entering an operator token or provider key: name a player, start the browser policy, receive a public watch link, observe 48 accepted plies, then stop and retain the replay.

Replay: https://arena-production-47d4.up.railway.app/matches/dff34045-d7f1-401b-bcad-8d0c99626831

The downloadable Node starter ran a complete 160-ply local practice session, reached the documented move limit, and printed PGN/JSON export links. The same Node starter also created and advanced a hosted public game:

https://arena-production-47d4.up.railway.app/matches/c3522b24-2a06-4636-96e7-057878f70bae

A separate hosted API check confirmed session creation (201), illegal-move rejection (422), denial of paid-match creation with a public player token (403), and player cancellation (200). Public match records did not expose the player token. Hosted inference-account figures remained unchanged during these free practice checks.

## Paid model execution

A real GPT-4.1 mini versus Gemini 2.5 Flash game finished with Black checkmating at 144 plies under `legal-choice-v2`:

https://arena-production-47d4.up.railway.app/matches/ee86261b-84a0-461c-a73b-1fbcb00ab349

Its exported PGN was replayed through chess.js; the final FEN matched the persisted final frame and checkmate was confirmed. Other runs reached the 160-ply cap, and earlier `legal-json-v1` runs failed on invalid model replies. Those records remain visible; stopped games are not counted as draws or wins. This sample does not establish comparative model strength.

SSE returned persisted frames, a future `after` cursor returned 409, and PGN/JSON endpoints returned downloadable attachments. Anonymous hosted-model mutation requests returned 403.

## Material limits

Public players execute on their own machine or in the browser starter. Uploaded-code hosting, a tournament scheduler, complete dead-position proofs, and validated ratings are not implemented. Practice has a global pilot capacity of 12 simultaneous sessions and 200 starts per day. This is not a complete internet-abuse defense or a load test.

Desktop browser interaction was checked. A mobile viewport override did not apply to the existing browser tab, so a mobile visual pass is not claimed. Long-term backup restoration, large-scale load, third-party paper replication and contributor-demand validation were not performed.

## Harness lab and research-led product update — October 13, 2026

- Inspected all five supplied product links in Chrome, without webfetch: Softmax, Proxy War, STS2 agent, its Hugging Face dataset URL, and the Warcraft X post. Followed the STS2 pod design and Warcraft article. The dataset returned 404; its contents were not inspected. External performance claims were not reproduced. Research registry, two complete drafts, counter-review and synthesis are in `research/product-upgrade/`.
- Implemented a browser comparison of two fixed policies and a local custom-policy CLI. Both use the existing referee, four seeds, both colors, seeded random opponent, and a 160-ply cap. Public regression only; no training, hidden evaluation, server-side custom code or persistent version registry.
- Full local suite: **50/50 tests passed**, including PostgreSQL integration, repeated deterministic evaluations, paired-color reconciliation, legal PGN reconstruction, explicit invalid-policy outcomes, protocol aggregates and factual move annotations. Tests loaded the isolated local environment with `node --env-file=.env.local --import tsx --test test/*.test.ts`. An initial invocation without database environment failed its explicit database guard; corrected invocation passed.
- Browser comparison completed 16 games. Random: 0 wins, 0 draws, 0 losses, 8 stopped, 0 errors. Capture-first: 2 wins, 2 draws, 0 losses, 4 stopped, 0 errors. Counts describe this public suite only.
- Downloaded comparison JSON through the browser and independently loaded every PGN with chess.js; all 16 final positions and move counts matched. Random policy move sequences matched a separate custom-policy CLI run. CLI report included a 64-character SHA-256 of the policy entry file. Browser download-event automation timed out, but the file was present in Downloads and its contents were verified directly.
- Browser selected a winning game and moved the replay slider to ply 1; board/move text updated. A hosted-record local replay URL with `?ply=4` restored ply 4, and the checkmate/capture event navigated to ply 9. Share action reported success. No claim is made about clipboard interoperability beyond that visible state.
- Found the Lichess query-string form opened the starting position. Replaced it with the direct `/analysis/standard/<FEN_with_underscores>` form; browser verified the exact selected FEN and generated PGN on Lichess. No external engine analysis was run.
- Desktop homepage visually inspected. This was targeted functional and visual QA, not a complete accessibility, mobile, security or scientific evaluation audit.
- Browser reports remain in memory until downloaded; local policy code is unsandboxed and has no hard execution timeout. Policy entry hashes do not cover transitive dependencies; keep the git commit and lockfile. All arena matches remain unrated.
