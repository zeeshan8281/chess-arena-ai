# Chess Arena as a workspace for improving agents

Independent draft one. Research as of 13 October 2026. This report recommends a product direction; it does not claim that proposed features have shipped or that any external experiment was reproduced. Citations refer to the accompanying approved registry. Recommendations and acceptance criteria are our inferences from the evidence.

## 1. The product should make an improvement test possible

The central recommendation is to organize Chess Arena around a concrete loop: select a version of an agent, run a controlled set of games, inspect what happened, change one part of its policy or harness, and compare the next version under the same conditions. A leaderboard can summarize the resulting evidence. A replay can explain it. Neither, by itself, gives a builder a way to improve anything.

The user's examples sharpen this distinction. Proxy War presents separate builder, agent and version concepts, and connects improvement to episode replays, decision logs and diagnostic flags. Softmax makes a coding-agent entry point visible and describes iteration through games. These are documented product patterns, not proof that this arena will attract the same audience. [2][1]

For the immediate website, the most useful addition is a free public regression lab for a small set of local chess policies. A visitor should be able to inspect a baseline, run the named suite, change an available strategy setting, and see the differences in the underlying games. If policy editing is not implemented, the page should offer comparison between named presets and say exactly that. It should never suggest that selecting a dropdown trains a model.

**Confidence: medium-high for the product mechanism, low for market demand.** Multiple products expose executable iteration, but no interviews or usage study establishes demand for this particular implementation. The immediate success criterion is therefore functional: can someone complete a real change-and-compare cycle and understand the evidence? Forms for proposing research are supporting infrastructure, not a substitute for that cycle.

## 2. What “improving an agent” means here

An agent's behavior is not determined solely by the name of its language model. Game Arena separates the game environment, prompt construction, sampling, parsing and model calls. Its options include different representations, history and legal-move visibility, and methods for handling attempted moves. [6] The public STS2 materials distinguish weight-training work from a fixed-weight agent track where notes, skills, context management and harness code may change. [3][4]

Chess Arena should adopt a similarly precise vocabulary. A **model** is the underlying inference system, if one is used. A **policy** is the decision procedure that chooses a move. A **harness** supplies observations, calls that procedure, handles its output and enforces limits. An **agent version** identifies the policy and configuration used in a run. These are proposed product definitions; the implementation must make them true rather than merely adding labels.

A local search bot provides a low-cost example. Its evaluation weights, search depth or move-ordering policy can change without any model training. A language-model agent could change its prompt, retained history or parsing policy. These changes ask different questions and should not appear in one undifferentiated ranking. Supplying legal moves also changes what is being evaluated: it tests choosing among valid actions rather than independently reconstructing all legal actions.

**Confidence: high for the distinction, conditional for implementation.** The evidence supports separating components. It does not establish that the current app supports all forms of modification, or that a changed harness has improved. Professional copy should say “test a policy change” or “compare configurations.” Reserve “improved” for a stated measure on a stated test, and reserve “trained” for an actual training procedure.

## 3. Begin with a working baseline, not an application form

The first-run experience should produce a game artifact. Kaggle Environments opens with a compact agent, a match against a default random opponent, and replay rendering, then explains the observation-to-action contract. [11] UNSW Battlecode similarly moves from starter creation to a local game and replay before authentication and versioned submission. [12] Softmax makes a copyable coding-agent instruction visible on its homepage. [1]

For this arena, the homepage's primary builder action should be **Open the agent lab**. The first screen should already contain a valid local baseline and a clearly named test. It should state what the agent receives, what it must return, and what resources it can use. A visible run action should lead to a finished or explicitly stopped run, not another instructions page. Developers should have a starter download and copyable setup instructions beside that flow.

This does not require unrestricted uploads. The smallest complete implementation can expose a few built-in policies whose source is public, or validated settings within one policy. A public code-hosting service would require isolation, resource ownership, account controls and a different execution boundary. Those are separate commitments. Calling an upload field “bring your agent” before execution exists would recreate the original problem of promising participation through a surface that cannot deliver it.

**Confidence: medium-high.** Runnable starters are well-supported precedents; the precise layout is a design judgment. Test the complete first-run path without a paid key. If the machine-readable instructions cannot actually run the published starter against this project's runner, they are unfinished documentation, regardless of how polished the page looks.

