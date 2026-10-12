# Research synthesis verification

AS_OF: **2026-10-13**. This file verifies the report's evidence and synthesis process. It does not certify application behavior. Actual runtime checks belong in [docs/verification.md](../../docs/verification.md), which exists at the time of this review.

## Completed workflow

Read the plan and all task notes: A (onboarding), B (spectator products), C (evaluation trust), D (candidate scope), and browser observations of the newly supplied examples. Established a fixed registry and evidence-mapped outline. Two agents independently wrote complete drafts: draft one (approximately 3,400 words) and draft two (3,459 words after counter-review refinements). A third researcher reviewed the direction and both drafts. The final report unions their useful distinctions rather than concatenating their text.

`REPORT.md` is **4,162 whitespace-delimited words**, within the 3,000–4,500 requirement. Its body uses all sixteen approved source IDs. Its external source URLs all appear in the approved registry. No new research fetches were made during this union.

## Union decisions

| Material | Decision and rationale |
| --- | --- |
| Draft-two backbone | Retained the progression from product decision and browser examples to reproducible runs, version evidence, presentation, debugging, research agenda and release boundaries |
| Draft-one component definitions | Added explicit model/policy/harness/version vocabulary to prevent preset selection or prompt changes being described as model training |
| Draft-one comparison requirements | Added manifest compatibility check and immutable source/config identity; incompatible runs cannot silently produce a controlled delta |
| Draft-one partial-run accounting | Preserved all 2N planned paired legs, including unrun work; warned against merging favorable reruns into an original denominator |
| Draft-one implementation discipline | Added reuse of existing rules enforcement and narrow browser/CLI boundaries; browser execution does not inherit hosted-worker guarantees |
| Draft-one secondary challenges | Demoted to optional future support for observed failures; no generic puzzle catalog in the primary delivery promise |
| Counter-review refinements | Preserved PGN `*` for unfinished games, last valid state and attempted invalid action, and deterministic artifact checks excluding timing/run IDs |
| Implementation scope accompanying the report | Distinguished current two-preset browser lab and local custom-policy CLI from the proposed wider platform; tab-local artifacts until download; no server version registry, hosted arbitrary-code execution, training or held-out suite |
| Verification ownership | Linked actual runtime evidence rather than inventing test counts, successful deployment claims or browser checks not performed by the synthesis author |

Implementation scope was supplied by the lead implementation agent in the task assignment. This research subtask did not independently execute the new lab or CLI. The final report expressly points to the separate runtime record.

## Traceable claim checks

| Final report claim | Supporting note and approved source | Check result / qualification |
| --- | --- | --- |
| Softmax provides a coding-agent entry and build/play/learn pattern | task-browser finding 1; [1] | Traceable browser observation; no conversion or demand claim |
| Proxy War separates builder, agent and version and exposes diagnostics | task-browser findings 2–3; [2] | Traceable browser observation; no upload was performed |
| STS2 fixed-weight track changes notes/skills/context/harness while game state is external | task-browser finding 4; [3–4] | Traceable; not claimed as complete measured self-improvement |
| STS2 design has separate seed pools and unfinished restore/evaluation work | task-browser finding 5; [4] | Preserves documented incompleteness |
| Warcraft authors describe scenario-specific failures | task-browser findings 7–8; [5] | Attributed to authors; no portable cost, performance or model-family assertion |
| Game Arena varies representation, history, sampling and parsing | task-c findings 1–2; [6] | Traceable harness documentation; not proof of app capability |
| Evaluation implementation/settings affect comparisons | task-c finding 3 and deep read; [7] | Traceable primary guide; does not promise exact hosted reruns |
| LLM Chess's small random-opponent stage is a gate, not precise ranking | task-c finding 6; [9] | Traceable paper design; no published scores transferred |
| Tournament and human-site Elo differ | task-c findings 7–8; [10] | Traceable paper caveat; no fabricated rating |
| Runnable starter and replay precede broader submission flow | task-a findings 4–8; [11–13] | Traceable documentation; identifies UNSW correctly |
| Engine-based classifications depend on analysis settings | task-b findings 1–2; [14] | Traceable support documentation; uncomputed blunder labels excluded |
| Historical study artifact/export precedent and puzzle schema limits | task-b findings 4, 7–8; [15–16] | Historical status and limited export-license scope retained |

No report claim relies on inaccessible dataset contents or private Slack anecdotes. The 404 is described as an access failure, not evidence of nonexistence. The redundant semi-public X post and search-only Kaggle landing page remain excluded.

## Citation concentration

Counted bracketed source references in the report body, excluding the bibliography. This is a reproducible proxy for citation concentration, not a measure of rhetorical importance or independent corroboration.

| Source ID | Mentions | Share of 24 mentions |
| --- | ---: | ---: |
| 1 | 2 | 8.33% |
| 2 | 3 | 12.50% |
| 3 | 2 | 8.33% |
| 4 | 2 | 8.33% |
| 5 | 2 | 8.33% |
| 6 | 2 | 8.33% |
| 7 | 1 | 4.17% |
| 8 | 1 | 4.17% |
| 9 | 1 | 4.17% |
| 10 | 1 | 4.17% |
| 11 | 1 | 4.17% |
| 12 | 1 | 4.17% |
| 13 | 2 | 8.33% |
| 14 | 1 | 4.17% |
| 15 | 1 | 4.17% |
| 16 | 1 | 4.17% |

Maximum per-source citation share: **12.5%**, below 25%. STS2 sources [3–4] together account for four mentions (16.67%) and are treated as one project's evidence, not independent validation. Registry: sixteen approved families/seventeen URLs, fourteen official families (87.5%), eight conservative domain groups. All have access/type/date metadata. Primary publisher claims remain distinguished from independently reproduced findings.

## Counterissues and resolutions

1. **Public-suite overfitting:** final report calls it development/regression, explicitly excludes held-out inference and describes future separation as future work.
2. **Broken comparison provenance:** added manifest compatibility, exact source/config identity, immutable previous observations and explicit remote-policy attestation limits.
3. **Failures disguised as draws:** kept stopped categories, planned denominator reconciliation, last valid state and PGN `*` for incomplete games.
4. **Preset choice disguised as training/custom coding:** current browser scope explicitly says two presets; custom policies use local CLI; no training or hosted arbitrary-code execution claim.
5. **Persistence overstated:** browser artifacts described as tab-local until download; no stored version registry implied.
6. **Puzzle expansion obscures harness improvement:** optional future supporting role only, tied to observable failures.
7. **Unverified performance/adoption:** author results attributed; no claim of replicated improvement, demand, scientific ranking or general model superiority.
8. **Professional presentation implies mature validation:** removed unearned Elo/accuracy assertions; implementation checks delegated to the actual runtime verification record.

## Remaining limits

This was a bounded review, not an exhaustive literature survey. Source retrieval and browser evidence rely on the investigators' recorded notes; synthesis did not re-fetch them. No model training, experiment replication, dataset inspection behind the 404, user study, provider-term audit, deployed-product check or security audit was performed by this subtask. Source mutability, hosted-model drift and the distinction between replay and regeneration remain explicit in the report.

Final editorial check: each of the ten substantive sections now includes an explicit confidence assessment with a rationale. No new sources or claims of runtime validation were added.
