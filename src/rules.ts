import { Chess, DEFAULT_POSITION, type Color, type Square } from 'chess.js';

export type Outcome = {
  kind: 'ongoing' | 'draw' | 'win' | 'pending_adjudication';
  reason: string;
  winner?: Color;
};
export type ClaimReason = 'threefold' | 'fifty_move';

export class Referee {
  readonly chess: Chess;
  readonly moves: string[] = [];
  readonly rankEligible = false;
  private readonly counts = new Map<string, number>();
  private decision?: Outcome;

  constructor(private readonly initialFen = DEFAULT_POSITION, historyUci: string[] = []) {
    this.chess = new Chess(initialFen);
    this.counts.set(this.key(), 1);
    for (const move of historyUci) this.play(move);
  }

  private key(chess = this.chess): string {
    return chess.fen().split(' ').slice(0, 4).join(' ');
  }

  private apply(chess: Chess, uci: string): void {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error('Invalid UCI move');
    if (!chess.moves({ verbose: true }).some(m => m.from + m.to + (m.promotion ?? '') === uci)) {
      throw new Error('Illegal UCI move');
    }
    chess.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square,
      ...(uci[4] ? { promotion: uci[4] } : {}) });
  }

  private requireOngoing(): void {
    if (this.outcome().kind !== 'ongoing') throw new Error('Match is not ongoing');
  }

  legalUci(): string[] {
    if (this.outcome().kind !== 'ongoing') return [];
    return this.chess.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion ?? ''));
  }

  claimable(): ClaimReason[] {
    if (this.outcome().kind !== 'ongoing') return [];
    const reasons: ClaimReason[] = [];
    if ((this.counts.get(this.key()) ?? 0) >= 3) reasons.push('threefold');
    if (Number(this.chess.fen().split(' ')[4]) >= 100) reasons.push('fifty_move');
    return reasons;
  }

  play(moveUci: string): Outcome {
    this.requireOngoing();
    this.apply(this.chess, moveUci);
    this.moves.push(moveUci);
    const key = this.key();
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
    return this.outcome();
  }

  outcome(): Outcome {
    if (this.decision) return this.decision;
    if (this.chess.isCheckmate()) return { kind: 'win', reason: 'checkmate', winner: this.chess.turn() === 'w' ? 'b' : 'w' };
    if (this.chess.isStalemate()) return { kind: 'draw', reason: 'stalemate' };
    if (this.chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'proven_material_dead_position' };
    if ((this.counts.get(this.key()) ?? 0) >= 5) return { kind: 'draw', reason: 'fivefold' };
    if (Number(this.chess.fen().split(' ')[4]) >= 150) return { kind: 'draw', reason: 'seventy_five_move' };
    // shortcut: unknown dead positions continue only unrated; require complete adjudication before ranked use.
    return { kind: 'ongoing', reason: 'unrated_dead_position_unverified' };
  }

  claim(reason: ClaimReason, intendedMove?: string): Outcome {
    this.requireOngoing();
    let valid = this.claimable().includes(reason);
    if (intendedMove !== undefined) {
      const candidate = new Chess(this.chess.fen());
      try {
        this.apply(candidate, intendedMove);
        valid = reason === 'threefold'
          ? (this.counts.get(this.key(candidate)) ?? 0) + 1 >= 3
          : reason === 'fifty_move' && Number(candidate.fen().split(' ')[4]) >= 100;
      } catch {
        valid = false;
      }
    }
    this.decision = valid
      ? { kind: 'draw', reason: `claimed_${reason}` }
      : { kind: 'pending_adjudication', reason: 'invalid_claim_clock_sanction_unimplemented' };
    return this.decision;
  }

  timeout(loser: Color): Outcome {
    const outcome = this.outcome();
    if (outcome.kind !== 'ongoing') return outcome;
    if (loser !== this.chess.turn()) throw new Error('Only the active side can time out');
    const opponent = loser === 'w' ? 'b' : 'w';
    const opponentPieces = this.chess.board().flat().filter(p => p?.color === opponent);
    this.decision = opponentPieces.every(p => p?.type === 'k')
      ? { kind: 'draw', reason: 'timeout_opponent_bare_king' }
      : { kind: 'pending_adjudication', reason: 'timeout_possible_mate_unverified' };
    return this.decision;
  }

  pgn(): string {
    const result = this.outcome();
    this.chess.setHeader('Result', result.kind === 'draw' ? '1/2-1/2'
      : result.kind === 'win' ? (result.winner === 'w' ? '1-0' : '0-1') : '*');
    return this.chess.pgn();
  }
}
