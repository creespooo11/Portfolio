import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registered once here; every component imports gsap/ScrollTrigger from
// this module instead of the raw 'gsap' package so the plugin is
// guaranteed to be registered before any component tries to use it,
// regardless of import order.
gsap.registerPlugin(ScrollTrigger)

// Mobile browsers resize the viewport as the address bar shows/hides; by
// default that triggers a full ScrollTrigger refresh mid-scroll (a visible
// hitch). Only real width changes need one.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
