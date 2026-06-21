<script setup lang="ts">
/**
 * Detail-Editor fuer den ausgewaehlten Block (#222, Stufen 1 + 5). Aenderungen committen ueber
 * editor.renameBlock / setBlockOptional / setBlockVisibleIf -> creator.updateBlock. id fix.
 */
import { computed } from 'vue'
import { useEditor } from '@/composables/editorKey'
import type { Block, Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'
import VisibleIfEditor from './VisibleIfEditor.vue'

const editor = useEditor()
const block = computed<Block | null>(() => editor.selectedBlock.value)
const visibleIf = computed<Predicate | undefined>(() => (block.value?.visibleIf as Predicate | undefined) ?? undefined)
</script>

<template>
  <div v-if="block" class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <span class="badge badge-neutral badge-sm">Block</span>
      <code class="text-xs text-base-content/50">{{ block.id }}</code>
    </div>

    <label class="form-control">
      <span class="label-text">Titel</span>
      <input class="input input-sm input-bordered" :value="block.title" @input="editor.renameBlock(block.id, ($event.target as HTMLInputElement).value)" />
    </label>

    <label class="label cursor-pointer justify-start gap-2 py-0">
      <input type="checkbox" class="toggle toggle-sm" :checked="block.optional === true" @change="editor.setBlockOptional(block.id, ($event.target as HTMLInputElement).checked)" />
      <span class="label-text">optionaler Block (nur aktiv, wenn im Einsatz zugeschaltet)</span>
    </label>

    <div class="divider my-0 text-xs">Sichtbarkeit</div>
    <VisibleIfEditor :target="'block'" :target-id="block.id" :current="visibleIf" />
  </div>

  <p v-else class="text-sm text-base-content/50">Keinen Block ausgewählt.</p>
</template>
