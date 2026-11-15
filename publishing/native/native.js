'use strict';
// ================= THE APP STORE BRIDGE =================
// Only in the iPhone and iPad app (prepare.mjs adds this file). It switches the free-to-start lock on and
// connects the game's purchase hooks to the App Store through cordova-plugin-purchase.
//
// Products, all non-consumable, created in App Store Connect with these IDs:
//   com.loveseyland.anointed.full      the full game: every house and difficulty in France, challenges, five save slots
//   com.loveseyland.anointed.britain   Great Britain & Ireland, 1066
//   com.loveseyland.anointed.empire    The Empire, 1002
//   com.loveseyland.anointed.complete  everything above, at a saving
// The game shows the App Store's own local prices once they arrive (window.COTF_PRICES).

window.COTF_STORE = true;
(function () {
  const APP = 'com.loveseyland.anointed';
  const P = { full: APP + '.full', britain: APP + '.britain', empire: APP + '.empire', complete: APP + '.complete' };
  const unlock = what => {
    if (what === 'full') cotfUnlocked();
    else if (what === 'complete') { cotfUnlocked(); cotfMapUnlocked('britain'); cotfMapUnlocked('empire'); }
    else cotfMapUnlocked(what);
  };
  const whatOf = id => Object.keys(P).find(k => P[k] === id);
  window.COTF_PRICES = window.COTF_PRICES || {};

  document.addEventListener('deviceready', () => {
    if (!window.CdvPurchase) return;
    const { store, ProductType, Platform } = CdvPurchase;
    store.register(Object.values(P).map(id => ({ id, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE })));
    store.when()
      .approved(t => t.verify())
      .verified(r => r.finish())
      .productUpdated(p => {
        const what = whatOf(p.id); if (!what) return;
        const o = p.getOffer && p.getOffer(), price = o && o.pricingPhases && o.pricingPhases[0] && o.pricingPhases[0].price;
        if (price) window.COTF_PRICES[what] = price;
        if (p.owned) unlock(what);
      });
    store.error(e => { if (e && e.code !== CdvPurchase.ErrorCode.PAYMENT_CANCELLED && typeof toast === 'function') toast('The App Store could not complete that. Try again in a moment.'); });
    store.initialize([Platform.APPLE_APPSTORE]);
    window.COTF_BUY = what => { const p = store.get(P[what] || P.full), o = p && p.getOffer(); if (o) o.order(); else if (typeof toast === 'function') toast('The App Store is not reachable just now'); };
    window.COTF_RESTORE = () => store.restorePurchases().then(() => typeof toast === 'function' && toast('Purchases restored', 'crown'));
  }, false);
})();
