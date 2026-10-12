# From chess arena to a harness-improvement workspace

**Research synthesis and product decision · 13 October 2026**

## 1. Decision: make improvement the product

The next useful version should help someone build a chess-playing agent, run a declared test, inspect what failed, change its harness, and compare the new version with the old one. The central artifact is a reproducible run, connected to a particular policy and its game records. A leaderboard can summarize those records later. A research reading list can explain why the tests matter. Neither should substitute for the actual improvement loop.

This direction follows the user's examples more closely than a general chess-learning portal. Softmax presents coding-agent onboarding and a repeated build, play and learn workflow. Proxy War distinguishes the person building a competitor, the persistent agent and its uploaded versions, and connects improvement to replay and diagnostic evidence. These are observed product patterns, not evidence that copying them will produce adoption. [1][2]

The proposed near-term release is a **public regression lab** for a bounded local policy: fixed cases, a fixed opponent, balanced colors, declared randomness, a saved configuration and a downloadable result bundle. A visitor should be able to rerun the same test after making one change and see exactly which games or failure modes changed. Public practice games remain useful for exploration, but their outcomes should stay separate from controlled comparisons.

The implementation accompanying this report is narrower than the full recommendation: a **free browser lab comparing two built-in presets** and a **local CLI for a custom policy**. Browser run artifacts are tab-local until downloaded. There is no stored version registry, hosted arbitrary-code upload or execution service, training loop, or held-out suite. Selecting a browser preset does not edit its source or train a model. Custom-policy work belongs to the local CLI path.

This scope statement is not a claim that every runtime check passed. Consult [the implementation verification record](../../docs/verification.md) for actual checks, deployment status and remaining failures. The research authors did not execute those checks. The broader features below remain recommendations unless that record establishes their delivery. “Improvement” does not mean automatic learning: the initial product supports a deliberate change by a person or coding agent and makes the observed effect inspectable.

Confidence is **medium** in this product recommendation. The sources support concrete workflow and methodology patterns. They do not establish demand among this arena's users. The strongest early validation is one complete outside-user cycle: start, run, inspect, revise and compare without private explanation from the maintainer.

## 2. What the supplied examples establish—and what they do not

The browser investigation is especially useful because it changes the product question from “what content makes a chess site look complete?” to “what infrastructure lets an agent builder learn from experience?” Softmax's visible instructions give a coding agent an executable entry point. Proxy War's build guide and improvement flow expose named versions, episode evidence and diagnostic distinctions such as fallback or degraded planning. A loss in a valid game is different from a broken execution path. [1][2]

The STS2 repository separates weight-training work from a fixed-weight agent track. In the latter, notes, skills, context management and harness code can change while the game state remains outside the agent sandbox. Its pod design describes distinct training and evaluation seed pools, serialized observations and legal actions, action-attempt logs, context snapshots and query records. It also leaves restoration and evaluation-battery work unfinished in its own implementation notes. This is a valuable design reference, not proof of measured self-improvement or an audited isolation system. [3][4]

The Warcraft environment article provides a complementary lesson: success in a narrow scenario need not transfer to a complete game. Its authors describe a game-control interface and report failures involving target switching, forgotten commitments, latency and conflicting actions. Those are author-reported observations from their setup. They motivate failure-specific test cases; they do not establish a universal weakness of a model family or a portable cost estimate. [5]

Two evidence boundaries matter. The linked STS2 dataset returned 404, and the repository describes it as private. No dataset rows or actual run traces were inspected. The private chat excerpt supplies user context, not publishable validation of model-size, context-window or training-time claims. Public documentation must omit those anecdotes and identities.

Use precise vocabulary throughout the product. A **model** is an inference system, if one is used. A **policy** chooses a move. A **harness** supplies observations, calls the policy, validates its output and applies limits. A **version** identifies the policy source and configuration used in a run. These definitions keep a prompt change, local search change and model-training procedure from being presented as the same activity. A version label becomes meaningful provenance only when tied to the actual code or configuration.

The inference for chess is narrow and practical: retain the observations and decisions needed to explain an outcome, isolate a suspected failure, and rerun an appropriate case after a harness edit. There is no need to reproduce every architectural component of the examples. Their scope is larger than a first chess lab, and their documentation alone does not establish which components are essential for this audience.

**Confidence: high for the documented distinctions, medium for their transfer to chess.** The browser evidence describes project workflows and limitations; their outcomes were not replicated.

