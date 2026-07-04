import { describe, it, expect } from 'vitest'
import {
  isBotUserAgent,
  isNorwegianLocale,
  shouldAutoSwitchToEnglish,
} from '../localeDetection'

describe('isNorwegianLocale', () => {
  it('treats Bokmål, Nynorsk, and generic Norwegian as Norwegian', () => {
    expect(isNorwegianLocale(['nb-NO'])).toBe(true)
    expect(isNorwegianLocale(['nn'])).toBe(true)
    expect(isNorwegianLocale(['no'])).toBe(true)
    expect(isNorwegianLocale(['NB-no'])).toBe(true)
  })

  it('is Norwegian if any entry in the list is Norwegian', () => {
    expect(isNorwegianLocale(['en-US', 'nb-NO'])).toBe(true)
  })

  it('is not Norwegian for other locales', () => {
    expect(isNorwegianLocale(['en-US'])).toBe(false)
    expect(isNorwegianLocale(['de', 'fr'])).toBe(false)
    expect(isNorwegianLocale([])).toBe(false)
  })

  it('does not match locales that merely start with the same letters', () => {
    expect(isNorwegianLocale(['nob'])).toBe(false)
    expect(isNorwegianLocale(['non-sense'])).toBe(false)
  })
})

describe('isBotUserAgent', () => {
  it('flags search and AI crawlers', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true)
    expect(isBotUserAgent('GPTBot/1.0')).toBe(true)
    expect(isBotUserAgent('ClaudeBot/1.0')).toBe(true)
    expect(isBotUserAgent('anthropic-ai')).toBe(true)
    expect(isBotUserAgent('PerplexityBot')).toBe(true)
  })

  it('does not flag ordinary browsers', () => {
    expect(isBotUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')).toBe(false)
    expect(isBotUserAgent('')).toBe(false)
    expect(isBotUserAgent(null)).toBe(false)
    expect(isBotUserAgent(undefined)).toBe(false)
  })
})

describe('shouldAutoSwitchToEnglish', () => {
  const human = 'Mozilla/5.0 (iPhone) Safari'

  it('switches a first-time non-Norwegian human', () => {
    expect(shouldAutoSwitchToEnglish({
      hasCookie: false,
      userAgent: human,
      locales: ['en-US'],
    })).toBe(true)
  })

  it('leaves Norwegian visitors on the default', () => {
    expect(shouldAutoSwitchToEnglish({
      hasCookie: false,
      userAgent: human,
      locales: ['nb-NO'],
    })).toBe(false)
  })

  it('never overrides an existing preference', () => {
    expect(shouldAutoSwitchToEnglish({
      hasCookie: true,
      userAgent: human,
      locales: ['en-US'],
    })).toBe(false)
  })

  it('never switches a crawler, protecting Norwegian SEO', () => {
    expect(shouldAutoSwitchToEnglish({
      hasCookie: false,
      userAgent: 'Googlebot/2.1',
      locales: ['en-US'],
    })).toBe(false)
  })

  it('does not switch when no locale is known', () => {
    expect(shouldAutoSwitchToEnglish({
      hasCookie: false,
      userAgent: human,
      locales: [],
    })).toBe(false)
  })
})
