# Little Grandmaster — AI Chess Tutor starter

**Stage 0 of a larger chess-learning application.** Framework-free frontend (vanilla ES modules), PHP API, `cm-chessboard`, and `chess.js` for chess legality. This is a deliberately small local proof of concept, not a production-ready children's service.

## Quick start (Windows 11 / WSL Ubuntu / LAMP)

Requirements: PHP 8.2+, Node 20+, npm. The AI endpoint additionally needs the PHP `curl` extension when an OpenRouter key is configured.

```bash
unzip chess-tutor-starter.zip
cd chess-tutor-starter
npm install                 # fetches two libraries and copies the browser files into public/vendor
npm test                    # rules and lesson unit tests
php -S 127.0.0.1:8000 -t public
```

Open **http://127.0.0.1:8000/** in a browser. For Apache, either set the **DocumentRoot to `.../chess-tutor-starter/public`**, or keep the whole repository in the web root and rely on the bundled root `.htaccess`, which routes every request into `public/` (this is how shared-hosting deployments work — see below). No database is required in this stage; the Docker LAMP stack below is provided for parity with production. `npm` is used only to download vendor assets and run tests, not to run a Node server or bundler. The bundled zip intentionally contains **no `node_modules` or vendor files**: installing the pinned packages is required once, after which the browser assets are served locally without any CDN dependency.

## Local Docker: LAMP + phpMyAdmin behind Traefik

```bash
docker compose up -d --build
```

Starts Apache+PHP 8.2 (repo mounted at `/var/www/html`, root `.htaccess` active), MySQL 8 and phpMyAdmin on the shared `traefik` Docker network. Traefik (run separately from the parent `traefik-local` workspace) routes:

- **https://chesstutorstarter.test** — the app
- **https://pma.chesstutorstarter.test** — phpMyAdmin (auto-login user `chesstutor`)
- Direct, no-proxy fallback: **http://localhost:8083**

MySQL defaults: host `chesstutor-db`, database/user/password `chesstutordb` / `chesstutor` / `chesstutorpass` (override with `MYSQL_*` variables). Windows hosts file entries are required for both `.test` domains; TLS uses the certificate mounted at `traefik/certs/chesstutorstarter.test.pem` — see the parent workspace README for the Windows-side `mkcert` flow. After replacing certificates, restart Traefik with `docker compose restart traefik` from `traefik-local/`.

## Deploying to shared hosting (repository inside public_html)

The whole repository — including `public/`, `src/`, `config/` — is designed to be pushed straight into the web root (`public_html`) of an Apache shared host:

1. Push the git repo (or `git archive`/FTP the working tree) into `public_html`.
2. Create the environment file: copy `config/config.php.example` to `config/config.php` and set production values (DB credentials, optional OpenRouter key). Both files stay outside `public/` and are additionally blocked by `.htaccess`; `config/config.php` is gitignored, so create it once per environment.
3. Nothing else is required: mod_rewrite must be enabled (standard on shared hosts) and PHP 8.1+ is needed.

The root `.htaccess` sends every request to `public/`, refuses all dotfiles (`.git`, `.env`, ...) and blocks `config/`, `src/`, `docs/`, `tests/`, `scripts/` and `node_modules/`. `public/.htaccess` disables directory listings. Browser libraries in `public/vendor/` are committed to git on purpose: shared hosting has no `npm`, and `public/vendor/` is intentionally not gitignored.

### Try the three modes

- **Free practice:** play either colour, undo, flip the board, reset, inspect PGN/FEN, try legal and illegal moves.
- **Guided first lesson:** play the white moves as requested; the scripted tutor responds for Black. Wrong lesson choices are gently rejected even if otherwise legal.
- **Watch a demonstration:** step through an opening without making moves yourself.

On a phone, try tapping a piece and destination square; on desktop try dragging. Pawn promotion asks for queen, rook, bishop or knight.

### Programmatic API (browser console)

```js
chessTutor.setMode('practice');
chessTutor.move({ from: 'e2', to: 'e4' }); // or chessTutor.move('e4')
chessTutor.move('e5');
chessTutor.legalMoves('g1');             // SAN moves for the knight
chessTutor.getState();                   // FEN, PGN, turn, game over, history
chessTutor.undo();
chessTutor.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
chessTutor.move({ from: 'a7', to: 'a8', promotion: 'q' });
chessTutor.reset();
```

Moves passed through `chessTutor.move(...)` are always checked for chess legality. For Stage 0, use the programmatic API in **practice mode**; scripted lesson moves have their own guarded sequence.

### Configuration files

