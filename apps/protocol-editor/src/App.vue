<script setup lang="ts">
/**
 * ResQDocs Protokoll-Editor (#176).
 *
 * Bearbeiten: volle Editier-Maechtigkeit ueber duenne Wrapper auf creator.mjs (#222), mit
 * Import/Export (#223) und mitlaufendem Live-Klartext. Vorschau: INTERAKTIVE Live-Vorschau
 * (#224) — der Lern-Kern: Variablen/Zustaende verstellen und live sehen, wie Text + visibleIf-
 * Sichtbarkeit reagieren (render()/runtime aus protocol-core). Editor- und Vorschau-Zustand
 * werden hier erzeugt und per provide bereitgestellt; der Vorschau-Zustand ist FLUECHTIG und
 * NICHT Teil der gespeicherten Vorlage.
 */
import { provide, ref } from 'vue'
import { sampleProtocol } from '@/data/sampleProtocol'
import { useProtocolEditor } from '@/composables/useProtocolEditor'
import { usePreviewState } from '@/composables/usePreviewState'
import { useTutorial } from '@/composables/useTutorial'
import { editorKey, previewKey, learnKey } from '@/composables/editorKey'
import type { ProtocolTemplate } from '@resqdocs/protocol-core/renderer/render.mjs'
import ImportExport from '@/components/editor/ImportExport.vue'
import StructurePanel from '@/components/editor/StructurePanel.vue'
import BlockDetail from '@/components/editor/BlockDetail.vue'
import PointDetail from '@/components/editor/PointDetail.vue'
import VariableDetail from '@/components/editor/VariableDetail.vue'
import ValidationBar from '@/components/editor/ValidationBar.vue'
import RenderedPreview from '@/components/RenderedPreview.vue'
import PreviewControls from '@/components/preview/PreviewControls.vue'
import PreviewInsights from '@/components/preview/PreviewInsights.vue'
import LearnView from '@/components/learn/LearnView.vue'
import FirstStartHint from '@/components/learn/FirstStartHint.vue'

const editor = useProtocolEditor(sampleProtocol)
const preview = usePreviewState(editor.protocol)
const tutorial = useTutorial()
provide(editorKey, editor)
provide(previewKey, preview)

const mode = ref<'edit' | 'preview' | 'learn'>('edit')

// „Beispiel oeffnen": laedt die Vorlage, setzt den Vorschau-Zustand neutral und zeigt die Live-Vorschau.
function openExample(protocol: ProtocolTemplate): void {
  editor.loadDraft(protocol)
  preview.reset()
  mode.value = 'preview'
}
provide(learnKey, { tutorial, openExample })

function startTutorial(): void {
  tutorial.start()
  mode.value = 'learn'
}

// Build-Kennung (via Vite injiziert) — dezent in der Fußzeile, damit der ausgelieferte
// Stand identifizierbar ist („deployt vs. aktuell").
const buildId = __BUILD_ID__
</script>

<template>
  <div class="min-h-full bg-base-200">
    <header class="navbar sticky top-0 z-10 bg-base-100 shadow-sm">
      <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4">
        <span class="text-lg font-semibold">
          Res<span class="text-primary">Q</span>Docs <span class="font-normal text-base-content/60">Protokoll-Editor</span>
        </span>
        <div class="join">
          <button class="join-item btn btn-sm" :class="mode === 'edit' ? 'btn-primary' : 'btn-ghost'" @click="mode = 'edit'">Bearbeiten</button>
          <button class="join-item btn btn-sm" :class="mode === 'preview' ? 'btn-primary' : 'btn-ghost'" @click="mode = 'preview'">Live-Vorschau</button>
          <button class="join-item btn btn-sm" :class="mode === 'learn' ? 'btn-primary' : 'btn-ghost'" @click="mode = 'learn'">Lernen</button>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" title="leeres Protokoll" @click="editor.newEmpty()">Neu (leer)</button>
          <button class="btn btn-ghost btn-sm" title="Beispiel-Vorlage laden" @click="editor.loadDraft(sampleProtocol)">Beispiel laden</button>
        </div>
      </div>
    </header>

    <!-- Erststart-Hinweis aufs Tutorial (#225) — dezent, ueberspringbar, nur am Anfang -->
    <div v-if="!tutorial.started.value && !tutorial.dismissed.value && mode !== 'learn'" class="mx-auto w-full max-w-7xl px-4 pt-4">
      <FirstStartHint @start="startTutorial" @dismiss="tutorial.skip()" />
    </div>

    <!-- Import/Export (#223) — in Bearbeiten/Vorschau verfuegbar -->
    <div v-if="mode !== 'learn'" class="mx-auto w-full max-w-7xl px-4 pt-4">
      <ImportExport />
    </div>

    <!-- Bearbeiten -->
    <main v-if="mode === 'edit'" class="mx-auto w-full max-w-7xl px-4 py-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr_22rem]">
        <section class="card bg-base-100 shadow-sm">
          <div class="card-body gap-3 p-3">
            <h2 class="card-title text-base">Struktur</h2>
            <StructurePanel />
          </div>
        </section>

        <section class="card bg-base-100 shadow-sm">
          <div class="card-body gap-3 p-4">
            <h2 class="card-title text-base">
              {{ editor.selectedVariableId.value ? 'Variable' : editor.selectedPointId.value ? 'Punkt' : editor.selectedBlockId.value ? 'Block' : 'Detail' }}
            </h2>
            <VariableDetail v-if="editor.selectedVariableId.value" />
            <PointDetail v-else-if="editor.selectedPointId.value" />
            <BlockDetail v-else-if="editor.selectedBlockId.value" />
            <p v-else class="text-sm text-base-content/50">
              Links etwas auswählen (Variable, Block oder Punkt) oder neu anlegen, um es hier zu bearbeiten.
            </p>
          </div>
        </section>

        <!-- Validierung + Live-Klartext (reagiert auf Edits + Vorschau-Zustand) -->
        <section class="flex flex-col gap-4">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body gap-2 p-4">
              <h2 class="card-title text-base">Validierung</h2>
              <ValidationBar />
            </div>
          </div>
          <RenderedPreview :protocol="editor.protocol.value" :case-state="preview.caseState.value" />
        </section>
      </div>
    </main>

    <!-- Live-Vorschau (#224) — interaktiver Lern-Kern -->
    <main v-else-if="mode === 'preview'" class="mx-auto w-full max-w-7xl px-4 py-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section class="card bg-base-100 shadow-sm">
          <div class="card-body gap-3 p-4">
            <PreviewControls />
          </div>
        </section>
        <div class="flex flex-col gap-4">
          <PreviewInsights />
          <RenderedPreview :protocol="editor.protocol.value" :case-state="preview.caseState.value" />
        </div>
      </div>
    </main>

    <!-- Lernen (#225) — Tutorial, Beispiele, Referenz -->
    <main v-else class="mx-auto w-full max-w-7xl px-4 py-4">
      <LearnView />
    </main>

    <!-- Dezente Build-Kennung (für „deployt vs. aktuell"): per Auge + per curl/grep auffindbar. -->
    <footer class="mx-auto w-full max-w-7xl px-4 py-3 text-right text-xs text-base-content/40">
      <span data-build-id>{{ buildId }}</span>
    </footer>
  </div>
</template>
