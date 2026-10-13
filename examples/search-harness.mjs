// Fixed-depth alpha-beta with capture quiescence. No model, no network, deterministic.
// Exports both contracts: createPolicy() for `npm run evaluate`, createHarness() for `npm run connect`.
import { Chess } from 'chess.js';

const MAX_DEPTH = 4;
// ponytail: node budget instead of a clock so runs stay repeatable; chess.js movegen is the ceiling,
// swap in a bitboard generator if deeper search is ever needed.
const NODE_BUDGET = 12000;
const MATE = 100000;
const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const centre = (r, f) => 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(f - 3.5)); // 0 at the rim, 3 in the middle

// Score from the side to move's point of view.
function evaluate(chess) {
  const board = chess.board(), kings = {};
  let white = 0, material = { w: 0, b: 0 };
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const piece = board[r][f];
    if (!piece) continue;
    let score = VALUE[piece.type];
    material[piece.color] += score;
    if (piece.type === 'k') kings[piece.color] = [r, f];
    else if (piece.type === 'p') score += 8 * (piece.color === 'w' ? 6 - r : r - 1); // advance toward promotion
    else if (piece.type !== 'r') score += 6 * centre(r, f);
    white += piece.color === 'w' ? score : -score;
  }
  // Mop-up: with a decisive lead, drive the losing king to the rim and bring ours closer,
  // otherwise a material-only search shuffles until the ply cap.
  const lead = material.w - material.b;
  if (Math.abs(lead) >= 400 && kings.w && kings.b) {
    const [winner, loser] = lead > 0 ? [kings.w, kings.b] : [kings.b, kings.w];
    const distance = Math.abs(winner[0] - loser[0]) + Math.abs(winner[1] - loser[1]);
    const push = 12 * (3 - centre(loser[0], loser[1])) + 4 * (14 - distance);
    white += lead > 0 ? push : -push;
  }
  return chess.turn() === 'w' ? white : -white;
}

// SAN moves, not verbose ones: chess.js builds a before/after FEN for every verbose move, ~50x slower.
// Order by most valuable victim, least valuable attacker.
function gain(chess, san) {
  const promotion = san.includes('=') ? VALUE[san[san.indexOf('=') + 1].toLowerCase()] : 0;
  if (!san.includes('x')) return promotion;
  const target = san.match(/x([a-h][1-8])/)[1];
  const attacker = /[NBRQK]/.test(san[0]) ? san[0].toLowerCase() : 'p';
  return 10 * VALUE[chess.get(target)?.type ?? 'p'] - VALUE[attacker] + promotion; // empty target = en passant
}
function ordered(chess, moves) {
  const scores = new Map(moves.map(san => [san, gain(chess, san)]));
  return moves.sort((a, b) => scores.get(b) - scores.get(a));
}

let nodes = 0;
const OUT_OF_BUDGET = Symbol('budget');

function quiesce(chess, alpha, beta, depth) {
  if (++nodes > NODE_BUDGET) throw OUT_OF_BUDGET;
  const stand = evaluate(chess);
  if (depth === 0 || stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  for (const move of ordered(chess, chess.moves().filter(san => san.includes('x') || san.includes('=')))) {
    chess.move(move);
    const score = -quiesce(chess, -beta, -alpha, depth - 1);
    chess.undo();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(chess, depth, alpha, beta, ply) {
  if (++nodes > NODE_BUDGET) throw OUT_OF_BUDGET;
  const moves = chess.moves();
  if (!moves.length) return chess.inCheck() ? -MATE - depth : 0; // deeper remaining depth = faster mate
  if (ply === 1 && chess.isDraw()) return 0; // only right after our own move: repetition checks are costly
  if (depth === 0) return quiesce(chess, alpha, beta, 2);
  for (const move of ordered(chess, moves)) {
    chess.move(move);
    const score = -search(chess, depth - 1, -beta, -alpha, ply + 1);
    chess.undo();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Replay the game when it started from the standard position so repetition is visible to the search.
function position(turn) {
  try {
    const chess = new Chess(START);
    for (const uci of turn.historyUci ?? []) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    if (chess.fen().split(' ').slice(0, 4).join(' ') === turn.fen.split(' ').slice(0, 4).join(' ')) return chess;
  } catch {}
  return new Chess(turn.fen);
}

export function bestMove(turn) {
  let best;
  nodes = 0;
  // Deepen until the budget runs out; keep the last depth that finished, with its best move searched first.
  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    const chess = position(turn); // fresh board: an aborted search leaves moves on the stack
    const moves = ordered(chess, chess.moves());
    if (best) moves.sort((a, b) => (b === best) - (a === best));
    let found, alpha = -Infinity;
    try {
      for (const move of moves) {
        chess.move(move);
        const score = -search(chess, depth - 1, -Infinity, -alpha, 1);
        chess.undo();
        if (score > alpha) { alpha = score; found = move; }
      }
    } catch (error) {
      if (error !== OUT_OF_BUDGET) throw error;
      break;
    }
    best = found;
    if (alpha >= MATE) break; // forced mate found
  }
  const chess = position(turn);
  return chess.move(best).lan;
}

export const createPolicy = () => turn => bestMove(turn);
export const createHarness = () => async turn => bestMove(turn);

// Self-check: `node examples/search-harness.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  const { strict: assert } = await import('node:assert');
  // Back-rank mate in one, as each colour.
  assert.equal(bestMove({ fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', historyUci: [] }), 'a1a8');
  assert.equal(bestMove({ fen: 'r3k3/8/8/8/8/8/5PPP/6K1 b - - 0 1', historyUci: [] }), 'a8a1');
  // Takes the hanging queen rather than the defended pawn.
  assert.equal(bestMove({ fen: '4k3/8/8/3q4/8/2N5/8/4K3 w - - 0 1', historyUci: [] }), 'c3d5');
  console.log('ok');
}
