<script setup lang="ts">
/**
 * Detail-Editor fuer die ausgewaehlte Variable (#222, Stufe 4). Aenderungen committen ueber
 * editor.updateVariable -> creator.updateVariable. id + Typ sind nach Anlage fix (creator-Regel).
 * select braucht zwingend options; Gender-Grammatik (de-gender) liefert {{der_die}}/{{er_sie}}/…
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import type { Variable } from '@resqdocs/protocol-core/creator/creator.mjs'

interface Option {
  value: string
  label: string
}

const editor = useEditor()
const variable = computed<Variable | null>(() => editor.selectedVariable.value)

function set(patch: Partial<Variable>): void {
  if (variable.value) editor.updateVariable(variable.value.id, patch)
}
const options = computed<Option[]>(() => (Array.isArray(variable.value?.options) ? (variable.value!.options as Option[]) : []))

function setOptions(next: Option[]): void {
  set({ options: next })
}
function patchOption(i: number, patch: Partial<Option>): void {
  setOptions(options.value.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
}
function addOption(): void {
  const n = options.value.length + 1
  setOptions([...options.value, { value: `option-${n}`, label: `Option ${n}` }])
}
function removeOption(i: number): void {
  setOptions(options.value.filter((_, idx) => idx !== i))
}
function moveOption(i: number, dir: -1 | 1): void {
  const j = i + dir
  if (j < 0 || j >= options.value.length) return
  const next = options.value.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  setOptions(next)
}

function setDefault(raw: string, kind: 'text' | 'number'): void {
  set({ default: kind === 'number' ? (raw === '' ? '' : Number(raw)) : raw })
}
</script>

<template>
  <div v-if="variable" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-secondary badge-sm">{{ variable.type }}</span>
      <code class="text-xs text-base-content/50">{{ variable.id }}</code>
      <span class="text-xs text-base-content/40">(Typ &amp; id nach Anlage fix)</span>
    </div>

    <label class="form-control">
      <span class="label-text">Label</span>
      <input class="input input-sm input-bordered" :value="variable.label ?? ''" @input="set({ label: ($event.target as HTMLInputElement).value })" />
    </label>

    <!-- select: Optionen + Default -->
    <template v-if="variable.type === 'select'">
      <div class="form-control">
        <span class="label-text">Optionen (Wert + Anzeige)</span>
        <div class="flex flex-col gap-1">
          <div v-for="(o, i) in options" :key="i" class="flex items-center gap-1">
            <input class="input input-xs input-bordered w-28" :value="o.value" placeholder="wert" @input="patchOption(i, { value: ($event.target as HTMLInputElement).value })" />
            <input class="input input-xs input-bordered flex-1" :value="o.label" placeholder="Anzeige" @input="patchOption(i, { label: ($event.target as HTMLInputElement).value })" />
            <button class="btn btn-ghost btn-xs" :disabled="i === 0" @click="moveOption(i, -1)">↑</button>
            <button class="btn btn-ghost btn-xs" :disabled="i === options.length - 1" @click="moveOption(i, 1)">↓</button>
            <button class="btn btn-ghost btn-xs text-error" @click="removeOption(i)">✕</button>
          </div>
          <button class="btn btn-ghost btn-xs self-start" @click="addOption">+ Option</button>
        </div>
      </div>
      <label class="form-control">
        <span class="label-text">Default</span>
        <select class="select select-sm select-bordered" :value="String(variable.default ?? '')" @change="set({ default: ($event.target as HTMLSelectElement).value })">
          <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <label class="label cursor-pointer justify-start gap-2 py-0">
        <input type="checkbox" class="toggle toggle-sm" :checked="variable.grammar === 'de-gender'" @change="set({ grammar: ($event.target as HTMLInputElement).checked ? 'de-gender' : undefined })" />
        <span class="label-text">Gender-Grammatik (de-gender: <code v-pre>{{der_die}}/{{er_sie}}/{{patient}}</code>)</span>
      </label>
    </template>

    <!-- boolean -->
    <label v-else-if="variable.type === 'boolean'" class="label cursor-pointer justify-start gap-2 py-0">
      <input type="checkbox" class="toggle toggle-sm" :checked="variable.default === true" @change="set({ default: ($event.target as HTMLInputElement).checked })" />
      <span class="label-text">Default an</span>
    </label>

    <!-- number -->
    <label v-else-if="variable.type === 'number'" class="form-control">
      <span class="label-text">Default (Zahl)</span>
      <input type="number" class="input input-sm input-bordered" :value="String(variable.default ?? '')" @input="setDefault(($event.target as HTMLInputElement).value, 'number')" />
    </label>

    <!-- text -->
    <label v-else class="form-control">
      <span class="label-text">Default</span>
      <input class="input input-sm input-bordered" :value="String(variable.default ?? '')" @input="setDefault(($event.target as HTMLInputElement).value, 'text')" />
    </label>
  </div>

  <p v-else class="text-sm text-base-content/50">Keine Variable ausgewählt.</p>
</template>
