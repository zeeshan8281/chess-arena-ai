# Counter-review: minimum credible policy regression lab

AS_OF: 2026-10-13. Reviewed `plan.md` and notes `task-a.md`, `task-b.md`, `task-c.md`, `task-d.md`, and `task-browser.md`. This is a research and specification critique, not a code or deployment audit. No new web research was performed. Draft review is pending until the independent drafts are available.

## Decision and governing claim

The free deterministic local policy lab is a better fit for the user's clarified direction than adding an unrelated chess curriculum. Its credible promise is: **change a policy, run the same public cases, inspect failures and compare evidence**. It is not yet autonomous self-improvement, model fine-tuning, an uploaded-code execution platform, or a held-out strength benchmark.

The browser-reviewed STS2 notes distinguish fixed-weight harness changes from weight training and explicitly identify unfinished evaluation machinery. Proxy War's versioned submissions and failure diagnostics support an inspectable iteration loop. Warcraft's author-reported failures motivate scenario tests, without establishing universal model limits. [STS2](https://github.com/mingxuan-he/sts2-agent), [pod design](https://github.com/mingxuan-he/sts2-agent/blob/main/docs/track2-pod-design.md), [Proxy War](https://proxywar.xyz/build), [Warcraft environment](https://pwang724.github.io/wc3env/).

## Meaningful issues that must change the product or claims

### 1. “Improved” can merely mean overfitted to the visible examples

If the developer can inspect every opening and seed, repeatable score gains demonstrate progress on that public suite only. Do not label the public fixtures “test set” in a way that implies unseen evaluation. The STS2 pod specification's train/eval separation is a relevant precedent, but its documentation is not proof of a working assessment system. [Pod design](https://github.com/mingxuan-he/sts2-agent/blob/main/docs/track2-pod-design.md).

**Resolution:** Call this a public regression suite. Label version comparisons “On these cases.” Keep a separate held-out suite and leakage controls as future work, not a hidden claim. Preserve regressions and losses as prominently as wins.

### 2. Balanced colors alone do not make the comparison controlled

Two runs can swap colors and still differ in opening, opponent version, move cap, random schedule, engine depth or policy implementation. A same-model label is not enough; Game Arena and the Hugging Face guidebook make protocol and implementation differences explicit. [Game Arena](https://github.com/google-deepmind/game_arena), [reproducibility guide](https://github.com/huggingface/evaluation-guidebook/blob/main/contents/troubleshooting/troubleshooting-reproducibility.md).

**Resolution:** Freeze a suite manifest, opponent and policy source identity, per-case initial state and seed, and termination rules. Run candidate and baseline against the same manifest. Reject or clearly mark incompatible comparisons. A fixed random seed fixes a pseudorandom process; it does not guarantee that different game trajectories produce identical opponent moves.

### 3. Calling capped or failed games draws corrupts the result

A maximum-ply stop is not a legal chess draw. A crashed or invalid policy response is not a successfully completed game. Pooling these states into draws can reward a strategy for avoiding completion or conceal a regression. Task C's primary research separates ply/game failures and treats its small random-opponent stage as a gate, not precise ranking. [LLM Chess](https://arxiv.org/html/2512.01992v1).

**Resolution:** Persist and display separate chess outcome and run status. Use explicit `capped`, `error`, and `cancelled` categories. Preserve the exact reason and last valid state. Export unfinished PGNs with `*`, not `1/2-1/2`. Report completed coverage beside any score. No invented loss penalty or draw conversion unless it is an explicit versioned competition rule; even then retain the underlying failure category.

### 4. A version name without source identity cannot support reproduction

“v2” can refer to different code tomorrow. A prompt field or slider that is never read by the runner is not customization. Proxy War distinguishes competitor and uploaded version; Battlecode's workflow likewise names versions and preserves replay/debug artifacts. [Proxy War](https://proxywar.xyz/build), [Battlecode quickstart](https://game.battlecode.au/docs/quickstart).

**Resolution:** Capture immutable policy ID plus source hash/revision or the exact source used, normalized config and harness version. Changes must create a new identity; old results stay attached to old identity. A purely local browser lab should state where runs are stored and what is lost on refresh/clear-storage. Do not imply hosted persistence or public submission merely because there is an export button.

### 5. Exporting a summary number is not exporting evidence

A W/D/L card without individual case outcomes, moves, initial state or errors cannot establish whether an improvement is real. Conversely, a PGN alone cannot reconstruct a policy, seed or cap. Kaggle's documented agent interface and failure categories are a practical precedent for keeping execution evidence separate from game result. [Kaggle environments](https://github.com/Kaggle/kaggle-environments/blob/master/README.md).

**Resolution:** Export a machine-readable run bundle plus PGN, with every requested case represented. Regeneration and exact replay are different claims: replay requires retained moves; re-running requires code/config/environment. If an export omits what is needed for regeneration, say that.

### 6. Spectator additions can distract from the actual improvement loop

Mate puzzles and replay moments are useful supporting features, but they do not meet the clarified harness-development goal by themselves. A polished landing page with a research reading list still fails if visitors cannot modify something meaningful and compare controlled runs.

**Resolution:** Give the lab one clear next action after a run: inspect a failure, change the policy, rerun identical cases. Keep challenges tied to arena evidence and secondary to that loop. Do not add claims that users can improve a hosted model or upload arbitrary code when only preset local strategies run.

## Minimum acceptance criteria

The following are release gates for the proposed free deterministic lab. They are not statements that tests have passed.

| Area | Minimum passing behavior | Concrete check |
|---|---|---|
| Free execution | A public visitor runs the local suite without a provider key, paid API request or operator credential | With all provider credentials absent, complete a suite; inspect request path/code and ensure no provider invocation |
| Actual policy choice | Selected parameters or policy source determine move decisions; displayed source/config matches runner input | Use a controlled position where two supported configurations choose different legal moves; exported identities differ |
| Suite identity | Manifest includes suite version, ordered case IDs, initial FEN and required prior history, seed, cap, and rules/harness versions | Export contains exact manifest; modifying any condition changes identity or blocks direct comparison |
| Paired colors | Every opening/seed case has both candidate-as-white and candidate-as-black games | For N base cases, schedule exactly 2N games; each leg references its pair and candidate color |
| Fixed opponent | Opponent algorithm and config/source identity are constant across compared runs | Export both opponent version/config and candidate version/config; no silent random selection of opponent |
| Deterministic random process | Seeded PRNG and tie-breaking behavior are defined and isolated per case/leg | Run identical policy and suite twice; move sequences and outcome categories match; wall-clock durations may differ |
| Termination fidelity | Checkmate, legal draw, capped, execution error and cancellation remain distinguishable | Force each category in a fixture; counters, per-case text, JSON and PGN agree; no unfinished game exported as a draw |
| Failure evidence | Invalid output/error does not mutate the last valid position and does not disappear from totals | Include case ID, attempted action/error kind, failing ply and last valid state in export |
| Complete accounting | Requested, attempted, completed, capped, errored and unrun/cancelled counts reconcile | Sum categories equals scheduled games; a partial run never appears completed |
| Honest comparison | Baseline/candidate results use identical manifests and expose changed cases as well as totals | Self-comparison has zero outcome delta; mismatched manifest receives a warning or refusal |
| Evidence export | JSON contains source/config identities, suite, moves and statuses; PGN contains correct start setup and result | Reconstruct every final board from exported initial state and moves; compare to exported terminal state |
| User control | Run cannot double-submit inadvertently; cancel/reset does not overwrite a completed baseline | Start/cancel/rerun and compare; retain previous artifact or explicitly prompt/export before replacing |
| Useful feedback | Results lead to exact case replay with policy identity, color and stop reason visible | Click a losing or errored case; board, move list and exported case identify the same run |

For deterministic local policies, count-based limits such as search depth/nodes/plies support repeatability better than an outcome that depends on laptop speed. A wall-clock safety timeout may still be needed, but must produce an infrastructure/timeout status and remain separate from chess outcomes. This is an engineering recommendation, not a reproduced experimental result from the external sources.

## Minimal public language

Suggested: “Run your policy on a fixed public suite. Compare the same openings, colors and opponent. Inspect every game and export the evidence.”

Required nearby qualification: “Local regression results. Not a human chess rating or held-out benchmark. Capped and failed runs are reported separately.”

Avoid: “Self-improving AI,” “train your model,” “scientifically ranked,” “production sandbox,” or “beats humans” unless those exact capabilities and evidence exist. A deterministic regression run can validate code changes; it cannot by itself validate a scientific generalization claim.

## Evidence and access caveats

Source metadata and access notes reside in task A/C/browser notes. Browser-supplied user links were not fetched again. The STS2 dataset was inaccessible (404) and described as private by its README; no dataset-content claims are supported. Private Slack context must not be republished. Competitor documentation supports workflow precedents, not demand, conversion or measured effectiveness.

No tests, app edits, paid calls, external code execution, security audit or deployed-state inspection were performed for this counter-review. Independent drafts still require a consistency pass against these gates.

## Draft review addendum — draft one

Read `draft-one.md` in full after it became available. It aligns with the counter-review: controlled public cases, explicit failure categories, versioned artifacts, no claim of autonomous learning or held-out generalization. No blocking research-claim conflict found. Sent these four concrete precision improvements to its author and synthesis agent:

1. Reconcile all scheduled paired legs, including unrun/cancelled cases, rather than only attempted games.
2. Specify PGN `*` for capped/error games and preserve last valid state plus attempted invalid action in JSON.
3. Define deterministic replay checks over move/outcome artifacts, excluding timings and run IDs; stabilize per-case/leg PRNG and tie-breaking.
4. Require policy source/hash or exact source plus config, not a human-readable version name alone.

## Draft review addendum — draft two

Read `draft-two.md` in full when it became available. No blocking research-claim conflict found. It preserves the inaccessible-dataset caveat, attributes author-reported results, separates public regression from held-out evaluation, and describes future capabilities as proposals. Its author confirmed adoption of the paired-schedule, PGN and determinism clarifications. The same source/config identity requirement applies. One additional precision request was sent: make “save” explicit about downloadable artifacts, browser-local storage or server persistence once the implemented behavior is known.

Both draft consistency passes are complete. These passes establish alignment of research recommendations and claims, not acceptance of code, tests or deployed behavior. The implementation owner still needs to run the release gates above and report actual outcomes.
