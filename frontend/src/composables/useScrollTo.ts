import { getLenis } from './useLenis'

/**
 * Smooth-scrolls to a section via the app's shared Lenis instance (falls
 * back to native scrollIntoView if Lenis hasn't mounted yet, e.g. during
 * SSR-less early hydration).
 */
export function scrollToSection(target: string) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { offset: -20 })
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  }
}
