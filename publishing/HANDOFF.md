# Anointed: handoff for the App Store

Everything needed to take Anointed from the web version to a live App Store app. The game itself is finished (version 1.5.11); what is left is building it on a Mac, wiring up bug reports, preparing the store page, and submitting.

- **Code:** https://github.com/jdc001/Anointed (download: https://github.com/jdc001/Anointed/archive/refs/heads/main.zip)
- **Play the current version:** https://jdc001.github.io/Anointed/
- **Privacy policy and support page:** https://jdc001.github.io/Anointed/privacy.html

Files in this `publishing` folder:

| File | What it is |
|---|---|
| `README.md` | Build steps on the Mac, the in-app purchase table, App Store Connect notes |
| `IAP.md` | The free-to-start model and how purchases are wired into the game |
| `bug-collector/` | The Google Apps Script that collects bug reports, and its setup |
| `BUGS.md` | What a bug report contains and how to replay one |
| `screenshots/` | Draft App Store screenshots at the right sizes |
| `capacitor.config.json`, `package.json`, `prepare.mjs`, `native/native.js` | The app build: Capacitor 8, offline fonts, App Store purchase bridge |
| `icon-1024.png` | The App Store icon |

## 1. Accounts (start first: Apple's checks take days)

1. **Apple Developer Program** ($99 US a year). Enrol as an organization, Loveseyland Ltd., so the store shows the company as seller. Apple needs a D-U-N-S number for the company (free from Dun & Bradstreet, can take a week or two). Enrolling as an individual is faster but shows a personal name.
2. In App Store Connect, **Agreements, Tax and Banking**: accept the **Paid Apps** agreement and add the bank and tax details. In-app purchases do not work, even in testing, until this is done.
3. Join the **App Store Small Business Program** (developer.apple.com/app-store/small-business-program). Apple then takes 15% instead of 30%. It is not automatic.

## 2. Build the app on the Mac

Follow `publishing/README.md`. In short:

1. Install Xcode and Node.js 20+. Download or clone the repo.
2. In `publishing`: `npm install`, then `npx cap add ios`, then `npm run ios`. Xcode opens.
3. In Xcode: signing team; bundle ID `com.loveseyland.anointed`; app icon from `icon-1024.png`; all orientations on iPad, portrait and landscape on iPhone; add the **In-App Purchase** capability.
4. Run on a real iPhone and iPad and go through the checklist in `README.md` (saves survive a restart, Back up everything works, sound starts, nothing under the notch, fonts show in airplane mode).
5. In Xcode's Info settings add `ITSAppUsesNonExemptEncryption` = NO (the game uses no encryption beyond the system's), so every upload skips the export question.

## 3. Bug reports

Follow `publishing/bug-collector/README.md` (about ten minutes):

1. Create the Apps Script from `Code.gs`, set `EMAILS` to the addresses that should get reports, run `setup`, deploy as a web app, and copy the `/exec` URL.
2. Put the URL in `js/bugs.js` (`BUG_ENDPOINT`, line 8), bump the version, rebuild.
3. Send a test report from the game and check the sheet, the Drive folder and the alert email.

From then on: an email per report, and every Monday a digest with all the week's reports in one attached `.json` file. That file goes back to Jeff, who hands it to Claude to fix the bugs.

## 4. App Store Connect: the app record

1. **New app:** platform iOS, bundle ID `com.loveseyland.anointed`, SKU `anointed`, primary language English (Canada or US).
2. **Name:** check availability. "Anointed" alone may clash: a US trademark application exists for THE ANOINTED (faith-based mobile games, IMD Interactive) and church apps crowd the search. Use a distinctive store name, for example **Anointed: Medieval Kingdoms** or **Anointed: Crown & Conquest** (Jeff to choose). A trademark lawyer's clearance search is advised before marketing spend.
3. **Subtitle** (30 characters): e.g. *Free to start: win the crown*.
4. **Category:** Games, primary Strategy, secondary Board or Simulation.
5. **Age rating:** infrequent/mild cartoon or fantasy violence; no gambling, no user content, no web access. Expect 9+.
6. **Privacy policy URL** and **support URL:** https://jdc001.github.io/Anointed/privacy.html
7. **App privacy label:** Diagnostics → Crash Data and Other Diagnostic Data; not linked to the user; not used for tracking; purpose App Functionality. Nothing else.
8. **Price:** Free. Availability: all countries (English only for now).
9. **In-app purchases:** create the four non-consumables in the table in `README.md` (full game $6.99, each expansion $3.99, complete edition $11.99), each with a display name, description and review screenshot (the unlock screen: open the game with `?store=1` in a browser to see it).

## 5. Store page

- **Screenshots:** drafts are in `screenshots/` at the required sizes (iPad 13" 2752×2064, iPhone 6.9" 2868×1320, landscape). They were made in a desktop browser; final ones are best taken on the devices or the Xcode simulator (iPad Pro 13-inch and iPhone 16 Pro Max, Cmd+S saves a screenshot). Suggested order: the replay map, the map in play, the catapult, the battle screen, the title, the medal book. Up to 10 per device; 3 is the minimum.
- **App preview video** (optional, up to 30 seconds): the end-of-game replay map animating is the strongest clip.
- **Promotional text, description, keywords:** to write. Lead with "Free to start". Keywords to consider: medieval, strategy, kingdom, castle, siege, conquest, crown, 1066, empire, turn-based.

## 6. TestFlight, then review

1. In Xcode: Product → Archive → Distribute → App Store Connect. The build appears in TestFlight after processing.
2. Add Jeff (and anyone else) as internal testers. Test the purchases with a Sandbox account, including Restore a purchase on a second device.
3. Fix anything found, then **Submit for Review** with the release set to **manual**, so it goes live when Jeff says.
4. Review notes for Apple: "Free to start. Three houses on the gentle setting are free; one non-consumable unlocks the rest, and two map expansions are sold separately. Restore Purchases is on every unlock screen and in Settings."

## Decisions for Jeff before launch

- The store name and subtitle (see the trademark note above).
- The website at jdc001.github.io/Anointed plays the whole game free, which undercuts the app. Before launch, lock it like the app or turn it into a trailer page with an App Store link.
- The privacy policy names Loveseyland Ltd. and lovesey@loveseyland.com: confirm both, and that bug reports will be deleted within 12 months (the collector does this on its own).
