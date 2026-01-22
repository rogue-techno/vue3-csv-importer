<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CsvImporter from './components/CsvImporter.vue'
import AppDialog from './components/AppDialog.vue'

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

// Dialog examples
const defaultDialog = ref(false)
const customDialog = ref(false)
const confirmDialog = ref(false)

const handleDefaultSubmit = () => {
  alert('Default dialog submitted!')
  defaultDialog.value = false
}

const handleConfirmDelete = () => {
  alert('Item deleted!')
  confirmDialog.value = false
}

const handleAction1 = () => {
  alert('Action 1!')
}

const handleAction2 = () => {
  alert('Action 2!')
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Vue 3 CSV Importer</v-app-bar-title>
      <v-spacer />
      <v-btn-toggle v-model="locale" mandatory divided density="compact" class="mr-4">
        <v-btn value="en" size="small">EN</v-btn>
        <v-btn value="fr" size="small">FR</v-btn>
      </v-btn-toggle>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Dialog Examples -->
        <v-card class="mb-6 pa-4">
          <v-card-title>AppDialog Examples</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="auto">
                <v-btn color="primary" @click="defaultDialog = true"> Default Buttons </v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn color="secondary" @click="customDialog = true"> Custom Buttons </v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn color="error" @click="confirmDialog = true"> Delete Confirmation </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Default Dialog -->
        <AppDialog
          v-model="defaultDialog"
          title="Default Buttons Dialog"
          max-width="500"
          @submit="handleDefaultSubmit"
          @cancel="defaultDialog = false"
        >
          <p>This dialog uses the default Cancel and Submit buttons.</p>
          <p class="text-medium-emphasis mt-2">
            The buttons automatically translate when you switch languages.
          </p>
        </AppDialog>

        <!-- Custom Buttons Dialog -->
        <AppDialog v-model="customDialog" title="Custom Buttons Dialog" max-width="500">
          <p>This dialog has completely custom action buttons.</p>
          <p class="text-medium-emphasis mt-2">
            The default Cancel/Submit buttons are replaced by the actions slot.
          </p>

          <template #actions>
            <v-btn variant="text" @click="customDialog = false">Close</v-btn>
            <v-btn color="warning" variant="tonal" @click="handleAction1"> Action 1 </v-btn>
            <v-btn color="success" variant="flat" @click="handleAction2"> Action 2 </v-btn>
          </template>
        </AppDialog>

        <!-- Delete Confirmation Dialog -->
        <AppDialog
          v-model="confirmDialog"
          title="Confirm Delete"
          max-width="400"
          submit-label="Delete"
          @submit="handleConfirmDelete"
          @cancel="confirmDialog = false"
        >
          <v-alert type="warning" variant="tonal" class="mb-0">
            Are you sure you want to delete this item? This action cannot be undone.
          </v-alert>
        </AppDialog>

        <!-- CSV Importer -->
        <CsvImporter :fields="importFields" @import="onImport" />
      </v-container>
    </v-main>
  </v-app>
</template>
