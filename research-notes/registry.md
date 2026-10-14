# Citation registry
AS_OF: 2026-10-14. All approved sources public. All URLs came from task-design.md or task-models.md. Source numbers final.

| ID | Source / URL | Type | Date / freshness | Authority | Notes |
|---|---|---|---|---:|---|
| 1 | Kolasani et al., [LLM CHESS](https://arxiv.org/abs/2512.01992) | academic preprint; peer review unverified | 2025-12-01; method useful, historical rankings not current | 8 | D6=C5 deduplicated; main paper read, appendices not fully read |
| 2 | Google DeepMind, [Game Arena harness](https://github.com/google-deepmind/game_arena/blob/main/README.md) | official | undated living README; observed2026-10-14 | 9 | C3, full read |
| 3 | Oran Kelly / Google DeepMind, [Advancing AI benchmarking with Game Arena](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/kaggle-game-arena-updates/) | official | 2026-02-02; stale for current model rankings | 8 | C4, full read |
| 4 | Lichess, [Open database](https://database.lichess.org/) | official | puzzle dataset2026-10-05; page undated; observed2026-10-14 | 10 | D1, relevant puzzle documentation read |
| 5 | Kagi / Vladimir Prelovac, [llm-chess-puzzles](https://github.com/kagisearch/llm-chess-puzzles) | official project implementation | README2025-04-26; puzzle artifact2024-03-25; rankings stale | 8 for artifact | D5, full README read; no endorsement of philosophical claims |
| 6 | OpenRouter, [Models API](https://openrouter.ai/api/v1/models) | official | live observation2026-10-14; no publication date | 10 for catalog | C1, public API downloaded; not successful inference evidence |
| 7 | OpenRouter, [Reasoning Tokens](https://github.com/OpenRouterTeam/docs/blob/main/guides/best-practices/reasoning-tokens.mdx) | official | visible commit2026-10-14 | 9 | C2, full rendered document read |
| 8 | NIST/SEMATECH, [Confidence intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) | official | undated living handbook, foundational methods | 10 | D2, full page read |
| 9 | Stockfish, [Frequently Asked Questions](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html) | official | undated living document; observed2026-10-14 | 10 | D3, full FAQ read |
| 10 | Disservin et al., [Fastchess manual](https://github.com/Disservin/fastchess/blob/master/man.md) | official | displayed file commit2026-10-04 | 9 | D4, full manual read |
| 11 | OpenRouter, [Limits](https://github.com/OpenRouterTeam/docs/blob/main/api_reference/limits.mdx) | official | observed2026-10-14; exact commit date not captured | 9 | C6, full rendered document read |
| 12 | Stockfish developers, [UCI implementation](https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp) | official primary source code | exact commit/publication date not captured; observed2026-10-14 | 10 for displayed code | C7, complete702-line file read in Chrome; no binary audit |

## Governance
13 source entries including the follow-up implementation source yield12 approved unique sources after one duplicate. Seven host domains: arxiv.org, github.com, blog.google, database.lichess.org, openrouter.ai, www.itl.nist.gov, official-stockfish.github.io. Official share11/12=91.7%; academic1/12=8.3%. Domain minimum5, official minimum30%, and standard unique-source minimum12 met. Source12 is distinct source code rather than a second URL for the FAQ; it is the same organization and not independent corroboration. No private/user-owned sources; no circular verification. Source concentration: report uses at least four independent authorities for core design, but gateway price/support claims necessarily depend on OpenRouter alone.

## Dropped / excluded
- D6 as a duplicate ofC5; consolidated into[1], not counted twice.
- Failed old Stockfish UCI URL (404): no claim cited to it.
- Search-only mirrors and community posts: not approved.
- Current rankings in2025 Kagi README and2026-02 Google blog: stale and excluded from contemporary performance claims.
- Kagi CSV URL is a discovered artifact referenced by[5], not a separately read independent source; not counted to inflate total.
