# Free to start: the in-app purchases

The website is never locked. The App Store build is free to start: Normandy, the Royal Domain and
Flanders on the gentle setting, with the whole map of France. Four non-consumable purchases:

- **The full game** ($6.99): every house, every difficulty, the Chronicler's challenges and five save slots.
- **Great Britain & Ireland, 1066** ($3.99) and **The Empire, 1002** ($3.99): each expansion map.
- **The complete edition** ($11.99): all three, offered on every unlock screen while two or more are unbought.

Trophies, points and ranks are earned in the free game too, so a free player is already invested when the unlock is offered.

Preview the locked version in a browser by adding `?store=1` to the address.

## How it is wired

`publishing/native/native.js` is added to the app build only, by `prepare.mjs`. It sets `window.COTF_STORE`,
registers the four products with `cordova-plugin-purchase`, fills `window.COTF_PRICES` with the App Store's
local prices (the unlock screens show them), and supplies `window.COTF_BUY(what)` and `window.COTF_RESTORE()`.
When a product is owned it calls `cotfUnlocked()` or `cotfMapUnlocked(id)`, which remember it on the device.
"Restore a purchase" (on the unlock screens and in Settings) is required by Apple for non-consumables, and is there.

## Store page wording

Say "Free to start" in the subtitle or first line, and list what the unlock adds. Players who feel
surprised by a paywall leave one-star reviews; players who were told up front mostly don't.

