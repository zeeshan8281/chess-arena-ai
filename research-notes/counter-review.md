# P6 counter-review: tactics benchmarking implementation
AS_OF2026-10-14. Read scripts/benchmark-tactics.ts, src/tactics-benchmark.ts, app/components/tactics-benchmark.tsx, src/openrouter.ts, test/tactics-benchmark.test.ts, fixture metadata and initial Argon result; no paid calls and no code changes. Review is targeted, not full application audit. Findings refer to code snapshot reviewed before subsequent lead fixes.

## Findings

### HIGH 1 — Unknown charged failures are displayed as zero API cost
Script starts costMicros=0 and only updates it after a successful decoded adapter reply with known usage.cost. Deadline, transport, oversized-body, provider-error or unknown-billing cases may have incurred billable work but retain0 in evidence. Reservation accounting conservatively retains RESERVE_MICROS, which is good for the spend cap; reported summed case cost is nevertheless a lower bound, not necessarily total measured cost. UI currently labels it “Measured API cost” with no unknown-cost count.
Fix: record billingKnown / unknownCostAttempts (separate failed-request reservation from measured bill), show known cost with explicit unknown billing when applicable, and exclude incomplete/unknown-cost entries from any cost frontier. Preserve key usage reconciliation as aggregate evidence without allocating unexplained charges to particular models.

### HIGH 2 — Incomplete runs receive comparable-looking accuracy and intervals
complete=false only changes ordering and a subtitle. Score remains successes / all32 including unattempted cases, displayed with the same bar, Wilson interval, per-band counts and errors as completed runs. This conflates actual wrong answers with work never attempted after a provider/budget stop and invites incorrect comparison.
Fix: keep visibility but label unranked/incomplete; show attempted/total prominently, omit ranked accuracy/CI for incomplete runs or explicitly call it a completion lower bound rather than measured accuracy. Errors should distinguish provider failures from skipped positions. No current tactic Pareto exists, so no false frontier membership observed, but the rankings still need this treatment.

### MEDIUM 3 — Evidence cannot fully identify fixture and harness implementation
The fixture has a source CSV SHA256 and selection description, but individual run sourceHash includes only tactics-benchmark.ts, openrouter.ts, and the runner. It excludes positions.json and src/harness.ts. suite ID is static. A future edit to positions or helper policy could produce different trials under apparently matching provenance. configHash alone hashes harness settings, not implementation.
Fix: persist fixture SHA256 (full frozen fixture), harness implementation hash, prompt/protocol hash or exact serialized prompt template, and record upstream revision/hash. Avoid rewriting historical run hash to imply a newer scorer executed the old trials; annotation provenance may be added separately.

### MEDIUM 4 — Provider usage and termination evidence is discarded
openRouterMove returns inputTokens/outputTokens/finishReason, but per-case artifacts retain only requestId/model/cost/latency/move/error. A1024-output cap may include reasoning tokens and cause incomplete responses. Without termination/usage data it is harder to distinguish chess failure from token-budget exhaustion, verify actual cost, or audit requested versus returned settings. Same token ceiling is not equal compute across model families.
Fix: persist token counts, finish reason and available reasoning usage, along with requested settings; mark absent values null. No need to expose raw private reasoning text. Public report already correctly says model-plus-interface and settings, which should remain.

### MEDIUM 5 — Test coverage proves artifact arithmetic but not failure/budget behavior
Existing tests check legal fixture lines, count/band totals, Wilson bounds, and sum recorded evidence. They do not execute the runner with mocked provider failures, unknown cost, oversize response, HTTP stop, deadline, budget exhaustion or skipped slots; do not check complete/attempted correctness; and do not verify per-case FEN equals fixture post-setup FEN. Thus tests could pass if a runner silently gave the wrong state or incorrectly treated skipped cases as completed.
Fix: focused offline tests around extracted accounting/aggregation logic and provider mocks; assert requests cease before cap, ambiguous charges retain reservations, invalid responses never count correct, incomplete rows are excluded from comparative scores, and evidence FEN matches the shared fixture. This is substantive verification, not UI snapshot duplication.

### MEDIUM 6 — Harness subtitle overstates search for every local configuration
The component labels every non-model result “Arena search harness,” but the registry inclusion filter accepts random/capture/search brain types. This may be correct for the current three entries but is false as the registry grows.
Fix: expose actual brain/config label (e.g. published random/capture/search harness) or use generic “Arena harness.” Model-vs-harness grouping is otherwise appropriate.