## 4. A public regression suite is the first defensible evaluation product

The proposed suite should be deliberately modest: a versioned list of starting cases, a specified opponent policy, a fixed seed list where randomness is involved, both colors, and explicit move and time limits. Each run should retain the suite identity and the precise policy version. A visitor then has a stable question: did this change behave differently on these cases?

Hugging Face's evaluation guide emphasizes that implementation, prompts, generation settings, seeds and backend choices affect scores. [7] STS2's pod design describes separate server-selected training and evaluation seed pools, but its implementation notes also leave restoration and evaluation-battery scripts as remaining work. That document is a useful design precedent, not proof of a completed controlled-learning system. [4]

The arena should start with a **public regression suite**, visibly labeled as such. Its cases can be inspected, so a builder can overfit them. Passing them is evidence of behavior on known cases; it is not evidence of general strength, unseen-position performance or autonomous learning. If held-out evaluation is introduced later, it needs a separate protocol and leakage controls. A hidden tab containing the same public cases is not a held-out test.

Run acceptance should require a recorded starting position and history, color, opponent, seed, version, configuration, termination policy and final state. Version identity must include a source revision, content hash or the exact code used, not only a mutable name such as “v2.” Paired colors alone are insufficient if the opponent or opening changes between versions. A FEN by itself also omits repetition history; use a complete starting state and move record when that history matters.

**Confidence: high for reproducibility requirements, medium for the chosen initial case set.** The suite should launch small enough to inspect and test. Its value comes from controlled comparison, not the number of games advertised.

## 5. Make the comparison unit the run, with games underneath

A comparison screen should place two recorded runs side by side. The top of each column identifies agent version, suite revision, opponent and resource limits. A compatibility check should warn when those conditions differ. Below that, show completed wins, draws and losses alongside stopped or failed games. Every aggregate should open the games that produced it.

This is a proposed data model rather than an external finding. It follows from the need to preserve the experimental unit. If a run comprises a list of cases, the report should show how many were planned, attempted, completed and stopped. For N opening/seed cases, paired colors schedule 2N games; completed, capped, errored, cancelled and unrun categories must reconcile to that total. Re-running only losing cases and adding the new wins to the original denominator would not be a fair version comparison. Nor should a shorter run silently appear equivalent to a complete one.

UNSW Battlecode documents per-version records, build logs, activation of a chosen version and match diagnostics. [13] Proxy War's build flow treats an upload as a new version and preserves registry history. [2] These observations support immutable identities and readable release notes. They do not prescribe a particular rating formula for this app.

The first comparison metric can remain simple: “On this suite, version B completed these cases with these outcomes.” Include the exact counts. Do not infer superiority from one favorable game. The LLM Chess paper itself characterizes a small random-opponent stage as a gate rather than a precise ranking exercise. [9]

**Confidence: high for provenance and denominators, conditional for statistical claims.** A useful early product can show transparent observations without estimating Elo or significance. If later adding uncertainty estimates, the model must respect the pairing and dependence structure of the experiments.

## 6. Failures are part of the result

The lab should answer two different questions: did the agent complete the task within the rules, and how did it play when it did? Kaggle Environments distinguishes timeout, execution error and invalid action. [11] Proxy War's documented diagnostics distinguish degraded or fallback behavior from simply losing a valid game. [2] LLM Chess also reports failures at different levels rather than presenting only a final game score. [9]

A chess run therefore needs visible, separate categories for checkmate or ordinary draw, configured move cap, budget stop, illegal move, invalid response, timeout, provider failure and manual cancellation where these can actually occur. The exact status taxonomy must follow the runner. A frontend should not turn an unknown exception into a draw, or present an interrupted game as completed because it has a final stored board.

For builders, the key affordance is **Inspect failure**. It should jump to the last valid position and show the attempted action, validation result and recorded timing. Preserve those fields in JSON; unfinished or errored games should export a PGN result of `*`, not a draw. Where a provider charge is unknown, say unknown; zero communicates something different. If a fallback was used, disclose it and retain the original attempt. A fallback can keep a demonstration moving while contaminating an experiment about the primary policy.

