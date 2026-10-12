# Task D — concrete candidate evaluation and implementation boundaries

AS_OF: 2026-10-13. Inputs: Task B's official-source findings; parent implementation proposal; targeted inspection of `src/insights.ts`, `test/insights.test.ts`, and `app/api/positions/route.ts` in `/tmp/chess-arena-publish`. No application edits or test execution in this task. This document evaluates the candidate direction; it is not a claim that the finished website has passed verification.

## Decision

Ship a compact **watch → try → inspect** experience using actual arena games. Deriving a mate-in-one challenge from a persisted checkmate game's penultimate position is the strongest first addition: it directly connects spectator interest to an action, avoids unrelated content imports, and has a verifiable success criterion. Match moments, visible provenance, and selected-position exports complete that loop. Replace generic proposal cards with a short playbook describing what visitors can do now.

The public precedents support these interaction patterns: Lichess lessons combine a board objective, hint and feedback; Chess.com Review connects replay positions to retry actions; Lichess studies preserve context and export. They do **not** demonstrate that this particular implementation will acquire users or improve chess skill. [Lessons](https://lichess.org/@/lichess/blog/interactive-lessons/WtDErSQA), [Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work), [Studies](https://lichess.org/@/lichess/blog/study-chess-the-lichess-way/V0KrLSkA).

## Candidate 1: checkmate challenges from real games — approve first

**Proposed behavior:** Show an unsolved position with side to move and “Find mate in one.” Accept any legal move that leaves the opposing king checkmated. A legal nonmate produces “Legal move, but not checkmate. Try again.” The recorded agent move is available after success or reveal. Show source players and a replay link with the exact move reference.

**Why it works:** This is a bounded, objective interaction requiring neither a hosted model call nor heuristic move-quality scoring. It gives meaning to the arena's own data instead of building a generic puzzle-site clone. Choosing every valid mate avoids falsely rejecting alternatives, consistent with Lichess's documented mate-in-one acceptance rule. [Puzzle documentation](https://database.lichess.org/).

**Observed source implementation:** `matingMoves` enumerates legal moves and tests checkmate after applying each. `checkChallenge` uses the chess library to apply the user's move. The positions route queries checkmate games, reconstructs all but the final move, and only returns positions with a mating move. Current tests include a position with multiple mating solutions. These observations describe source, not verified runtime behavior.

**Required checks:** Source game must have a real checkmate result and at least one committed move. Test both sides, promotion/underpromotion solutions, illegal choices, reset/retry, answer reveal, loading/error/empty states, and keyboard or text input. Validate the full UCI input string if untrusted text is accepted; the observed helper slices input rather than enforcing full-string syntax. Do not leak the recorded answer through visible SAN text before the visitor tries. Sending legal destinations is appropriate assistance for this learning widget, but label it if later reusing task scores as a benchmark.

**Content limits:** These are uncalibrated challenges, not a rated puzzle bank. Do not invent difficulty numbers or say the user outperformed the model unless a specific comparison was actually made. A one-move exercise does not measure general chess ability. If no real checkmate games exist, present an honest empty state with a playable local game action. Do not silently substitute a scripted fixture and label it an arena game.

## Candidate 2: factual match moments — approve

**Proposed behavior:** A short event list links checks, captures, castling, promotions and checkmate to their replay positions. Selected move has a precise board explanation and optional material count. This turns a long move list into navigable evidence.

**Observed source implementation:** `moveFacts` produces these tags from the actual chess position and move object. `materialBalance` uses conventional piece weights and a white-minus-black signed sum. The targeted test checks capture and promotion/check tags.

**Required boundaries:** Call this “Match moments” or “Move events,” not “Critical mistakes.” Capturing material may be a blunder, and checking may be ineffective. Material balance must state that it is not an engine evaluation. Distinguish checkmate from stalemate and pending termination; label missing or interrupted game outcomes as such. Avoid inferring tactical motifs like forks solely from check/capture tags. Test en passant, castling and black-positive/white-positive presentation before shipping.

**External evidence:** Chess.com can call a move a blunder because its review is based on engine analysis; its own documentation acknowledges that labels depend on analysis settings. That supports postponing such labels until the arena has recorded real analysis. [Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work).

## Candidate 3: inspect and export the selected position — approve

**Proposed behavior:** Copy FEN; export PGN; open the selected board on Lichess; provide a stable arena replay URL with move index. Preserve the distinction between live-follow mode and a viewer-selected historical move. Board state, selected notation, export and external link must agree.

**Official implementation evidence:** Lichess's public `UserAnalysis` controller accepts `fen` as a query parameter on `/analysis`, with URI decoding; its route table connects that endpoint. Construct `https://lichess.org/analysis?fen=${encodeURIComponent(fen)}`. [Controller](https://raw.githubusercontent.com/lichess-org/lila/master/app/controllers/UserAnalysis.scala), [routes](https://raw.githubusercontent.com/lichess-org/lila/master/conf/routes).

**Required checks:** Test actual board rendered at the external link; keep Copy FEN if the external route changes. Escape labels and constrain outgoing host. Do not imply external analysis was already computed or imported into the arena. A FEN does not capture full repetition history: PGN remains the better artifact for reproducing the complete game.

## Candidate 4: useful homepage and playbook — approve within existing scope

Lead with a real match that a visitor can watch, a challenge they can solve, and a local opponent they can play. Public match availability should be distinct from operator-only paid generation. Display real participants and finished/live/interrupted status. Put methodological details, reading links and contribution instructions in the playbook rather than making proposal completion the visitor's first action.

A useful playbook answers: What can I do now? Where did this position come from? What are local bots versus hosted models? What does the score mean? How do I reproduce this game? How do I contribute an agent? How is paid spending controlled? Do not add claims about community size, ratings or training improvement that the data cannot support. These are editorial recommendations based on the proposed product, not external findings.

## Licensing and provenance decision

Use only the arena's own persisted game records for the first challenge collection. That avoids importing a third-party puzzle database or community commentary. Record match ID, participants, original start position, move history and source ply; author any instructional explanation independently. Review applicable provider terms before publishing raw model response text; this task has not audited those terms. Move records and tokens/cost summaries are enough for the initial user interaction.

If a later version imports puzzles, Lichess officially labels its database exports CC0 and documents their provenance fields. Preserve source IDs, retrieval revision, game URL and preprocessing convention. Do not generalize the database license to Lichess's public study prose or Chess.com's coaching text. [Official export documentation](https://database.lichess.org/).

## Counter-position and success test

The risk is product dilution: visitors interested in agent competition may not want generic chess lessons. Mitigate that by tying every initial challenge to a visible arena game and returning users to its replay. The first success test is functional, not a growth claim: a new visitor can select a real game, locate a moment, make a legal challenge attempt, understand the response, and inspect the exact position without an account or paid request. Observe a real user doing this before adding a larger curriculum.

These candidates intentionally skip a large puzzle catalog, collaborative study editor, neural commentary, engine-quality badges, accuracy graphs, Elo estimates, and user progress accounts. Add them only when a specific use case and a reliable implementation justify their cost.

## Evidence registry and remaining work

Source metadata are in `task-b.md` (B1–B9), with public accessibility, publication/access dates and authority. All external sources cited here were fetched directly during Task B or its follow-up. Local source inspection covers only the three files named at the top and is not a full audit. No application changes, test runs, external-link browser checks, provider-term audit or usability study were performed by this research task.
