# Chess benchmark design research notes
AS_OF: 2026-10-14. General research; task A/B within lead's Standard pipeline. Primary sources searched with web search, then read in real browser via gstack headed system Chrome; no web_fetch. Browser initially failed missing bundled executable, then system Chrome succeeded. Full relevant Lichess puzzle documentation, NIST page, Stockfish FAQ, Fastchess manual and Kagi README read; arXiv abstract only (explicitly SCAN). No private accounts accessed.

## Task board
| Task | Role / objective | Queries | Depth | Group | Output |
|---|---|---|---|---|---|
| A | Chess evaluation engineer: identify discriminating affordable tasks and controlled opponents | Stockfish UCI nodes limit strength; Lichess puzzle format rating; chess language models benchmark puzzles | DEEP, 3 official documents | A | task-design.md |
| B | Measurement reviewer: separate agent effects, sampling uncertainty and game bias | NIST Wilson interval; Fastchess repeat openings; LLM CHESS instruction following | DEEP official manual/statistics plus abstract SCAN | A | task-design.md |
Aging risks: model leaderboards age rapidly; protocol and statistical methods stable; freeze live dataset version/hash. Counter-review: harder opponents can produce universal zero; public tactics can reward memorization; shared helper tools can dominate model effect.

## Sources
[D1] Lichess — Open database / Puzzles | https://database.lichess.org/ | Source-Type: official | Accessibility: public | Date: dataset updated 2026-10-05, page publication undated | Verified: 2026-10-14 browser | Authority: 10 | task A. Full relevant puzzle section read. CC0, FEN/setup convention, UCI solution and ratings.
[D2] NIST/SEMATECH — 7.2.4.1 Confidence intervals | https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm | Source-Type: official | Accessibility: public | Date: undated living handbook (references Wilson1927/Brown2001) | Verified: 2026-10-14 browser | Authority: 10 | task B. Full page read; old foundational methods, not current-model evidence.
[D3] Stockfish — Frequently Asked Questions | https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html | Source-Type: official | Accessibility: public | Date: undated living documentation | Verified: 2026-10-14 browser | Authority: 10 | task A. Full FAQ read; rating relativity, weak move randomness, depth definition.
[D4] Disservin et al — Fastchess manual | https://github.com/Disservin/fastchess/blob/master/man.md | Source-Type: official | Accessibility: public | Date: latest displayed file commit 2026-10-04 | Verified: 2026-10-14 browser | Authority: 9 | task B. Entire manual read; matched rounds/colors, fixed nodes, openings and evidence.
[D5] Kagi/Vladimir Prelovac — llm-chess-puzzles | https://github.com/kagisearch/llm-chess-puzzles | Source-Type: official (project authors' implementation) | Accessibility: public | Date: README updated 2025-04-26, puzzles.csv displayed 2024-03-25 | Verified: 2026-10-14 browser | Authority: 8 for artifact/method, 4 for broad reasoning conclusions | task A. Full README read; current rankings stale and NOT adopted. Small1000-puzzle artifact at https://raw.githubusercontent.com/kagisearch/llm-chess-puzzles/main/puzzles.csv discovered in search and confirmed repository file listing.
[D6] Kolasani et al — LLM CHESS: Benchmarking Reasoning and Instruction-Following in LLMs through Chess | https://arxiv.org/abs/2512.01992 | Source-Type: academic (preprint; peer review not established) | Accessibility: public | Date: 2025-12-01 | Verified: 2026-10-14 browser | Authority: 7 | task B. Abstract only, not full paper. Authors' broad saturation prevention claim not independently established.

Stats: six approved primary sources, five host domains (database.lichess.org,itl.nist.gov,official-stockfish.github.io,github.com,arxiv.org); official5/6. No privileged sources. Search-only mirrors and community posts not included. Failed old Stockfish UCI page returned404; do not cite it.

