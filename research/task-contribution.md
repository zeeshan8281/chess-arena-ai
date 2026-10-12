---
task_id: contribution
role: Open-source participation and evaluation ecosystem researcher
status: complete
sources_found: 7
as_of: 2026-10-13
mode: lightweight, bounded research
---

## Sources

[1] Arena — How to Compare AI Models in Battle Mode | https://help.arena.ai/articles/4489017547-how-to-use-battle-mode | Source-Type: official | Accessibility: public | Published/updated: 2026-09-22 in search extraction; fetched page gives relative date | Verified: 2026-10-13 | Authority: 9/10

[2] Arena — FAQ | https://arena.ai/faq | Source-Type: official | Accessibility: public | Published/updated: undated | Verified: 2026-10-13 | Authority: 9/10

[3] Kaggle — Introducing Kaggle Game Arena | https://www.kaggle.com/blog/introducing-game-arena/ | Source-Type: official | Accessibility: public | Published: 2025-08-04 | Verified: 2026-10-13 | Authority: 9/10 for launch design, 6/10 for current submission availability

[4] Google DeepMind — Game Arena README | https://github.com/google-deepmind/game_arena/blob/main/README.md | Source-Type: official | Accessibility: public | Published/updated: undated, mutable main branch | Verified: 2026-10-13 | Authority: 9/10

[5] Stockfish — Get Involved | https://stockfishchess.org/get-involved/ | Source-Type: official | Accessibility: public | Published/updated: undated | Verified: 2026-10-13 | Authority: 9/10

[6] Lichess — Welcome Lichess Bots | https://lichess.org/@/lichess/blog/welcome-lichess-bots/WvDNticA | Source-Type: official | Accessibility: public | Published: 2018-05-08, later inline edits undated | Verified: 2026-10-13 | Authority: 8/10 for historical model, 5/10 for current restrictions

[7] Stockfish Docs — Running the Fishtest Worker | https://official-stockfish.github.io/docs/fishtest-wiki/Running-the-Worker.html | Source-Type: official | Accessibility: public | Published/updated: undated | Verified: 2026-10-13 | Authority: 9/10

## Findings

- Arena Battle Mode lets a person supply a prompt, compare two anonymous model answers, and vote before model identities are shown; this contribution directly powers its leaderboards. [1]
- Arena says only anonymous votes count toward public rankings, while side-by-side identified-model votes support research instead. [2]
- Arena shares a subset of anonymized research data including prompts, vote outcomes, and model pairings; its FAQ describes direct work with model providers but does not establish an unrestricted public model-upload workflow. [2]
- Kaggle's launch post distinguishes community-submitted agents in Kaggle Simulations from Game Arena's evergreen model benchmarks, and describes future work toward game/environment submissions rather than a verified self-serve Game Arena chess-agent submission route. [3]
- Kaggle's launch protocol withheld tools and legal-move lists, allowed three illegal-move retries, and stated its pool-relative scores were not comparable with human chess Elo. [3]
- DeepMind publishes the Game Arena harness, demo instructions, prompt options including history/legal moves, and different sampling and parsing strategies, allowing protocol-level experiments rather than only watching finished matches. [4]
- Stockfish explicitly offers both code contributions tested through Fishtest and non-programmer participation by running test games on donated computers. [5]
- Lichess's bot launch described an HTTP bot API, UCI/XBoard-compatible client, and a vote-chess example in which spectators selected moves; these are distinct participation patterns, not evidence that this app integrates Lichess. [6]
- Fishtest documents registration, worker installation, CPU/memory limits, and graceful shutdown, showing that compute contribution requires an explicit operational workflow. [7]

## Deep Read Notes

### Source [1]: Arena Battle Mode
Key data: two anonymous responses; reveal follows preference selection.
Key insight: visitors create evaluation observations through an immediate interaction.
Useful for: explaining why a spectator-only leaderboard lacks a contribution loop.

### Source [2]: Arena FAQ
Key data: Bradley–Terry rankings; identified side-by-side votes excluded; partial public datasets.
Key insight: separate collection purposes and release only clearly described data.
Useful for: separate objective game results from subjective explanation votes.

### Source [4]: DeepMind harness
Key data: text/image representations, move-history/legal-move options, majority voting and rethinking.
Key insight: an agent's observed result depends on its harness, not only model identity.
Useful for: agent manifest fields and research ablation templates.

