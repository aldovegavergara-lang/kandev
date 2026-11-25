import type { BootPayload } from "@/src/boot-payload";

import { readLocaleCookie } from "./cookie";
import { DEFAULT_LOCALE, isSupportedLocale, normalizeLocale, type SupportedLocale } from "./index";

/**
 * True when the pseudo QA locale should be offered in the switcher.
 *
 * The e2e harness serves a PRODUCTION frontend bundle, so `import.meta.env.PROD`
 * is true there and cannot tell an automated-test run from a real release. The
 * Go shell sets `runtime.nonProduction` for dev and e2e profiles, which is the
 * signal that actually answers the question.
 */
export function pseudoLocaleAvailable(payload: BootPayload | undefined): boolean {
  if (payload?.runtime?.nonProduction) return true;
  return !import.meta.env.PROD;
}

/**
 * Resolve the locale to activate before first paint. Precedence:
 *   negotiated server locale → explicit supported preference → server default.
 * A server running during a frontend upgrade can fall back to English for a newer locale.
 * Any unknown value coerces to `en`.
 */
export function resolveInitialLocale(
  payload: BootPayload | undefined,
  doc: Document | undefined = typeof document === "undefined" ? undefined : document,
): SupportedLocale {
  const fromPayload = payload?.runtime?.locale;
  if (fromPayload && fromPayload !== DEFAULT_LOCALE) {
    return normalizeLocale(fromPayload);
  }
  const fromCookie = doc ? readLocaleCookie(doc) : undefined;
  if (fromCookie && isSupportedLocale(fromCookie)) {
    return normalizeLocale(fromCookie);
  }
  return DEFAULT_LOCALE;
}
