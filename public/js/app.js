import { GameSession } from './GameSession.js';
import { BoardView } from './BoardView.js';
import { OPENING_LESSON, DEMONSTRATION, LessonEngine } from './LessonEngine.js';

const $ = id => document.getElementById(id);
const session = new GameSession();
const lesson = new LessonEngine();
let mode = 'practice';
let demoIndex = 0;
let coachText = 'Move a piece to explore the board. Both sides are yours in practice mode.';
let automatedReply = false;
let generation = 0;

function describeStatus(state) {
  if (state.checkmate) return `Checkmate — ${state.turn === 'w' ? 'Black' : 'White'} wins.`;
  if (state.stalemate) return 'Draw by stalemate.';
  if (state.draw) return 'Game drawn.';
  return `${state.turn === 'w' ? 'White' : 'Black'} to move${state.check ? ' — CHECK!' : ''}`;
}

function requestPromotion() {
  return new Promise(resolve => {
    const dialog = $('promotion-dialog');
    const onClose = () => { dialog.removeEventListener('close', onClose); resolve(['q','r','b','n'].includes(dialog.returnValue) ? dialog.returnValue : null); };
    dialog.addEventListener('close', onClose, { once: true });
    dialog.showModal();
  });
}

function canInteract() {
  return !automatedReply && !session.state().gameOver && mode !== 'demo' &&
    (mode === 'practice' || (lesson.current()?.actor === 'student' && session.state().turn === 'w'));
}

function playMove(candidate, source = 'api') {
  // API / lesson moves bypass UI restrictions but never chess legality.
  const result = session.move(candidate, source);
  if (!result.ok) coachText = `That move isn't legal in the current position.`;
  return result;
}

function onUserMove(candidate) {
  if (!canInteract()) return { ok: false, error: 'Input is paused.' };
  const preview = session.preview(candidate);
  if (!preview) { coachText = 'That move is not allowed by the rules. Try another square.'; render(); return { ok: false }; }
  if (mode === 'guided' && !lesson.accepts(preview.san)) {
    coachText = `Good thinking! For this lesson, we're practising ${lesson.current()?.san}. ${lesson.current()?.prompt}`;
    render();
    return { ok: false, error: 'Try the lesson move.' };
  }
  const result = playMove(candidate, 'human');
  if (result.ok && mode === 'guided') {
    coachText = lesson.current().explanation;
    lesson.advance(preview.san, 'student');
    render();
    void playTutorReplies();
  } else if (result.ok) {
    coachText = `You played ${result.move.san}. Before your next move, look for checks, captures and threats.`;
    render();
  }
  return result;
}

async function onPromotion(from, to) {
  if (!canInteract()) return;
  const promotion = await requestPromotion();
  if (!promotion) return;
  const result = onUserMove({ from, to, promotion });
  if (result?.ok) board.sync(false); // The board originally cancelled the move to open the promotion dialog.
}

const board = new BoardView($('board'), session, { onUserMove, onPromotion, canInteract });

session.subscribe(({ source }) => {
  // Board commits validated mouse/touch moves itself; sync after its finished event.
  if (source !== 'human') board.sync(source === 'script' || source === 'demo');
  render();
});

async function playTutorReplies() {
  if (mode !== 'guided') return;
  const token = generation;
  if (lesson.current()?.actor !== 'tutor') { render(); return; }
  automatedReply = true;
  render();
  await new Promise(resolve => setTimeout(resolve, 600));
  if (generation !== token || mode !== 'guided') return;
  const step = lesson.current();
  const result = playMove(step.san, 'script');
  if (result.ok) {
    lesson.advance(step.san, 'tutor');
    coachText = step.explanation;
  }
  automatedReply = false;
  render();
}

