<script setup lang="ts">
/**
 * Interaktive Vorschau-Steuerung (#224, Lern-Kern): leitet aus der Vorlage Eingabe-Controls ab
 * (Variablen je Typ, optionale Bloecke, Befund-Zustaende, von visibleIf referenzierte Punkte) und
 * fuettert damit den FLUECHTIGEN Vorschau-Zustand (usePreviewState). Damit sieht man live, wie
 * Variablen + visibleIf den Output und die Sichtbarkeit veraendern. KEINE Template-Mutation.
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import { usePreview } from '@/composables/editorKey'
import type { Override } from '@resqdocs/protocol-core/renderer/render.mjs'

const editor = useEditor()
const preview = usePreview()

const optionalBlocks = computed(() => editor.blocks.value.filter((b) => b.optional))

interface FindingRow {
  id: string
  label: string
  group: string
}
const findings = computed<FindingRow[]>(() => {
  const out: FindingRow[] = []
  for (const b of editor.blocks.value) {
    for (const p of b.points ?? []) {
      const bag = p as Record<string, unknown>
      if (p.type === 'finding' && p.id) out.push({ id: p.id, label: String(p.label ?? p.id), group: String(b.title) })
      if (p.type === 'findingGroup' && Array.isArray(bag.findings)) {
        const key = String(bag.key ?? '')
        for (const f of bag.findings as Array<Record<string, unknown>>) {
          if (typeof f.id === 'string') out.push({ id: f.id, label: `${key} › ${String(f.label ?? f.id)}`, group: String(b.title) })
        }
      }
    }
  }
  return out
})

// Von visibleIf referenzierte NICHT-Befund-Punkte (Feld/Text/Liste/Medikamente) -> Wert-Control.
const refPoints = computed<FindingRow[]>(() => {
  const out: FindingRow[] = []
  for (const b of editor.blocks.value) {
    for (const p of b.points ?? []) {
      if (p.id && preview.referencedPointIds.value.has(p.id) && p.type !== 'finding' && p.type !== 'findingGroup') {
        out.push({ id: p.id, label: String(p.label ?? p.id), group: String(b.title) })
      }
    }
  }
  return out
})

function asStr(v: unknown): string {
  return v == null ? '' : String(v)
}

// ----- Befund-Zustand <-> Override -----
type FindingChoice = 'standard' | 'normal' | 'abnormal' | 'excluded'
// Diese Controls besitzen den vollen Schreib-Satz fuer Befund-Overrides (nur die vier Formen unten),
// daher klassifiziert die Rueck-Lesung jeden sonstigen Wert als 'abnormal' (runtime: value-ohne-state ⇒ abnormal).
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

// ----- Referenzierter Punkt: Wert / ausgeschlossen -----
function pointFieldValue(id: string): string {
  const ov = preview.getValue(id)
  if (typeof ov === 'string') return ov
  if (typeof ov === 'object' && ov !== null && 'value' in ov && typeof ov.value === 'string') return ov.value
  return ''
}
function pointExcluded(id: string): boolean {
  const ov = preview.getValue(id)
  return typeof ov === 'object' && ov !== null && 'excluded' in ov
}
function setPointValue(id: string, text: string): void {
  preview.setValue(id, text === '' ? undefined : text)
}
function setPointExcluded(id: string, on: boolean): void {
  preview.setValue(id, on ? { excluded: true } : undefined)
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
      Flüchtiger Lern-/Demonstrations-Zustand — NICHT Teil der gespeicherten Vorlage. Verstelle Werte und
      sieh rechts, wie sich Text + Sichtbarkeit (visibleIf) ändern.
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

    <!-- Befund-Zustaende -->
    <section v-if="findings.length">
      <h3 class="mb-1 text-sm font-semibold">Befund-Zustände</h3>
      <div class="flex flex-col gap-1">
        <label v-for="f in findings" :key="f.id" class="flex items-center gap-2 text-sm">
          <span class="w-40 shrink-0 truncate" :title="`${f.group}: ${f.label}`">{{ f.label }}</span>
          <select
            class="select select-xs select-bordered flex-1"
            :value="findingChoice(f.id)"
            @change="setFinding(f.id, ($event.target as HTMLSelectElement).value as FindingChoice)"
          >
            <option value="standard">Standard (Vorgabe)</option>
            <option value="normal">normal</option>
            <option value="abnormal">auffällig</option>
            <option value="excluded">nicht erhoben</option>
          </select>
        </label>
      </div>
    </section>

    <!-- Referenzierte Punkte (Feld/Text/Liste) -->
    <section v-if="refPoints.length">
      <h3 class="mb-1 text-sm font-semibold">Von Bedingungen referenzierte Punkte</h3>
      <div class="flex flex-col gap-1">
        <label v-for="p in refPoints" :key="p.id" class="flex items-center gap-2 text-sm">
          <span class="w-32 shrink-0 truncate" :title="p.label">{{ p.label }}</span>
          <input
            class="input input-xs input-bordered flex-1"
            :value="pointFieldValue(p.id)"
            :disabled="pointExcluded(p.id)"
            placeholder="Wert"
            @input="setPointValue(p.id, ($event.target as HTMLInputElement).value)"
          />
          <label class="flex items-center gap-1 text-xs">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="pointExcluded(p.id)" @change="setPointExcluded(p.id, ($event.target as HTMLInputElement).checked)" />
            n.e.
          </label>
        </label>
      </div>
    </section>
  </div>
</template>