## 3. Give builders a first run, not an application form

The first action should produce a working artifact. A visitor sees a short contract, starts with a local policy or hands machine-readable instructions to a coding agent, completes a game, and lands on a replay with a clear next step. A GitHub proposal is appropriate for suggesting project changes; it is a poor substitute for actually trying the product.

There is supporting precedent beyond the supplied examples. Kaggle Environments documents a small executable agent, a built-in opponent and rendered output. UNSW Battlecode's quickstart moves through a starter, local play, replay inspection and named submission; its API exposes version statistics and operational failure records. These sources support an actionable starter and feedback path, not the claim that this arena already offers their submission infrastructure. [11][12][13]

The smallest starter should show what the agent receives and what it must return. For chess this includes the board representation, side to move, legal-action assistance, available history and the exact move format. A local deterministic baseline is valuable because visitors can exercise the loop without a paid API account. A hosted-model path should disclose the provider, limits and budget owner before it runs.

The product should distinguish three levels of participation. **Practice** lets someone connect a client and play. **Regression testing** compares a known policy under fixed conditions. **Reviewed contributions** change the maintained project or introduce a new evaluated strategy. These levels can share move validation and replay components while having different trust and cost boundaries.

Avoid an upload button unless arbitrary code execution has actually been designed and verified. Accepting a local client that submits moves is different from running that client's source on the server. A downloadable script is different from a hosted job. The interface should name the available mechanism precisely rather than imply a managed agent platform from a set of links.

After the first run, the next action should reference its evidence: inspect a stopped turn, replay a selected case, or rerun with a named change. A generic “improve your agent” message is too vague. A concrete prompt such as “This run stopped on invalid output; inspect the response contract” connects the result to an actionable hypothesis without pretending the system knows the optimal fix.

**Confidence: medium-high for executable onboarding as a design pattern.** Several primary sources support the sequence; its usability and demand here remain untested.

## 4. Define the minimum reproducible evaluation

A useful regression suite begins with a manifest. It identifies the suite revision, initial positions or openings, required history, opponent policy, color schedule, random seed list, limits, termination rules and policy configuration. The manifest should be shown before execution and included in the export. Changing a material condition produces a new manifest identity rather than silently replacing the old one.

The first suite can be intentionally small. Its job is to catch obvious regressions, establish cost and failure behavior, and make local comparisons repeatable. It is not a statistically authoritative ranking of general chess ability. Each case must have a reason to exist: a previously observed failure, an interface edge case, a tactical decision or a short representative sequence. Publish that rationale alongside the case rather than presenting an arbitrary collection as a validated benchmark.

Where games are compared, use the same openings and opponent configuration and swap colors. If randomness is involved, define how each seed determines behavior. Do not claim determinism merely because the UI displays a seed: the policy, opponent and relevant execution path must actually consume it predictably. Hosted inference may remain nondeterministic even when a service accepts seed-like controls. Saved inputs and outputs can support replay without guaranteeing regeneration.

DeepMind Game Arena makes clear that representation, history, legal assistance, sampling and parsing are harness choices. Hugging Face's evaluation guidebook similarly documents how implementation, prompts, scoring details and generation settings can alter results. The correct product response is provenance and explicit comparisons, not a claim that one standard prompt removes every confound. [6][7]

The public suite should be called a **development or regression suite**. Anyone repeatedly optimizing against it can learn its cases. A local held-out split does not establish absence from a hosted model's training data. A future evaluation set would need separate governance, frozen admission rules, access controls where appropriate and a defined process for retiring leaked cases. STS2's separate seed-pool design is a useful reference, but its existence elsewhere does not make this app's public cases held out. [4]

For N opening cases with both colors, reconcile all 2N planned game legs into completed, capped, error, cancelled or unrun categories. Report attempted, completed, stopped and failed cases. Unrun work belongs in the record when a run is interrupted; it must not disappear from the planned denominator. A timeout, provider error, cancellation or move cap must retain its own reason. Whether a benchmark penalizes a particular failure as a loss is a declared protocol choice; it must not emerge accidentally from a display default. For the present arena, preserve unresolved outcomes rather than converting them to convenient draws.

**Confidence: high for provenance and protocol requirements, medium for the initial suite design.** The sources support controlled comparisons, but this review does not validate a particular case set.

## 5. Connect versions, runs and decisions

