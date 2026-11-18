# Receiving bug reports

When a player taps **Settings → Report a bug** (or **Report it** on the bar that appears after an error), the game builds a report and sends it to the address in `BUG_ENDPOINT` at the top of `js/bugs.js`.

A report contains: the version, map, house, turn and date; the device (browser string, screen size, whether it runs from the home screen); the settings; the player's last 80 moves; up to 20 error messages with their stack traces; the last 40 lines of the chronicle; the player's note; and, if they leave the box ticked, the whole game, gzipped.

Until `BUG_ENDPOINT` is set, the report goes to the share sheet (Mail, Messages, Files) as a `.json` file, or downloads.

## The receiver

A free Google Apps Script receives the reports, logs them in a sheet, emails alerts and a weekly digest with every report attached. The script and its setup are in `publishing/bug-collector/`.

## Replaying a player's game

Open the game in a desktop browser, open the developer console, and run `bugLoad(<the report's JSON text>)`. The saved game in the report loads as if it were yours. Or send the report file to Claude to investigate.

## App Store privacy label

Because reports are only sent when the player asks, declare **Diagnostics → Crash data and Other diagnostic data**, *not linked to the user's identity*, *not used for tracking*, purpose *App functionality*.
