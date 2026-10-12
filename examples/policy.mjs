// Each game gets a fresh policy. Keep game-local memory inside this factory.
// The turn contract matches public practice: FEN, legalMoves, historyUci, version.
// Use the supplied random() for repeatable runs; Math.random() breaks that guarantee.
export function createPolicy() {
  return function chooseMove(turn, random) {
    return turn.legalMoves[Math.floor(random() * turn.legalMoves.length)];
  };
}
