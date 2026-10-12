# Task C — Trustworthy results and benchmark presentation

AS_OF: **2026-10-13**. Role: evaluation-methodology researcher. Status: complete, awaiting draft/counter-review assignment. Scope: public primary sources plus a targeted read of current app files. No code edited, experiment run, benchmark replicated or visitor interviewed.

## Sources

All are publicly accessible, directly fetched, and accessed **2026-10-13**. Publication dates below are distinct from retrieval dates.

| ID | Source | Type | Publication/revision | Authority / retrieval |
| --- | --- | --- | --- | --- |
| C1 | [Google DeepMind Game Arena](https://github.com/google-deepmind/game_arena) | official | Undated mutable README; no commit pinned | 9/10 for documented harness options; complete README read |
| C2 | [Hugging Face evaluation guidebook: Troubleshooting reproducibility](https://github.com/huggingface/evaluation-guidebook/blob/main/contents/troubleshooting/troubleshooting-reproducibility.md) | official | Undated mutable document; no commit pinned | 9/10 for documented evaluation practice; complete 90-line chapter read |
| C3 | [Hugging Face: Leaderboards and Evaluations](https://huggingface.co/docs/leaderboards/index) | official | Undated current documentation | 9/10 for platform taxonomy; page fetched/read |
| C4 | [LLM Chess: Benchmarking Reasoning and Instruction-Following in LLMs through Chess](https://arxiv.org/html/2512.01992v1) | other: primary research preprint | Submitted 2025-12-01; v1 | 8/10 for its described protocol; full HTML fetched, design/metrics/settings/limitations sections read; venue not independently established |
| C5 | [Amortized Planning with Large-Scale Transformers: A Case Study on Chess](https://arxiv.org/html/2402.04494v2) | academic | First submitted 2024-02-07; v2 2024-10-21 | 9/10 for authored methods and caveats; HTML fetched; ratings/discussion/limitations examined |

Metadata verified through [C4 abstract](https://arxiv.org/abs/2512.01992) and [C5 abstract](https://arxiv.org/abs/2402.04494). These corroborate dates, not additional independent studies. Five substantive sources across github.com, huggingface.co and arxiv.org; 60% official. Primary research means the authors' evidence, not independent replication.

Searches performed: Hugging Face leaderboard reproducibility/methodology; Google DeepMind Game Arena chess/legal moves; chess language-model evaluation benchmarks. Third-party SEO pages, Reddit, DeepWiki and ambiguous similarly named ChessBench sites were not used as evidence. A new October 2026 prompt-optimization paper appeared in search but was not deep-read or approved.

## Findings — eight sourced observations

1. Game Arena separates environment, prompting, sampling, parsing and model calling. It supports different board representations, optional history/legal moves, majority sampling and rethinking. Therefore copying a model name alone does not reproduce its protocol. [C1]
2. Game Arena documents permissive move parsing and retry mechanisms. Those choices differ from strict one-response legal-JSON validation; results from different harnesses should not be silently pooled. [C1]
3. Hugging Face's guidebook explains that code, prompt/chat template, metric implementation, normalization, seeds, generation settings and backend details can change evaluation scores. Identical metric names do not establish identical scoring. [C2]
4. Hugging Face distinguishes benchmark results on model pages, community-managed Spaces leaderboards and its historical curated Open LLM Leaderboard. An externally hosted leaderboard is not automatically a standardized benchmark. [C3]
5. LLM Chess reports model-, game- and ply-level measurements, including failure causes. Its design supplies board/legal-move tools without history; this differs from this app's direct FEN/history/legal-list prompt. [C4]
6. That paper explicitly frames its 30-game random-opponent stage as a gating exercise rather than precise model ranking. It notes engine-derived move-quality metrics depend on analysis settings. [C4]
7. The amortized-planning chess paper states tournament Elo is not directly comparable with Lichess Elo; it discusses human/bot population differences and caveats when inputs, training and search differ. [C5]
8. Its limitations qualify the strong human-opponent result and note computation/speed constraints. A prominent number needs the condition under which it was measured. [C5]

## Deep-read notes

**C1 — harness design.** Examined prompting through model-calling sections. Legal assistance and parsing flexibility are deliberate protocol choices. Practical inference: expose a compact protocol card rather than implying all games measure unaided chess knowledge. Do not transplant its retries into this paid runner without accounting changes.

**C2 — reproducibility chapter.** Read code-base, metric, prompt, generation and model-loading sections. The useful product lesson is provenance next to a score: name the protocol revision and link details. A checklist cannot guarantee byte-identical hosted-model reruns.

**C4 — chess evaluation.** Read design, metrics, random-stage justification and engine-analysis appendix. It distinguishes chess outcomes from instruction failures; game caps and failure policy are part of the benchmark. Practical inference: show completed and stopped counts side by side. Do not copy its numerical ratings or results into this app.

**C5 — limitations.** Checked the tournament table caveat and human-versus-bot discussion. Practical inference: preserve opponent context and avoid imported human-rating labels. This study trains specialized policies; it is not direct evidence about current chat-model rankings.

## Current implementation evidence — local inspection, not external research

Read `src/arena.ts`, `src/openrouter.ts`, `src/worker.ts`, `app/page.tsx`, `public/play.md`, and the play API route on 2026-10-13.

- Matches persist protocol IDs; current hosted protocol is `legal-choice-v2`. It supplies FEN, history and legal moves, constrains output to legal UCI choices, allows 1,024 output tokens and uses a 45-second turn deadline.
- Public practice has its own session behavior and free local opponent. It must not inherit hosted-provider deadline/settings copy.
- The homepage currently calculates W/D/L from all completed results, including community guests; its archive returns only the latest 100 games. A new denominator derived solely from that archive would silently have a different population.
- The results table sorts by score and displays ordinal row numbers while disclaiming a strength ranking. That visual conflict is avoidable.
- The match-detail record already has frames, outcome, protocol, PGN and attempt timing/cost/error fields. It does not include authoritative Stockfish evaluation or a general “blunder” judgment.

## Feasible now — recommendations, not validated demand

| Addition | Smallest useful implementation | Boundary |
| --- | --- | --- |
| Featured real replay | Show an actual ongoing or recent persisted game, participants, board, state, replay link | Do not call a saved fixture live; retain stopped label |
| Track separation | Separate community practice, local baselines and hosted-model experiments | Opponent pools and protocols remain explicit |
| Honest results | W/D/L plus completed, ongoing and stopped counts; remove ordinal ranks | Aggregate over one stated scope; no Elo from the current pilot |
| Protocol card | Human-readable input assistance, response policy, limits and version, with methodology link | Use per-track/per-match settings; do not backfill old games with new settings |
| Useful match summary | Move count, termination reason, known cost and unknown-cost indicator; PGN/JSON links | Unknown billing is not zero; stopped is not a draw |
| Clear explanation of metrics | Define score numerator/denominator beside results; disclose small sample | Avoid fake precision and statistical certainty |
| Professional empty states | Clear start/play/watch action and honest zero/empty states | No fictional active players, research output or community scale |

Suggested short copy: “Observed results from this arena. Legal moves are supplied. Community practice and hosted experiments use different protocols. Stopped games are reported separately. These results are not human chess ratings.” Place detailed methodology in a disclosure or separate page so the board and next action stay prominent.

A short “What happened?” match summary can use deterministic events—checkmate, capture, promotion, castling, draw, stop—and allow jumping to the move. Calling a move a blunder or best move requires an engine-analysis pipeline with named version/settings; defer that label rather than generating plausible commentary.

## Gaps and counterclaims

1. More protocol detail could bury the play/watch loop. Prefer one compact card and progressive disclosure; this review did not measure visitor comprehension.
2. Showing W/D/L without Elo avoids one misleading signal but still invites invalid comparisons. Track separation, denominators and opponent context are necessary.
3. Excluding interrupted games from score is valid only if interruptions remain visible. Hiding them creates survivorship bias; adding failure counts is not the same as deciding scientific failure penalties.
4. Fixed prompts and recorded protocols improve traceability but do not freeze a provider's backend or guarantee repeatability. Preserve replayable artifacts and state that limit.
5. Source papers support methodological caution, not this product's demand, scientific validity or competitive differentiation. No ranking claim is established by this review.
6. Current source code is changing concurrently. Recheck API shapes, protocol settings and scope before shipping copy. This subtask did not inspect the deployed database or validate a production replay.
