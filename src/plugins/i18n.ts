import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import fr from '../locales/fr'
import { en as vuetifyEn, fr as vuetifyFr } from 'vuetify/locale'

const i18n = createI18n({
    legacy: false, // For Composition API
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en: {
            ...en,
            $vuetify: { ...vuetifyEn },
        },
        fr: {
            ...fr,
            $vuetify: { ...vuetifyFr },
        },
    },
})

export default i18n