The Warcraft authors' report is instructive because it describes specific behaviors—such as inconsistent commitments and action timing—rather than claiming that a single score explains the agent. Those are author-reported observations from one setup, not independently replicated findings or universal model limitations. [5]

**Confidence: high for exposing failures.** The website should make operational reliability inspectable without claiming to know the model's hidden reasoning. Observable evidence is enough to guide the next controlled change.

## 7. Replays should be a debugging workspace

The replay belongs inside the improvement loop. It should preserve the selected historical move while new events arrive, indicate whether the visitor is following live play, and keep the move list, board and exports synchronized. A run-to-game-to-ply path makes an aggregate failure recoverable as a concrete position.

The smallest valuable inspector shows the current position, move history, active side, agent configuration, outcome and available turn evidence. Add navigation for factual events such as captures, checks, castling, promotion and checkmate. These events can make a long game readable without pretending to evaluate move quality. A material count can be useful if labeled as material rather than an engine evaluation.

Chess.com Game Review connects selected moves to retry actions and evaluation, but its documentation notes that classifications depend on analysis settings. [14] This is a reason to avoid decorative accuracy bars and “blunder” tags in a site that has not run recorded engine analysis. A check is not necessarily a good move; a capture is not necessarily an advantage.

Provide **Copy FEN**, full **Download PGN**, and a stable replay link to the selected ply. Lichess studies offer a precedent for preserving position context and exportable analysis artifacts. [15] An outgoing analysis link is useful if it opens the selected board, but it should be labeled as an external service. It must not imply analysis has already been performed by the arena.

**Confidence: high for the artifact workflow, medium for navigation details.** Test both a completed game and a stopped game. Correct state restoration and evidence retrieval matter more than adding a simulated commentary feed.

## 8. Human play and challenges support the builder story

Public practice and small challenges give a visitor a way to understand the environment before building a policy. They should connect back to the arena's real games rather than expanding into a generic chess-learning portal. A useful path is: watch a game, pause at a position, try an action, inspect the result, then see how the agent handled it.

Lichess studies provide a historical precedent for preserving positions and reusable analysis artifacts. [15] Its puzzle export documentation specifies position conventions and allows any checkmating move for mate-in-one tasks. [16] These establish interaction and validation precedents. They do not prove that a handful of exercises improves general chess ability.

A mate-in-one position taken from a real completed arena game is a particularly bounded initial task. Enumerate legal moves and accept every move that produces checkmate. A legal nonmate can receive objective-specific feedback; it should not be labeled a universally bad move. Show source game and ply, hide the recorded answer until attempt or reveal, and offer a replay link afterward.

The builder benefit is not a puzzle rating. The same verified position can illustrate the observation/action contract or become a public regression case with the appropriate provenance. Human practice, a curated tactical test and a full agent match remain different tracks. They should not silently contribute to one strength leaderboard.

**Confidence: medium.** These interactions are feasible supporting features, but an oversized puzzle catalog could dilute the harness-improvement product. Prioritize a small number of correct, attributable tasks and accessible input. Leave accounts, streaks and a full curriculum out until users need them.

## 9. A professional website communicates scope without burying the action

The site should organize around **Lab**, **Runs**, **Agents** and **Watch**, with practice and learning as supporting routes where they exist. The opening screen should offer a runnable starter or suite and a recent real run. The main headline should describe a testable activity: “Build a chess agent. Test the change. Inspect every game.” That is proposed copy, conditional on the product implementing those actions.

Each results surface needs a compact protocol summary. State whether legal moves are supplied, whether history is included, the opponent category and the relevant limits. Deeper methodology belongs one click away. Game Arena's configurable harness demonstrates why a model name alone cannot communicate the conditions of an experiment. [6] The amortized-planning chess paper also cautions that tournament ratings and human-site ratings are not interchangeable. [10]

Remove signals that imply maturity unsupported by evidence: fictional community activity, unexplained ordinal ranks, fake charts or “live” labels on finished records. A no-runs state should offer a useful first action. A stopped-run state should offer inspection and a next step. A paid operation should explain its access and spending boundary without leaking internal tokens or implementation plumbing into the primary visitor experience.

**Confidence: medium-high for clarity, unmeasured for usability.** The research supports the underlying distinctions, not a proven information architecture. Test whether a new visitor can distinguish a local policy from a hosted model and a public suite from open-ended games. If that requires reading a long methodology essay, simplify the interface while retaining the evidence.

