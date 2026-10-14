# Tasks C/D — Model breadth and game evaluation
AS_OF: 2026-10-14. Role: model API and game-evaluation researcher. No paid inference; no application code changes.

## Sources
[C1] OpenRouter — public model inventory | https://openrouter.ai/api/v1/models | Source-Type: official | Accessibility: public | Date: live observation 2026-10-14; no publication date | Authority: 10 for gateway availability and listed prices, not model quality. Read-only API downloaded to /tmp/openrouter-model-research.json.
[C2] OpenRouter — Reasoning Tokens | https://github.com/OpenRouterTeam/docs/blob/main/guides/best-practices/reasoning-tokens.mdx | Source-Type: official | Accessibility: public | Date: visible commit Oct14 2026 | Authority: 9. Full rendered document read in Chrome.
[C3] Google DeepMind — Game Arena harness README | https://github.com/google-deepmind/game_arena/blob/main/README.md | Source-Type: official | Accessibility: public | Date: observed 2026-10-14; publication date unknown | Authority: 9. Full README read in Chrome.
[C4] Google DeepMind, Oran Kelly — Advancing AI benchmarking with Game Arena | https://blog.google/innovation-and-ai/models-and-research/google-deepmind/kaggle-game-arena-updates/ | Source-Type: official | Accessibility: public | Date: 2026-02-02 | Authority: 8 for platform design; stale for current leaderboard rankings. Full article read in Chrome.
[C5] Kolasani et al. — LLM CHESS: Benchmarking Reasoning and Instruction-Following in LLMs through Chess | https://arxiv.org/abs/2512.01992 | Source-Type: academic (preprint; peer-review status unverified) | Accessibility: public | Date: 2025-12-01 | Authority: 8. Abstract and HTML main paper through conclusion read in Chrome; appendices not fully read.
[C6] OpenRouter — Limits | https://github.com/OpenRouterTeam/docs/blob/main/api_reference/limits.mdx | Source-Type: official | Accessibility: public | Date: observed 2026-10-14; exact commit date not captured | Authority: 9. Full rendered document read in Chrome.

Six sources, four domains (openrouter.ai, github.com, blog.google, arxiv.org), five official. Gateway sources are not independent corroboration of one another. No dropped or private sources.

## Findings
1. Live inventory lists six usable diverse model IDs below; availability is catalog availability, not a guarantee that an actual generation succeeds. [C1]
2. Reasoning consumes charged output tokens and usually shares max_tokens with visible output; too-small caps can produce empty responses with finish_reason length. [C2]
3. The inventory explicitly exposes reasoning support and mandatory status; Argon cannot disable reasoning, whereas several cheaper candidates can. [C1][C2]
4. Game Arena changes opposition through head-to-head games; competitive difficulty is a meaningful alternative to measuring only success against a weak fixed opponent. [C3][C4]
5. LLM Chess explicitly treats random-opponent play as a cheap gate, then evaluates promising models against variable engine difficulty to avoid saturation. [C5]
6. LLM Chess separates instruction failures from move quality and reports engine-derived per-ply quality, making a shared 100% win rate insufficient as the whole report. [C5]
7. Game Arena exposes board representations, legal-move inclusion, voting, retry/rethinking, and move parsers as harness components; these are confounders that should be versioned when comparing models. [C3]
8. LLM Chess ablations find performance sensitive to prompt and legal-move access, so public benchmark results measure model-plus-harness configurations, not isolated model capability. [C5]
9. OpenRouter exposes key usage and effective remaining budgets; concurrent in-flight requests reserve estimated spend, and actual costs settle after completion. [C6]
10. Game Arena demonstrates that retry and parsing policy are part of evaluation design; report them explicitly, and do not count a fallback move selected by local code as a successful raw model decision. [C3; recommendation inferred from harness design]

