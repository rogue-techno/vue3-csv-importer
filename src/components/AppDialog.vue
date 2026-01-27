<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const dialogModel = defineModel<boolean>({ required: true })

const {
  title = '',
  cancelLabel = '',
  submitLabel = '',
  submitDisabled = false,
  submitLoading = false,
} = defineProps<{
  title?: string
  cancelLabel?: string
  submitLabel?: string
  submitDisabled?: boolean
  submitLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const computedCancelLabel = computed(() => cancelLabel || t('dialog.cancel'))
const computedSubmitLabel = computed(() => submitLabel || t('dialog.submit'))

const close = () => {
  dialogModel.value = false
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const handleSubmit = () => {
  emit('submit')
}
</script>

<template>
  <v-dialog v-model="dialogModel" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <span class="text-h5">{{ title }}</span>
        <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close" />
      </v-card-title>

      <v-card-text class="px-4">
        <slot />
      </v-card-text>

      <v-card-actions class="pa-4 justify-end">
        <slot name="actions">
          <v-btn variant="plain" @click="handleCancel">
            {{ computedCancelLabel }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            :disabled="submitDisabled"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            {{ computedSubmitLabel }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