## Cost-cap assessment
No critical definite cap breach identified in inspected implementation: calls are serial; reservation50,000microUSD is charged before each request and retained for ambiguous errors; starting allowance min($2,$5−keyUsage); adapter has provider price ceilings and request size/output limits. Post-model key usage reconciliation catches aggregate increases. However key usage is not rechecked before every call, so the cap guarantee assumes no other process spends the same key, as P0 explicitly states. This is a limitation, not evidence of actual overspend. Unknown billing must not be presented as free.

## Metric validity / opposing interpretations
The tactical track fixes the known weak-random-opponent ceiling but does not measure full games, memory, long-horizon recovery, or full-puzzle completion. Existing UI explicitly says first-move accuracy and public32-position pilot, appropriately limiting claims. Human rating bins need not order LLM difficulty. Wilson intervals are a descriptive approximation on a chosen stratified public set, not a confidence guarantee across chess or proof of a rank; paired per-item analysis would be preferable for later close comparisons. Public contamination remains unresolved, disclosed, and cannot be fixed by simply naming the sample “expert.” None of these justify inventing Elo or extending source rankings to current models.

Mate-in-one exception is not an active defect in this frozen fixture: parent confirmed no mateIn1 themes, and all answers are legal in tests. If future fixtures include these, accept any actual checkmating move or prohibit that theme explicitly.

## Research cross-check
Reviewed task-design.md and task-models.md source notes. Full-paper limitations and stale model rankings are disclosed; source types/public access dates recorded. Final synthesis report did not yet exist at initial review; final citation registry/claim matching therefore not signed off here. This is P6 implementation + notes review only.

## Disposition
0 critical definite defects,2 high,4 medium implementation issues. Lead notified immediately of high findings and provenance risk. Re-review required after changes; do not claim issues fixed solely from this report.

## P6 final synthesis pass — 2026-10-14
Read benchmark-design-report.md, registry.md, task-design.md and task-models.md, including the model specialist's main-paper read and follow-up UCI implementation note. Unlike the earlier initial review, the synthesis is now available. Checked all numbered citations against the final registry:12 unique IDs,32 citation occurrences, no missing IDs or dropped-source resurrection. Maximum citation-occurrence concentration is source1 at6/32=18.75%; this is an auditable citation proxy, not a word-attribution measurement. Twelve-source and domain/official-share counts agree with registry. The second specialist's main-paper read supports report statements extending beyond my initial abstract-only read; appendices and experimental reproduction remain explicitly outside scope.

Seven traceability spot checks passed: (1) Lichess CC0 and post-setup FEN convention [4/D1]; (2) mate-in-one alternative answers [4/D1]; (3) Kagi1000-puzzle provenance and contamination caution [5/D5]; (4) Wilson8/8 example and interval bounds [8/D2]; (5) relative engine rating and nonuniform depth [9/D3]; (6) fixed nodes/opening/color controls [10/D4]; (7) candidate pricing/reasoning settings versus actual execution distinction [6/C1,C2]. Recommendations such as32positions and future held-out ladder are clearly labeled proposals, not borrowed experimental findings.

Substantive controversies remain and are properly represented in the report:
- Public first-move tasks are affordable and discriminating, but susceptible to memorization and cannot validate long-horizon game play.
- Human puzzle-rating bands permit transparent stratification, but do not guarantee model difficulty or justify model Elo.
- Equal nominal token limits improve protocol consistency, but do not normalize inference compute or reasoning allocation across providers.
- Small stratified sets show observed differences, but broad Wilson bands and item correlation limit claims of superiority.
- Stronger engine opposition broadens assessment only if calibrated; replacing a universal ceiling with universal losses is not useful.

No critical factual/citation defect found in this synthesis. Two minor documentation corrections notified to lead: registry source12 is separated from its table by a blank line; the proposed near-term result still says five measured configurations while implementation may include six (use count-independent wording or final actual count). Report is explicitly a research proposal, not claimed run completion.

Source-level UI re-check confirms unknown billing now labeled as a cost minimum and main incomplete bars/intervals are suppressed as Unranked. Per-band table still renders incomplete rows as successes/8, which could be confused with attempted failures; lead notified to consider unavailable/attempted labeling. Future-run metadata and accounting helper tests are implemented; historical token/finish metadata cannot be recovered by these changes, and exact original runner snapshot was not preserved before editing. Any retrospective hashes must remain clearly marked annotations, not execution-time provenance. This pass did not rerun paid inference or perform browser visual QA.
