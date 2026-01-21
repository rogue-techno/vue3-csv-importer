<script setup lang="ts">
import CsvImporter from './components/CsvImporter.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

const importFields = computed(() => [
  { key: 'name', label: t('fields.name'), required: true },
  { key: 'email', label: t('fields.email'), required: true },
  { key: 'age', label: t('fields.age'), required: false },
  { key: 'city', label: t('fields.city'), required: false },
  { key: 'phone', label: t('fields.phone'), required: false },
  { key: 'occupation', label: t('fields.occupation'), required: false },
  { key: 'company', label: t('fields.company'), required: false },
  { key: 'salary', label: t('fields.salary'), required: false },
  { key: 'country', label: t('fields.country'), required: false },
])

const onImport = (data: unknown[]) => {
  console.log('Imported Data:', data)
  alert(`Imported ${data.length} rows! Check console.`)
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Vue 3 CSV Importer</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn-toggle v-model="locale" mandatory divided density="compact" class="mr-4">
        <v-btn value="en" size="small">EN</v-btn>
        <v-btn value="fr" size="small">FR</v-btn>
      </v-btn-toggle>
    </v-app-bar>

    <v-main>
      <v-container>
        <CsvImporter :fields="importFields" @import="onImport" />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
