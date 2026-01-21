<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Papa from 'papaparse'

interface FieldDef {
  key: string
  label: string
  required?: boolean
}

const props = defineProps<{
  fields: FieldDef[]
}>()

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
  props.fields.forEach((field) => {
    // Auto-match if header matches field key or label (case-insensitive)
    const match = newHeaders.find(
      (h) =>
        h.toLowerCase() === field.key.toLowerCase() ||
        h.toLowerCase() === field.label.toLowerCase(),
    )
    newMappings[field.key] = match || null
  })
  mappings.value = newMappings
})

// Validation: check which required fields are missing
const unmappedRequiredFields = computed(() => {
  return props.fields.filter((f) => f.required && !mappings.value[f.key])
})

const isValid = computed(() => {
  return unmappedRequiredFields.value.length === 0
})

// Helper to get sample value for a field based on current mapping
const getSampleValue = (fieldKey: string) => {
  const header = mappings.value[fieldKey] // string | null
  // Ensure we have a header and data exists
  if (!header || !parsedData.value || parsedData.value.length === 0) return ''

  const firstRow = parsedData.value[0]
  if (!firstRow) return '' // strict check

  const val = firstRow[header]
  return val !== undefined && val !== null ? String(val) : ''
}

const previewHeaders = computed(() => {
  return props.fields.map((f) => ({
    title: f.label,
    key: f.key,
  }))
})

const previewData = computed(() => {
  return parsedData.value.map((row) => {
    const mappedRow: Record<string, unknown> = {}
    props.fields.forEach((f) => {
      const csvCol = mappings.value[f.key]
      if (csvCol) {
        mappedRow[f.key] = row[csvCol]
      }
    })
    return mappedRow
  })
})

const onFileSelected = (uploadedFiles: unknown) => {
  // Vuetify v-file-input model is Array or File depending on config.
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
  // Reset data if new file
  parsedData.value = []
  headers.value = []
  step.value = 2
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
      step.value = 3
    },
    error: (err) => {
      parsing.value = false
      error.value = { key: 'importer.errorParsing', params: { error: err.message } }
    },
  })
}

const completeImport = () => {
  if (!isValid.value) return
  emit('import', previewData.value)
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
</script>

<template>
  <v-container class="csv-importer fill-height justify-center">
    <v-card width="900" class="pa-6" elevation="4">
      <v-card-title class="text-h5 font-weight-bold mb-4 d-flex justify-space-between align-center">
        <span>{{ t('importer.title') }}</span>
        <v-chip v-if="step > 1" size="small" variant="outlined">{{ file?.name }}</v-chip>
      </v-card-title>

      <v-window v-model="step">
        <!-- Step 1: Upload -->
        <v-window-item :value="1">
          <v-file-upload
            v-model="files"
            :title="t('importer.dragDrop')"
            icon="mdi-cloud-upload"
            density="comfortable"
            @update:model-value="onFileSelected"
          />
        </v-window-item>

        <!-- Step 2: Configure & Parse -->
        <v-window-item :value="2">
          <div v-if="file" class="text-center mb-6">
            <v-row justify="center" align="center" class="mb-4">
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

            <v-btn
              color="primary"
              size="large"
              :loading="parsing"
              prepend-icon="mdi-table-search"
              @click="parseFile"
            >
              {{ t('importer.parsePreview') }}
            </v-btn>
            <v-btn variant="text" color="error" class="ml-2" @click="reset">
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-window-item>

        <!-- Step 3: Map Columns -->
        <v-window-item :value="3">
          <div class="mb-4">
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
              class="elevation-1 mb-4"
            />

            <div class="d-flex justify-end">
              <v-btn variant="text" class="mr-2" @click="step = 2">{{ t('common.back') }}</v-btn>
              <v-btn
                color="success"
                prepend-icon="mdi-check"
                :disabled="!isValid"
                @click="completeImport"
              >
                {{ t('importer.importData') }}
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
        {{ t(error.key, error.params || {}) }}
      </v-alert>
    </v-card>
  </v-container>
</template>
