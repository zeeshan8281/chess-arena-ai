# Task B — chess learning and spectator product evidence

AS_OF: 2026-10-13. Read `../plan.md`. Scope: official Lichess and Chess.com product material; actionable website improvements. No app files edited. All recommendations below are design inferences, not measured user-demand or learning-effectiveness results.

## Answer

The useful product loop is **watch a game → stop at an interesting position → try a move → see what happened → inspect or export it**. It can work immediately with the arena's real moves and a small set of verified chess challenges. Research papers and contribution forms belong behind this experience. Do not imitate engine-derived accuracy bars, blunder labels, or best-move arrows without actually running and recording engine analysis.

## Cited facts (nine)

1. Chess.com Game Review offers navigation through selected key moves, retrying positions, and visual continuation displays; its engine-based evaluation graph and accuracy are separate from simple replay. [B1](https://support.chess.com/en/articles/8584089-how-does-game-review-work)
2. The same documentation explains that classifications can change with analysis settings and that accuracy is not a player's rating. [B1](https://support.chess.com/en/articles/8584089-how-does-game-review-work)
3. Lichess interactive lessons support a prompt, optional hidden hint, an expected line, and feedback for wrong moves. Its study modes distinguish analysis, playing a position against a computer, hiding future moves, and guided lessons. [B2](https://lichess.org/@/lichess/blog/interactive-lessons/WtDErSQA)
4. Lichess studies preserve position comments, variations and annotations; chapters can start from FEN or PGN, and accessible studies can be exported as PGN. [B3](https://lichess.org/@/lichess/blog/study-chess-the-lichess-way/V0KrLSkA)
5. Lichess's practice index groups material into checkmates, fundamental and advanced tactics, and pawn and rook endings. It presents a separate sign-up prompt for saving progress. [B4](https://lichess.org/practice)
6. Its puzzle navigation provides themes, game phases, opening families, mate lengths, special moves and source categories. [B5](https://lichess.org/training/themes)
7. Lichess database exports are offered under CC0; the puzzle schema supplies IDs, position, UCI line, rating, themes and game URL. [B6](https://database.lichess.org/)
8. A Lichess puzzle's initial FEN comes before the opponent's setup move: apply the first UCI move before presenting the solver's turn. For a mate-in-one exercise, any checkmating move should succeed. [B6](https://database.lichess.org/)
9. Chess.com distinguishes server-run Game Review/Cloud Analysis from device-run Self Analysis and exposes analysis settings. These are computational products, not merely decorative labels. [B7](https://support.chess.com/en/articles/8708936-what-is-analysis-depth-what-does-it-mean)

## Deep reads

**B1, Game Review, full article read.** The article makes the board the central workspace, with explanations and navigation tied to the selected move. Guided review and exploratory analysis serve different jobs. Its FAQ directly acknowledges that analysis depth can alter labels. Product implication: the arena needs clear state (live position, historical position, or user variation), and should not let incoming events silently replace a viewer's selected historical board. Adopt concise move-specific feedback and accessible replay controls; leave premium coaching avatars and opaque accuracy scoring out of this first iteration. This source documents features, not evidence that copying them improves retention.

**B2, Interactive Lessons, full article read.** The lesson author supplies mainline, instructions, hints and feedback, and can attach responses to specific alternatives. Hints are optional and revealed by action. Product implication: a small carefully verified challenge is more useful than many generic research cards. “Find mate in one,” a playable board, and a real completion state make a concrete task. Hide the answer until attempt or reveal. A legal alternative is not inherently a bad chess move; feedback must refer to the exercise objective, not universal strength.

**B3, Study introduction, full article read.** Persisted position context, chapter structure, and export make analysis a reusable object. Collaboration rights distinguish viewers and contributors. Product implication: every arena position should have a recoverable game/move reference and export path. Full collaborative editing is unnecessary for the immediate website; preserve the artifact first. The dated announcement describes the feature concept and should not be treated as a current exhaustive compatibility specification.

**B6, database documentation, puzzle/evaluation sections read.** The puzzle schema provides enough provenance for a seed collection. The documented FEN convention prevents a common off-by-one implementation failure. Evaluation records contain depth and node metadata and may vary across analyses; their existence does not mean every arena position has an evaluation. Database license statements cover those exports; they do not establish that arbitrary community-written study annotations or article text may be copied wholesale.

## Recommended feature candidates

These are proposed implementation choices, not claims that the current app already supports them.

| Priority | Feature and real user job | Small implementation boundary | Honest labels and acceptance check |
|---|---|---|---|
| P0 | Featured recent match: give a new visitor something real to watch | Reuse one recorded match with actual participants, result/state, board and replay link | Never invent live viewers, match counts or a “live” state for finished games |
| P0 | Match moments: jump to an event without scrolling every move | Derive checks, captures, promotions, castling and final result from validated move history; click jumps to exact ply | Call them events/moments, not decisive errors; test en passant, promotion and checks |
| P0 | Try a challenge: let a visitor do something useful immediately | Three to six verified mate-in-one positions, side-to-move, click or drag input, optional hint, retry and reveal | Accept every legal checkmating move, not one hard-coded answer; reject illegal moves without corrupting state |
| P0 | Take the position elsewhere: support actual investigation | Copy current FEN, download real PGN, link to external analysis | Verify external link encodes selected position, not always starting board; clarify external service |
| P1 | Compare your move with the agent's | Freeze a historical position, accept a legal choice, reveal recorded move and allow reset | “Your move” versus “Agent played”; no better/worse verdict unless there is validated objective or real evaluation |
| P1 | Position-specific explanation | Short rule-grounded descriptions for checks, captures and mate; original authored hints for seed tasks | Do not say what the model “thought”; do not describe captures alone as gaining advantage |
| P1 | Share a replay moment | Stable game ID plus ply in URL; loading restores selected board | Refresh and copying must preserve selected ply; absent match should show recovery link |
| Later | Engine move comparison | Run a pinned engine/version with explicit search budget and retain outputs | Display engine, depth/nodes/time and evaluation perspective; unfinished analysis stays pending |

Recommended homepage hierarchy: featured game and **Watch replay** first; one playable **Find the move** challenge second; measured recent results third; developer contribution link as a compact next step. The exact hierarchy still needs usability checking. Avoid adding a general chess school or a full research portal before the watch/try/replay loop works.

## Content provenance and validation

- For imported Lichess seed puzzles store puzzle ID, source/game URL, retrieval date, export license, original FEN, setup move, and solver position. Keep copy short and write explanations independently. [B6](https://database.lichess.org/)
- For arena-derived positions store game ID, move index and original participants; do not relabel a demonstration fixture as a newly played match.
- For original compositions say “Original training position,” record who authored it, and verify kings, side to move, legal moves and intended objective with the actual chess rules library.
- A material count is only a material count, not a position evaluation. A check is not evidence of a good move. A forced-mate claim beyond a one-move legal enumeration needs a trusted solution or an appropriate search procedure.
- Include a text move-input or keyboard-accessible alternative if the board interaction otherwise requires dragging; preserve visible focus and do not communicate correctness through color alone. These are implementation recommendations, not externally tested accessibility findings from this review.

## Source registry

All accessed 2026-10-13; all primary official sources, publicly readable without login. HTML retrieval succeeded. Lichess's HTML reported blocked static assets, so feature descriptions were read but interactive flows were not exercised in a browser.

| ID | URL | Source type | Publication/update date | Authority and accessibility |
|---|---|---|---|---|
| B1 | https://support.chess.com/en/articles/8584089-how-does-game-review-work | Product help | Relative update label varied between search and fetch; exact date unavailable | Chess.com official support; full text fetched/read |
| B2 | https://lichess.org/@/lichess/blog/interactive-lessons/WtDErSQA | Official product article | 2018-04-15 | Lichess official account; full text fetched/read |
| B3 | https://lichess.org/@/lichess/blog/study-chess-the-lichess-way/V0KrLSkA | Official feature introduction | 2016-05-24 | Lichess official account; full text fetched/read |
| B4 | https://lichess.org/practice | Live product index | Undated; accessed as of date | Lichess primary site; public text fetched/read |
| B5 | https://lichess.org/training/themes | Live product taxonomy | Undated; accessed as of date | Lichess primary site; public text fetched/read |
| B6 | https://database.lichess.org/ | Data schema and licensing documentation | Puzzle export shown updated 2026-10-05 | Lichess official publisher; relevant sections fetched/read |
| B7 | https://support.chess.com/en/articles/8708936-what-is-analysis-depth-what-does-it-mean | Product help | 2025-03-15 | Chess.com official support; full text fetched/read |

## Gaps and counterclaims

- These sources establish competitor capabilities, not demand among this arena's visitors. A spectator may care primarily about model identity and whether the game is real; challenge widgets should not obstruct watching.
- A large puzzle catalog is already served by established sites. The arena's useful distinction would be tying a playable moment to an actual agent game, then showing the real move and its evidence.
- Dated Lichess announcements should be treated as conceptual precedents; current exact study UI was not browser-tested.
- No proprietary content was licensed, copied or downloaded. Public visibility of a study is not an established blanket license for its prose. CC0 references here are the publisher's statements about database exports, not legal advice about every chess asset.
- No engine analysis, challenge correctness tests, user interviews, retention study, or accessibility audit was performed in this research task. Implementation must verify every selected puzzle and actual route behavior before describing features as working.

## Position-link implementation evidence added after review

**B8:** [Lichess UserAnalysis controller](https://raw.githubusercontent.com/lichess-org/lila/master/app/controllers/UserAnalysis.scala), official public source code, mutable master branch, accessed 2026-10-13. The `index` action loads standard analysis; its loader accepts a `fen` query parameter and passes it through `readFen`, including URI decoding. **B9:** [Official routes](https://raw.githubusercontent.com/lichess-org/lila/master/conf/routes), same source status and access date, routes `/analysis` to that action. Thus a practical outgoing link is `https://lichess.org/analysis?fen=` followed by `encodeURIComponent(fen)`. This is direct implementation evidence, not a documented permanent API guarantee. Validate the resulting board in-browser and retain Copy FEN as a fallback. Neither source licenses copying unrelated Lichess content. Both files were fetched; the relevant controller and routing sections were read.
