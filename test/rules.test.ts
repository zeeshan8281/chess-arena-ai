import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_POSITION } from 'chess.js';
import { Referee } from '../src/rules';

const cycle = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];
const bishopFen = (counter: number) => `8/8/8/8/1b6/8/B1k5/K7 b - - ${counter} 1`;

test('threefold is claimable, fivefold automatic, history restores counts', () => {
  const r = new Referee(DEFAULT_POSITION, [...cycle, ...cycle]);
  assert.equal(r.outcome().kind, 'ongoing');
  assert.deepEqual(r.claimable(), ['threefold']);
  assert.equal(r.rankEligible, false);
  const restored = new Referee(DEFAULT_POSITION, r.moves);
  assert.deepEqual(restored.claimable(), ['threefold']);
  assert.equal(restored.claim('threefold').reason, 'claimed_threefold');
  assert.match(restored.pgn(), /1\/2-1\/2/);
  for (const m of [...cycle, ...cycle]) r.play(m);
  assert.equal(r.outcome().reason, 'fivefold');
  assert.throws(() => r.play('e2e4'));
});

test('intended repetition claim is evaluated without playing the move', () => {
  const r = new Referee(DEFAULT_POSITION, [...cycle, ...cycle.slice(0, 3)]);
  const before = r.chess.fen();
  assert.deepEqual(r.claimable(), []);
  assert.equal(r.claim('threefold', 'f6g8').kind, 'draw');
  assert.equal(r.chess.fen(), before);
  assert.equal(r.moves.length, 7);
});

test('50 move current and intended claims; 75 automatic; mate takes precedence', () => {
  const at99 = new Referee(bishopFen(99));
  const before = at99.chess.fen();
  assert.equal(at99.claim('fifty_move', 'b4d6').kind, 'draw');
  assert.equal(at99.chess.fen(), before);
  const at100 = new Referee(bishopFen(99));
  assert.equal(at100.play('b4d6').kind, 'ongoing');
  assert.deepEqual(at100.claimable(), ['fifty_move']);
  assert.equal(at100.claim('fifty_move').kind, 'draw');
  assert.equal(new Referee(bishopFen(149)).play('b4d6').reason, 'seventy_five_move');
  assert.deepEqual(new Referee(bishopFen(149)).play('b4c3'), { kind: 'win', reason: 'checkmate', winner: 'b' });
});

test('invalid claims preserve board/history and block scoring', () => {
  for (const move of [undefined, 'e2e5', 'garbage']) {
    const r = new Referee();
    const before = r.chess.fen();
    assert.equal(r.claim('threefold', move).kind, 'pending_adjudication');
    assert.equal(r.chess.fen(), before);
    assert.deepEqual(r.moves, []);
    assert.throws(() => r.play('e2e4'));
    assert.match(r.pgn(), /\*/);
  }
});

test('illegal move does not mutate and pawn moves reset halfmove count', () => {
  const r = new Referee();
  assert.throws(() => r.play('e2e5'));
  assert.equal(r.chess.fen(), DEFAULT_POSITION);
  assert.deepEqual(r.moves, []);
  for (const m of cycle) r.play(m);
  r.play('e2e4');
  assert.equal(r.chess.fen().split(' ')[4], '0');
});

test('spurious promotion suffix is rejected without mutation, including intended claims', () => {
  const r = new Referee();
  assert.throws(() => r.play('e2e4q'), /Illegal UCI/);
  assert.equal(r.chess.fen(), DEFAULT_POSITION);
  assert.deepEqual(r.moves, []);
  assert.equal(r.claim('threefold', 'e2e4q').kind, 'pending_adjudication');
  assert.equal(r.chess.fen(), DEFAULT_POSITION);
  assert.deepEqual(r.moves, []);
  const claimAt99 = new Referee(bishopFen(99));
  assert.equal(claimAt99.claim('fifty_move', 'b4d6q').kind, 'pending_adjudication');
  assert.equal(claimAt99.chess.fen(), bishopFen(99));
  assert.deepEqual(claimAt99.moves, []);
});

test('special moves: promotion, en passant pin and castling through check', () => {
  const promotion = new Referee('7k/P7/8/8/8/8/8/7K w - - 0 1');
  assert(promotion.legalUci().includes('a7a8n'));
  promotion.play('a7a8n');
  assert.equal(promotion.chess.get('a8')?.type, 'n');
  const pinned = new Referee('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  assert(!pinned.legalUci().includes('e5d6'));
  assert.equal(pinned.chess.fen().split(' ')[3], '-');
  const castle = new Referee('k4r2/8/8/8/8/8/8/4K2R w K - 0 1');
  assert(!castle.legalUci().includes('e1g1'));
});

test('timeouts draw only with proved impossibility; otherwise pending', () => {
  const bare = new Referee('7k/8/8/8/8/8/R7/7K w - - 0 1');
  assert.equal(bare.timeout('w').reason, 'timeout_opponent_bare_king');
  const dead = new Referee('7k/8/8/8/8/8/8/7K w - - 0 1');
  assert.equal(dead.timeout('w').reason, 'proven_material_dead_position');
  const unresolved = new Referee();
  assert.throws(() => unresolved.timeout('b'));
  assert.equal(unresolved.timeout('w').kind, 'pending_adjudication');
  assert.match(unresolved.pgn(), /\*/);
});

test('mate result, PGN and replay agree', () => {
  const r = new Referee(DEFAULT_POSITION, ['f2f3', 'e7e5', 'g2g4', 'd8h4']);
  assert.deepEqual(r.outcome(), { kind: 'win', reason: 'checkmate', winner: 'b' });
  assert.match(r.pgn(), /0-1/);
  assert.deepEqual(new Referee(DEFAULT_POSITION, r.moves).outcome(), r.outcome());
});
