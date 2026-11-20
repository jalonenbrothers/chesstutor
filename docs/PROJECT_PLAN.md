# AI Chess Tutor — Product and Implementation Plan

**Status:** Stage 0 prototype delivered; remaining work is an incremental roadmap.  
**Scope:** beginners, especially children, but approachable for adults.  
**Constraints:** PHP/MySQL (LAMP), vanilla JS and CSS, libraries allowed, minimal dependencies, OOP where useful, DRY, tests first, short independently verifiable milestones.

## 1. Product vision and success criteria

A chess learning playground rather than a high-pressure opponent. Let learners explore, make errors safely, understand *why* a move matters, and improve through short missions. Reward learning objectives, not just wins or a synthetic Elo rating.

**Success means**: a first-time student can make legal moves without instruction, understand checks/captures, complete a 5-minute lesson, receive supportive factually grounded feedback, and return to a sensible next task. A parent can understand what was learned without needing to read a complete game score.

### Product principles

- **Truthful chess:** rules engine is authoritative for legality; engine and verified patterns for tactical judgement; language model is the explanation layer.
- **Exploration before punishment:** in lessons, distinguish an illegal move from a valid but pedagogically unhelpful move, a tactical mistake and a reasonable alternative.
- **Adjustable support:** hint-on-demand, explore first, then guided fallback; never interrupt after every move.
- **Short sessions:** each mission teaches one concept and uses concrete board positions.
- **Accessible:** touch and mouse, keyboard moves, readable colours, non-colour-only indicators, sound optional, reduced-motion mode.
- **Privacy for children:** no unrestricted public chat or direct social features, no collection of a child's name/email by default.
- **No forced accounts:** local-first anonymous progress, optional parent account later.

## 2. Modes and behaviour

| Mode | Student controls | Tutor behaviour | Completion |
|---|---|---|---|
| Sandbox / free practice | Both colours | Optional basic rule explanations | None |
| Guided first game | White (or selectable side later) | Plays understandable replies, asks questions, allows retries | Concepts achieved |
| Interactive lesson | Mission-specific side/pieces | Accepts many valid options or asks for a particular concept | Objective solved |
| Demonstration | Play/pause/step/rewind | Makes *both* sides' moves, narrates and highlights | Viewed + short quiz |
| Tactical puzzle | Move/capture from a preset FEN | Hints in levels, explains threat pattern | Target move or motif |
| Coach game | Student against adjustable opponent | Notices teachable moments, not every engine inaccuracy | Post-game reflection |
| Position explorer | Any side, unrestricted variations | Compares candidate moves and plans | No formal scoring |
| Quick challenge | Mini-board or constrained exercise | Short targeted feedback | 1–3 correct actions |

**Do not implement all these at once.** Stage 0 contains the first three; the rest come from the same GameSession and LessonEngine contracts.

### Teacher move policies (important)

A normal chess engine chooses moves to win. A teacher chooses moves *appropriate to the lesson* while remaining legal:

1. **Scripted example:** known sequence deliberately illustrates an idea (e.g., developing knights before chasing pawns).
2. **Constrained engine:** get several legal suggestions (MultiPV), eliminate obvious tactical blunders, prefer moves that sustain the target idea and student engagement.
3. **Response templates:** if student chose an alternative valid move, adapt with a suitable prepared branch instead of resetting unnecessarily.
4. **Exhibit-a-mistake:** occasionally show a weaker *legal* move to make a concept visible, clearly label it as a demonstration, not 'optimal play'.
5. **Graceful fallbacks:** if the lesson plan cannot continue, give a short natural language explanation and return to sandbox or a known teaching position.

An AI should **never issue moves straight to the board**. The coordinator asks the legal-move gateway to validate the proposed move. If invalid, retry within bounded attempts or use a verified fallback. Game and tutorial state must commit in a single controlled operation.

## 3. Beginner course (initial syllabus)

Organise by *concept mastery*, not opening repertoire. Suggested Stage-1 content is 20–25 micro-lessons, expandable later:

