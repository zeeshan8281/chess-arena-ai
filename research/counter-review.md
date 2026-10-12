# Counter-review and verification

Date: 2026-10-13. Scope: manual review of the bounded report against both research-task notes and current code. This is not an independent replication or a full security audit.

| Issue | Severity | Opposing interpretation / risk | Resolution in final report |
| --- | --- | --- | --- |
| Contribution links might be mistaken for automatic agent onboarding | High | A GitHub issue alone does not register, execute or rank an agent | Describe reviewed proposals/PRs; identify fixed registry and dispatch path; automation explicitly absent |
| Arena voting could be mistaken for a chess-strength measurement | High | Persuasive explanations can win preference votes while recommending bad moves | Separate subjective preference from objective game outcomes; no vote-derived chess ranking proposed |
| A small paid pilot could become an unsupported leaderboard | High | A handful of games, failures and opponent choices can determine apparent rankings | Require denominators, failures, protocol and uncertainty; label pilot; current games remain unrated |
| Current exports could be called a reproducible research corpus | High | PGNs do not contain full prompt/config/response provenance; hosted outputs may drift | Identify missing experiment manifest, provider response archive and seeded schedule; distinguish replay from rerun |
| Tactical datasets can be contaminated or misparsed | High | Public puzzles may be in training data; Lichess FEN is before the opponent move | Include format caveat; recommend frozen source/version and disclose contamination; do not equate local holdout with training exclusion |
| Model explanations could be interpreted as mechanism evidence | High | API explanation quality is not activation probing or a causal intervention | Restrict proposed claims to observable performance; cite original mechanistic methods |
| Stale or mutable sources could imply current superiority or intake | Medium | Launch posts and old bot articles do not establish current policies; Maia-2 has a successor | Exclude Kaggle/Lichess historical sources from final claims; note Maia-3 recommendation; date mutable sources by access |
| Open contribution design could be mistaken for validated demand | Medium | Useful templates do not prove anyone will contribute or reproduce results | State that demand is untested; recommend observing a completed contribution before costly automation |

## Traceability checks

Spot-checks against the source-task notes:

1. Anonymous Arena preference workflow → task-contribution findings 1–2, registry 1–2.
2. Code and donated-compute participation → task-contribution findings 7 and 9, registry 3–4.
3. Input/harness choices matter to protocol → task-contribution finding 6 and task-chess finding 8, registry 5–6.
4. FEN/repetition limitation and rating comparability → task-chess findings 1–2 and deep notes, registry 7.
5. Lichess first-move puzzle semantics and mate acceptance → task-chess findings 6–7, registry 8.
6. Mechanistic claims require different evidence → task-chess finding 3 and deep notes, registry 9.
7. Human move prediction differs from playing strength; successor caveat → task-chess findings 4–5, registry 10–11.
8. Current contribution and export boundaries → direct local code inspection listed in registry; not counted as external research evidence.

All eleven numbered report references map to the approved registry; no excluded source is cited as report evidence. The report adds no external URLs absent from the research notes. Recommendations are visibly labeled as proposals. Single-source details remain attributed, and no experiment result or market-demand claim is invented.

## Remaining limits

No new experiments, dataset downloads, paper replications, interviews, public submission attempts or arbitrary-code execution tests were performed by this research subtask. The whole report was checked manually, but there was no independent second reviewer of the synthesis. Research-source accessibility and dates rely on the two source investigators' recorded retrievals; synthesis did not re-fetch the same pages. Repository state may continue changing while the main implementation task proceeds.
