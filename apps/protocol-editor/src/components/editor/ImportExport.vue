<script setup lang="ts">
/**
 * Import/Export von Protokoll-Vorlagen (#223, Slice 4). Serialisierung/Validierung kommen
 * VERBATIM aus @resqdocs/protocol-core (exportProtocol/parseImport ueber den Editor-Composable) —
 * KEIN eigener Parser/Validator. Diese Komponente macht nur die Browser-Datei-Mechanik
 * (Blob-Download, File-Picker, Drag&Drop) und zeigt klare Meldungen. Kein Server.
 */
import { ref } from 'vue'
import { useEditor } from '@/composables/editorKey'
import { downloadJson, readTextFile } from '@/utils/fileTransfer'

const editor = useEditor()
const MAX_IMPORT_BYTES = 10 * 1024 * 1024 // Vorlagen sind winzig; Schutz vor versehentlich riesiger Datei

interface Status {
  kind: 'success' | 'error'
  text: string
  errors: string[]
  warnings: string[]
}
const status = ref<Status | null>(null)
const dragging = ref(false)

function exportDownload(): void {
  status.value = null
  try {
    const name = editor.suggestedFilename()
    downloadJson(name, editor.exportCurrent())
    status.value = { kind: 'success', text: `Exportiert: ${name}`, errors: [], warnings: [] }
  } catch (e) {
    status.value = { kind: 'error', text: 'Export nicht möglich', errors: [e instanceof Error ? e.message : String(e)], warnings: [] }
  }
}

async function handleFile(file: File): Promise<void> {
  if (file.size > MAX_IMPORT_BYTES) {
    status.value = { kind: 'error', text: `Datei zu groß: ${file.name}`, errors: ['Maximal 10 MB.'], warnings: [] }
    return
  }
  try {
    const text = await readTextFile(file)
    const res = editor.importFromJson(text)
    status.value = res.ok
      ? { kind: 'success', text: `Importiert: ${file.name}`, errors: [], warnings: res.warnings }
      : { kind: 'error', text: `Import abgelehnt: ${file.name}`, errors: res.errors, warnings: res.warnings }
  } catch (e) {
    status.value = { kind: 'error', text: `Datei konnte nicht gelesen werden: ${file.name}`, errors: [e instanceof Error ? e.message : String(e)], warnings: [] }
  }
}

function onPick(ev: Event): void {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void handleFile(file)
  input.value = ''
}
function onDrop(ev: DragEvent): void {
  dragging.value = false
  const file = ev.dataTransfer?.files?.[0]
  if (file) void handleFile(file)
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body flex-row flex-wrap items-center gap-3 p-3">
      <button class="btn btn-sm btn-primary" @click="exportDownload">⬇ Exportieren</button>

      <label class="btn btn-sm">
        ⬆ Importieren
        <input type="file" accept="application/json,.json" class="hidden" @change="onPick" />
      </label>

      <div
        class="flex-1 rounded-box border border-dashed px-3 py-2 text-center text-xs text-base-content/60"
        :class="dragging ? 'border-primary bg-primary/10' : 'border-base-300'"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        JSON-Vorlage hierher ziehen
      </div>

      <div v-if="status" class="w-full">
        <div class="alert py-2 text-sm" :class="status.kind === 'success' ? 'alert-success' : 'alert-error'">
          <span>{{ status.text }}</span>
        </div>
        <ul v-if="status.errors.length" class="list-disc pl-5 text-xs text-error">
          <li v-for="(e, i) in status.errors" :key="i">{{ e }}</li>
        </ul>
        <ul v-if="status.warnings.length" class="list-disc pl-5 text-xs text-warning">
          <li v-for="(w, i) in status.warnings" :key="i">Hinweis: {{ w }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