## Findings (10 maximum)
1. Lichess publishes CC0 puzzles with rated difficulty, rating deviation, popularity, play count and thematic labels, enabling an explicitly frozen difficulty-stratified pilot. [D1]
2. Lichess FEN precedes the opponent's setup move: apply Moves[0] before querying the solver, and Moves[1] begins the answer; mate-in-one must accept any checkmating move. [D1]
3. Kagi's repository provides a1000-puzzle Lichess sample and evaluates the best next move, establishing an affordable existing artifact rather than requiring a full huge download. [D5]
4. Kagi warns training contamination can affect future utility; its broad claim that models cannot reason is interpretation, not proven by the artifact. [D5]
5. NIST describes Wilson intervals that remain within possible proportion bounds and exact binomial alternatives for small samples/extreme proportions. [D2]
6. Stockfish documents that ratings are relative to opponent pool, time controls, opening books and other match conditions; no universal human Elo can be inferred from a few wins. [D3]
7. Stockfish's Skill Level/UCI_Elo intentionally select weaker moves using randomized bias, so fixed weakened settings alone do not establish deterministic strength. [D3]
8. Fastchess explicitly supports node budgets, paired games with swapped colors, seeded opening selection and PGN output with search/latency evidence. [D4]
9. Reported engine depth is not uniform exhaustive search depth because real engines prune, reduce and extend branches. [D3]
10. LLM CHESS separates outcomes from move legality, hallucinated actions, duration and move quality, illustrating that full-game interaction measures behavior a single tactical decision does not. [D6, abstract only]

## Deep read synthesis / recommended implementation (our proposal, not claimed source findings)
A32-position first-move pilot with8 positions per800–1199,1200–1599,1600–1999,2000–2600 source puzzle-rating band is feasible under an API dollar cap. Freeze selection before any calls, record dataset/selection hashes and filter rules. Source ratings mean human puzzle difficulty in Lichess's system, not model Elo. Do not tune fixtures after seeing model results. Preserve a zero-API random/capture/search baseline and show every evaluated configuration.

Use the exact same post-setup FEN, legal-move representation, instruction, parser, retry limit and requested reasoning/output settings for all models. Publish model ID, provider response identity, prompt hash, full harness settings, token budget and observed costs. A model-plus-harness result is not a bare-model claim. If the model sees all legal moves, label it as assisted legal-move selection; do not imply independent board-rule mastery. If any fallback chooses the move, identify that separately and do not credit it as model accuracy.

Score correct first move / all scheduled positions; wrong legal moves, illegal moves, parse failures, API failures, timeouts and unattempted cases need distinct status. A fully completed accuracy includes failures in its denominator; incomplete runs should not join the same frontier. Add overall and per-band bars plus absolute counts and Wilson95% intervals. A two-sided Wilson interval for8/8 is approximately67.6–100%;100% observed does not mean established perfect ability. On a deliberately stratified set, overall Wilson is a descriptive binomial approximation, not a rigorous confidence interval for all chess positions. Prefer paired item-level bootstrap/differences for later comparisons, preserving shared item IDs and strata; one-move differences on32 are not reliable winner claims.

Use Pareto charts only among completed runs on identical suite+version+scoring. X axis cost per attempted position or median latency; y first-move accuracy. Include legal/error rate and counts in detail. Pareto membership is descriptive observed data, not proof of statistical superiority.

Later add a separate full-game engine ladder using pinned engine binary/network/hash, one thread, fixed nodes, fixed opening FENs in color-swapped pairs, pinned adjudication and move limits. Do not substitute full-strength Stockfish for random and assume the benchmark improves: universal losses are another saturation floor. Calibrate several weak/medium node tiers and retain endgame conversion/defensive tasks. Name opponent exactly (engine version + configuration), never invented human Elo. Keep random-opponent test as a regression/smoke suite, not headline model-strength evidence.

## Counter-review / gaps
1. HIGH: Tiny public first-move sample can be memorized and does not establish game-playing skill. Publish limitation; keep replayable game track separate and rotate fresh held-out suites later.
2. HIGH: Difficulty bands are human puzzle ratings, not guaranteed LLM difficulty; harder band may score better by chance or task-specific patterns. Do not promise monotonic scores or adjust sample after results.
3. HIGH: Equal max_tokens is not equal inference compute across providers; model reasoning modes differ. Publish exact settings and cost, avoid claiming compute-controlled rankings.
4. MEDIUM: Dataset solution uniqueness exception for mate-in-one requires checking actual mate, otherwise correct alternative mates are falsely marked wrong.
5. MEDIUM: Small sample intervals do not account for dataset-selection bias, correlated themes or repeated calls; clearly call pilot evidence. More samples and independent fresh positions are needed for stable rankings.
6. MEDIUM: Kagi's model rankings are2025 and its philosophical reasoning conclusion overreaches evidence. Use only artifact/provenance/method, not contemporary performance claims.
7. LIMIT: Full LLM CHESS paper was not read; abstract-supported metrics only. No independent verification of its saturation or rating claims. No other complete benchmark's experimental results reproduced in this research task.

## Verification
All six IDs refer to sources actually opened in browser. Five spot checks: D1license/setup/mate exception; D2Wilson bounds; D3rating relativity; D4node+opening/color controls; D5sample size/provenance. No quotations copied into proposed product text. No private user data used as external research.
