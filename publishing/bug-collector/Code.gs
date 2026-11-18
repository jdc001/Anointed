// Anointed: bug report collector (Google Apps Script)
//
// Receives the reports the game sends when a player taps "Report a bug", and:
//  1. saves each report whole, as a .json file, in a Google Drive folder;
//  2. adds a line for it to a Google Sheet (one row per report: when, version, map, house, turn, note, errors, device);
//  3. emails a short alert for each report (optional, see ALERT_EACH);
//  4. once a week, emails a digest: a table of the week's reports, plus one attached file holding all of them
//     (anointed-bugs-YYYY-MM-DD.json). That file is what goes back to Claude for fixing;
//  5. deletes reports older than 12 months, as the privacy policy promises.
//
// Setup is in publishing/bug-collector/README.md.

const EMAILS = 'you@example.com';                // who gets the alerts and the weekly digest; separate several with commas
const ALERT_EACH = true;                          // false: no email per report, only the weekly digest
const FOLDER_NAME = 'Anointed bug reports';
const SHEET_NAME = 'Anointed bug reports';
const KEEP_DAYS = 365;

// ---------- receiving ----------
function doPost(e) {
  const body = e && e.postData ? e.postData.contents : '';
  if (!body || body.length > 5e6) return out('too big or empty');
  let r = {}; try { r = JSON.parse(body); } catch (x) { return out('not json'); }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const file = folder_().createFile(fileName_(r), body, 'application/json');
    const d = r.device || {}, errs = (r.errors || []).map(x => x.msg || String(x)).join(' | ');
    sheet_().appendRow([new Date(), r.v || '', r.map || '', r.house || '', r.turn ?? '', r.date || '', (r.note || '').slice(0, 500),
      errs.slice(0, 500), `${d.w}x${d.h} ${d.layout || ''}${d.standalone ? ' home-screen' : ''}`, (d.ua || '').slice(0, 200), r.save ? 'yes' : 'no', file.getUrl(), file.getId()]);
    if (ALERT_EACH) MailApp.sendEmail(EMAILS, `Anointed bug: v${r.v} ${r.map || ''} ${(r.note || '').slice(0, 60)}`,
      `${r.note || '(no note)'}\n\nVersion ${r.v} · ${r.map} · ${r.house} · turn ${r.turn} (${r.date})\n` +
      `Device: ${d.ua}\nScreen: ${d.w}×${d.h} · ${d.layout} · home screen: ${d.standalone}\n\n` +
      `Errors:\n${(r.errors || []).map(x => '- ' + (x.msg || x)).join('\n') || 'none'}\n\n` +
      `Last moves:\n${(r.crumbs || []).slice(-15).join('\n')}\n\nFull report: ${file.getUrl()}`);
  } finally { lock.releaseLock(); }
  return out('ok');
}
function doGet() { return out('Anointed bug collector is running.'); }

// ---------- the weekly digest ----------
function weeklyDigest() {
  const since = new Date(Date.now() - 7 * 864e5), rows = sheet_().getDataRange().getValues().slice(1).filter(x => x[0] >= since);
  const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (!rows.length) { MailApp.sendEmail(EMAILS, `Anointed bugs: none this week (${day})`, 'No bug reports came in this week.'); prune_(); return; }
  const reports = rows.map(x => { try { return JSON.parse(DriveApp.getFileById(x[12]).getBlob().getDataAsString()); } catch (e) { return null; } }).filter(Boolean);
  const bundle = Utilities.newBlob(JSON.stringify({ app: 'anointed', kind: 'bug-bundle', from: since.toISOString(), to: new Date().toISOString(), count: reports.length, reports }), 'application/json', `anointed-bugs-${day}.json`);
  const byVer = {}; rows.forEach(x => byVer[x[1]] = (byVer[x[1]] || 0) + 1);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const table = rows.map(x => `<tr><td>${esc(Utilities.formatDate(x[0], Session.getScriptTimeZone(), 'MMM d HH:mm'))}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[4])}</td><td>${esc(x[6])}</td><td>${esc(x[7]).slice(0, 160)}</td></tr>`).join('');
  MailApp.sendEmail({ to: EMAILS, subject: `Anointed bugs: ${rows.length} this week (${day})`, attachments: [bundle],
    htmlBody: `<p>${rows.length} bug report${rows.length === 1 ? '' : 's'} this week. By version: ${Object.keys(byVer).map(v => `${esc(v)} (${byVer[v]})`).join(', ')}.</p>
      <p>The attached file holds every report in full, saved games included. Send it to Claude to investigate and fix.</p>
      <table border="1" cellpadding="4" style="border-collapse:collapse;font:13px sans-serif"><tr><th>When</th><th>Version</th><th>Map</th><th>House</th><th>Turn</th><th>Note</th><th>Errors</th></tr>${table}</table>` });
  prune_();
}

// ---------- run once, from the editor, to switch on the weekly digest (Mondays, 8 to 9 am) ----------
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('weeklyDigest').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  folder_(); sheet_();
  return 'Weekly digest scheduled. Sheet: ' + sheet_().getParent().getUrl();
}

// ---------- helpers ----------
function out(s) { return ContentService.createTextOutput(s); }
function fileName_(r) { return `bug ${r.v || '?'} ${r.map || ''} ${r.house || ''} T${r.turn ?? ''} ${new Date().toISOString()}.json`; }
function folder_() { const it = DriveApp.getFoldersByName(FOLDER_NAME); return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME); }
function sheet_() {
  const p = PropertiesService.getScriptProperties(); let id = p.getProperty('sheet'), ss = null;
  if (id) try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  if (!ss) { ss = SpreadsheetApp.create(SHEET_NAME); p.setProperty('sheet', ss.getId()); ss.getSheets()[0].appendRow(['Received', 'Version', 'Map', 'House', 'Turn', 'Game date', 'Note', 'Errors', 'Screen', 'Device', 'Save attached', 'Report file', 'File id']); ss.getSheets()[0].setFrozenRows(1); }
  return ss.getSheets()[0];
}
// reports older than KEEP_DAYS are deleted, file and row
function prune_() {
  const sh = sheet_(), v = sh.getDataRange().getValues(), cut = new Date(Date.now() - KEEP_DAYS * 864e5);
  for (let i = v.length - 1; i >= 1; i--) if (v[i][0] < cut) { try { DriveApp.getFileById(v[i][12]).setTrashed(true); } catch (e) { } sh.deleteRow(i + 1); }
}
