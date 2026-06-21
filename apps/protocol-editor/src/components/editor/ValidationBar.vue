<script setup lang="ts">
/**
 * Validierungs-Anzeige (#222, Querschnitt): spiegelt assertValidProtocolDraft (Domain) und
 * den letzten geworfenen creator-Fehler. Garantie: jede Mutation laeuft ueber creator; hier
 * werden verbleibende Struktur-/Dangling-Ref-Hinweise sichtbar gemacht (Schema bleibt intakt).
 */
import { useEditor } from '@/composables/editorKey'

const editor = useEditor()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="editor.lastError.value" class="alert alert-error py-2 text-sm">
      <span>Abgelehnt: {{ editor.lastError.value }}</span>
    </div>

    <div class="flex items-center gap-2 text-sm">
      <span v-if="editor.validation.value.valid" class="badge badge-success badge-sm">schema-valide</span>
      <span v-else class="badge badge-error badge-sm">{{ editor.validation.value.errors.length }} Fehler</span>
      <span v-if="editor.validation.value.warnings.length" class="badge badge-warning badge-sm">
        {{ editor.validation.value.warnings.length }} Hinweise
      </span>
    </div>

    <ul v-if="editor.validation.value.errors.length" class="list-disc pl-5 text-xs text-error">
      <li v-for="(e, i) in editor.validation.value.errors" :key="i">{{ e }}</li>
    </ul>
    <ul v-if="editor.validation.value.warnings.length" class="list-disc pl-5 text-xs text-warning">
      <li v-for="(w, i) in editor.validation.value.warnings" :key="i">{{ w }}</li>
    </ul>
  </div>
</template>