## 10. Implementation should preserve a narrow, complete boundary

The recommended delivery sequence is a decision framework, not a status report. First, establish run identity and suite identity. Second, execute the smallest local suite through the existing trustworthy move path. Third, retain game artifacts and per-case status. Fourth, display comparison and failure inspection. Finally, add onboarding and spectator entry points that lead into those working capabilities.

Avoid creating a separate rules implementation for the lab. The local suite and hosted matches should share the existing legal-move enforcement where their protocols overlap. New code must preserve cancellation, terminal-state handling and persistence guarantees rather than bypass them to generate fast results. If browser-only execution is chosen, its resource limits and persistence behavior need their own accurate description; it must not inherit hosted-worker guarantees it does not have.

A small release can use existing built-in opponents and a fixed public suite without adding dependencies, a new queue or a public upload service. That is a useful boundary if the user can inspect, run and compare it. It is not useful if the site merely describes the intended workflow and links to an issue template.

Verification should cover determinism for fixed local conditions, both colors, suite completeness, version identity, partial runs, failure categories, replay restoration and downloadable evidence. Seed each case/leg's random process independently and define stable tie-breaking. Compare repeat runs' move sequences and outcome categories, excluding variable timings and generated run IDs. Test that a rerun creates a new observation rather than overwriting the original. Test that incompatible runs are identified. Tests should inspect behavior and data integrity, not only confirm that a button renders.

**Confidence: conditional on code inspection and execution.** Research notes contain targeted implementation observations, not a full audit. The shipping report must state the features actually implemented, the checks actually run and remaining limits.

## 11. Boundaries for stronger claims and future work

A public regression lab can help someone discover a bug or compare a change. It cannot, by itself, establish autonomous learning. The STS2 project describes a broader architecture, but some evaluation and restoration components remained unfinished in the inspected design notes. [3][4] The linked dataset returned an inaccessible public page, so its contents were not inspected. No dataset-content or measured-improvement claim should be inferred from that link.

Similarly, deterministic scenarios are useful for debugging but vulnerable to memorization and narrow tuning. A later generalization program would need held-out cases, a declared sampling procedure and controls over version selection. A later model-strength program would need adequate opponent coverage and appropriate statistical treatment. A later public hosting program would need authenticated ownership, isolation and controlled spending. These are different expansions, not labels to apply to the initial suite.

Provider-backed runs add a further limitation: recording prompt and settings improves traceability but does not freeze a remote backend. The evaluation guide's reproducibility concerns support preserving actual outputs and artifacts, not promising identical reruns. [7] Exact replays reconstruct the recorded game; a fresh model call may produce a different move.

**Confidence: high for these limits.** Keep the private chat anecdotes supplied as context out of public evidence. Do not publish unverified claims about minimum model size, context budget or fine-tuning time. Those may inspire experiments, but they are not established constraints for this product.

## 12. Decision and evidence standard

Proceed with the harness-improvement workspace. The release should let someone choose a real local agent version, execute an identified public suite, inspect each game and failure, and compare a subsequent configuration without losing the original evidence. Replay moments, human challenges and readable setup instructions should bring users into that loop. A research reading list and contribution templates belong behind it.

The evidence threshold for calling this complete is practical. A fresh visitor can finish a local run without paid credentials. Two runs under the same conditions expose those conditions visibly. A change produces a new version or configuration identity. Stopped cases remain visible. A displayed difference can be traced to game artifacts. Exported PGN and JSON correspond to the selected run. No screen claims general chess strength, unseen-test performance, automated learning or sandboxed arbitrary uploads without the required implementation.

The research used official product documentation, primary project materials and research papers, with publication and access dates separated in the registry. The five user-supplied links were inspected through a browser by the lead; the dataset was inaccessible, and the X announcement is supplementary rather than the main evidence. Competitor workflows were observed or documented, not exercised through submission or training. Reported author experiments were not independently replicated.

**Overall confidence: medium-high in the direction, conditional in delivery, low in growth predictions.** The recommendation addresses the concrete participation problem by giving people an executable improvement loop. Whether that loop creates a durable community remains an empirical question for the product after the core task is working.
