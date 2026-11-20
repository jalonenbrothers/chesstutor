import { Chess } from 'chess.js';

/** Single source of truth for legal game state. Never let a view mutate this directly. */
export class GameSession {
  #game = new Chess();
  #listeners = new Set();

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(source, move = null) {
    const snapshot = this.state();
    for (const listener of this.#listeners) listener({ source, move, snapshot });
  }

  state() {
    return {
      fen: this.#game.fen(),
      pgn: this.#game.pgn(),
      turn: this.#game.turn(),
      history: this.#game.history({ verbose: true }).map(m => ({
        from: m.from, to: m.to, san: m.san, color: m.color,
        piece: m.piece, captured: m.captured ?? null, promotion: m.promotion ?? null
      })),
      gameOver: this.#game.isGameOver(),
      check: this.#game.isCheck(),
      checkmate: this.#game.isCheckmate(),
      stalemate: this.#game.isStalemate(),
      draw: this.#game.isDraw()
    };
  }

  piece(square) { return this.#game.get(square); }
  legalMoves(square) { return this.#game.moves({ square, verbose: true }); }

  preview({ from, to, promotion } = {}) {
    if (!from || !to) return null;
    const moves = this.legalMoves(from).filter(m => m.to === to);
    return moves.find(m => m.promotion === promotion)
      ?? (promotion ? null : moves.find(m => !m.promotion))
      ?? null;
  }

  requiresPromotion(from, to) {
    return this.legalMoves(from).some(m => m.to === to && !!m.promotion);
  }

  /** Accepts SAN ('e4', 'Nf3') or { from:'e2', to:'e4', promotion?:'q' }. */
  move(candidate, source = 'api') {
    if (this.#game.isGameOver()) return { ok: false, error: 'Game is over.' };
    let move;
    try { move = this.#game.move(candidate); }
    catch { return { ok: false, error: 'Illegal move.' }; }
    if (!move) return { ok: false, error: 'Illegal move.' };
    this.#notify(source, move);
    return { ok: true, move: { from: move.from, to: move.to, san: move.san, color: move.color } };
  }

  undo() {
    const move = this.#game.undo();
    if (move) this.#notify('undo');
    return !!move;
  }

  reset() { this.#game.reset(); this.#notify('reset'); }

  loadFen(fen) {
    try {
      this.#game.load(fen);
      this.#notify('load');
      return { ok: true };
    } catch { return { ok: false, error: 'Invalid FEN.' }; }
  }
}
