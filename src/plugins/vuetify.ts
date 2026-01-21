// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VFileUpload } from 'vuetify/labs/VFileUpload'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import i18n from './i18n'

export default createVuetify({
  components: {
    ...components,
    VFileUpload,
  },
  directives,
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: 'dark', // Setting dark theme as per generic "premium" guidelines
  },
})
