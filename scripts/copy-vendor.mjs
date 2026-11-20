import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Keep Node-only dependencies out of the published document root.
const source = 'node_modules';
const target = 'public/vendor';
await rm(target, { recursive: true, force: true });
await mkdir(join(target, 'chess.js'), { recursive: true });
await mkdir(join(target, 'cm-chessboard'), { recursive: true });
const chessEntrypoint = join(source, 'chess.js', 'dist', 'esm', 'chess.js');
await stat(chessEntrypoint);
await cp(chessEntrypoint, join(target, 'chess.js', 'chess.js'));
await cp(join(source, 'chess.js', 'LICENSE'), join(target, 'chess.js', 'LICENSE'));
await cp(join(source, 'cm-chessboard', 'src'), join(target, 'cm-chessboard', 'src'), { recursive: true });
await cp(join(source, 'cm-chessboard', 'assets'), join(target, 'cm-chessboard', 'assets'), { recursive: true });
await cp(join(source, 'cm-chessboard', 'LICENSE'), join(target, 'cm-chessboard', 'LICENSE'));
console.log('Browser libraries copied into public/vendor/.');
