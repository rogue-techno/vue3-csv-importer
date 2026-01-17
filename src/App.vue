<template>
  <v-app>
    <v-main>
      <v-container>
        <CsvImporter :fields="importFields" @import="onImport" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import CsvImporter from './components/CsvImporter.vue'

const importFields = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email Address', required: true },
  { key: 'age', label: 'Age', required: false },
  { key: 'city', label: 'City', required: false },
]

const onImport = (data: unknown[]) => {
  console.log('Imported Data:', data)
  alert(`Imported ${data.length} rows! Check console.`)
}
</script>

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
