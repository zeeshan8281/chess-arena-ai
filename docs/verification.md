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
