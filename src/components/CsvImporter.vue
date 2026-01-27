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
const file = ref<File | undefined>(undefined)
const fileKey = ref(0)

const pastedCsv = ref('')
const error = ref<{ key: string; params?: Record<string, string> } | null>(null)
const parsing = ref(false)

const customDelimiter = ref('')

const parsedData = ref<Record<string, unknown>[]>([])
const headers = ref<string[]>([])
const mappings = ref<Record<string, string | null>>({})
const selected = ref<number[]>([])

const hasDataToParse = computed(() => file.value !== undefined || pastedCsv.value.length > 0)

watch(file, (newFile: File | undefined) => {
  if (newFile) {
    pastedCsv.value = ''
  }
})

watch(pastedCsv, (newPastedCsv) => {
  if (newPastedCsv.length > 0) {
    file.value = undefined
    // Needed to force the file upload to reset the selected file
    fileKey.value++
  }
})

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

const unmappedRequiredFields = computed(() =>
  fields.filter((f) => f.required && !mappings.value[f.key]),
)

const isValid = computed(() => unmappedRequiredFields.value.length === 0 || selected.value.length)

const getSampleValue = (fieldKey: string) => {
  const header = mappings.value[fieldKey]
  if (!header || !parsedData.value || parsedData.value.length === 0) return ''

  const firstRow = parsedData.value[0]
  if (!firstRow) return ''

  const val = firstRow[header]
  return val !== undefined && val !== null ? String(val) : ''
}

const parseData = () => {
  if (!hasDataToParse.value) return

  parsing.value = true
  error.value = null

  const parseOptions = {
    header: true,
    skipEmptyLines: true,
    delimiter: customDelimiter.value,
    delimitersToGuess: [';', ',', '\t', '|'],
    complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
      parsing.value = false
      if (results.errors.length > 0) {
        console.warn('Parse errors:', results.errors)
      }
      parsedData.value = results.data
      headers.value = results.meta.fields || []
      step.value = 2
    },
    error: (err: Error) => {
      parsing.value = false
      error.value = { key: 'importer.errorParsing', params: { error: err.message } }
    },
  }

  if (file.value) {
    Papa.parse(file.value, parseOptions)
  } else if (pastedCsv.value) {
    Papa.parse(pastedCsv.value, parseOptions)
  }
}

const previewHeaders = computed(() =>
  fields.map((f) => ({
    title: f.label,
    key: f.key,
  })),
)

const previewData = computed(() =>
  parsedData.value.map((row) => {
    const mappedRow: Record<string, unknown> = {}
    fields.forEach((f) => {
      const csvCol = mappings.value[f.key]
      if (csvCol) {
        mappedRow[f.key] = row[csvCol]
      }
    })
    return mappedRow
  }),
)

const completeImport = () => {
  emit('import', previewData.value)
  dialogModel.value = false
}

const reset = () => {
  file.value = undefined
  customDelimiter.value = ''
  pastedCsv.value = ''
  parsedData.value = []
  headers.value = []
  step.value = 1
  error.value = null
  mappings.value = {}
}

watch(dialogModel, (dialogOpened) => {
  if (!dialogOpened) {
    reset()
  }
})
</script>

<template>
  <AppDialog v-model="dialogModel" :title="t('importer.title')" max-width="950" persistent>
    <v-window v-model="step">
      <!-- Step 1: Upload & Configure -->
      <v-window-item :value="1">
        <div class="d-flex flex-column ga-2">
          <v-file-upload
            :key="fileKey"
            v-model="file"
            :title="t('importer.dragDrop')"
            icon="mdi-cloud-upload"
            density="comfortable"
            filter-by-type="text/csv"
            clearable
          />

          <div class="d-flex align-center mb-2">
            <v-divider />
            <span class="mx-4 text-medium-emphasis">{{ t('importer.or') }}</span>
            <v-divider />
          </div>

          <v-textarea
            v-model.trim="pastedCsv"
            :label="t('importer.pasteData')"
            :placeholder="t('importer.pasteDataPlaceholder')"
            rows="6"
            hide-details
            variant="outlined"
          />

          <div v-if="hasDataToParse" class="d-flex align-center ga-4 mt-4">
            <v-text-field
              v-model="customDelimiter"
              :label="t('importer.configureDelimiter')"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <div>{{ t('importer.configureDelimiterLabel') }}</div>
            <v-spacer />
          </div>
        </div>
      </v-window-item>

      <!-- Step 2: Map Columns -->
      <v-window-item :value="2">
        <div class="d-flex flex-column ga-6">
          <div class="text-h6">{{ t('importer.mapColumns') }}</div>

          <v-alert v-if="!isValid" type="warning" variant="tonal" density="compact">
            {{
              t('importer.status.missing', {
                fields: unmappedRequiredFields.map((f) => f.label).join(', '),
              })
            }}
          </v-alert>
          <v-alert v-else type="success" variant="tonal" density="compact">
            {{ t('importer.status.allMapped') }}
          </v-alert>

          <v-table>
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
                    density="compact"
                    hide-details
                    clearable
                    :placeholder="t('common.ignore')"
                    variant="solo-filled"
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

          <div class="text-h6">{{ t('importer.previewData') }}</div>

          <v-data-table
            v-model="selected"
            :headers="previewHeaders"
            :items="previewData"
            density="compact"
            show-select
            select-strategy="all"
            return-object
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
        <v-btn variant="plain" @click="dialogModel = false">{{ t('common.cancel') }}</v-btn>
        <v-btn :disabled="!hasDataToParse" color="primary" :loading="parsing" @click="parseData">
          {{ t('common.next') }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn variant="plain" @click="dialogModel = false">{{ t('common.cancel') }}</v-btn>
        <v-btn variant="text" @click="step = 1">{{ t('common.back') }}</v-btn>
        <v-btn color="primary" :disabled="!isValid" @click="completeImport">
          {{ t('importer.importData') }}
        </v-btn>
      </template>
    </template>
  </AppDialog>
</template>
