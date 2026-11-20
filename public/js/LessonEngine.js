/** Pedagogical script. Data can later come from JSON lessons / a PHP API. */
export const OPENING_LESSON = Object.freeze({
  id: 'first-opening',
  title: 'Your first opening',
  summary: 'Control the centre, develop pieces and keep the king safe.',
  steps: [
    { actor: 'student', san: 'e4', prompt: 'Move the pawn in front of your king two squares to e4.', explanation: 'Nice! This pawn claims space in the centre.' },
    { actor: 'tutor', san: 'e5', explanation: 'Black also places a pawn in the centre.' },
    { actor: 'student', san: 'Nf3', prompt: 'Develop your king-side knight to f3.', explanation: 'Your knight now attacks the e5 pawn and helps control the centre.' },
    { actor: 'tutor', san: 'Nc6', explanation: 'Black protects the e5 pawn by developing a knight.' },
    { actor: 'student', san: 'Bc4', prompt: 'Develop your bishop to c4.', explanation: 'Your bishop points towards the f7 square near the enemy king.' },
    { actor: 'tutor', san: 'Bc5', explanation: 'Black develops a bishop too.' },
    { actor: 'student', san: 'O-O', prompt: 'Castle king-side: move your king from e1 to g1.', explanation: 'Castling usually helps protect your king and connects the rook with the game.' }
  ]
});

export class LessonEngine {
  constructor(lesson = OPENING_LESSON) { this.lesson = lesson; this.index = 0; }
  reset() { this.index = 0; }
  current() { return this.lesson.steps[this.index] ?? null; }
  finished() { return this.index >= this.lesson.steps.length; }
  accepts(san) { return this.current()?.actor === 'student' && this.current()?.san === san; }
  advance(san, actor) {
    const current = this.current();
    if (!current || current.actor !== actor || current.san !== san) return false;
    this.index += 1;
    return true;
  }
}

export const DEMONSTRATION = Object.freeze([
  { san: 'e4', text: 'White claims central space with a pawn.' },
  { san: 'e5', text: 'Black competes for central space.' },
  { san: 'Nf3', text: 'White develops a knight and attacks e5.' },
  { san: 'Nc6', text: 'Black develops a knight and protects e5.' },
  { san: 'Bc4', text: 'White develops a bishop towards f7.' },
  { san: 'Bc5', text: 'Black develops a bishop towards f2.' },
  { san: 'O-O', text: 'White castles to improve king safety.' }
]);