| Chapter | Approx lessons | Topics / sample mission |
|---|---:|---|
| Welcome to chess | 3 | Board orientation, coordinates, turns, how to win |
| Meet the pieces | 5 | Pawn/rook/bishop/knight/queen/king; simple piece-specific moves |
| Rules and king safety | 4 | Check, mate vs stalemate, castling, promotion, en passant as optional bonus |
| First opening principles | 3 | Centre, develop minor pieces, castle; simple 1.e4 line as an illustration |
| Spot threats and tactics | 4 | Checks-captures-threats, hanging pieces, forks, simple pins |
| Thinking in the middle game | 3 | Protect pieces, improve activity, simple two-move plan |
| Introduction to endgames | 3 | Pawn promotion race, active king, simple queen/rook checkmates |
| Graduation challenges | 2 | Mixed mini-game and an annotated short game |

Each lesson has a short **explain → demonstrate → student tries → reasoned feedback → repeat in a slightly different position → recap** loop. Save structured mission data, not AI-generated prose as the lesson's source of truth.

Example lesson definition (JSON in a future `content/lessons/` directory):

```json
{
  "id": "opening-develop-knight",
  "chapter": "opening-principles",
  "title": "Bring out your knight",
  "level": "beginner",
  "start_fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "objective": { "kind": "move_matches", "allowed_san": ["Nf3", "Nc3"] },
  "success_text": "Great! Knights help contest the centre early.",
  "hint_levels": ["Think about developing a piece.", "Find a knight that can leave the back rank.", "Try moving a knight towards the centre."],
  "next_lesson": "opening-keep-king-safe"
}
```

**Important:** the example above deliberately illustrates a *two-knight-choice exercise*, not a forced opening line. Valid instructional alternatives should not be marked objectively 'bad'. A future objective evaluator must interpret mission rules independently from tactical engine scores.

## 4. The teaching feedback loop

For every move or candidate move:

1. Read **game state** (FEN, legal moves, turn, history, result) from chess.js.
2. Read **learning context** (mode, current mission, age band, attempts, hint level, recent concepts mastered).
3. Use **lesson policy** first: if mission asks for a specific concept, see whether the student achieved it. Do not confuse a wrong answer to a lesson with a bad chess move.
4. Use **Stockfish** only where relevant. Fetch candidate moves, compare evaluations with enough search depth, detect tactical consequences and distinguish clear blunders from harmless inaccuracy. Add deterministic pattern tags where possible.
5. Build a validated **teaching fact record** with limited permitted moves, square markers, concept labels, and confidence level.
6. The **LLM** creates brief teaching phrasing appropriate to reader level, potentially a Socratic question before giving the answer. For fixed simple lessons, use authored copy rather than API calls.
7. Validate AI output against schema and chess state: proposed SAN/UCI, highlights, chess claims and square names must be authorised by the fact record. Reject or replace unverified claims.
8. Record lightweight progress (concept, completed/attempted, hint count) and select the next mission.

### Example engine-grounded teaching record

```json
{
  "position_fen": "<full valid FEN>",
  "mode": "guided",
  "objective": "develop-knight",
  "student_move": "Nf3",
  "move_legal": true,
  "objective_met": true,
  "tactical_verdict": "not-evaluated",
  "facts": ["Knight moved from initial rank", "Knight now attacks the central e5 square"],
  "allowed_highlights": ["g1", "f3", "e5"],
  "allowed_followups": ["e5"],
  "student_level": "novice"
}
```

For stronger tactical assertions, attach actual verified analysis (engine score and principal variation, fixed search budget and engine version). **An engine centipawn delta alone is insufficient** to explain *why* a move is weak, particularly with noisy low-depth analysis, mate scores, or teaching sacrifices. Derive understandable motifs from position comparison and provide 'uncertain' when necessary.

### Three hint levels

- **Nudge:** "Before moving, which of your pieces is in danger?"
- **Focus:** highlight the threatened piece or its attackers.
- **Show:** highlight one safe square and animate a sample line, then let the learner replay it unaided.

