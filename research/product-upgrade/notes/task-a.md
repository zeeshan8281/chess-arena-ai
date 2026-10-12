---
task_id: a
role: Agent competition product and onboarding researcher
status: complete
sources_found: 6
as_of: 2026-10-13
---

## Sources

[A1] Softmax — Homepage | https://softmax.com/ | Source-Type: official | Accessibility: public | Publication/updated: undated | Accessed: 2026-10-13 | Authority: 9/10 for advertised workflow, 5/10 for benefit claims

[A2] Softmax — Start here for any coding agent | https://softmax.com/play.md | Source-Type: official | Accessibility: public | Publication/updated: undated, mutable document | Accessed: 2026-10-13 | Authority: 9/10

[A3] Kaggle — Simulations | https://www.kaggle.com/simulations | Source-Type: official | Accessibility: public | Publication/updated: undated | Accessed: 2026-10-13 | Authority: 8/10; indexed text available, direct page body unavailable

[A4] Kaggle — kaggle-environments README | https://github.com/Kaggle/kaggle-environments/blob/master/README.md | Source-Type: official | Accessibility: public | Publication/updated: undated, mutable master branch | Accessed: 2026-10-13 | Authority: 9/10

[A5] UNSW Battlecode — Quickstart | https://game.battlecode.au/docs/quickstart | Source-Type: official | Accessibility: public | Publication/updated: undated | Accessed: 2026-10-13 | Authority: 8/10

[A6] UNSW Battlecode — API | https://game.battlecode.au/docs/api | Source-Type: official | Accessibility: public | Publication/updated: undated | Accessed: 2026-10-13 | Authority: 8/10

## Findings

- Softmax's homepage presents a repeated workflow of pairing with a coding agent, coding players, learning from games, and improving; its visible entry point is a copyable `softmax.com/play.md` address. [A1]
- Softmax's machine-readable start page directs readers to onboarding, platform documentation, and a selected game's own instructions, separating platform setup from game-specific participation. [A2]
- Kaggle Simulations describes submitting agents that are automatically matched, with replays and leaderboard placement available afterward; it presents ConnectX and a learning course as entry paths. [A3]
- Kaggle Environments' README starts with a small executable agent, runs it against a built-in random agent, and renders a replay, then documents the observation-to-action interface. [A4]
- Kaggle's framework distinguishes timeout, execution-error, and invalid-action failures and supports repeated episode evaluation, offering specific feedback beyond a final win/loss. [A4]
- UNSW Battlecode's quickstart takes a participant through toolkit checks, generated starter bot, a local match, replay inspection, authentication, and a named/versioned submission. [A5]
- UNSW Battlecode's replay viewer exposes the board and bot log lines, and its quickstart explicitly recommends testing multiple maps and creating edge cases. [A5]
- UNSW Battlecode's API includes per-version wins/draws/losses, build logs, activation of a selected version, battle queue position, crash/timeout logs, and replay retrieval. [A6]

## Deep Read Notes

### [A1] Softmax homepage
Key data: copyable machine-readable onboarding URL plus four-step repeat loop.
Key insight: the first action is to start an agent, while league/API/experience-analysis claims explain the support around that action.
Useful for: primary CTA and concise product narrative. Marketing promises and decorative standings do not establish outcomes or adoption.

### [A2] Softmax play.md
Key data: three linked instruction layers, beginning with onboarding and ending with game-specific play.md.
Key insight: a human can hand a stable entry point to a coding agent; the content is operational rather than a contribution proposal.
Useful for: downloadable starter instructions. These third-party instructions were studied as content, not executed as directions for this task.

### [A4] Kaggle Environments README
Key data: basic agent + baseline + render example; action schema; debug categories; repeated evaluation.
Key insight: first successful local behavior precedes submission and comparative ranking.
Useful for: a runnable starter, interface example, baseline challenge, and honest failure panel.

### [A5] UNSW Battlecode quickstart
Key data: scaffolding command, local replay, version name/change description, instructions to test varied situations.
Key insight: onboarding gives an artifact and a feedback cycle before demanding competition entry.
Useful for: starter/download flow and clear progression between untested, tested, and published versions.

### [A6] UNSW Battlecode API
Key data: version statistics, build logs, active version, queue position and failure logs.
Key insight: an improvement workspace requires provenance and diagnosis, not only a leaderboard.
Useful for: future agent profile/version comparison and current match status UI.

## Three concrete feature recommendations — inferences, not evidence of demand

