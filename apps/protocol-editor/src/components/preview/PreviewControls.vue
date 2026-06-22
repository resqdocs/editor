<script setup lang="ts">
/**
 * Interaktive Ausfuell-Maske der Live-Vorschau (#fulltest / Bug B): JEDER sichtbare, eingebbare
 * Punkt jedes sichtbaren Blocks bekommt ein typgerechtes Wert-Control — nicht mehr nur die
 * visibleIf-referenzierten. Damit spielt man das Protokoll wie ein echter Anwender durch:
 * Felder fuellen -> die gerenderte Vorschau zeigt Werte UND visibleIf-Logik live.
 *
 * Sichtbarkeit kommt aus den GETEILTEN runtime-Funktionen (preview.blockVisible/pointVisible,
 * die getVisibleBlocks/getVisiblePoints kapseln), damit Maske und gerenderte Ausgabe NIE
 * divergieren. referencedPointIds dient nur noch der Hervorhebung. KEINE Template-Mutation —
 * alles schreibt ausschliesslich in den fluechtigen caseState (usePreviewState).
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import { usePreview } from '@/composables/editorKey'
import type { Override } from '@resqdocs/protocol-core/renderer/render.mjs'
import { listValueToText, listEntriesFromText } from '@/utils/previewFill'

const editor = useEditor()
const preview = usePreview()

const optionalBlocks = computed(() => editor.blocks.value.filter((b) => b.optional))

type FillKind = 'field' | 'finding' | 'list' | 'text' | 'medikamente'
interface FillControl {
  kind: FillKind
  id: string
  label: string
  entries?: string[]
  content?: string
  referenced: boolean
}
interface FillGroup {
  blockId: string
  title: string
  controls: FillControl[]
}

function plabel(p: Record<string, unknown>): string {
  return String(p.title ?? p.label ?? p.id ?? '')
}

// Sichtbare Bloecke -> sichtbare Punkte -> typgerechte Controls. Gleiche Sichtbarkeit wie der
// Renderer (preview.*Visible kapseln getVisibleBlocks/getVisiblePoints), darum kann nie ein Punkt
// in der Maske auftauchen, der gerade nicht gerendert wird (und umgekehrt).
const fillGroups = computed<FillGroup[]>(() => {
  const out: FillGroup[] = []
  for (const b of editor.blocks.value) {
    if (!preview.blockVisible(b.id)) continue
    const controls: FillControl[] = []
    for (const p of b.points ?? []) {
      if (!p.id || !preview.pointVisible(p.id)) continue
      const bag = p as Record<string, unknown>
      const referenced = preview.referencedPointIds.value.has(p.id)
      switch (p.type) {
        case 'field':
          controls.push({ kind: 'field', id: p.id, label: plabel(bag), referenced })
          break
        case 'finding':
          controls.push({ kind: 'finding', id: p.id, label: plabel(bag), referenced })
          break
        case 'findingGroup': {
          const key = String(bag.key ?? '')
          for (const f of (bag.findings as Array<Record<string, unknown>>) ?? []) {
            if (typeof f.id === 'string') {
              controls.push({
                kind: 'finding',
                id: f.id,
                label: `${key} › ${plabel(f)}`,
                referenced: preview.referencedPointIds.value.has(f.id),
              })
            }
          }
          break
        }
        case 'list':
          controls.push({ kind: 'list', id: p.id, label: plabel(bag), entries: (bag.entries as string[]) ?? [], referenced })
          break
        case 'text':
          controls.push({ kind: 'text', id: p.id, label: plabel(bag), content: String(bag.content ?? ''), referenced })
          break
        case 'medikamente':
          controls.push({ kind: 'medikamente', id: p.id, label: plabel(bag), referenced })
          break
      }
    }
    if (controls.length) out.push({ blockId: b.id, title: String(b.title ?? b.id), controls })
  }
  return out
})

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

    <!-- Optionale Bloecke -->
    <section v-if="optionalBlocks.length">
      <h3 class="mb-1 text-sm font-semibold">Optionale Blöcke</h3>
      <label v-for="b in optionalBlocks" :key="b.id" class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="toggle toggle-sm"
          :checked="preview.isBlockActive(b.id)"
          @change="preview.toggleBlock(b.id, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ b.title }} aktivieren</span>
      </label>
    </section>

    <!-- Protokoll ausfuellen: ein typgerechtes Control je sichtbarem, eingebbarem Punkt,
         nach Block gruppiert; visibleIf-Subjekte sind als „Bedingung“ markiert. -->
    <section v-if="fillGroups.length">
      <h3 class="mb-1 text-sm font-semibold">Protokoll ausfüllen</h3>
      <div class="flex flex-col gap-3">
        <div v-for="g in fillGroups" :key="g.blockId" class="rounded border border-base-300 p-2">
          <h4 class="mb-1 text-xs font-semibold text-base-content/70">{{ g.title }}</h4>
          <div class="flex flex-col gap-2">
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