Avoid "Bad move!" or punishing animations. Use "That move leaves your bishop unprotected. Want to try finding a safer square?". Praise the reasoning or idea, not every move mechanically.

## 5. Software architecture

```text
                         BROWSER (Vanilla JS ES modules)
   BoardRenderer2D ───────┐
   BoardRenderer3D (later)├─ BoardController ─┐
   MoveList / Controls ───┘                   │
                         GameSession (chess.js)  ← canonical client state
                                   │
                    LessonEngine / ModePolicy
                                   │
                           TutorController
                                   │ JSON over HTTPS
                                   ▼
                PHP REST API (public/api/*)
                        │
               TutorOrchestrator (PHP)
                ├── LessonRepository / MySQL
                ├── ProgressRepository / MySQL
                ├── AnalysisProvider / Stockfish
                ├── ExplanationProvider / OpenRouter
                └── AuthService / Sessions (later)
```

**Interfaces:**

- `GameSession`: `state()`, `move(san|{from,to,promotion})`, `legalMoves(square)`, `undo()`, `loadFen()`, `reset()`, `subscribe(handler)`.
- `BoardRenderer`: `render(state)`, `showHighlights(squares)`, `showArrow(from,to)`, `flip()`, `setInputEnabled(flag)`. Current Stage-0 `BoardView` is the first implementation; refactor its API before adding 3D.
- `LessonEngine`: `load(lesson)`, `current()`, `evaluate(candidate)`, `advance()`, `nextHint()`.
- `EngineAnalyzer`: `analyze(fen, depth/time, multipv) → score, bestMoves, PV, confidence`.
- `TutorService`: `explain(verifiedFactRecord, learnerContext) → {text, question, highlights, suggestions}`.

Keep the frontend as **one authority for live moves** initially. Once server-persisted or competitive games exist, server endpoints must independently verify submitted game histories (with a trusted chess rules implementation or replay validator), never accept arbitrary FEN or move claims from the browser as trustworthy. Prevent stale tutor responses from painting an old position: include a `position_id` or hash and ignore results if the state changed.

### Intended project structure after first milestones

```text
public/                      # only directory exposed by Apache
  index.php
  css/
  js/
    core/GameSession.js
    core/MoveController.js
    boards/CmBoardRenderer.js
    boards/ThreeBoardRenderer.js     # optional
    lessons/LessonEngine.js
    tutor/TutorController.js
    api/ApiClient.js
    ui/
  api/index.php                # future tiny REST router
  vendor/                      # pinned browser assets
src/
  Auth/
  Http/
  Lessons/
  Game/
  Tutor/
  Repository/
config/.env                    # server secret; gitignored
content/lessons/*.json        # editorially reviewed beginner lessons
migrations/                   # numbered SQL migration files
tests/                        # JS and PHP unit/integration tests
scripts/                      # dependency copy / content validation
```

Do not add empty classes or elaborate dependency injection frameworks in anticipation; each folder appears when a milestone needs it. Use PHP namespaces and PSR-4 via Composer only if the backend genuinely grows beyond a few classes.

## 6. Three.js 3D board: optional view, not a second chess application

Three.js can render a physically modelled board and `.glb` chess pieces with perspective camera, orbit/zoom controls and simple move animations. Hit-testing via raycasting maps picked meshes to algebraic squares. **The 3D layer must not implement any chess rules.** It consumes the same FEN/history and sends candidate moves to `GameSession.move` just like the 2D board.

Keep a clear **2D / 3D** toggle, with fallback on low-end mobiles, low frame rates or reduced-motion preference. Support contrast outlines, flat overhead camera, alternate piece sets, the same lesson arrows and legal-target indications. Stage 0 stays 2D; 3D is a late enhancement once input, promotion and teaching behaviours are stable. Source and licensing of `.glb` models must be checked separately.

## 7. Accounts, personalisation and progress

