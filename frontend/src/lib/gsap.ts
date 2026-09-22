import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

// Registered once here; every component imports gsap/ScrollTrigger/SplitText
// from this module instead of the raw 'gsap' package so the plugins are
// guaranteed to be registered before any component tries to use them,
// regardless of import order.
gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }
