# Local implementation and verification

AS_OF: 2026-10-14. This is implementation evidence, separate from the external research report.

Implemented: frozen 32-position first-move suite, four source-rating bands, five requested model configurations and three executable community configurations; accuracy counts, descriptive Wilson intervals, per-band table, model/harness filters, latency, known/unknown billing, downloadable decisions, and visible unmeasured external clients. The prior random-opponent game chart remains an expandable regression baseline.

Scoring: apply the opponent setup move, compare the first response with the recorded first solution move. The fixed fixture has no mate-in-one themes. No retries or answer repair; errors count unsuccessful. Provider interruption continuation preserves attempted cases and only evaluates missing positions. Incomplete runs have no comparable score, interval or difficulty score. The 1,024-output-token/45-second model budget is visible. This is not unrestricted model capability, Elo, or full-game playing strength.

Evidence limits: initial batch preserved moves, FENs, errors, request IDs, model identities, latency and known billing but did not retain token counts or finish reasons. Later continuation records add those fields. Historical source hashes are not rewritten; post-run fixture/harness hash annotations are labeled. Original historical runner source was not archived byte-for-byte. Exact random-seed position selection reproduces all32 items from the pinned public CSV. Known response billing excludes unknown charges after provider/timeouts; aggregate key usage is reconciled separately.

Targeted checks: TypeScript and optimized Next build; fixture legality/solution continuations; evidence totals/intervals; conservative budget reservation and failure classification; continuation preservation test. Browser checks cover the homepage benchmark at1440px and390px, filters/selection, incomplete-state masking, unknown-cost wording and no horizontal page overflow. These checks are not a whole-application audit or a reproduction of external papers.

Not implemented: stronger full-game engine ladder, fresh held-out or private puzzle set, engine-equivalence grading of alternate moves, more samples/repeated trials, or automatic execution of external custom clients. These remain recommendations in the research report. No production deployment or GitHub push was performed.

## Final local results

All eight entrants completed32 scheduled attempts (256 total):

- Gemini 4 Argon: 19/32 correct; 1 response failures.
- GPT-6 Luna: 5/32 correct; 9 response failures.
- Gemini 2.5 Flash Lite: 4/32 correct; 1 response failures.
- Qwen3 32B: 1/32 correct; 0 response failures.
- queen gambit: 12/32 correct; 0 response failures.
- Launch Demo: 12/32 correct; 0 response failures.
- GitHub Starter: 12/32 correct; 0 response failures.
- Claude Haiku 5.5: 3/32 correct; 23 response failures.

Reported total key usage after completion: $0.575846; prior to this task: $0.4974454. This is aggregate provider-reported usage, separate from per-response known billing. No other paid runner remains active. TypeScript/build and nine targeted tests passed. Browser final checks are recorded by the lead.
