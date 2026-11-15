// Builds the app's web folder (publishing/www) from the game in the folder above:
//  1. copies the game files,
//  2. downloads the two typefaces from Google Fonts into www/fonts and points the page at them,
//     so the app never needs a connection (skip with --no-fonts),
//  3. adds js/native.js (the App Store purchase bridge) before the game starts,
//  (the service worker is left out: js/app.js does not register it inside the app)
// Run it with `node prepare.mjs` from this folder (the npm scripts do it for you).
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), www = join(here, 'www');
const noFonts = process.argv.includes('--no-fonts');
rmSync(www, { recursive: true, force: true }); mkdirSync(www);
for (const f of ['index.html', 'css', 'js', 'icon-180.png', 'icon-512.png', 'icon.svg', 'privacy.html']) cpSync(join(root, f), join(www, f), { recursive: true });
cpSync(join(here, 'native', 'native.js'), join(www, 'js', 'native.js'));

let html = readFileSync(join(www, 'index.html'), 'utf8');
const GOOGLE = /<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g;
const cssUrl = (html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/) || [])[1];

if (!noFonts && cssUrl) {
  // a current browser's user agent, so Google answers with woff2 files
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  let css = await (await fetch(cssUrl.replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();
  mkdirSync(join(www, 'fonts'));
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
  let n = 0;
  for (const u of urls) {
    const name = `f${n++}.woff2`;
    writeFileSync(join(www, 'fonts', name), Buffer.from(await (await fetch(u)).arrayBuffer()));
    css = css.split(u).join(`../fonts/${name}`);
  }
  writeFileSync(join(www, 'css', 'fonts.css'), `/* Cinzel and IM Fell English, SIL Open Font License 1.1 */\n${css}`);
  html = html.replace(GOOGLE, '').replace('<link rel="stylesheet" href="css/style.css">', '<link rel="stylesheet" href="css/fonts.css">\n<link rel="stylesheet" href="css/style.css">');
  console.log(`fonts: ${urls.length} files bundled`);
} else if (noFonts) console.log('fonts: skipped (--no-fonts); the app will need a connection on first launch');

html = html.replace('<script src="js/app.js"></script>', '<script src="js/native.js"></script>\n<script src="js/app.js"></script>');
writeFileSync(join(www, 'index.html'), html);
if (!existsSync(join(www, 'js', 'native.js')) || !html.includes('js/native.js')) throw new Error('native.js was not added');
console.log('www ready');
