/**
 * Pure helpers for deciding whether a first-time visitor should be shown the
 * existing English UI instead of the Norwegian default.
 *
 * Kept free of browser globals so they can be unit tested.
 */

// User agents we must never auto-switch: doing so would render the English body
// under Norwegian metadata for JS-executing crawlers (Googlebot reports en-US),
// polluting the Norwegian-targeted index. Non-JS crawlers already see the
// server-rendered Norwegian; this guard covers the ones that do run JS.
const BOT_UA_PATTERN =
  /bot|crawl|spider|googlebot|bingbot|gptbot|oai-searchbot|chatgpt-user|claudebot|anthropic-ai|claude-user|perplexitybot|applebot/i

const NORWEGIAN_LOCALE_PATTERN = /^(nb|nn|no)\b/i

export function isBotUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent) {
    return false
  }
  return BOT_UA_PATTERN.test(userAgent)
}

export function isNorwegianLocale(locales: readonly string[]): boolean {
  return locales.some(locale => NORWEGIAN_LOCALE_PATTERN.test(locale))
}

interface AutoSwitchInput {
  hasCookie: boolean
  userAgent: string | undefined | null
  locales: readonly string[]
}

/**
 * True only for a first-time human visitor whose browser is not Norwegian.
 * Anyone with a stored preference, any bot, and any Norwegian locale are left
 * on the server default.
 */
export function shouldAutoSwitchToEnglish({ hasCookie, userAgent, locales }: AutoSwitchInput): boolean {
  if (hasCookie) {
    return false
  }
  if (isBotUserAgent(userAgent)) {
    return false
  }
  if (locales.length === 0) {
    return false
  }
  return !isNorwegianLocale(locales)
}
