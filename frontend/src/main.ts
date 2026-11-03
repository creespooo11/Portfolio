import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// The page is one continuous 3D journey that starts with the intro's
// build-in: a reload always starts from the top instead of dropping the
// visitor mid-scene. Deep links to a section (#about...) still work.
if (!window.location.hash) {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
}

createApp(App).mount('#app')
