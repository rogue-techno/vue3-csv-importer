import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import i18n from './plugins/i18n'

const app = createApp(App)

// Log all Vue errors to console
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// Log all Vue warnings to console (only in development)
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Vue Warning:', msg)
  console.warn('Component:', instance)
  console.warn('Trace:', trace)
}

app.use(i18n).use(vuetify).mount('#app')
