# Citation registry

AS_OF and access date: **2026-10-13**. Mode: lightweight, bounded primary-source review. Sources were gathered by the contribution and chess research tasks; report synthesis introduced no new external URLs. All approved sources are **public**. No private accounts, credentials, paid databases or user-owned account data supplied research evidence.

| ID | Source / URL | Type | Publication or revision date | Authority and retrieval | Trace |
| --- | --- | --- | --- | --- | --- |
| 1 | [Arena: How to Compare AI Models in Battle Mode](https://help.arena.ai/articles/4489017547-how-to-use-battle-mode) | official | Search extraction: 2026-09-22; fetched page uses relative date | 9/10; fetched; date precision limited | task-contribution, source 1 |
| 2 | [Arena FAQ](https://arena.ai/faq) | official | Undated | 9/10; fetched | task-contribution, source 2 |
| 3 | [Stockfish: Get Involved](https://stockfishchess.org/get-involved/) | official | Undated | 9/10; fetched | task-contribution, source 5 |
| 4 | [Stockfish: Running the Fishtest Worker](https://official-stockfish.github.io/docs/fishtest-wiki/Running-the-Worker.html) | official | Undated | 9/10; fetched | task-contribution, source 7 |
| 5 | [DeepMind Game Arena README](https://github.com/google-deepmind/game_arena/blob/main/README.md) | official | Undated, mutable main branch | 9/10; fetched; not commit-pinned | task-contribution, source 4 |
| 6 | [DeepMind searchless_chess](https://github.com/google-deepmind/searchless_chess) | official | Undated, mutable repository | 9/10; fetched; not commit-pinned | task-chess, source 2 |
| 7 | [Amortized Planning with Large-Scale Transformers: A Case Study on Chess](https://arxiv.org/html/2402.04494v2) | academic | First submitted 2024-02-07; v2 2024-10-21; NeurIPS 2024 | 9/10; full HTML and relevant sections read | task-chess, source 1 |
| 8 | [Lichess open puzzle database](https://database.lichess.org/#puzzles) | official | Export shown updated 2026-10-05; documentation undated | 9/10; schema/license notes read | task-chess, source 6 |
| 9 | [Emergent World Models and Latent Variable Estimation in Chess-Playing Language Models](https://arxiv.org/html/2403.15498v2) | other: primary research preprint | v2 2024-07-14 | 8/10; full HTML; conference status not independently checked | task-chess, source 3 |
| 10 | [Maia-2](https://arxiv.org/html/2409.20553v1) | academic | 2024-09-30; NeurIPS 2024 | 9/10; full HTML; venue cross-checked by source task | task-chess, source 4 |
| 11 | [CSSLab/maia2](https://github.com/CSSLab/maia2) | official | Undated, mutable repository | 9/10; successor recommendation read; not commit-pinned | task-chess, source 5 |

Authority scores reflect fitness for the narrow attributed claim, not independent replication. Official repositories establish published functionality or project guidance; they do not establish this app's behavior or adoption.

## Selection and freshness

Approved: **11 sources**, **8 official (72.7%)**, 2 academic, 1 primary preprint. Domains include arena.ai, stockfishchess.org, github.io, github.com, arxiv.org and lichess.org; even conservatively grouping GitHub Pages with GitHub gives **5 distinct domain groups**. Every source has a report citation. No individual source dominates the recommendations; methodological recommendations are identified as proposals rather than attributed findings.

The three research papers are approximately two years old and used for established methods/prior art, not a current best-model ranking. Mutable pages carry access dates; repository revisions were not pinned. No claim of exhaustive literature coverage is made.

## Not included in the final approved set

- [Kaggle Game Arena launch](https://www.kaggle.com/blog/introducing-game-arena/), 2025-08-04: useful background in task-contribution, but direct open returned no readable body and indexed launch text cannot establish current public intake. Excluded from final report claims.
- [Lichess bot introduction](https://lichess.org/@/lichess/blog/welcome-lichess-bots/WvDNticA), 2018-05-08: historical example only; too old for current endpoint/eligibility assertions. Excluded from final report claims.
- Current Lichess API page: task reported no readable body; no endpoint-contract claim retained.
- Reddit, Wikipedia, unrelated repositories and industry commentary seen during search were not evidence for this report.

Local code inspection is implementation verification, not external research evidence: `src/agents.ts`, `src/openrouter.ts`, `src/worker.ts`, `src/arena.ts`, `src/store.ts`, `src/http.ts`, `src/db.ts`, match API routes, package scripts and tests were read for CONTRIBUTING and current-state boundaries. No private evidence is presented as independent verification.
