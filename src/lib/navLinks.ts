import { TranslationKey } from '@/types/game'

export interface NavLink {
  href: string
  labelKey: TranslationKey
}

// Single source of truth for the site's primary navigation.
// Consumed by both the header dropdown (NavigationMenu) and the Footer.
export const navLinks: NavLink[] = [
  { href: '/hvordan-spille', labelKey: 'how_to_play' },
  { href: '/om', labelKey: 'about' },
  { href: '/spoersmaal-og-svar', labelKey: 'faq' },
  { href: '/fjord-fakta', labelKey: 'fjord_facts' },
  { href: '/fjorder', labelKey: 'fjorder_index_h1' },
  { href: '/hurtigruten', labelKey: 'hurtigruten' },
  { href: '/tidligere', labelKey: 'past_fjordles' },
  { href: '/stats', labelKey: 'statistics' },
  { href: '/personvern', labelKey: 'privacy' },
]
