<script setup lang="ts">
/**
 * Editor fuer die Kind-Befunde einer findingGroup (xABCDE) (#222, Stufe 3).
 * Controlled: gibt das KOMPLETTE neue findings-Array hoch; der Aufrufer persistiert es ueber
 * updatePoint({ findings }). updatePoint re-keyt die Kinder (vergibt fehlende ids), daher
 * koennen neue Kinder ohne id angelegt werden. Kind-id ist nach Vergabe nicht editierbar.
 */
import StringListEditor from './StringListEditor.vue'

interface FindingChild {
  id?: string
  label?: string
  normal: string
  variants?: string[]
  value?: string
  state?: 'normal' | 'abnormal'
}

const props = defineProps<{ modelValue: FindingChild[] }>()
const emit = defineEmits<{ 'update:modelValue': [FindingChild[]] }>()

function patchAt(i: number, patch: Partial<FindingChild>): void {
  const next = props.modelValue.map((f, idx) => (idx === i ? { ...f, ...patch } : f))
  emit('update:modelValue', next)
}
function add(): void {
  emit('update:modelValue', [...props.modelValue, { label: 'Neuer Befund', normal: '' }])
}
function removeAt(i: number): void {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
function move(i: number, dir: -1 | 1): void {
  const j = i + dir
  if (j < 0 || j >= props.modelValue.length) return
  const next = props.modelValue.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="(f, i) in modelValue" :key="f.id ?? i" class="rounded-box border border-base-300 p-2">
      <div class="flex items-center gap-2">
        <span class="badge badge-ghost badge-xs">{{ f.id ?? 'neu' }}</span>
        <button class="btn btn-ghost btn-xs ml-auto" :disabled="i === 0" title="hoch" @click="move(i, -1)">↑</button>
        <button class="btn btn-ghost btn-xs" :disabled="i === modelValue.length - 1" title="runter" @click="move(i, 1)">↓</button>
        <button class="btn btn-ghost btn-xs text-error" title="entfernen" @click="removeAt(i)">✕</button>
      </div>
      <div class="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
        <label class="form-control">
          <span class="label-text text-xs">Label</span>
          <input class="input input-xs input-bordered" :value="f.label ?? ''" @input="patchAt(i, { label: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Normalbefund</span>
          <input class="input input-xs input-bordered" :value="f.normal ?? ''" @input="patchAt(i, { normal: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Default-Status</span>
          <select class="select select-xs select-bordered" :value="f.state ?? 'normal'" @change="patchAt(i, { state: ($event.target as HTMLSelectElement).value as 'normal' | 'abnormal' })">
            <option value="normal">normal</option>
            <option value="abnormal">abnormal</option>
          </select>
        </label>
      </div>
      <div class="mt-1">
        <span class="label-text text-xs">Varianten (alternative Normalbefund-Texte)</span>
        <StringListEditor :model-value="f.variants ?? []" placeholder="Variante" add-label="Variante" @update:model-value="patchAt(i, { variants: $event })" />
      </div>
    </div>
    <button class="btn btn-ghost btn-xs self-start" @click="add">+ Befund</button>
  </div>
</template>
