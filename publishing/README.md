# Packaging for the App Store

The iPhone and iPad app is the web game inside a native shell (Capacitor 8). These files are ready for a build on a Mac; they have not yet been built, because that needs Xcode.

## What you need

- A Mac with Xcode (current version) and Node.js 20 or later.
- An Apple Developer Program membership. Enrol as an organization (Loveseyland Ltd.) if the company is the seller; Apple asks for a D-U-N-S number for that. Enrolling as an individual is faster but shows your own name as the seller.
- Enrol in the App Store Small Business Program once the account exists: Apple then keeps 15% of sales instead of 30%.

## Build

From this folder:

1. `npm install`
2. `npx cap add ios` (first time only)
3. `npm run ios`. This runs `prepare.mjs`, which copies the game into `www`, downloads the two typefaces into the app so it never needs a connection, and adds `js/native.js`, the App Store purchase bridge. Then Xcode opens.
4. In Xcode: set the signing team; set the bundle identifier to `com.loveseyland.anointed` (it must match `capacitor.config.json` and the product IDs below); add the app icon from `icon-1024.png` (1024 by 1024, square corners, no transparency); allow all four orientations on iPad and portrait plus landscape on iPhone; turn on the In-App Purchase capability.
5. Run on a real iPhone and iPad.

After any change to the game, run `npm run sync` and build again.

## Check on the device before TestFlight

- Saves survive force-quitting the app and restarting the phone.
- Settings, Back up everything: the share sheet opens and "Save to Files" works; Restore brings everything back.
- Delete and reinstall the app, restore from the backup file: campaigns, trophies and purchases return.
- Sound starts after the first tap.
- Nothing hides under the notch, the Dynamic Island or the home bar.
- With the phone in airplane mode from first launch, the typefaces still show.

## In-app purchases

The app is free to start (see `IAP.md` for the model and the reasoning). Create these four **non-consumable** products in App Store Connect:

| Product ID | What it unlocks | US price |
|---|---|---|
| `com.loveseyland.anointed.full` | Every house and difficulty in France, the Chronicler's challenges, five save slots | $6.99 |
| `com.loveseyland.anointed.britain` | Great Britain & Ireland, 1066 | $3.99 |
| `com.loveseyland.anointed.empire` | The Empire, 1002 | $3.99 |
| `com.loveseyland.anointed.complete` | All of the above | $11.99 |

Test them with a Sandbox account in TestFlight, including "Restore a purchase" on a second device.

## App Store Connect

- **Privacy policy URL:** https://jdc001.github.io/Anointed/privacy.html (also the support page).
- **Privacy label:** declare **Diagnostics: Crash Data and Other Diagnostic Data**, not linked to the user, not used for tracking, purpose App Functionality. Nothing else is collected. (Bug reports are only sent when the player taps Report a bug, but declaring them is the safe reading of Apple's rules.)
- **Age rating:** answer "infrequent/mild cartoon or fantasy violence". Expect 9+.
- **Screenshots:** iPhone 6.9-inch and iPad 13-inch at minimum. The end-of-game replay map is the strongest image.
- **Name and subtitle:** see the name check notes before choosing the store title.

## Android

`npm install @capacitor/android`, `npx cap add android`, `npm run sync`, then build in Android Studio. The purchase bridge in `native/native.js` would need the Google Play platform added.
