import { Chessboard, COLOR, INPUT_EVENT_TYPE } from '/vendor/cm-chessboard/src/Chessboard.js';

/** Thin view adapter. Has no chess rules and no lesson knowledge. */
export class BoardView {
  constructor(container, session, callbacks) {
    this.session = session;
    this.callbacks = callbacks;
    this.humanMovePending = false;
    this.board = new Chessboard(container, {
      position: session.state().fen,
      assetsUrl: '/vendor/cm-chessboard/assets/',
      responsive: true,
      style: { cssClass: 'default', showCoordinates: true, animationDuration: 230 }
    });
    this.board.enableMoveInput(event => this.#onInput(event));
  }

  #onInput(event) {
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
      const piece = this.session.piece(event.squareFrom);
      return !!piece && piece.color === this.session.state().turn && this.callbacks.canInteract();
    }
    if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
      const { squareFrom: from, squareTo: to } = event;
      if (this.session.requiresPromotion(from, to)) {
        this.callbacks.onPromotion(from, to); // asynchronously asks for a piece
        return false;
      }
      const result = this.callbacks.onUserMove({ from, to });
      if (result.ok) this.humanMovePending = true;
      return result.ok;
    }
    if (event.type === INPUT_EVENT_TYPE.moveInputFinished && this.humanMovePending) {
      this.humanMovePending = false;
      // Sync the complete position: castling, en-passant and promotions update multiple squares.
      this.sync(false);
    }
    return undefined;
  }

  sync(animated = false) { return this.board.setPosition(this.session.state().fen, animated); }
  flip() {
    const next = this.board.getOrientation() === COLOR.white ? COLOR.black : COLOR.white;
    return this.board.setOrientation(next, true);
  }
  destroy() { this.board.destroy(); }
}
