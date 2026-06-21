<script setup lang="ts">
/**
 * visibleIf-Editor fuer Block ODER Punkt (#222, Stufe 5). Schaltet die Bedingung an/aus und
 * haelt den VOLLEN Bedingungsbaum (rekursiv via PredicateNode). Der lokale `node` ist der
 * Edit-Puffer; bei jeder Aenderung wird daraus ein Predicate gebaut (buildPredicate, Blaetter
 * ueber creator.createSimpleVisibleIf) und ueber die Editor-Wrapper persistiert
 * (set*VisibleIf -> updateBlock/updatePoint). Unvollstaendige Baeume persistieren als „keine
 * Bedingung", bleiben aber im Puffer editierbar.
 */
import { ref, watch } from 'vue'
import { useEditor } from '@/composables/editorKey'
import { parsePredicate, buildPredicate, emptyLeaf, describePredicate, type PredNode } from '@/composables/visibleIfModel'
import type { Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'
import PredicateNode from './PredicateNode.vue'

const props = defineProps<{ target: 'block' | 'point'; targetId: string; current: Predicate | undefined }>()
const editor = useEditor()

const node = ref<PredNode | null>(null)

// Nur bei Auswahlwechsel aus dem aktuellen Draft neu einlesen (NICHT bei jeder Persistenz,
// sonst Feedback-Schleife waehrend des Tippens).
watch(
  () => props.targetId,
  () => {
    node.value = props.current ? parsePredicate(props.current) : null
  },
  { immediate: true },
)

function persist(): void {
  const pred = buildPredicate(node.value)
  if (props.target === 'block') editor.setBlockVisibleIf(props.targetId, pred)
  else editor.setPointVisibleIf(props.targetId, pred)
}

function toggle(on: boolean): void {
  node.value = on ? (node.value ?? emptyLeaf()) : null
  persist()
}
function onRootChange(next: PredNode): void {
  node.value = next
  persist()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="label cursor-pointer justify-start gap-2 py-0">
      <input type="checkbox" class="toggle toggle-sm" :checked="node !== null" @change="toggle(($event.target as HTMLInputElement).checked)" />
      <span class="label-text">Sichtbar nur, wenn …</span>
    </label>

    <PredicateNode v-if="node" :model-value="node" :depth="0" @update:model-value="onRootChange" />

    <p v-if="current" class="text-xs text-base-content/50">
      Aktiv gespeichert: <code>{{ describePredicate(current) }}</code>
    </p>
    <p v-else class="text-xs text-base-content/50">Keine Bedingung gespeichert (immer sichtbar).</p>
  </div>
</template>
