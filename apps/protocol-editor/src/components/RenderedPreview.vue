<script setup lang="ts">
/**
 * Klartext-Vorschau: rendert die Vorlage mit dem GETEILTEN Renderer aus
 * @resqdocs/protocol-core - exakt derselben Funktion, die die App nutzt. Reagiert
 * reaktiv auf Edits (Slice 3) UND auf den Vorschau-Zustand (Slice 5, #224).
 *
 * render(protocol, caseState, { heading }) -> deterministischer Klartext-String.
 * Ohne caseState-Prop wird mit leerem Einsatz-Zustand gerendert (Default-Darstellung).
 * Der caseState ist FLUECHTIG (Vorschau/Lernen) und NICHT Teil der gespeicherten Vorlage.
 */
import { computed } from 'vue'
import { render } from '@resqdocs/protocol-core/renderer/render.mjs'
import type { ProtocolTemplate, RenderCase } from '@resqdocs/protocol-core/renderer/render.mjs'

const props = defineProps<{ protocol: ProtocolTemplate; caseState?: RenderCase }>()

const rendered = computed(() => render(props.protocol, props.caseState ?? {}, {}))
const interactive = computed(() => props.caseState !== undefined)
</script>

<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body gap-3 p-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title text-base">Gerenderter Klartext</h2>
        <span class="badge badge-ghost badge-sm">{{ interactive ? 'render(…, caseState, …)' : 'render(…, {}, {})' }}</span>
      </div>
      <p class="text-xs text-base-content/60">
        Ausgabe des geteilten Renderers (<code>@resqdocs/protocol-core</code>) - identisch zur App.
        <template v-if="interactive">Reagiert live auf Edits und Vorschau-Eingaben.</template>
        <template v-else>Default-Werte, keine Einsatz-Eingaben.</template>
      </p>
      <pre class="max-h-[70vh] overflow-auto rounded-box bg-base-200 p-3 text-xs leading-relaxed whitespace-pre-wrap">{{ rendered }}</pre>
    </div>
  </section>
</template>
