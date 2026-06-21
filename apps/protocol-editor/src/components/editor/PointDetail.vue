<script setup lang="ts">
/**
 * Detail-Editor fuer den ausgewaehlten Punkt (#222, Stufen 2-3 + Stufe 5 visibleIf).
 * Jede Aenderung committet ueber editor.updatePoint(...) -> creator.updatePoint (Domain).
 * id + Typ sind nach Anlage unveraenderlich (creator-Regel) und werden read-only gezeigt.
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import type { Point, Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'
import StringListEditor from './StringListEditor.vue'
import FindingsEditor from './FindingsEditor.vue'
import VisibleIfEditor from './VisibleIfEditor.vue'

const editor = useEditor()
const point = computed<Point | null>(() => editor.selectedPoint.value)
const pid = computed<string | null>(() => editor.selectedPointId.value)

function set(patch: Partial<Point>): void {
  if (pid.value) editor.updatePoint(pid.value, patch)
}
function asStr(v: unknown): string {
  return v == null ? '' : String(v)
}
function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(asStr) : []
}
// Punkt traegt eine offene Index-Signatur; typ-spezifische Felder werden untypisiert gelesen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field(key: string): any {
  return (point.value as Record<string, unknown> | null)?.[key]
}
const visibleIf = computed<Predicate | undefined>(() => (point.value?.visibleIf as Predicate | undefined) ?? undefined)
</script>

<template>
  <div v-if="point" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-primary badge-sm">{{ point.type }}</span>
      <code class="text-xs text-base-content/50">{{ point.id }}</code>
      <span class="text-xs text-base-content/40">(Typ &amp; id nach Anlage fix)</span>
    </div>

    <!-- Label (Basis) — fuer alle ausser reinem text/findingGroup sinnvoll, aber Schema erlaubt es ueberall -->
    <label v-if="point.type !== 'text'" class="form-control">
      <span class="label-text">Label</span>
      <input class="input input-sm input-bordered" :value="asStr(point.label)" @input="set({ label: ($event.target as HTMLInputElement).value })" />
    </label>

    <!-- text -->
    <label v-if="point.type === 'text'" class="form-control">
      <span class="label-text">Inhalt (Platzhalter wie <code v-pre>{{var:id}}</code> erlaubt)</span>
      <textarea class="textarea textarea-bordered textarea-sm" rows="3" :value="asStr(field('content'))" @input="set({ content: ($event.target as HTMLTextAreaElement).value } as Partial<Point>)"></textarea>
    </label>

    <!-- field -->
    <template v-if="point.type === 'field'">
      <label class="form-control">
        <span class="label-text">Anzeige-Titel (optional)</span>
        <input class="input input-sm input-bordered" :value="asStr(field('title'))" @input="set({ title: ($event.target as HTMLInputElement).value } as Partial<Point>)" />
      </label>
      <label class="form-control">
        <span class="label-text">Default-Wert (optional)</span>
        <input class="input input-sm input-bordered" :value="asStr(field('default'))" @input="set({ default: ($event.target as HTMLInputElement).value } as Partial<Point>)" />
      </label>
      <label class="form-control">
        <span class="label-text">Tool (App-Rechner-id, optional, z. B. news2/bmi)</span>
        <input class="input input-sm input-bordered" :value="asStr(field('tool'))" @input="set({ tool: ($event.target as HTMLInputElement).value } as Partial<Point>)" />
      </label>
      <div class="form-control">
        <span class="label-text">Vorschlags-Optionen</span>
        <StringListEditor :model-value="asArr(field('options'))" placeholder="Option" add-label="Option" @update:model-value="set({ options: $event } as Partial<Point>)" />
      </div>
      <label class="label cursor-pointer justify-start gap-2 py-0">
        <input type="checkbox" class="toggle toggle-sm" :checked="field('multiline') === true" @change="set({ multiline: ($event.target as HTMLInputElement).checked } as Partial<Point>)" />
        <span class="label-text">mehrzeilig</span>
      </label>
    </template>

    <!-- finding -->
    <template v-if="point.type === 'finding'">
      <label class="form-control">
        <span class="label-text">Normalbefund</span>
        <input class="input input-sm input-bordered" :value="asStr(field('normal'))" @input="set({ normal: ($event.target as HTMLInputElement).value } as Partial<Point>)" />
      </label>
      <label class="form-control">
        <span class="label-text">Default-Status</span>
        <select class="select select-sm select-bordered" :value="asStr(field('state')) || 'normal'" @change="set({ state: ($event.target as HTMLSelectElement).value } as Partial<Point>)">
          <option value="normal">normal</option>
          <option value="abnormal">abnormal</option>
        </select>
      </label>
      <div class="form-control">
        <span class="label-text">Varianten (alternative Normalbefund-Texte)</span>
        <StringListEditor :model-value="asArr(field('variants'))" placeholder="Variante" add-label="Variante" @update:model-value="set({ variants: $event } as Partial<Point>)" />
      </div>
    </template>

    <!-- findingGroup (xABCDE) -->
    <template v-if="point.type === 'findingGroup'">
      <label class="form-control">
        <span class="label-text">Key (xABCDE-Buchstabe/Label, z. B. „A")</span>
        <input class="input input-sm input-bordered" :value="asStr(field('key'))" @input="set({ key: ($event.target as HTMLInputElement).value } as Partial<Point>)" />
      </label>
      <label class="label cursor-pointer justify-start gap-2 py-0">
        <input type="checkbox" class="toggle toggle-sm" :checked="field('collapsible') === true" @change="set({ collapsible: ($event.target as HTMLInputElement).checked } as Partial<Point>)" />
        <span class="label-text">einklappbar (UI-Flag)</span>
      </label>
      <div class="form-control">
        <span class="label-text">Befunde</span>
        <FindingsEditor :model-value="field('findings') ?? []" @update:model-value="set({ findings: $event } as Partial<Point>)" />
      </div>
    </template>

    <!-- list -->
    <div v-if="point.type === 'list'" class="form-control">
      <span class="label-text">Einträge (Default-Liste)</span>
      <StringListEditor :model-value="asArr(field('entries'))" placeholder="Eintrag" add-label="Eintrag" @update:model-value="set({ entries: $event } as Partial<Point>)" />
    </div>

    <!-- medikamente -->
    <p v-if="point.type === 'medikamente'" class="text-xs text-base-content/60">
      Medikamenten-Punkt: Zeilen entstehen ausschließlich im Einsatz (Vorlagen tragen keine
      Patientendaten). Editierbar sind nur Label und Sichtbarkeit.
    </p>

    <!-- required (field/finding) -->
    <label v-if="point.type === 'field' || point.type === 'finding'" class="label cursor-pointer justify-start gap-2 py-0">
      <input type="checkbox" class="toggle toggle-sm" :checked="point.required === true" @change="set({ required: ($event.target as HTMLInputElement).checked })" />
      <span class="label-text">Pflichtpunkt (kein „nicht erhoben")</span>
    </label>

    <!-- visibleIf (Stufe 5) -->
    <div class="divider my-0 text-xs">Sichtbarkeit</div>
    <VisibleIfEditor :target="'point'" :target-id="point.id ?? ''" :current="visibleIf" />
  </div>

  <p v-else class="text-sm text-base-content/50">Keinen Punkt ausgewählt.</p>
</template>