function render() {
  const state = session.state();
  $('status').textContent = describeStatus(state);
  $('coach-message').textContent = coachText;
  $('lesson-title').textContent = mode === 'guided' ? OPENING_LESSON.title : mode === 'demo' ? 'Opening demonstration' : 'Free practice';
  $('mode-description').textContent = mode === 'guided' ? OPENING_LESSON.summary : mode === 'demo'
    ? 'See each move and why it might be useful.' : 'Move pieces for either side and experiment with the rules.';
  const next = lesson.current();
  $('lesson-instruction').textContent = mode === 'guided'
    ? (automatedReply ? 'The tutor is making a move…' : next?.prompt ?? (lesson.finished() ? 'Lesson complete! Great work.' : 'Watch the tutor move.'))
    : mode === 'demo' ? `${demoIndex} of ${DEMONSTRATION.length} moves demonstrated` : 'Explore freely. Try castling, checks and captures.';
  $('demo-next').hidden = mode !== 'demo';
  $('demo-next').disabled = demoIndex >= DEMONSTRATION.length;
  $('undo').disabled = mode !== 'practice' || state.history.length === 0;
  $('fen-display').textContent = state.fen;
  const moves = $('moves');
  moves.replaceChildren();
  for (let i = 0; i < state.history.length; i += 2) {
    const line = document.createElement('div');
    line.className = 'move-pair';
    const n = document.createElement('span'); n.textContent = `${Math.floor(i / 2) + 1}.`;
    const white = document.createElement('span'); white.textContent = state.history[i]?.san ?? '';
    const black = document.createElement('span'); black.textContent = state.history[i + 1]?.san ?? '';
    line.append(n, white, black);
    moves.append(line);
  }
  if (!state.history.length) moves.textContent = 'No moves yet — your board is ready.';
}

function startMode(next) {
  generation += 1; automatedReply = false; mode = next; $('mode').value = next; demoIndex = 0;
  lesson.reset(); session.reset();
  coachText = next === 'guided' ? 'Welcome! We will learn one idea at a time. You can make the move yourself.'
    : next === 'demo' ? 'Press “Show next move” to see a short opening explained.'
    : 'Make moves for White and Black. Every move is checked against the rules.';
  board.sync(false); render();
}

$('mode').addEventListener('change', e => startMode(e.target.value));
$('new-game').addEventListener('click', () => startMode(mode));
$('flip').addEventListener('click', () => board.flip());
$('undo').addEventListener('click', () => { if (mode === 'practice') { session.undo(); coachText = 'Move taken back.'; render(); } });
$('demo-next').addEventListener('click', () => {
  if (mode !== 'demo') return;
  const step = DEMONSTRATION[demoIndex];
  if (!step) return;
  const result = playMove(step.san, 'demo');
  if (result.ok) { demoIndex += 1; coachText = step.text; render(); }
});
$('copy-pgn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(session.state().pgn); coachText = 'PGN copied.'; }
  catch { coachText = 'Clipboard unavailable. You can copy moves from the display.'; }
  render();
});
$('load-fen').addEventListener('click', () => {
  if (mode !== 'practice') startMode('practice');
  const result = session.loadFen($('fen-input').value.trim());
  coachText = result.ok ? 'Position loaded. Try a legal move.' : result.error;
  render();
});
$('ask-tutor').addEventListener('click', async () => {
  const button = $('ask-tutor'); button.disabled = true;
  coachText = 'Asking the tutor…'; render();
  try {
    const state = session.state();
    const response = await fetch('/api/tutor.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: state.fen, last_move: state.history.at(-1)?.san ?? '', question: $('question').value.trim() })
    });
    const result = await response.json();
    coachText = result.message ?? 'The tutor is unavailable right now.';
  } catch { coachText = 'Could not reach the tutoring API. Check that PHP is running.'; }
  finally { button.disabled = false; render(); }
});

/** Integration contract for future backend tutor, lesson runner or 3D view. */
window.chessTutor = Object.freeze({
  getState: () => session.state(),
  move: (candidate) => playMove(candidate, 'api'),
  undo: () => mode === 'practice' ? session.undo() : false,
  reset: () => startMode(mode),
  loadFen: (fen) => { startMode('practice'); return session.loadFen(fen); },
  legalMoves: (square) => session.legalMoves(square).map(m => m.san),
  setMode: (value) => { if (!['practice','guided','demo'].includes(value)) return false; $('mode').value = value; startMode(value); return true; }
});

render();