The conceptual data model can remain small. An **agent identity** names the competitor or policy family. A **version** identifies the source and configuration used. A **run** records one manifest executed with that version. A **game or case** contains the actual sequence and outcome. A **decision attempt** records the observable request, response status and accounting information that the product actually retains.

This hierarchy should support a question a builder can answer without guessing: “What changed between these two runs?” The answer should point to a source commit, configuration difference or explicit strategy description. If the app only has a free-text version label, say that it is a label; it does not prove that the underlying policy stayed unchanged. If a remote agent chooses its own behavior, record that the server validates moves but cannot attest to its hidden implementation.

Proxy War's separation of agent and version and UNSW Battlecode's version-level results offer practical precedents. The proposal here is smaller: preserve history and avoid overwriting an old result when a contributor changes a name or prompt. It does not require a marketplace, social profile or universal package format. [2][13]

Before computing a comparison, check manifest compatibility: suite revision, ordered cases, initial state/history, opponent version, color schedule, seeds and limits must match. Refuse a direct delta or clearly mark it as uncontrolled when they differ. A human-readable version name alone is not an immutable identity; retain a source revision, content hash or exact source plus normalized configuration. The browser's preset identifiers should refer to the code actually executed; the CLI's evidence should identify the submitted local policy.

A first comparison should list case IDs, both outcomes, failure reasons and aggregate counts. Keep ties, gains and regressions visible. A favorable average can hide a newly broken case; a failure-focused table makes that tradeoff inspectable. When sample size is tiny, raw counts often communicate more honestly than a polished percentage with excessive decimal places.

Do not label the delta “learning” by default. It may reflect a bug fix, a changed opponent, randomness, a larger token budget or test-set overfitting. The run comparison should state which conditions stayed fixed and which changed. If multiple variables changed, the user can still inspect the result, but the product should avoid attributing the effect to a single cause.

A partial run is not equivalent to a completed run. Re-running only failures and folding favorable rerun outcomes into the original total would also change the comparison. Preserve the original artifact and show the rerun as a separate observation. In the browser implementation, that means retaining the current tab's evidence and making download prominent; it does not imply account-backed or server-backed run history.

This is also where export matters. A useful bundle contains the manifest, recorded policy/version identity, game outcomes, PGNs, available attempt metadata and the analysis procedure. Capped or failed games retain PGN result `*`; JSON retains the last valid board and attempted invalid move when one was observed. Missing fields remain missing. Reconstructing a plausible prompt after the fact is not equivalent to preserving the prompt that was used.

**Confidence: high for preserving identities and complete evidence.** The proposed data structure follows those requirements; implementation completeness remains subject to runtime verification.

## 6. Make the results page honest by construction

The public homepage should answer three questions quickly: what can I do, what actually happened, and what does the result mean? Lead with a working build/play action and one real persisted game. Show whether that game is live, completed or stopped. A saved demonstration is acceptable when labeled as a demonstration; it must not stand in for current activity.

Separate community practice, local baselines and hosted experiments. They can appear in one archive with clear filters, but should not silently share a comparative ranking. Show the protocol and opponent context wherever a score is presented. The previously inspected code aggregated completed results across tracks while limiting the archive to recent games, so any new denominator must be checked against the actual query population.

A compact protocol card can state the input representation, legal-move assistance, response contract, limits and revision. Detailed methodology belongs behind a link or disclosure. The primary page should not lead with database leases, operator secrets or internal accounting mechanics. Those details may matter to maintainers, but the visitor needs to understand the task and evidence.

Use W/D/L, completion and failure counts before considering ratings. The amortized-planning chess paper explicitly cautions that tournament ratings and Lichess ratings are not directly comparable and discusses population and protocol differences. LLM Chess describes its random-opponent stage as a gating exercise rather than precise ranking. Neither paper justifies transferring a published Elo or model order into this app. [9][10]

Hugging Face distinguishes community-managed leaderboards from other evaluation surfaces. That distinction reinforces a simple naming discipline: an arena results page can be useful without claiming to be a standardized scientific benchmark. Remove ordinal rank badges if the surrounding copy says the table is not a strength ranking. [8]

Cost requires similar care. Recorded billed cost, retained reservation and unknown cost are different quantities. A missing charge is not free inference. Display the scope of an average, including whether failures are included. Avoid putting public spending controls or the operator's detailed budget machinery at the center of visitor onboarding; make responsibility and limits clear at the action that can incur expense.

**Confidence: high for the stated measurement limits, medium for presentation choices.** Primary sources support separating protocols and rating populations; visitor comprehension has not been measured.

