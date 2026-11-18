# Bug report collector

The game's **Report a bug** button posts a report to a web address (`BUG_ENDPOINT` in `js/bugs.js`). This folder holds a free Google Apps Script that receives them. It:

- saves each report in full as a `.json` file in a Drive folder called *Anointed bug reports*;
- logs one row per report in a Google Sheet of the same name;
- emails a short alert for each report (switch off with `ALERT_EACH = false`);
- every Monday morning, emails a digest of the week with one attached file, `anointed-bugs-YYYY-MM-DD.json`, holding every report in full;
- deletes reports older than 12 months, as the privacy policy promises.

The weekly file is the one to send back to Claude: it has the version, device, the player's last 80 moves, any errors, and usually the saved game, so bugs can be replayed and fixed.

## Setup (about ten minutes)

1. Sign in to the Google account that should own the reports (a dedicated one, such as a new Gmail for the game, keeps them apart from personal mail).
2. Go to https://script.google.com, **New project**, and name it *Anointed bug reports*.
3. Replace everything in `Code.gs` with the contents of `Code.gs` from this folder.
4. Change `EMAILS` at the top to the addresses that should get the alerts and the digest, separated by commas.
5. In the function menu at the top, choose `setup` and press **Run**. Allow the permissions it asks for (Drive, Sheets, Gmail, triggers). This creates the folder and the sheet and schedules the Monday digest.
6. **Deploy → New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Press Deploy and copy the **Web app URL** (it ends in `/exec`).
7. Test it: open that URL in a browser. It should say *Anointed bug collector is running.*
8. Put the URL in the game: in `js/bugs.js`, line 8, `const BUG_ENDPOINT = 'https://script.google.com/macros/s/…/exec';`. Bump the version (see the main README), commit, and rebuild the app (`npm run sync` in `publishing`).
9. Send a test: in the game, Settings → Report a bug → Send. Within a minute there should be a row in the sheet, a file in the folder, and an alert email. To see the digest straight away, run `weeklyDigest` from the editor.

If the script is ever changed, use **Deploy → Manage deployments → Edit → New version**, so the `/exec` address stays the same.

## Limits

A free Google account can send about 100 emails a day from a script. If reports ever come faster than that, set `ALERT_EACH = false` and rely on the digest.

## Opening a report

In a desktop browser, open the game, open the developer console and run `bugLoad(<the text of one report>)`: the player's saved game loads as if it were yours. A weekly bundle holds many reports under `reports`; pick one out first.
