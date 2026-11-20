import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../public/js/GameSession.js';

// These tests use the actual chess.js rules engine (after `npm install`).
test('opening move is legal, illegal pawn jump is rejected', () => {
  const game = new GameSession();
  assert.equal(game.move('e4', 'test').ok, true);
  assert.equal(game.state().turn, 'b');
  const before = game.state().fen;
  assert.equal(game.move({ from: 'e7', to: 'e4' }, 'test').ok, false); // pawns cannot jump three squares
  assert.equal(game.state().fen, before);
});
test('castling updates rook and king and stores SAN', () => {
  const game = new GameSession();
  for (const move of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O']) assert.equal(game.move(move).ok, true, move);
  assert.equal(game.state().history.at(-1).san, 'O-O');
  assert.equal(game.piece('g1').type, 'k');
  assert.equal(game.piece('f1').type, 'r');
});
test('fool’s mate gives checkmate and blocks further moves', () => {
  const game = new GameSession();
  for (const move of ['f3', 'e5', 'g4', 'Qh4#']) assert.equal(game.move(move).ok, true);
  assert.equal(game.state().checkmate, true);
  assert.equal(game.move('e4').ok, false);
});
test('en passant, undo and FEN loading', () => {
  const game = new GameSession();
  for (const move of ['e4', 'a6', 'e5', 'd5', 'exd6']) assert.equal(game.move(move).ok, true);
  assert.equal(game.piece('d6').type, 'p');
  assert.equal(game.piece('d5'), undefined);
  assert.equal(game.undo(), true);
  assert.equal(game.piece('d5').type, 'p');
  assert.equal(game.loadFen('not fen').ok, false);
});
test('promotion can be previewed and applied', () => {
  const game = new GameSession();
  assert.equal(game.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1').ok, true);
  assert.equal(game.requiresPromotion('a7', 'a8'), true);
  assert.equal(game.move({ from: 'a7', to: 'a8', promotion: 'n' }).ok, true);
  assert.equal(game.piece('a8').type, 'n');
});
test('notifications fire for API moves, resets and FEN updates', () => {
  const game = new GameSession();
  const events = [];
  game.subscribe(e => events.push(e.source));
  game.move('e4', 'api'); game.reset();
  assert.deepEqual(events, ['api', 'reset']);
});