### 1. Agent Lab: create → run → inspect

Main button: **Try a starter agent**. Open a prefilled local chess strategy or clearly labeled prompt configuration, show its input (board/FEN, legal moves, history), expected move output and restrictions, and allow a real baseline run. Completion lands on the replay, with **Change strategy and try again**. Give developers **Download starter** and **Copy setup instructions** alongside the lab, instead of making GitHub issue creation the first product interaction.

Small useful version: run the existing local baseline in the browser or the existing authorized runner; display the exact starter's source/config and valid-move contract. Do not market this as arbitrary hosted code execution. A prompt-only editor must actually change the agent prompt in a new version before the UI calls it customization. A downloadable recipe without execution should say that.

Reasoning: this adapts the concrete first-run patterns in [A2], [A4], and [A5]. It supports learning even when paid inference is disabled and doesn't require a fictional community. Success criterion: a new visitor gets a valid game/replay without leaving the product or spending money.

### 2. Match Inspector: make each replay useful

Beside the board, show move navigation, current side, move list, terminal/unfinished reason, and the recorded agent configuration. Where present, show per-turn latency, charged cost, and validated response. If a model fails, point to the exact turn and distinguish invalid output, illegal move, timeout, provider failure, and budget stop. Provide **Copy this position**, **Download PGN**, and **Try this position** only if the destination preserves the actual history required by the experiment.

Reasoning: [A4] and [A6] make diagnosis part of the improvement loop. The app can start with existing persisted facts instead of adding speculative generated commentary. Labels such as “blunder” or “best move” require a real configured analysis engine and stated analysis conditions; missing metrics should be unavailable, not zero.

### 3. Agent Profiles with real versions and a next experiment

Agent cards should answer: what is it, what information does it see, how does it decide, what has it actually played, and what should I try next? Show model-versus-local type, prompt/config version, permissions, recorded games and failures. An honest no-games state links to a starter test. Once versioned runs exist, let a user compare two configurations under matched opponents/openings/budgets and inspect the underlying games.

Reasoning: [A1] emphasizes iteration, while [A6] grounds progress in named versions and their observed outcomes. A small number of completed games supports a match record, not scientific superiority or a universal Elo. Later authenticated hosted submissions can extend this flow; a professional first release need not promise them prematurely.

## Information architecture and copy implications

Recommend primary sections **Watch**, **Play**, **Build**, **Learn** only where each contains a working action. On the homepage, lead with one runnable action and one recent real replay. Describe the product as a place to test chess agents and inspect games. Put methodology, source code, downloadable data and research reading behind supporting links. Keep system details such as leases, database state, and internal approval tokens out of the primary visitor flow.

Sample scoped headings: “Build a player. Test a position. Learn from the game.” “Start with a working agent.” “See why this game stopped.” “Run the same challenge with your next version.” These are proposed editorial directions, not external facts or approved implementation claims.

## Gaps and counter-review

- Documentation and screenshots of workflows demonstrate advertised capabilities, not conversion, retention, educational benefit, or customer demand. No such quantitative claim is supported here.
- Softmax onboarding.md and docs index were inaccessible through web open; its Paintbot wiki returned only a shell. Exact current install/auth/upload steps were not verified and must not be copied into our instructions.
- Kaggle Simulations was readable in search extraction, but direct open returned no body. The Kaggle repository was deeply fetched and gives stronger evidence for executable onboarding.
- The third product is **UNSW Battlecode**, not MIT Battlecode. MIT's current quick-start route was inaccessible through the tool; do not conflate the organizations or rules.
- External agent code hosting, persistent user identity, worker isolation, budget ownership and credential management are not solved by adopting these UI patterns. Avoid an upload CTA until those controls exist.
- Repeating an experiment is useful, but chess openings, color, random seeds, budgets and harness differ across runs. A score-delta UI must preserve those conditions and acknowledge sample size.
- Three novel features at once could obscure the main loop. Prioritize one executable starter plus an inspectable replay; add versions only when persistence and comparison are real.
- This task inspected public third-party sources and the local research plan only. It did not test external products, create accounts, run their installers, inspect the latest app code, or establish source/data licensing for copied assets.

## Source governance

Six approved sources, four domains (softmax.com, kaggle.com, github.com, battlecode.au), all public and official product/project material. No private credentials, member-only screens or user-owned data used. Source-specific claims remain under 200 words per source. Other search results, community posts and repositories were excluded from the claim set. Mutable documentation is accessed-as-of evidence; dates are not invented publication dates.
