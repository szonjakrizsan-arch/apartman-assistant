/**
 * Meta Pixel — event tracking.
 *
 * The Pixel base code (fbq init) is loaded statically in index.html's
 * <head>, matching Meta's expected installation pattern so that Meta
 * Pixel Helper and the Test Events tool can detect it correctly.
 * It only calls `init` there — no PageView is tracked automatically.
 *
 * This file only fires the one meaningful conversion event: a
 * successful registration. No passive/automatic tracking happens.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/**
 * Fire the CompleteRegistration conversion event.
 * Call this once, right after supabase.auth.signUp() succeeds.
 */
export function trackRegistrationComplete(): void {
  try {
    window.fbq?.("track", "CompleteRegistration");
  } catch {
    // Tracking must never break the actual signup flow.
  }
}
