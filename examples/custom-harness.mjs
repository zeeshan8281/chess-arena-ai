// A fresh instance is created for each game. Keep working memory in this closure.
// Replace this with your own model calls, search, routing or tool combinations.
// The arena records the declared configuration, but executes no custom code itself.
export function createHarness(config) {
  const seen = new Set();
  return async function chooseMove(turn) {
    const candidates = turn.candidates; // Ranked by your selected harness modules.
    const fresh = config.memory === 'none' ? candidates : candidates.filter(move => !seen.has(move));
    const chosen = fresh[0] ?? candidates[0];
    seen.add(chosen);
    return chosen;
  };
}
