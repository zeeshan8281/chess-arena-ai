import { Chess } from 'chess.js';

export const agents = [
  { id: 'local-search', name: 'Materialist', kind: 'local', detail: 'Two-ply search · material + mobility' },
  { id: 'local-random', name: 'Random walk', kind: 'local', detail: 'Uniform random legal move · baseline' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 mini', kind: 'model', detail: 'OpenRouter · same legal-move prompt' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', kind: 'model', detail: 'OpenRouter · same legal-move prompt' },
] as const;
export type AgentId = typeof agents[number]['id'];
export const isAgent = (id: string): id is AgentId => agents.some(a => a.id === id);
export const agentName = (id: string) => agents.find(a => a.id === id)?.name ?? id;
const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function score(chess: Chess, color: string) {
  if (chess.isCheckmate()) return chess.turn() === color ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  return chess.board().flat().reduce((n, p) => n + (p ? values[p.type] * (p.color === color ? 1 : -1) : 0), 0);
}
export function localMove(fen: string, id: string, random = Math.random): string {
  const chess = new Chess(fen), moves = chess.moves({ verbose: true });
  if (!moves.length) throw new Error('No legal moves');
  if (id === 'local-random') { const m = moves[Math.floor(random() * moves.length)]; return m.from + m.to + (m.promotion ?? ''); }
  if (id !== 'local-search') throw new Error('Unknown local agent');
  const color = chess.turn();
  let best = -Infinity, selected = moves[0];
  for (const move of moves) {
    chess.move(move);
    let value = score(chess, color);
    if (!chess.isGameOver()) {
      value = Infinity;
      for (const response of chess.moves({ verbose: true })) {
        chess.move(response); value = Math.min(value, score(chess, color)); chess.undo();
      }
      value += chess.moves().length * -0.05;
    }
    chess.undo();
    if (value > best || (value === best && random() < 0.2)) { best = value; selected = move; }
  }
  return selected.from + selected.to + (selected.promotion ?? '');
}
