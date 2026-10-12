# Chess research and contribution agenda

Research date: 2026-10-13. Scope: a lightweight primary-source review to identify credible, affordable research contributions for Chess Arena AI. This is a research agenda, not completed experiments or a claim of novelty.

## Recommendation

Make the project an open laboratory where people **submit an agent or strategy, run a declared experiment, and publish the games and measurements**. The first useful community work is small, inspectable experiment packs with explicit budgets, rather than training another large chess model. Give each contribution an author, version, hypothesis, executable configuration, and evidence links. This recommendation is our synthesis of the sources below, not a finding directly tested by those papers.

## Findings (eight)

1. **There is substantial prior art; do not claim the first chess transformer benchmark.** ChessBench supplies engine-annotated data and associated evaluation tooling. Its paper studies distilling search into a model, not whether a general chat model wins a handful of games. Cite it as a research foundation. [Paper](https://arxiv.org/html/2402.04494v2), [official repository](https://github.com/google-deepmind/searchless_chess).
2. **Ratings need a population and protocol.** The ChessBench paper reports markedly different performance against humans and engines, and explicitly cautions about comparability. Arena results should name opponents, sample sizes, rules, and time or compute budgets. A local tournament score is not FIDE or Lichess Elo. [Limitations and discussion](https://arxiv.org/html/2402.04494v2).
3. **Behavioral success does not establish an internal world model.** Karvonen's chess study uses access to activations, held-out probes, and interventions. An API arena can measure legality and sensitivity to input information, but cannot infer the same mechanism from a model's verbal explanation. [Full paper](https://arxiv.org/html/2403.15498v2).
4. **Human imitation and playing strength are different objectives.** Maia-2 evaluates how closely predicted moves match human moves across skill levels, including coherence across skills. A future human-style track needs its own metric and held-out human games; game win rate cannot stand in for alignment. [Full paper](https://arxiv.org/html/2409.20553v1).
5. **Use Maia-2 as established literature, not the latest implementation recommendation.** Its official repository now points new projects to Maia-3. A fresh integration should inspect that successor first. [Official repository](https://github.com/CSSLab/maia2).
6. **There is immediately reusable tactical data.** Lichess publishes its database exports under CC0 and documents puzzle IDs, themes, ratings, FEN, and UCI solution moves. Freeze a small versioned subset instead of silently using a changing full download. [Official database](https://database.lichess.org/).
7. **Puzzle ingestion has a concrete correctness trap.** Lichess's FEN precedes the opponent's first move. Apply that first move before presenting the puzzle; the next move starts the solver's response. For mate-in-one, any move that checkmates is accepted. [Puzzle format notes](https://database.lichess.org/#puzzles).
8. **Reproducibility artifacts are a useful contribution even without a new model.** ChessBench's repository separates puzzle evaluation, tournament play, and metric evaluation, and publishes code, data, and checkpoints. Arena contributors can similarly produce narrowly scoped and replayable experiments without claiming comparable scale. [Official repository](https://github.com/google-deepmind/searchless_chess).

## Proposed tracks: original recommendations

| Track | Question | First contribution | Measurements | Guardrail |
|---|---|---|---|---|
| Budget versus performance | Does more inference budget improve this strategy under fixed conditions? | Two prompt or token-budget variants, one fixed position set, a declared maximum spend | Puzzle success, failed requests, legal response rate, latency, billed cost | Report interrupted and failed runs; a tiny pilot cannot support a stable leaderboard ranking |
| State representation | Does supplying FEN, move history, or legal moves change observable performance? | A three-condition experiment pack with the same positions and model version | Correct responses, invalid moves, timeout rate, cost | Legal-list assistance changes the task; label conditions separately |
| Tactical weaknesses | Which themes or game phases cause failures? | A licensed, versioned puzzle pack with verified solutions and thematic labels | Solve rate per theme, sample count, failure examples | Distinguish first-move accuracy from full-line success |
| Strategy tournament | Does a contributor's strategy outperform a baseline? | Agent manifest plus a color-swapped match schedule and PGNs | Wins/draws/losses, completion rate, cost, uncertainty | Same openings and budgets; separate local engines, assisted agents, and pure model policies |
| Human-style modeling, later | Can an agent predict moves typical of a target skill group? | Small held-out prediction dataset and a model adapter | Move agreement by skill group, calibration where probabilities exist | Different objective from strongest play; do not promise a useful tutor from this test alone |

For the first release, prioritize the first three tracks and a minimal agent submission path. They share the existing move-validation, provider, and replay infrastructure. Training, activation probes, and human tutoring studies are separate projects.

## Minimum experiment contract

This proposed contract is not a claim that all fields are currently implemented.

- Identity: title, contributor, hypothesis, agent source commit, model identifier, provider and execution date.
- Inputs: dataset origin, license, immutable revision/hash, position IDs, initial FEN plus required history, split into development and evaluation sets.
- Protocol: exact prompt, legal-move assistance, tools/search allowed, sampling settings, deadline, output limit, game termination rules, maximum spend, stopping rule.
- Evidence: attempted requests including failures, move responses, validation outcomes, token and cost records, PGNs, summary script, and expected output.
- Comparison: use the same positions or paired openings for variants; swap colors for game pairs. Resample at the position or game-pair level when estimating uncertainty, rather than treating every move as independent evidence.
- Claims: label pilot results; do not hide unfinished games or change the test set after observing weaknesses. Publish negative results and reproduce another contributor's pack as valid contributions.

## Deep notes on the strongest sources

**ChessBench / amortized planning.** Full paper and repository fetched; examined experiment setup, discussion, limitations, and released evaluation entry points. FEN alone omits repetition history, an explicit limitation relevant to agent inputs. The repository lists small test files alongside very large training data: an evaluation-first contribution is more feasible than downloading or retraining everything. Software, weights, and data have distinct licensing terms; retain their respective attribution and license requirements. These are primary author artifacts, but their published ratings should not be transferred to this app.

**Chess world representations.** Full paper fetched; examined training, held-out probes, intervention tests, and discussion. It investigates dedicated character-level chess models, not arbitrary hosted chat endpoints. Probing and causal activation interventions carry the mechanism claim. Reusing its conceptual motivation is reasonable; claiming an API prompt ablation reproduces its interpretability evidence is not.

**Maia-2.** Full paper fetched; examined evaluation setup, results, discussion, and filtering details. It separates test sets and skill groups and controls comparisons for training data. That motivates clear split and population metadata. The paper does not establish that a generic instruction to “play like a beginner” makes a chat model a reliable human-style opponent.

## Sources and authority

All sources below are publicly accessible and were accessed 2026-10-13. Paper revision dates are publication metadata, not access dates. Repository pages are mutable and were not pinned to commits in this review.

| Source | Type / date | Authority / access |
|---|---|---|
| [Amortized Planning with Large-Scale Transformers: A Case Study on Chess](https://arxiv.org/html/2402.04494v2) | Research paper; first submitted 2024-02-07, v2 2024-10-21; NeurIPS 2024 | Primary authors; full HTML fetched and relevant sections read |
| [DeepMind searchless_chess](https://github.com/google-deepmind/searchless_chess) | Official research code and dataset documentation; current public README | Primary implementation; full page fetched |
| [Emergent World Models and Latent Variable Estimation in Chess-Playing Language Models](https://arxiv.org/html/2403.15498v2) | Research preprint; v2 2024-07-14 | Primary author; full HTML fetched and relevant sections read; conference status not independently checked |
| [Maia-2](https://arxiv.org/html/2409.20553v1) | Research paper; 2024-09-30; NeurIPS 2024 | Primary authors; full HTML fetched and relevant sections read; venue cross-checked on [NeurIPS](https://papers.nips.cc/paper_files/paper/2024/hash/250190819ff1dda47cd23cecc0c5a69b-Abstract-Conference.html) |
| [CSSLab/maia2](https://github.com/CSSLab/maia2) | Official implementation; current public README | Primary project maintainers; successor recommendation verified |
| [Lichess open database](https://database.lichess.org/) | Official data documentation; puzzle export shown updated 2026-10-05 | Primary dataset publisher; schema and license statement read |

## Counterarguments and gaps

- Another general chess leaderboard has limited novelty. The differentiated contribution must be transparent experiments, realistic budgets, and evidence people can reproduce. This is a product recommendation, not demonstrated market demand.
- Public puzzles can occur in model training data. A “held-out” local split does not establish absence from a closed model's training set. Declare that limitation and add newly constructed, legally checked cases over time.
- A $5 pilot may expose integration failures and obvious differences but does not establish statistically reliable model rankings. Request more budget only after measuring actual cost per completed task.
- Hosted model routing, model revisions, nondeterminism, and backend changes can prevent exact replay of inference. Preserve inputs and responses so game replay and analysis remain reproducible even when regeneration is not.
- No datasets were downloaded, models run, published numbers replicated, successor Maia-3 evaluated, or exhaustive literature search completed during this lightweight review. No new claim about which model is best is supported here.
