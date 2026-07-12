/**
 * Meta Pixel — lazy-loaded, event-driven tracking.
 *
 * Design choice: the app itself has no cookie-consent banner (unlike the
 * landing page), and we don't want passive PageView tracking on every
 * screen load. Instead, the Pixel base code is injected only at the moment
 * a real conversion happens (e.g. successful registration), and only the
 * one meaningful event is sent — never PageView.
 */

const META_PIXEL_ID = "982039981469218";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let pixelLoaded = false;

function ensurePixelLoaded(): void {
  if (pixelLoaded || typeof window === "undefined") return;
  if (window.fbq) {
    pixelLoaded = true;
    return;
  }

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    let n: any, t: any, s: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq!("init", META_PIXEL_ID);
  pixelLoaded = true;
}

/**
 * Fire the CompleteRegistration conversion event.
 * Call this once, right after supabase.auth.signUp() succeeds.
 */
export function trackRegistrationComplete(): void {
  try {
    ensurePixelLoaded();
    window.fbq?.("track", "CompleteRegistration");
  } catch {
    // Tracking must never break the actual signup flow.
  }
}
