import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import fr from '../locales/fr'

type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'fr'>({
    legacy: false, // For Composition API
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        fr,
    },
})

export default i18n
