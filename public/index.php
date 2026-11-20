<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#101c2d">
  <meta name="description" content="A calm, playful chess learning sandbox.">
  <title>Little Grandmaster · Chess Tutor</title>
  <link rel="stylesheet" href="/vendor/cm-chessboard/assets/chessboard.css">
  <link rel="stylesheet" href="/css/app.css">
  <script type="importmap">{"imports":{"chess.js":"/vendor/chess.js/chess.js"}}</script>
  <script type="module" src="/js/app.js"></script>
</head>
<body>
  <div class="app-shell">
    <header class="header">
      <div class="brand"><div class="brand-logo" aria-hidden="true">♞</div><div><span class="eyebrow">LEARN · PLAY · GROW</span><h1>Little Grandmaster</h1></div></div>
      <div class="header-note">The chessboard is your classroom <span aria-hidden="true">✦</span></div>
    </header>

    <main class="workspace">
      <section class="board-panel" aria-label="Interactive chessboard">
        <div class="panel-top"><div><div class="eyebrow">YOUR PLAY SPACE</div><h2>Make your next move.</h2></div><div class="status" id="status" role="status" aria-live="polite">White to move</div></div>
        <div class="board-frame"><div id="board" aria-label="Chess board"></div></div>
        <div class="controls">
          <button id="new-game" class="primary">↻ New board</button>
          <button id="undo" class="outline">↶ Undo</button>
          <button id="flip" class="outline">⇅ Flip board</button>
        </div>
        <div class="caption">Use your mouse or finger: tap a piece, then a square — or drag it. Legal chess moves only.</div>
      </section>

      <aside class="sidebar" aria-label="Learning companion">
        <section class="card lesson-card">
          <div class="section-header"><span class="eyebrow">CHOOSE YOUR JOURNEY</span><span class="small-star" aria-hidden="true">✳</span></div>
          <label class="field-label" for="mode">Learning mode</label>
          <select id="mode"><option value="practice">♙ Free practice</option><option value="guided">✦ Guided first lesson</option><option value="demo">▷ Watch a demonstration</option></select>
          <h3 id="lesson-title">Free practice</h3>
          <p id="mode-description">Move pieces for either side and experiment with the rules.</p>
          <div class="lesson-instruction" id="lesson-instruction">Explore freely. Try castling, checks and captures.</div>
          <button id="demo-next" class="primary full" hidden>Show next move →</button>
        </section>
        <section class="card coach-card">
          <div class="coach-head"><span class="coach-avatar" aria-hidden="true">♘</span><div><span class="eyebrow">YOUR CHESS GUIDE</span><h3>Coach Pip</h3></div><span class="coach-status">● Here to help</span></div>
          <p id="coach-message" class="coach-message" aria-live="polite">Move a piece to explore the board.</p>
          <div class="ask-area">
            <label class="field-label" for="question">Ask a question</label>
            <input id="question" type="text" maxlength="200" placeholder="What should I look for?" value="What beginner idea can I practise?">
            <button class="outline full" id="ask-tutor">Ask the tutor ✧</button>
            <p class="fine-print">Without an OpenRouter key, this displays an offline setup message. AI explanations are experimental and not engine-verified in this starter.</p>
          </div>
        </section>
        <section class="card moves-card"><div class="section-header"><h3>Move history</h3><button id="copy-pgn" class="link-button">Copy PGN</button></div><div id="moves" class="moves-list">No moves yet — your board is ready.</div></section>
        <details class="advanced"><summary>Developer tools · FEN / API</summary><p class="small">Position (FEN)</p><code id="fen-display" class="fen-output"></code><label class="field-label" for="fen-input">Load FEN position</label><input id="fen-input" placeholder="Paste a legal full FEN string"><button id="load-fen" class="outline full">Load FEN</button><p class="small">Open the browser console and try <code>chessTutor.move('e4')</code> or <code>chessTutor.getState()</code>.</p></details>
      </aside>
    </main>
    <footer>Built for curiosity, not trophies. · Local prototype v0.1</footer>
  </div>
  <dialog id="promotion-dialog" aria-label="Choose a piece for pawn promotion">
    <form method="dialog"><h2>Choose your new piece</h2><p>Your pawn reached the end of the board!</p><div class="promotion-options"><button value="q" title="Queen">♛ <span>Queen</span></button><button value="r" title="Rook">♜ <span>Rook</span></button><button value="b" title="Bishop">♝ <span>Bishop</span></button><button value="n" title="Knight">♞ <span>Knight</span></button></div><button class="outline full" value="cancel">Cancel</button></form>
  </dialog>
  <noscript>This page requires JavaScript to run the chessboard.</noscript>
</body>
</html>
