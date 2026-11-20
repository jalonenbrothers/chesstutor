import test from 'node:test';
import assert from 'node:assert/strict';
import { LessonEngine, OPENING_LESSON, DEMONSTRATION } from '../public/js/LessonEngine.js';

test('lesson requires exact student move; cannot skip scripted reply', () => {
  const lesson = new LessonEngine();
  assert.equal(lesson.accepts('Nf3'), false);
  assert.equal(lesson.accepts('e4'), true);
  assert.equal(lesson.advance('e4', 'student'), true);
  assert.equal(lesson.current().san, 'e5');
  assert.equal(lesson.advance('Nf3', 'student'), false);
  assert.equal(lesson.advance('e5', 'tutor'), true);
  assert.equal(lesson.accepts('Nf3'), true);
});
test('complete lesson then reset', () => {
  const lesson = new LessonEngine();
  for (const step of OPENING_LESSON.steps) assert.equal(lesson.advance(step.san, step.actor), true);
  assert.equal(lesson.finished(), true);
  lesson.reset(); assert.equal(lesson.finished(), false);
});
test('demonstration is short and has meaningful commentary', () => {
  assert.ok(DEMONSTRATION.length >= 6);
  assert.ok(DEMONSTRATION.every(m => m.san && m.text.length > 12));
});
