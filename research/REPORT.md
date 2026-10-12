# An open chess lab people can contribute to

**As of 13 October 2026 · Lightweight research and implementation proposal**

The strongest first contribution loop is: **submit an agent or strategy, test a declared hypothesis, publish the games and measurements.** Give each contribution an author and a version, and make the evidence inspectable. A reading list supports this loop; a reading list alone does not create participation.

This is a bounded research synthesis, not a completed study, a claim of novelty, or evidence of community demand. It combines two primary-source reviews with inspection of this repository. External evidence is tracked in [the citation registry](registry.md); uncertainties and opposing interpretations are recorded in [the counter-review](counter-review.md).

## What to borrow from existing communities

Arena's participation loop starts with an action: a visitor supplies a prompt, sees two anonymous responses, and chooses a preference before identities are revealed. Arena distinguishes these anonymous votes from identified side-by-side votes when describing its public rankings. **The transferable idea is an immediate contribution with a clear result path.** Chess wins and human preferences measure different things; votes about a convincing explanation must not silently become chess-strength points. Confidence: high for Arena's documented workflow, medium for its application here. [1, updated September 2026](https://help.arena.ai/articles/4489017547-how-to-use-battle-mode), [2, undated; accessed 2026-10-13](https://arena.ai/faq).

Stockfish offers a different model: people contribute code or donate computation to run tests. Its worker documentation makes the operational requirements explicit. This supports concrete contribution paths, but does not justify claiming a distributed compute network before this project has one. Confidence: high for the documented patterns. [3, undated; accessed 2026-10-13](https://stockfishchess.org/get-involved/), [4, undated; accessed 2026-10-13](https://official-stockfish.github.io/docs/fishtest-wiki/Running-the-Worker.html).

DeepMind's open Game Arena harness exposes choices such as move history, legal-move information, sampling and parsing. ChessBench separately publishes evaluation and tournament tooling. These projects show why “which model?” is only part of an experiment: the input protocol and execution harness also matter. Confidence: high for the published artifacts; transfer to this product is a design recommendation. [5, mutable repository; accessed 2026-10-13](https://github.com/google-deepmind/game_arena/blob/main/README.md), [6, mutable repository; accessed 2026-10-13](https://github.com/google-deepmind/searchless_chess).

## Two main ways to contribute

### Improve an agent or strategy

The entry point should be a reviewed GitHub proposal, followed by a small PR when implementation is appropriate. Accept a prompt idea, a local policy, a model adapter, or a reproducible comparison. Require the model/provider identifier, exact prompt and settings, tool and engine access, legal-move assistance, deadlines, expected cost, source/license, and an example result. Credit the contributor on the proposal and any resulting experiment.

This is available as a human review workflow, not a public execution service. The current code registers a fixed set of agents in `src/agents.ts`; `src/worker.ts` dispatches local policies or OpenRouter calls. It does not load arbitrary contributed agents. Public proposals must not automatically spend the operator's budget. The actionable path is documented in [CONTRIBUTING.md](../CONTRIBUTING.md).

### Publish reproducible chess research

The second entry point should accept a hypothesis and evidence package. A useful contribution can be a failure case, a position pack, a replication, or a negative result. It need not contain a new model. Include instructions that let another contributor regenerate the analysis from saved games and responses, even if hosted inference cannot be regenerated exactly.

A supporting “submit a position” path belongs inside this track. Ask for the FEN, relevant history/PGN, expected behavior, theme, and source/license. FEN alone can lose repetition context, which the ChessBench paper also discusses as a representation limitation. Confidence: high for that limitation; the submission design is proposed. [7, paper revision 2024-10-21](https://arxiv.org/html/2402.04494v2).

## Research that is worth starting with

The following are **proposed studies, not findings**. They are small enough to build on the existing provider, referee and replay components; the current app does not yet run these experiment packs automatically.

| Study | First useful submission | Measure | Essential control |
| --- | --- | --- | --- |
| Budget versus performance | Two prompt or output-budget variants on the same fixed positions | Task success, failed calls, latency, tokens, billed cost | Same model/protocol; declare maximum spend and stopping rule |
| Input representation | FEN-only, FEN-plus-history, and legal-list conditions | Correct responses, illegal outputs, timeouts, cost | Same positions and model version; label assistance explicitly |
| Tactical weaknesses | A small versioned puzzle pack grouped by theme | First-move accuracy, full-line success, sample counts | Verified solutions; distinguish the two success definitions |
| Strategy tournament | A contributor strategy versus a baseline on color-swapped games | Wins/draws/losses, completion rate, cost, uncertainty | Same opening positions and budgets; report interrupted games separately |

Prioritize one study at a time. The authorized $5 pilot is a useful integration and cost-measurement exercise; without an adequate sample and uncertainty analysis, it cannot support stable public model rankings. Do not increase spend merely to make the table look populated.

Lichess provides a practical source for tactical packs: its official database documents CC0 exports, puzzle themes and UCI solution moves. There is an ingestion trap: the supplied FEN is before the opponent's first move; apply that move before asking the solver for a response. The documentation also permits any checkmating move in mate-in-one puzzles. Freeze puzzle IDs and a dataset revision rather than silently using a changing download. Confidence: high for these documented data semantics. [8, export shown updated 2026-10-05; accessed 2026-10-13](https://database.lichess.org/#puzzles).

## What a credible result must contain

This is a proposed acceptance contract, not a statement that every field is already persisted:

1. **Identity:** contributor, hypothesis, code commit, model/provider identifiers and run date.
2. **Inputs:** position/opening IDs, initial FEN and required history, dataset source/license, immutable revision or hash, development/evaluation split.
3. **Protocol:** exact prompt, legal-move assistance, tools/search, sampling settings, deadline, token limits, termination rules, maximum spend and stopping rule.
4. **Evidence:** attempted requests including failures, validation outcomes, PGNs, saved responses where available, per-attempt timing/tokens/cost, and an analysis script.
5. **Comparison:** the same positions across variants or paired openings with swapped colors; uncertainty computed at the position or game-pair level rather than treating every move as independent evidence.
6. **Limitations:** exclusions, interrupted runs, missing billing data, possible training contamination and changes made after looking at results.

The present app exposes match PGN and JSON records, and records attempt timing/cost fields when available. Those exports are a starting point, not a complete research dataset: the runner does not yet persist a versioned experiment manifest, full provider response archive or seeded schedule. All present matches remain unrated.

## Claims to avoid

**“Our score is human chess Elo.”** ChessBench's paper cautions about comparability between evaluation populations. Any future rating here needs a named opponent pool, rules and budget; retain observed wins/draws/losses until the protocol and sample justify more. [7, 2024-10-21](https://arxiv.org/html/2402.04494v2).

**“The model understands chess because it explains a move.”** The chess world-model paper uses activations, held-out probes and interventions. An API-only arena can observe behavior under changed inputs; an eloquent explanation is not equivalent mechanistic evidence. Confidence: high for the methodological distinction, not a judgment about any particular hosted model. [9, preprint revision 2024-07-14](https://arxiv.org/html/2403.15498v2).

**“Winning more means playing more like a human.”** Maia-2 studies human move prediction across skill levels, a different objective from game strength. A future human-style track requires held-out human games and its own metrics. Its implementation repository now recommends Maia-3 to new projects, so Maia-2 is cited as established literature, not as the latest integration recommendation. [10, 2024-09-30](https://arxiv.org/html/2409.20553v1), [11, mutable repository; accessed 2026-10-13](https://github.com/CSSLab/maia2).

**“Open source means people will contribute.”** That remains untested. The immediate test is whether someone can understand a proposal, submit it, receive review and reproduce a result. Measure completed contributions and reproductions before building accounts, distributed workers or a public code-execution system.

## Delivery sequence and boundaries

Ship the contribution hub, agent/research/position issue forms, a PR guide and this research agenda first. Then review one community strategy or reproduce one small experiment with a fixed cap. Add automation only after that manual path reveals what reviewers and contributors actually need.

This review used public primary sources and inspected the current execution and export paths. It did not recruit contributors, download datasets, replicate papers, run the proposed ablations, audit arbitrary-code isolation, or verify every competitor's current intake process. Mutable documentation is dated by access, not treated as immutable evidence. Exact future hosted-model outputs remain uncertain even when the saved game and analysis are reproducible.

See [registry.md](registry.md) for all eleven approved sources, [task-contribution.md](task-contribution.md) and [task-chess.md](task-chess.md) for evidence notes, and [counter-review.md](counter-review.md) for challenges to these recommendations.