**Phase A (no signup):** browser-local anonymous identifier, generated randomly per app installation, not hardware fingerprinting; preferences and completion records in localStorage (or IndexedDB for larger content); optional reset. It is not a secure identity and may be lost with browser data.

**Phase B (optional account):** parent-managed account via email/password or social login later; children represented by local nicknames/avatars; parent can configure age band and review progress. Account creation is never required to use the basic board.

Minimal initial MySQL schema once server progress is necessary:

- `users`: id, email, password_hash, created_at (adult account holder only).
- `learner_profiles`: id, user_id nullable, display_alias, level, settings_json.
- `lesson_progress`: learner_id, lesson_id, status, attempts, hints_used, completed_at.
- `games`: id, learner_id, pgn, final_fen, mode, created_at.
- `concept_mastery`: learner_id, concept_key, evidence_count, last_practised_at.

Use prepared statements (PDO), password hashing, same-site session cookies, server validation and minimal data retention. Define data deletion/export paths before launch. For children, avoid open-ended model conversations, unnecessary telemetry, user-to-user messaging and storing raw transcripts. Review local child privacy/age-appropriate design obligations before public launch.

### Learner dashboard

Friendly map of chapters; which skills have been explored; current mission; strengths and next recommended skill. **No leaderboard required.** Optional achievements reward persistence, self-correction, and practice rather than victory or long addictive streaks. Parent summary shows simple skills practised, not exhaustive chat logs.

## 8. OpenRouter configuration and model usage

Stage 0 implements `config/.env` and a PHP-only `OpenRouterClient`. Later a protected admin page can expose `model`, `temperature`, `max_tokens`, `enabled`, budget and health check; never return or embed the secret API key in HTML/JS. The OpenRouter API currently supports chat completions and structured outputs for compatible provider/model endpoints; choose a model that actually supports the desired schema and verify responses server-side.

**Cost controls:** only request an explanation for real teachable moments, not every click; templates for basic lessons, debounce and one in-flight request per game position, bound output tokens, budget/day per account and server, cache common position+lesson explanations after safety review. Prefer a human-reviewed fallback answer if provider is unavailable.

**Content quality:** Use a JSON schema with `message`, `question`, `highlights` and optional `suggested_move`. Allow lists and chess facts originate from authoritative analysis and lesson data. Treat model outputs as untrusted; check before displaying. Do not let the model edit game records or assign mastery directly.

## 9. Development milestones, tests and stop/go gates

Each milestone is intended as a small PR: tests and documentation, implementation, local smoke run, screenshots/bug notes, then review and proceed. Run `npm test` and `phpunit` once introduced before opening the browser. TDD: first test observable behaviour including failure cases; avoid tests that merely echo implementation details.

### M0 — Playable board skeleton (delivered in starter)

**Build:** PHP page, styled 2D board, legal chess.js move gateway, touch/mouse, free practice, basic guided opening, demo, undo, reset, flip, FEN/PGN, console API, API config stub. **Automated tests:** chess move rules, checkmate, en passant, promotion, lesson transitions. **Manual test:** desktop + mobile input; castling; state synchronisation; promotion dialog. **Exit gate:** all ten README smoke checks pass. Any version/import/input issue is an M0 bug, not a reason to start AI work.

### M1 — Robust chessboard UX

**Build:** last move and check highlighting, legal targets, multi-colour teaching arrows, keyboard/text move entry, king accessibility labels, move replay/history navigation, PGN import/export, proper completed game end states, dismissible hints. Verify all renderer events after reset/undo/promotion. **Tests:** mouse/touch/keyboard Playwright smoke tests, FEN/PGN round-trips, castling/en-passant/promotion visual sync. **Exit:** zero state divergence in a 30-move fixture game on desktop and phone.

### M2 — Data-driven lessons and three pedagogy policies

**Build:** JSON lesson schema and validator, lessons menu, mission objectives, authored feedback, retry and three hint levels, demonstration pause/rewind, sandbox return, one small chapter (~5 lessons). Support alternatives when lesson objectives allow them. **Tests:** fixture JSON and acceptance path/wrong-move/hint paths, mode changes during scripted tutor move. **Exit:** beginner can complete a chapter offline; no AI key needed.

