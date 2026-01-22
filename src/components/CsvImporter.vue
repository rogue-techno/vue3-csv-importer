<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Papa from 'papaparse'
import AppDialog from './AppDialog.vue'

interface FieldDef {
  key: string
  label: string
  required?: boolean
}

const { fields } = defineProps<{
  fields: FieldDef[]
}>()

const dialogModel = defineModel<boolean>({ required: true })

const emit = defineEmits(['import'])

const { t } = useI18n()

const step = ref(1)
const files = ref<File[]>([])
const file = ref<File | null>(null)
const error = ref<{ key: string; params?: Record<string, string> } | null>(null)
const parsing = ref(false)

const delimiter = ref(',')
const delimiters = computed(() => [
  { title: t('importer.delimiters.comma'), value: ',' },
  { title: t('importer.delimiters.semicolon'), value: ';' },
  { title: t('importer.delimiters.tab'), value: '\t' },
  { title: t('importer.delimiters.pipe'), value: '|' },
])

const parsedData = ref<Record<string, unknown>[]>([])
const headers = ref<string[]>([])
const mappings = ref<Record<string, string | null>>({})

// Initialize mappings when fields change or headers are populated
watch(headers, (newHeaders) => {
  const newMappings: Record<string, string | null> = {}
  fields.forEach((field) => {
    const match = newHeaders.find(
      (h) =>
        h.toLowerCase() === field.key.toLowerCase() ||
        h.toLowerCase() === field.label.toLowerCase(),
    )
    newMappings[field.key] = match || null
  })
  mappings.value = newMappings
})

const unmappedRequiredFields = computed(() => {
  return fields.filter((f) => f.required && !mappings.value[f.key])
})

const isValid = computed(() => {
  return unmappedRequiredFields.value.length === 0
})

const getSampleValue = (fieldKey: string) => {
  const header = mappings.value[fieldKey]
  if (!header || !parsedData.value || parsedData.value.length === 0) return ''
  const firstRow = parsedData.value[0]
  if (!firstRow) return ''
  const val = firstRow[header]
  return val !== undefined && val !== null ? String(val) : ''
}

const previewHeaders = computed(() => {
  return fields.map((f) => ({
    title: f.label,
    key: f.key,
  }))
})

const previewData = computed(() => {
  return parsedData.value.map((row) => {
    const mappedRow: Record<string, unknown> = {}
    fields.forEach((f) => {
      const csvCol = mappings.value[f.key]
      if (csvCol) {
        mappedRow[f.key] = row[csvCol]
      }
    })
    return mappedRow
  })
})

const onFileSelected = (uploadedFiles: unknown) => {
  const selected = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles
  if (selected && selected instanceof File) {
    validateAndSetFile(selected)
  }
}

const validateAndSetFile = (f: File) => {
  error.value = null
  if (f.type !== 'text/csv' && !f.name.endsWith('.csv')) {
    error.value = { key: 'importer.invalidType' }
    return
  }
  file.value = f
  parsedData.value = []
  headers.value = []
}

const parseFile = () => {
  if (!file.value) return

  parsing.value = true
  Papa.parse(file.value, {
    header: true,
    skipEmptyLines: true,
    delimiter: delimiter.value,
    complete: (results) => {
      parsing.value = false
      if (results.errors.length > 0) {
        console.warn('Parse errors:', results.errors)
      }
      parsedData.value = results.data as Record<string, unknown>[]
      headers.value = results.meta.fields || []
      step.value = 2
    },
    error: (err) => {
      parsing.value = false
      error.value = { key: 'importer.errorParsing', params: { error: err.message } }
    },
  })
}

const goBack = () => {
  step.value = 1
}

const completeImport = () => {
  if (!isValid.value) return
  emit('import', previewData.value)
  reset()
  dialogModel.value = false
}

const reset = () => {
  file.value = null
  files.value = []
  parsedData.value = []
  headers.value = []
  step.value = 1
  error.value = null
  mappings.value = {}
}

const close = () => {
  reset()
  dialogModel.value = false
}
</script>

<template>
  <AppDialog v-model="dialogModel" :title="t('importer.title')" max-width="950" persistent>
    <v-window v-model="step">
      <!-- Step 1: Upload & Configure -->
      <v-window-item :value="1">
        <v-file-upload
          v-model="files"
          :title="t('importer.dragDrop')"
          icon="mdi-cloud-upload"
          density="comfortable"
          @update:model-value="onFileSelected"
        />

        <v-row v-if="file" justify="center" align="center" class="mt-4">
          <v-col cols="12" sm="6">
            <v-select
              v-model="delimiter"
              :items="delimiters"
              :label="t('importer.selectDelimiter')"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Step 2: Map Columns -->
      <v-window-item :value="2">
        <div>
          <h3 class="text-h6 mb-4">{{ t('importer.mapColumns') }}</h3>

          <v-alert v-if="!isValid" type="warning" variant="tonal" class="mb-4" density="compact">
            {{
              t('importer.status.missing', {
                fields: unmappedRequiredFields.map((f) => f.label).join(', '),
              })
            }}
          </v-alert>
          <v-alert v-else type="success" variant="tonal" class="mb-4" density="compact">
            {{ t('importer.status.allMapped') }}
          </v-alert>

          <v-table class="mb-6">
            <thead>
              <tr>
                <th class="text-left" style="width: 40%">{{ t('common.field') }}</th>
                <th class="text-left" style="width: 10%">{{ t('common.required') }}</th>
                <th class="text-left" style="width: 30%">{{ t('importer.csvColumn') }}</th>
                <th class="text-left" style="width: 20%">{{ t('importer.sampleValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="field in fields" :key="field.key">
                <td>{{ field.label }}</td>
                <td>
                  <v-icon v-if="field.required" color="error" size="small">mdi-asterisk</v-icon>
                </td>
                <td>
                  <v-select
                    v-model="mappings[field.key]"
                    :items="headers"
                    :label="t('importer.selectColumn')"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    :placeholder="t('common.ignore')"
                  />
                </td>
                <td
                  class="text-medium-emphasis text-caption text-truncate"
                  style="max-width: 150px"
                >
                  {{ getSampleValue(field.key) }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <h3 class="text-h6 mb-2">{{ t('importer.previewData') }}</h3>
          <v-data-table
            :headers="previewHeaders"
            :items="previewData"
            density="compact"
            items-per-page="5"
            class="elevation-1"
          />
        </div>
      </v-window-item>
    </v-window>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
      {{ t(error.key, error.params || {}) }}
    </v-alert>

    <!-- Step-specific action buttons -->
    <template #actions>
      <template v-if="step === 1">
        <v-btn variant="plain" @click="close">{{ t('common.cancel') }}</v-btn>
        <v-btn :disabled="!file" color="primary" :loading="parsing" @click="parseFile">
          {{ t('common.next') }}
        </v-btn>
      </template>
      <template v-else-if="step === 2">
        <v-btn variant="plain" @click="close">{{ t('common.cancel') }}</v-btn>
        <v-btn variant="text" @click="goBack">{{ t('common.back') }}</v-btn>
        <v-btn color="success" :disabled="!isValid" @click="completeImport">
          {{ t('importer.importData') }}
        </v-btn>
      </template>
    </template>
  </AppDialog>
</template>
