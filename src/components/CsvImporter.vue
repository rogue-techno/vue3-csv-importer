<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const step = ref(1)
const isDragging = ref(false)
const files = ref<File[]>([])
const file = ref<File | null>(null)
const error = ref<string | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileInput = ref<any>(null)
const parsing = ref(false)

const delimiter = ref(',')
const delimiters = [
  { title: 'Comma (,)', value: ',' },
  { title: 'Semicolon (;)', value: ';' },
  { title: 'Tab (\\t)', value: '\t' },
  { title: 'Pipe (|)', value: '|' },
]

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

const isValid = computed(() => {
  // Check if all required fields are mapped
  return props.fields.every((f) => !f.required || mappings.value[f.key])
})

const triggerFileInput = () => {
  fileInput.value?.$el.querySelector('input').click()
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  isDragging.value = false
  const droppedFiles = event.dataTransfer?.files
  if (droppedFiles && droppedFiles.length > 0) {
    const file = droppedFiles[0]
    if (file) validateAndSetFile(file)
  }
}

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
    error.value = 'Invalid file type. Please upload a CSV file.'
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
      error.value = 'Error parsing file: ' + err.message
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
        <span>CSV Importer</span>
        <v-chip v-if="step > 1" size="small" variant="outlined">{{ file?.name }}</v-chip>
      </v-card-title>

      <v-window v-model="step">
        <!-- Step 1: Upload -->
        <v-window-item :value="1">
          <div
            class="dropzone pa-10 text-center mb-4"
            :class="{ 'dropzone-active': isDragging }"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <v-icon icon="mdi-cloud-upload" size="64" color="primary" class="mb-4"></v-icon>
            <h3 class="text-h6 mb-2">Drag & Drop CSV File</h3>
            <p class="text-body-2 text-medium-emphasis">or click to browse</p>

            <v-file-input
              ref="fileInput"
              v-model="files"
              accept=".csv"
              class="d-none"
              @update:model-value="onFileSelected"
            ></v-file-input>
          </div>
        </v-window-item>

        <!-- Step 2: Configure & Parse -->
        <v-window-item :value="2">
          <div v-if="file" class="text-center mb-6">
            <v-row justify="center" align="center" class="mb-4">
              <v-col cols="12" sm="6">
                <v-select
                  v-model="delimiter"
                  :items="delimiters"
                  label="Select Delimiter"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                ></v-select>
              </v-col>
            </v-row>

            <v-btn
              color="primary"
              size="large"
              :loading="parsing"
              prepend-icon="mdi-table-search"
              @click="parseFile"
            >
              Parse & Preview
            </v-btn>
            <v-btn variant="text" color="error" class="ml-2" @click="reset"> Cancel </v-btn>
          </div>
        </v-window-item>

        <!-- Step 3: Map Columns -->
        <v-window-item :value="3">
          <div class="mb-4">
            <h3 class="text-h6 mb-4">Map Columns</h3>
            <v-table class="mb-6">
              <thead>
                <tr>
                  <th class="text-left" style="width: 40%">Field</th>
                  <th class="text-left" style="width: 10%">Required</th>
                  <th class="text-left" style="width: 50%">CSV Column</th>
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
                      label="Select Column"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      placeholder="Ignore"
                    ></v-select>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <h3 class="text-h6 mb-2">Preview Data</h3>
            <v-data-table
              :headers="previewHeaders"
              :items="previewData"
              density="compact"
              items-per-page="5"
              class="elevation-1 mb-4"
            ></v-data-table>

            <div class="d-flex justify-end">
              <v-btn variant="text" class="mr-2" @click="step = 2">Back</v-btn>
              <v-btn
                color="success"
                prepend-icon="mdi-check"
                :disabled="!isValid"
                @click="completeImport"
              >
                Import Data
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<style scoped>
.dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.5);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
}

.dropzone-active {
  border-color: rgba(var(--v-theme-primary), 1);
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: scale(1.02);
}
</style>
