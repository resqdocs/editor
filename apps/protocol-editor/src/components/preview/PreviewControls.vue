<script setup lang="ts">
/**
 * Interaktive Ausfuell-Maske der Live-Vorschau (#fulltest / Bug B + #258): JEDER sichtbare,
 * eingebbare Punkt jedes sichtbaren Blocks bekommt ein typgerechtes Wert-Control. Blöcke
 * erscheinen in PROTOKOLLREIHENFOLGE; OPTIONALE Blöcke an IHRER Position mit Inline-Toggle
 * (statt in einer Sammel-Sektion) — wie die App-Einsatzansicht (#49).
 *
 * Sichtbarkeit kommt aus den GETEILTEN runtime-Funktionen (preview.blockVisible/pointVisible,
 * die getVisibleBlocks/getVisiblePoints kapseln), darum können Maske und gerenderte Ausgabe NIE
 * divergieren. referencedPointIds dient nur der Hervorhebung. KEINE Template-Mutation — alles
 * schreibt ausschliesslich in den fluechtigen caseState (usePreviewState).
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import { usePreview } from '@/composables/editorKey'
import type { Override } from '@resqdocs/protocol-core/renderer/render.mjs'
import { buildFillGroups, listValueToText, listEntriesFromText, type FillControl, type FillGroup } from '@/utils/previewFill'

const editor = useEditor()
const preview = usePreview()

// Ausfuell-Gruppen in Dokumentreihenfolge (optionale Blöcke an Position, Inline-Toggle). Die
// Sichtbarkeit/Status werden aus usePreviewState gespiegelt -> Maske ↔ Renderer bleiben konsistent.
const fillGroups = computed<FillGroup[]>(() =>
  buildFillGroups(editor.blocks.value, {
    blockVisible: (id) => preview.blockVisible(id),
    isBlockActive: (id) => preview.isBlockActive(id),
    pointVisible: (id) => preview.pointVisible(id),
    isReferenced: (id) => preview.referencedPointIds.value.has(id),
  }),
)

function asStr(v: unknown): string {
  return v == null ? '' : String(v)
}

// ----- field: Wert + "nicht erhoben" (#43 dreistufig). Wert-Shape: string | { excluded:true }. -----
function fieldValue(id: string): string {
  const ov = preview.getValue(id)
  if (typeof ov === 'string') return ov
  if (typeof ov === 'object' && ov !== null && 'value' in ov && typeof ov.value === 'string') return ov.value
  return ''
}
function fieldExcluded(id: string): boolean {
  const ov = preview.getValue(id)
  return typeof ov === 'object' && ov !== null && 'excluded' in ov
}
function setFieldValue(id: string, text: string): void {
  preview.setValue(id, text === '' ? undefined : text)
}
function setFieldExcluded(id: string, on: boolean): void {
  preview.setValue(id, on ? { excluded: true } : undefined)
}

// ----- finding: Zustand <-> Override (genau die vier Renderer-Formen, #43/#71). -----
type FindingChoice = 'standard' | 'normal' | 'abnormal' | 'excluded'
function findingChoice(id: string): FindingChoice {
  const ov = preview.getValue(id)
  if (ov === undefined) return 'standard'
  if (typeof ov === 'object' && ov !== null && 'excluded' in ov) return 'excluded'
  if (typeof ov === 'object' && ov !== null && 'state' in ov && ov.state === 'normal') return 'normal'
  return 'abnormal'
}
function setFinding(id: string, choice: FindingChoice): void {
  const map: Record<FindingChoice, Override | undefined> = {
    standard: undefined,
    normal: { state: 'normal' },
    abnormal: { state: 'abnormal' },
    excluded: { excluded: true },
  }
  preview.setValue(id, map[choice])
}

// ----- list: Textarea <-> string[]-Eintraege (Wert-Shape wie runtime.listEntries). -----
function listText(c: FillControl): string {
  return listValueToText(preview.getValue(c.id), c.entries ?? [])
}
function setList(id: string, text: string): void {
  const entries = listEntriesFromText(text)
  preview.setValue(id, entries.length ? entries : undefined)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <h2 class="card-title text-base">Vorschau-Eingaben</h2>
      <span class="badge badge-sm" :class="preview.hasOverrides.value ? 'badge-primary' : 'badge-ghost'">
        {{ preview.hasOverrides.value ? 'ausgefüllt' : 'neutral' }}
      </span>
      <button class="btn btn-ghost btn-xs ml-auto" :disabled="!preview.hasOverrides.value" @click="preview.reset()">
        zurücksetzen
      </button>
    </div>
    <p class="text-xs text-base-content/60">
      Flüchtiger Lern-/Demonstrations-Zustand — NICHT Teil der gespeicherten Vorlage. Fülle die Punkte aus und
      sieh rechts, wie sich Text + Sichtbarkeit (visibleIf) live ändern.
    </p>

    <!-- Variablen -->
    <section v-if="editor.variables.value.length">
      <h3 class="mb-1 text-sm font-semibold">Variablen</h3>
      <div class="flex flex-col gap-2">
        <label v-for="v in editor.variables.value" :key="v.id" class="flex items-center gap-2 text-sm">
          <span class="w-32 shrink-0 truncate" :title="v.label || v.id">{{ v.label || v.id }}</span>
          <select
            v-if="v.type === 'select'"
            class="select select-xs select-bordered flex-1"
            :value="asStr(preview.varValue(v.id, v.default))"
            @change="preview.setVariable(v.id, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="o in v.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <input
            v-else-if="v.type === 'boolean'"
            type="checkbox"
            class="toggle toggle-sm"
            :checked="preview.varValue(v.id, v.default) === true"
            @change="preview.setVariable(v.id, ($event.target as HTMLInputElement).checked)"
          />
          <input
            v-else-if="v.type === 'number'"
            type="number"
            class="input input-xs input-bordered flex-1"
            :value="asStr(preview.varValue(v.id, v.default))"
            @input="preview.setVariable(v.id, ($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))"
          />
          <input
            v-else
            class="input input-xs input-bordered flex-1"
            :value="asStr(preview.varValue(v.id, v.default))"
            @input="preview.setVariable(v.id, ($event.target as HTMLInputElement).value)"
          />
          <span v-if="v.grammar === 'de-gender'" class="badge badge-ghost badge-xs">Gender</span>
        </label>
      </div>
    </section>

    <!-- Protokoll ausfuellen: ein typgerechtes Control je sichtbarem, eingebbarem Punkt, in
         PROTOKOLLREIHENFOLGE. Optionale Blöcke an IHRER Position mit Inline-Toggle (#258). -->
    <section v-if="fillGroups.length">
      <h3 class="mb-1 text-sm font-semibold">Protokoll ausfüllen</h3>
      <div class="flex flex-col gap-3">
        <div v-for="g in fillGroups" :key="g.blockId" class="rounded border border-base-300 p-2">
          <!-- optionaler Block: Aktivierungs-Toggle inline an seiner Position -->
          <label v-if="g.optional" class="mb-1 flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              class="toggle toggle-xs"
              :checked="g.active"
              @change="preview.toggleBlock(g.blockId, ($event.target as HTMLInputElement).checked)"
            />
            <span class="truncate text-base-content/80">{{ g.title }}</span>
            <span class="badge badge-outline badge-xs">optional</span>
          </label>
          <h4 v-else class="mb-1 text-xs font-semibold text-base-content/70">{{ g.title }}</h4>

          <!-- Controls nur, wenn sichtbar (optional: aktiv && visibleIf); optionale eingerueckt -->
          <div
            v-if="g.visible && g.controls.length"
            class="flex flex-col gap-2"
            :class="g.optional ? 'ml-2 border-l-2 border-base-300 pl-3' : ''"
          >
            <template v-for="c in g.controls" :key="c.id">
              <!-- field: Freitext + „nicht erhoben“ -->
              <label v-if="c.kind === 'field'" class="flex items-center gap-2 text-sm">
                <span class="flex w-32 shrink-0 items-center gap-1 truncate" :class="c.referenced ? 'font-medium' : ''" :title="c.label">
                  <span class="truncate">{{ c.label }}</span>
                  <span v-if="c.referenced" class="badge badge-ghost badge-xs">Bedingung</span>
                </span>
                <input
                  class="input input-xs input-bordered flex-1"
                  :value="fieldValue(c.id)"
                  :disabled="fieldExcluded(c.id)"
                  placeholder="Wert"
                  @input="setFieldValue(c.id, ($event.target as HTMLInputElement).value)"
                />
                <label class="flex items-center gap-1 text-xs">
                  <input type="checkbox" class="checkbox checkbox-xs" :checked="fieldExcluded(c.id)" @change="setFieldExcluded(c.id, ($event.target as HTMLInputElement).checked)" />
                  n.e.
                </label>
              </label>

              <!-- finding (auch findingGroup-Kinder): Zustands-Auswahl -->
              <label v-else-if="c.kind === 'finding'" class="flex items-center gap-2 text-sm">
                <span class="flex w-32 shrink-0 items-center gap-1 truncate" :class="c.referenced ? 'font-medium' : ''" :title="c.label">
                  <span class="truncate">{{ c.label }}</span>
                  <span v-if="c.referenced" class="badge badge-ghost badge-xs">Bedingung</span>
                </span>
                <select
                  class="select select-xs select-bordered flex-1"
                  :value="findingChoice(c.id)"
                  @change="setFinding(c.id, ($event.target as HTMLSelectElement).value as FindingChoice)"
                >
                  <option value="standard">Standard (Vorgabe)</option>
                  <option value="normal">normal</option>
                  <option value="abnormal">auffällig</option>
                  <option value="excluded">nicht erhoben</option>
                </select>
              </label>

              <!-- list: ein Eintrag je Zeile -->
              <label v-else-if="c.kind === 'list'" class="flex flex-col gap-1 text-sm">
                <span class="flex items-center gap-1 truncate" :class="c.referenced ? 'font-medium' : ''" :title="c.label">
                  <span class="truncate">{{ c.label }}</span>
                  <span class="text-xs text-base-content/50">(ein Eintrag je Zeile)</span>
                  <span v-if="c.referenced" class="badge badge-ghost badge-xs">Bedingung</span>
                </span>
                <textarea
                  class="textarea textarea-xs textarea-bordered"
                  rows="2"
                  :value="listText(c)"
                  placeholder="Eintrag je Zeile"
                  @input="setList(c.id, ($event.target as HTMLTextAreaElement).value)"
                ></textarea>
              </label>

              <!-- text: nur Anzeige (read-only) -->
              <div v-else-if="c.kind === 'text'" class="flex items-center gap-2 text-sm text-base-content/60">
                <span class="w-32 shrink-0 truncate" :title="c.label">{{ c.label }}</span>
                <span class="flex-1 truncate text-xs">{{ c.content || '(Text)' }} — nur Anzeige</span>
              </div>

              <!-- medikamente: Stub (voller Zeilen-Editor folgt) -->
              <div v-else-if="c.kind === 'medikamente'" class="flex items-center gap-2 text-sm">
                <span class="w-32 shrink-0 truncate" :title="c.label">{{ c.label }}</span>
                <span class="flex-1 text-xs text-base-content/50">Medikamente werden im Einsatz erfasst (Vorschau-Stub).</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