### Source [5]: Stockfish contribution page
Key data: worker installation, code forks/tests, discussion community.
Key insight: contributions are concrete actions with a result path.
Useful for: three explicit contribution cards rather than a generic GitHub icon.

### Source [6]: Lichess bot introduction
Key data: bots for engines and vote chess; linked client supports established engine protocols.
Key insight: spectators can participate in play without training a model.
Useful for: later human-versus-agent or community-move mode, clearly a proposal.

### Source [7]: Fishtest worker guide
Key data: account requirement; configurable concurrency and memory; controlled shutdown.
Key insight: donated computation needs transparent resource controls and durable job handling.
Useful for: avoiding premature distributed-worker claims.

## Proposed contribution UX — recommendations, not existing features

Use a prominent **Contribute** navigation item and homepage card: “Improve an agent. Submit a position. Publish a finding.” Each path must lead somewhere concrete.

1. **Submit an agent or prompt** → a GitHub issue form for proposals and a pull-request guide for implementation. Require model/provider ID, prompt/config version, legal-move visibility, history policy, tool access, response format, budget/time limits, and sample replay. Credit the author. Review before running code or consuming the host's API budget. Do not offer arbitrary public endpoint execution without a designed isolation boundary.
2. **Contribute a test position** → GitHub form with FEN, relevant move history/PGN, theme, source/license, expected behavior, and explanation. FEN alone does not encode repetition history. Maintainers review it before adding a versioned benchmark set; do not call all submissions verified benchmark items.
3. **Submit research** → issue/PR template with hypothesis, exact agents/prompts, input protocol, budget, seeds/paired openings, game IDs and PGNs, denominator and failure cases, result table, and limitations. Suggested first questions: legal-move-list visibility, history visibility, equal-budget prompt comparisons, and legality/failure versus playing-strength tradeoffs.
4. **Analyze games** → download each public replay as PGN and a documented JSON record carrying moves, model/config version, status, timing and cost fields when actually recorded. Add a bug-report link with the match ID. A public corpus should be versioned and licensed before advertising unrestricted reuse.

These pathways provide a useful first release with ordinary GitHub forms and reviewed PRs. Separate “Available now” links from “Planned” features. A reading list supports contributors, but papers alone do not create participation.

Later, add blind votes on two explanations of the same position if explanation quality is a product goal. Label that measure as human preference and keep it separate from objective chess results. Also consider user-supplied position challenges or playing against a model. These need quota, abuse, and collection-design decisions; none are prerequisites for the first contribution hub.

## Gaps and counter-review

- **Current submission policy uncertain:** no verified unrestricted public Arena model upload or Game Arena chess-agent entry workflow was found. Do not imply one exists or does not exist definitively; current official intake would need further research.
- **Source freshness:** the Kaggle launch is over a year old; the Lichess article is from 2018. Use these for documented examples, not current tournament eligibility or endpoint contracts. The current Lichess API page was fetched but returned no readable body; precise bot-endpoint behavior was not independently tested.
- **Kaggle retrieval limit:** the search tool returned the full indexed launch article, but direct open returned no readable body. Other primary sources were directly fetched successfully.
- **Preference is not strength:** Arena's human voting pattern need not transfer to objective chess wins. An explanation vote can reward plausible but incorrect analysis; engine-verification and separate labeling would be required.
- **Open code is not open participation:** a repository alone can still impose contributor friction. Templates, examples, review standards, and visible attribution make the path concrete, but community adoption remains unverified.
- **Protocol comparability:** this app's legal-move-assisted games should not be compared directly with Kaggle's launch chess-text results. Fair comparisons must hold the input/action protocol and budget constant.
- **Runtime trust:** accepting public agent code or URLs is materially different from reviewed GitHub contributions. Do not enable uncontrolled code execution or billing while merely adding contribution links.
- **No feature verification in this subtask:** this research did not inspect the latest application implementation, execute agents, submit issues, contact other services, or test public data exports. The lead must match all “Available now” copy to features actually shipped.

## Source governance summary

Seven approved official public sources, five distinct registrable domains (arena.ai, kaggle.com, github.com, stockfishchess.org, lichess.org); GitHub Pages counted conservatively with github.com. All retrieved on the AS_OF date. No private accounts or user-provided credentials used. Search results from Reddit, Wikipedia, industry reporting, and unrelated repositories were not used as evidence. Recommendations are explicitly separated from sourced observations.
