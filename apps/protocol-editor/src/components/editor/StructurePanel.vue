<script setup lang="ts">
/**
 * Struktur-Panel (#222, Stufe 1): Variablen + Bloecke -> Punkte als Baum, mit Auswahl und
 * Struktur-Operationen (anlegen / umbenennen via Detail / loeschen / duplizieren / ±1 sortieren).
 * Jede Operation laeuft ueber die Editor-Wrapper -> creator-Funktionen. Reorder ist bewusst
 * ±1 (creator bietet nur up/down; kein Drag-to-Index, kein Block-uebergreifendes Verschieben).
 */
import { useEditor } from '@/composables/editorKey'
import { describePredicate } from '@/composables/visibleIfModel'
import { POINT_TYPES, VARIABLE_TYPES, type PointType, type VariableType, type Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'
import { displayName } from '@/utils/displayName'

const editor = useEditor()

const POINT_LABELS: Record<PointType, string> = {
  field: 'Feld', finding: 'Befund', findingGroup: 'Befundgruppe', list: 'Liste', text: 'Text', medikamente: 'Medikamente',
}
const VAR_LABELS: Record<VariableType, string> = { select: 'Auswahl', boolean: 'Schalter', text: 'Text', number: 'Zahl' }

function addPointTo(blockId: string, ev: Event): void {
  const sel = ev.target as HTMLSelectElement
  const type = sel.value as PointType
  if (type) editor.addPoint(blockId, type)
  sel.value = ''
}
function addVariable(ev: Event): void {
  const sel = ev.target as HTMLSelectElement
  if (sel.value) editor.addVariable(sel.value as VariableType)
  sel.value = ''
}
function removeVariable(id: string): void {
  const refs = editor.variableReferences(id)
  if (refs.length && !confirm(`Diese Variable wird an ${refs.length} Stelle(n) referenziert (visibleIf/Platzhalter). Trotzdem löschen? Referenzen bleiben als verwaiste Verweise.`)) return
  editor.removeVariable(id)
}
function vis(x: { visibleIf?: unknown }): string {
  return x.visibleIf ? describePredicate(x.visibleIf as Predicate) : ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Variablen -->
    <section>
      <div class="mb-1 flex items-center gap-2">
        <h3 class="text-sm font-semibold">Variablen</h3>
        <select class="select select-xs select-bordered ml-auto" @change="addVariable">
          <option value="">+ Variable …</option>
          <option v-for="t in VARIABLE_TYPES" :key="t" :value="t">{{ VAR_LABELS[t] }}</option>
        </select>
      </div>
      <ul class="flex flex-col gap-0.5">
        <li
          v-for="v in editor.variables.value"
          :key="v.id"
          class="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-base-200"
          :class="editor.selectedVariableId.value === v.id ? 'bg-base-300' : ''"
        >
          <button class="flex flex-1 items-center gap-1 text-left" @click="editor.selectVariable(v.id)">
            <span class="badge badge-secondary badge-xs">{{ v.type }}</span>
            <span class="text-sm">{{ v.label || v.id }}</span>
          </button>
          <button class="btn btn-ghost btn-xs text-error" title="löschen" @click="removeVariable(v.id)">✕</button>
        </li>
        <li v-if="!editor.variables.value.length" class="text-xs text-base-content/40">keine Variablen</li>
      </ul>
    </section>

    <!-- Bloecke -> Punkte -->
    <section>
      <div class="mb-1 flex items-center gap-2">
        <h3 class="text-sm font-semibold">Blöcke</h3>
        <button class="btn btn-xs btn-ghost ml-auto" @click="editor.addBlock()">+ Block</button>
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="(b, bi) in editor.blocks.value" :key="b.id" class="rounded-box border border-base-300">
          <div
            class="flex items-center gap-1 px-2 py-1"
            :class="editor.selectedBlockId.value === b.id && !editor.selectedPointId.value ? 'bg-base-300' : 'bg-base-200'"
          >
            <button class="flex flex-1 items-center gap-1 text-left" @click="editor.selectBlock(b.id)">
              <span class="text-sm font-semibold">{{ b.title }}</span>
              <span v-if="b.optional" class="badge badge-outline badge-xs">opt</span>
              <span v-if="vis(b)" class="badge badge-ghost badge-xs" :title="vis(b)">bedingt</span>
            </button>
            <button class="btn btn-ghost btn-xs" :disabled="bi === 0" title="hoch" @click="editor.moveBlock(b.id, 'up')">↑</button>
            <button class="btn btn-ghost btn-xs" :disabled="bi === editor.blocks.value.length - 1" title="runter" @click="editor.moveBlock(b.id, 'down')">↓</button>
            <button class="btn btn-ghost btn-xs" title="duplizieren" @click="editor.duplicateBlock(b.id)">⎘</button>
            <button class="btn btn-ghost btn-xs text-error" title="löschen" @click="editor.removeBlock(b.id)">✕</button>
          </div>

          <ul class="flex flex-col gap-0.5 px-2 py-1">
            <li
              v-for="(p, pi) in b.points ?? []"
              :key="p.id ?? pi"
              class="flex items-center gap-1 rounded px-1 hover:bg-base-200"
              :class="editor.selectedPointId.value === p.id ? 'bg-base-300' : ''"
            >
              <button class="flex flex-1 items-center gap-1 text-left" @click="p.id && editor.selectPoint(p.id)">
                <span class="badge badge-primary badge-xs">{{ p.type }}</span>
                <span class="text-sm">{{ displayName(p) }}</span>
                <span v-if="vis(p)" class="badge badge-ghost badge-xs" :title="vis(p)">bedingt</span>
              </button>
              <button class="btn btn-ghost btn-xs" :disabled="pi === 0" title="hoch" @click="p.id && editor.movePoint(p.id, 'up')">↑</button>
              <button class="btn btn-ghost btn-xs" :disabled="pi === (b.points?.length ?? 0) - 1" title="runter" @click="p.id && editor.movePoint(p.id, 'down')">↓</button>
              <button class="btn btn-ghost btn-xs" title="duplizieren" @click="p.id && editor.duplicatePoint(p.id)">⎘</button>
              <button class="btn btn-ghost btn-xs text-error" title="löschen" @click="p.id && editor.removePoint(p.id)">✕</button>
            </li>
          </ul>

          <div class="px-2 pb-1">
            <select class="select select-xs select-bordered" @change="addPointTo(b.id, $event)">
              <option value="">+ Punkt …</option>
              <option v-for="t in POINT_TYPES" :key="t" :value="t">{{ POINT_LABELS[t] }}</option>
            </select>
          </div>
        </div>
        <p v-if="!editor.blocks.value.length" class="text-xs text-base-content/40">keine Blöcke</p>
      </div>
    </section>
  </div>
</template>
