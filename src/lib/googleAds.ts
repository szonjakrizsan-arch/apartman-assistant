/**
 * Google Ads — conversion tracking.
 *
 * The gtag.js base code is loaded statically in index.html's <head>
 * (gtag('config', 'AW-18334546190')), matching Google's expected
 * installation pattern.
 *
 * This file only fires the one meaningful conversion event: a
 * successful registration. No passive/automatic tracking happens.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire the "Potenciális ügyfél űrlapjának beküldése" conversion event.
 * Call this once, right after supabase.auth.signUp() succeeds.
 */
export function trackRegistrationConversion(): void {
  try {
    window.gtag?.("event", "conversion", {
      send_to: "AW-18334546190/v2WjCMO4hdYcEI7yy6ZE",
      value: 1.0,
      currency: "HUF",
    });
  } catch {
    // Tracking must never break the actual signup flow.
  }
}
