'use strict';
// ================= KEEPING SAVES SAFE =================
// Everything the game remembers (campaigns, slots, trophies, rank, past games, settings, purchases) lives in
// local storage. Two things keep it from being lost:
//  1. In the App Store build, every change is copied, a moment later, into one file in the app's Library folder,
//     through Capacitor's Filesystem plugin. iOS never clears that folder on its own, and an iCloud or computer
//     backup of the device includes it. If local storage ever comes up empty while the file exists, the game
//     puts everything back and reloads.
//  2. Anywhere, the player can write a backup file of everything (Settings, then Back up everything) and send it
//     to Files, iCloud Drive or email, and restore from it on this device or a new one.
// On the website, the game also asks the browser to keep its storage ("persistent storage").

const BACKUP_FILE = 'anointed-backup.json';
const BACKUP_SKIP = /^cotf-bug-pending$/;
const nativeFS = () => { try { return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem || null; } catch (e) { return null; } };

function backupData() {
  const data = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!BACKUP_SKIP.test(k)) data[k] = localStorage.getItem(k); } } catch (e) { }
  return data;
}
const backupJSON = () => JSON.stringify({ app: 'anointed', kind: 'backup', v: typeof APP_VERSION === 'string' ? APP_VERSION : '', when: Date.now(), data: backupData() });

// ---- the native copy: written a little after each change, so a burst of saves costs one write ----
let MIRROR_T = null;
function mirrorSoon() {
  if (!nativeFS() || MIRROR_T) return;
  MIRROR_T = setTimeout(() => { MIRROR_T = null; mirrorNow(); }, 1500);
}
async function mirrorNow() {
  const FS = nativeFS(); if (!FS) return;
  try { await FS.writeFile({ path: BACKUP_FILE, data: backupJSON(), directory: 'LIBRARY', encoding: 'utf8' }); } catch (e) { }
}
(function watchStorage() {
  if (!nativeFS()) return;
  try {
    const S = Storage.prototype, set = S.setItem, rem = S.removeItem, clr = S.clear;
    S.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage && !BACKUP_SKIP.test(k)) mirrorSoon(); };
    S.removeItem = function (k) { rem.call(this, k); if (this === localStorage) mirrorSoon(); };
    S.clear = function () { clr.call(this); if (this === localStorage) mirrorSoon(); };
    // iOS may suspend the app at any moment after it goes to the background: write straight away
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(MIRROR_T); MIRROR_T = null; mirrorNow(); } });
  } catch (e) { }
})();

// ---- putting it back: local storage empty, the native copy not ----
(async function restoreIfLost() {
  const FS = nativeFS(); if (!FS) return;
  let has = 0; try { for (let i = 0; i < localStorage.length; i++) if (!BACKUP_SKIP.test(localStorage.key(i))) has++; } catch (e) { }
  if (has > 2) { mirrorSoon(); return; }
  try {
    const r = await FS.readFile({ path: BACKUP_FILE, directory: 'LIBRARY', encoding: 'utf8' });
    const B = JSON.parse(r.data);
    if (!B || B.app !== 'anointed' || !B.data || Object.keys(B.data).length <= has) return;
    for (const k in B.data) localStorage.setItem(k, B.data[k]);
    location.reload();
  } catch (e) { /* no copy yet: a first launch */ }
})();

// ---- the website: ask the browser not to clear the game's storage when space runs short ----
try { if (!nativeFS() && navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }); } catch (e) { }

// ---- the backup file the player keeps ----
async function exportBackup() {
  const json = backupJSON(), d = new Date(), name = `anointed-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Anointed backup' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Backup downloaded', 'chest'); }
  catch (e) { toast('This browser cannot save files'); }
}
function importBackup(input) {
  const f = input.files && input.files[0]; input.value = ''; if (!f) return;
  const r = new FileReader();
  r.onerror = () => toast('Could not read that file');
  r.onload = () => {
    let B = null; try { B = JSON.parse(r.result); } catch (e) { }
    if (!B || B.app !== 'anointed' || B.kind !== 'backup' || !B.data) { toast('That is not an Anointed backup. A single save file goes in Saved games.'); return; }
    const when = new Date(B.when).toLocaleDateString();
    showModal(`<div class="rep"><h2>Restore the backup?</h2><p class="ctr">Made ${esc(when)}${B.v ? `, version ${esc(B.v)}` : ''}.</p>
      <p class="ctr">Everything on this device is replaced by the backup: campaigns, save slots, trophies, rank, past games, settings and purchases. This cannot be undone.</p>
      <div class="grid2"><button class="btn gold" id="dorestore">Restore</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div></div>`, '', { closable: true });
    document.getElementById('dorestore').onclick = () => {
      try { localStorage.clear(); for (const k in B.data) localStorage.setItem(k, B.data[k]); } catch (e) { toast('There is not enough room on this device to restore it'); return; }
      mirrorNow().finally(() => location.reload());
    };
  };
  r.readAsText(f);
}