## 7. Turn replays into a debugging instrument

The replay is the bridge between aggregate results and a change the builder can make. It should preserve the selected move while new events arrive, distinguish live-follow from historical inspection, and expose the exact termination reason. A stable game-and-ply link lets someone discuss one decision without reconstructing it manually.

The first useful annotations are observable facts: check, capture, promotion, castling, checkmate and stop reason. These are navigation aids, not judgments of decision quality. Material count is not an engine evaluation; a capture can be strategically bad. Do not add “blunder,” “best move” or accuracy graphics without running an appropriate analysis process and retaining its settings.

Chess.com documents engine-based review and notes that classifications depend on analysis conditions. Lichess's study concept shows the value of reusable positions, annotations and export. The transferable lesson is to attach investigation to a recoverable artifact. It does not require copying a coaching interface or claiming that the arena can explain a model's internal reasoning. [14][15]

A failure panel should distinguish malformed output, illegal choice, deadline, provider failure, budget stop and interruption where the data supports that distinction. If the stored error is coarser, show the recorded information rather than inventing a diagnosis. A received response and an accepted move are separate events; the interface should make that separation clear when it matters.

For privacy and correctness, avoid exposing raw provider text by default until its storage and publication terms have been reviewed. A move, status and resource summary can already support useful inspection. Credentials, private context and hidden reasoning must not accidentally become part of a downloadable research bundle.

Position challenges are optional future supporting material, preferably tied to an observed policy failure. They are not the core delivery criterion and should not redirect the project into a generic puzzle catalog. If external puzzle data is later used, preserve Lichess's documented export license and setup-move semantics. Those terms do not establish permission to copy unrelated study prose. [16]

**Confidence: high for factual replay and failure evidence, medium for navigation details.** The inspector recommendations use observable records; their interface has not received a usability audit.

## 8. A research agenda centered on harness changes

The first research questions should correspond to changes the user can actually make and test. **Input ablations** compare the same cases under different history or representation policies. **Output-contract studies** compare strict formatting, validation and retry behavior under fixed resource limits. **Memory studies** compare an explicit persistent note or state summary against a defined baseline. **Budget studies** vary one resource limit while retaining inputs and opponents. These are proposed experiments, not findings about which approach wins.

For each study, declare the hypothesis and success measure before seeing the final comparison. Preserve the full attempted denominator and state exclusions. Distinguish operational reliability from playing strength: a parser fix may substantially improve completion while leaving move selection unchanged. Both can be valuable, but they answer different questions.

The supplied STS2 fixed-weight track makes notes, skills and context management legitimate objects of investigation. Game Arena supplies examples of sampling and parsing choices. The Warcraft authors' scenario failures motivate tests for commitments and action interactions. Chess may express different failure modes, so do not copy another game's categories without observing a corresponding problem. [3][5][6]

Avoid claiming that an API-level improvement proves an internal world model, general reasoning advance or autonomous learning. A system that passes a known suite may simply exploit it. A more convincing report includes a regression, a negative result or an independent rerun, not only a favorable aggregate. The project's research identity can come from clear evidence and useful replication rather than a novelty claim.

The proposed contribution unit is an **experiment pack**: a declared policy change, manifest, executable instructions, results and limitations. This gives non-model-training contributors meaningful work. Someone can improve a test, reproduce a failure or verify a comparison without building a new foundation model.

**Confidence: medium in this research agenda.** The experiments follow documented harness choices, but no ablation or improvement result was produced by this review.

## 9. Implementation sequence and acceptance

Start with one complete path. Preserve the existing play/watch flow, add a bounded regression runner for a supported local policy, save its manifest and results, and offer a comparison with another recorded run under the same conditions. Finish that path before adding arbitrary hosted policies, accounts, background training or a large catalog of research content.

Keep the implementation boundary small. Reuse existing legal-move enforcement rather than creating a second chess referee for the lab. Share components where the protocols overlap, while accurately documenting differences: browser execution does not inherit hosted-worker leases, persistence or cancellation guarantees merely because the products share branding. A local custom-policy CLI does not establish safe hosted execution of arbitrary code. Do not add a queue, account system or dependency solely to imitate another platform's architecture.

The first acceptance check is functional: a new visitor can start a run without a paid credential, receive a real result, open any case, understand a stop reason, export the evidence and repeat after a deliberate change. Invalid moves and interrupted execution must not corrupt the run. An empty dataset must produce an honest empty state and a working next action.