Real credentials live only in non-tracked files outside `public/`, loaded by `src/AppConfig.php` with this priority: environment variables → `config/config.php` → legacy `config/.env`. The recommended flow:

```bash
cp config/config.php.example config/config.php   # then edit real values
```

`config/config.php` is gitignored everywhere (local and production); it is the environment file that production servers are expected to provide. The Stage 0 `config/.env` ini file still works:

```bash
cp config/.env.example config/.env
# Edit config/.env with OPENROUTER_API_KEY and a compatible OPENROUTER_MODEL
```

No key means the board and lessons work normally; the **Ask the tutor** button returns a setup message. The endpoint `POST /api/tutor.php` makes server-side calls, so the key is not exposed to the browser. The current endpoint offers **general beginner coaching only**, not engine-verified tactical analysis, and is **local development only**: protect it with authentication, CSRF controls, rate limits, spending caps, logging without child data and stricter input verification before any internet deployment.

### Test checkpoints

1. Page renders a full chessboard; all sprites and styles load with no 404s.
2. e2→e4 works using both mouse drag and click/tap; Black can reply e7→e5.
3. e2→e5 is rejected; cannot move opponent's piece when it's not their turn.
4. Legal castling automatically moves the rook; en passant removes the captured pawn.
5. Pawn at a7 (using FEN above) opens promotion choice and updates to the selected piece.
6. Undo, reset, board flip, move history and PGN copy work.
7. Guided mode asks for e4, then automatically plays e5; choosing d4 returns a friendly prompt instead.
8. Demo mode advances through the scripted opening and disables user input.
9. Browser console `chessTutor.move('e4')` changes the position and records a move.
10. With no OpenRouter config, 'Ask the tutor' returns a setup message without error or leaked credentials.

Run `npm test` after installing libraries. PHP lint: `npm run check` (needs PHP CLI in PATH). Mobile browser testing is manual in Stage 0; plan for Playwright smoke tests in Milestone 1.

## What this starter does NOT include yet

Stockfish evaluation, correct classification of good/bad moves, generic chess lessons loaded from database, persistence, accounts, parent dashboard, 3D board, accessibility testing, and production security controls. In particular, **AI general advice must not be presented as calculated analysis** until engine facts and output validation exist. See `docs/PROJECT_PLAN.md` for detailed architecture, course design and step-by-step milestones.

## Architecture and important files

```
.htaccess                         # routes every request into public/; blocks dotfiles and private dirs
apache.conf                       # Apache vhost for the Docker setup (DocumentRoot = repo root)
docker-compose.yml                # Apache + PHP 8.2, MySQL 8, phpMyAdmin on the traefik network
Dockerfile                        # php:8.2-apache + pdo_mysql + mod_rewrite
config/config.php.example         # environment file template (tracked sample)
config/config.php                 # real environment file (gitignored, created per environment)
config/.env.example               # legacy API configuration template; real .env ignored
public/.htaccess                  # disables directory listings
public/index.php                  # HTML shell
public/vendor/                    # committed browser libraries (served locally, deployable as-is)
public/css/app.css                # all styling
public/js/GameSession.js          # chess.js state, legal move gateway
public/js/BoardView.js            # cm-chessboard display and input adapter
public/js/LessonEngine.js        # deterministic guided lesson script
public/js/app.js                  # tiny UI controller, mode logic, API integration
public/api/tutor.php              # optional OpenRouter endpoint
src/AppConfig.php                 # environment/config loader (env vars > config.php > legacy .env)
src/OpenRouterClient.php          # backend API adapter
scripts/copy-vendor.mjs           # copies JS libraries into public/vendor
scripts/                          # no frontend build required
tests/                            # Node built-in test runner
docs/PROJECT_PLAN.md              # implementation roadmap
```

Keep all secrets and future PHP services **outside `public/`**. Own JavaScript code is ES modules; no framework and no bundler. When saving to MySQL later, expose only deliberate REST routes via PHP.

## Library licences

- `cm-chessboard`: MIT, https://github.com/shaack/cm-chessboard
- `chess.js`: BSD-2-Clause, https://github.com/jhlywa/chess.js
- Optional future Stockfish/Stockfish.js: GPLv3 obligations; review before distributing engine binaries or building the commercial product.

The vendor-copy script retains both permissive-library LICENSE files.

## Verification transparency

This artifact was syntax-checked with Node and PHP; the lesson-only tests were executed successfully. A full `npm install`, real rules tests, and interactive browser run **could not be executed in the artifact-building environment** because outbound package-network access was unavailable. Run the above smoke checklist in WSL/Chrome before accepting Stage 0. Any library-version incompatibility should be fixed in this stage before moving forward.