## Verified model matrix (USD per million tokens)
| ID | Input | Output | Reasoning observations |
|---|---:|---:|---|
| anthropic/claude-haiku-5.5 | 0.10 | 0.50 | optional; efforts max/xhigh/high/medium/low; default medium; temperature not listed as supported |
| openai/gpt-6-luna | 0.10 | 0.50 | optional; max/xhigh/high/medium/low/none; default enabled medium; temperature not listed |
| deepseek/deepseek-v4.1-flash | 0.02016 | 0.891 | optional; max/high/low; default enabled high |
| qwen/qwen3-32b | 0.08 | 0.28 | optional; effort list absent, so do not assume effort mapping |
| google/gemini-2.5-flash-lite | 0.10 | 0.40 | optional; effort list absent |
| google/gemini-4-argon | 2.00 | 10.00 | mandatory; high/medium/low; default medium |
All numbers from C1 observed 2026-10-14. Prices are gateway listing, may vary with provider/cache/context; collect billed usage for actual chart costs. These are candidates, not benchmark results.

## Deep read notes
C2: use per-model reasoning metadata, send only supported parameters, retain enough visible-output budget. A low reasoning effort is not a strict numeric token cap across providers. Excluding reasoning from response does not remove its billing. Avoid blindly copying one request body's temperature and reasoning settings to all models.
C3: official harness receives state and player, can include move history/legal moves, and supports majority-vote or repeated illegal-move correction. Its parser may soft-match ambiguous moves. Reproducing its leaderboard requires those settings; the README alone is insufficient to claim methodological equivalence.
C5: random agents isolate basic completion; stronger engine stages test actual playing strength. Model-error handling differs between random and engine stages in the paper, so borrow the decomposition but publish our own consistent failure policy. Strength estimates against calibrated engine anchors are not automatically FIDE or Lichess Elo. Their historical model ranking must not be presented as current ranking.

## Proposed implementation and budget (recommendation, not an empirical finding)
Add actual measured Luna, Haiku, DeepSeek and Qwen configurations alongside Argon. Start with a compact shared tactics/endgame-position suite with graded difficulty and full legal-move evidence. This supports far more model coverage within $4 than thousands of calls for full round robins. Keep a separate longer-game track against several stronger executable opponents; preserve random-opponent results only as a named completion gate.
Use equal documented task set, prompt/harness version, token ceilings, timeout and retry policy; record model-specific reasoning differences rather than pretending equal effort names imply equal compute. Commit a frozen position manifest and hash. Track solved/attempted, invalid response, timeout, completion truncation, cost and latency; include small-sample uncertainty. Use engine-backed continuation or a set of acceptable moves where exact-match would reject an equivalent move.
Suggested incremental allowance: $0.50 each for Luna/Haiku/DeepSeek/Qwen, $0.75 for Argon on new suite, $0.25 validation headroom = $3.00; retain $1 of remaining budget. This is an allocation, not guaranteed spend or guaranteed completed samples. Preflight accumulated key usage against the user's lifetime $5 cap, reserve worst-case per-request cost before concurrency, and stop incomplete runs honestly.

## Gaps / counter-review
- Catalog availability does not prove working calls; no inference was made in this research task.
- Cheap model candidates are cost-diverse but not evidence that they are strong at chess; do not select only successful runs for publication.
- Position solving is not full-game planning. Label tactics as tactics and retain independent full-game/conversion evaluation.
- Public puzzles may be memorized; fresh holdouts and generated positions reduce but do not prove elimination of contamination.
- Eight games is inadequate for tight strength ranking; 100% on an easy gate does not mean perfection, while merely replacing all scores with 0% against an unbeatable engine is also uninformative.
- Using an engine inside a harness measures a compound agent. Compare raw models and engine-assisted harnesses in explicit tracks.
- This research read the main paper but did not fully audit its appendices or reproduce its numerical results.

## Follow-up primary-source verification
[C7] Stockfish developers — src/uci.cpp | https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp | Source-Type: official (primary implementation) | Accessibility: public | Date: publication/commit date not captured; copyright2004–2026, observed2026-10-14 | Authority:10 for displayed implementation only. Search result led directly to official repository, then entire702-line file read in Chrome. This is a distinct code source from FAQ, but not an independent organization.
Findings: parse_limits reads a nodes parameter into limits.nodes; ucinewgame dispatches engine.search_clear(); on_update_full emits nodes, nps, hashfull, tbhits, time and pv. These establish an auditable adapter interface, not proof of cross-machine determinism. Recommended adapter acceptance: save command transcript and returned info/bestmove, enforce timeout/status separation, and test resetting engine state between independent trials. No binary was executed or independently audited in this follow-up.