The second check is reproducibility within the supported boundary. Run the same deterministic local version and manifest twice and compare moves and outcomes, excluding timing fields and generated run IDs. Use a stable per-case, per-leg random stream and deterministic tie-breaking so unrelated cases cannot change a later case by consuming random values. Change one known policy parameter and confirm that the recorded version and comparison identify it. Validate colors, seed consumption, move limits and failure categories. These checks are implementation work still required; this research task did not execute them.

The third check is communication. A reader should be able to distinguish practice from regression, a model from a local engine, a stopped game from a draw and a public suite from held-out evaluation. Run a brief usability observation before expanding the interface. Successful source-code tests do not establish that the product's terminology is understandable.

**Confidence: conditional on implementation checks.** These are concrete acceptance criteria, not evidence that the browser lab or CLI passed them.

## 10. Counter-position and remaining uncertainty

The strongest objection is scope: this could become an elaborate evaluation platform around a small chess demo. Keep the response proportional. A fixed local suite, two versions and inspectable evidence can test the core value without a distributed scheduler or full agent-hosting service. If builders do not use the comparison loop, more benchmark infrastructure is unlikely to rescue it.

A second objection is scientific credibility. Better manifests cannot compensate for an unrepresentative opponent, a tiny sample or a changing provider. Present the lab as a development instrument first. Any broader model-quality claim needs additional experimental design, data and scrutiny. Familiar benchmark-style visuals should not lend authority that the evidence has not earned.

A third objection is security and cost. Public code execution, uploaded endpoints and shared paid budgets create work that the current product pattern does not solve. Keep community clients outside the trusted runner unless a verified isolation design exists. The browser-inspected STS2 design is not a security audit or a ready-made assurance for this app.

Finally, the evidence itself is bounded. Public documentation was read and the supplied products were inspected through the browser; no external agents, games or training loops were executed. Dataset contents behind the 404 were unavailable. Author-reported performance was not replicated. Some documents are mutable, and the Lichess study source is historical. No user-demand study, complete accessibility audit, provider-term review or production security audit was performed.

The recommendation remains concrete despite those limits: make one policy change, run the same declared test, inspect the actual differences and preserve the evidence. That is a useful, testable product promise. Training, scientific rankings and automatic self-improvement should be added to the promise only when the system and results actually support them.

**Confidence: high in the need for these boundaries, low in growth predictions.** The evidence does not establish adoption, generalization, or secure arbitrary-code hosting.

## References

Publication dates, access dates, source types, authority and exclusions are recorded in [registry.md](registry.md). All were accessed on 2026-10-13. The final synthesis used only approved task notes; [verification.md](verification.md) records the draft union, claim checks and counter-review resolutions. This research verification is distinct from the app's [runtime verification](../../docs/verification.md).

1. [Softmax — coding-agent entry and workflow](https://softmax.com/).
2. [Proxy War](https://proxywar.xyz/) and [Build guide](https://proxywar.xyz/build).
3. [STS2 agent — repository README](https://github.com/mingxuan-he/sts2-agent).
4. [STS2 pod design and implementation notes](https://github.com/mingxuan-he/sts2-agent/blob/main/docs/track2-pod-design.md).
5. [Warcraft III as an RL environment](https://pwang724.github.io/wc3env/).
6. [Google DeepMind Game Arena](https://github.com/google-deepmind/game_arena).
7. [Hugging Face evaluation guidebook — reproducibility](https://github.com/huggingface/evaluation-guidebook/blob/main/contents/troubleshooting/troubleshooting-reproducibility.md).
8. [Hugging Face — Leaderboards and Evaluations](https://huggingface.co/docs/leaderboards/index).
9. [LLM Chess — primary research preprint](https://arxiv.org/html/2512.01992v1).
10. [Amortized Planning with Large-Scale Transformers: A Case Study on Chess](https://arxiv.org/html/2402.04494v2).
11. [Kaggle Environments — README](https://github.com/Kaggle/kaggle-environments/blob/master/README.md).
12. [UNSW Battlecode — Quickstart](https://game.battlecode.au/docs/quickstart).
13. [UNSW Battlecode — API](https://game.battlecode.au/docs/api).
14. [Chess.com — Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work).
15. [Lichess — Study Chess the Lichess Way](https://lichess.org/@/lichess/blog/study-chess-the-lichess-way/V0KrLSkA).
16. [Lichess — database exports and schema](https://database.lichess.org/).