### M3 — Verified analysis engine

**Build:** Stockfish via a browser Web Worker initially (off main thread); bounded CPU/memory/time; move grading threshold tuned for novices, check/capture/threat detectors, simple mate-in-one and hanging-piece examples, deterministic alternatives. Consider PHP-hosted engine later only if persistence and load justify it. **Tests:** known FEN test suite with tactical assertions; low-depth ambiguity tests; browser CPU/fallback tests. **Exit:** no explanations claim a tactic unverified by position facts. Review Stockfish GPLv3 redistribution/source obligations before shipping binaries.

### M4 — Real AI teaching orchestration

**Build:** PHP TutorService with OpenRouter model config, structured output and schema checks, compact state/fact input, 3 coaching levels, Socratic vs direct explanations, errors/timeouts, strict spending limits, coaching cache. **Tests:** mock model JSON correct/invalid, hallucinated move/square rejection, stale response rejection, outage fallback, red-team child-data prompts. **Exit:** model never controls legal moves and bad outputs produce safe, helpful fallbacks.

### M5 — Course progression and local profiles

**Build:** complete introductory syllabus, mastery tags, quiz/checkpoint loop, resume lesson, local persistence via anonymous app ID, accessibility improvements, preferences and backup/export. **Tests:** progress resume, browser restart, reset/clear, anonymised storage; lesson metrics. **Exit:** student can progress through chapters over several visits without signup.

### M6 — LAMP persistence and optional parent accounts

**Build:** SQL migrations; PDO repositories; optional accounts; children as learner profiles; parent overview; saved games; export/delete. **Tests:** PHPUnit service tests, API contract tests, auth/CSRF/session tests, SQL constraint and permissions tests. **Exit:** anonymous mode still works; accounts add sync rather than becoming a gate.

### M7 — 3D board view

**Build:** Three.js adapter using same move API, GLB models, raycaster input, camera presets and mobile fallback. **Tests:** 2D↔3D FEN equality after every game action, promotion/castling/endgame visual tests, performance checks. **Exit:** 3D is optional and cannot break tutoring or legal moves.

### M8 — Release readiness

**Build:** monitoring with child-privacy-safe metrics, content review, caching and cost limits, automated regression suite, accessibility audit, security review, age-appropriate safeguards, performance budgets, deployment docs. **Exit:** stable, safe and understandable on tested desktop/mobile browsers. Do not ship the prototype API publicly before these controls.

## 10. How to review each milestone locally

Use a short repeatable test report, which can be submitted to the development agent before the next milestone:

```text
Milestone: M1
Environment: Windows Chrome / Android Chrome / PHP 8.x
Automated tests: pass / fail + output
Manual scenarios: #1 pass; #2 pass; #3 fail
Bug: promotion dialog remains open after reset
Steps to reproduce: load FEN ..., drag a7→a8, press New board
Expected: dialog closes; starting position shown
Actual: dialog stays visible
Severity: blocking / high / minor
Suggested change: ...
Next milestone decision: GO / FIX FIRST
```

Each deliverable should include: changed-file list, test output, browser smoke script, known limitations, security implications, and what *not* to implement yet. This makes it easy to adjust scope before investing in large pieces of AI functionality.

## 11. Immediate decisions / backlog priorities

**Do now:** install and exercise Stage 0; fix any touch/promotion/lesson event issues; confirm board package works in your exact WSL/Apache environment; lock dependency versions with committed `package-lock.json`.

**Then:** M1 board finishing work, followed by M2 lesson schema/content. These two milestones should precede Stockfish and OpenRouter orchestration: they define what the learner actually needs to learn and how the app measures it.

**Not yet:** multiplayer, rating/Elo matchmaking, leaderboards, complex opening book, cloud analysis clusters, model fine-tuning, automated lesson content publication, real-time speech, highly detailed 3D environments. These offer little value until the core teaching loop is demonstrated.
