<script setup lang="ts">
/**
 * Wiederverwendbarer Editor fuer eine string[]-Liste (list.entries, finding.variants,
 * field.options-Vorschlaege, visibleIf `in`-Werte). Controlled: gibt bei jeder Aenderung
 * das KOMPLETTE neue Array hoch — der Aufrufer persistiert es ueber die passende
 * creator-Funktion (updatePoint/updateVariable). Hier KEINE Protokoll-Mutation.
 */
const props = defineProps<{ modelValue: string[]; placeholder?: string; addLabel?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

function setAt(i: number, val: string): void {
  const next = props.modelValue.slice()
  next[i] = val
  emit('update:modelValue', next)
}
function add(): void {
  emit('update:modelValue', [...props.modelValue, ''])
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
  <div class="flex flex-col gap-1">
    <div v-for="(item, i) in modelValue" :key="i" class="flex items-center gap-1">
      <input
        class="input input-sm input-bordered flex-1"
        :value="item"
        :placeholder="placeholder"
        @input="setAt(i, ($event.target as HTMLInputElement).value)"
      />
      <button class="btn btn-ghost btn-xs" :disabled="i === 0" title="hoch" @click="move(i, -1)">↑</button>
      <button
        class="btn btn-ghost btn-xs"
        :disabled="i === modelValue.length - 1"
        title="runter"
        @click="move(i, 1)"
      >↓</button>
      <button class="btn btn-ghost btn-xs text-error" title="entfernen" @click="removeAt(i)">✕</button>
    </div>
    <button class="btn btn-ghost btn-xs self-start" @click="add">+ {{ addLabel ?? 'Eintrag' }}</button>
  </div>
</template>
