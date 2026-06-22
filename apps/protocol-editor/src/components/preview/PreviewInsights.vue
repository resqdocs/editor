<script setup lang="ts">
/**
 * Vorschau-Hinweise (#224): macht sichtbar, WAS gerade den Output steuert —
 * (a) aktive Gender-Tokens aus der geteilten runtime-Grammatik (ctx.grammar, NICHT nachgebaut),
 * (b) welche Bloecke/Punkte beim aktuellen Zustand sichtbar vs. ausgeblendet sind (getVisible*).
 * Reines Lese-/Lern-Overlay; aendert nichts.
 */
import { computed } from 'vue'
import { useEditor, usePreview } from '@/composables/editorKey'
import { displayName } from '@/utils/displayName'

const editor = useEditor()
const preview = usePreview()

const blockCount = computed(() => editor.blocks.value.length)
const visibleBlockCount = computed(() => editor.blocks.value.filter((b) => preview.blockVisible(b.id)).length)

function token(k: string): string {
  return `{{${k}}}`
}
</script>

<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body gap-3 p-4">
      <h2 class="card-title text-base">Was steuert den Output?</h2>

      <!-- Gender-Tokens aus runtime ctx.grammar -->
      <div v-if="preview.genderTokens.value.length">
        <h3 class="mb-1 text-sm font-semibold">Aktive Gender-Grammatik</h3>
        <div class="flex flex-wrap gap-1">
          <span v-for="[k, val] in preview.genderTokens.value" :key="k" class="badge badge-outline badge-sm font-mono">
            {{ token(k) }} → {{ val }}
          </span>
        </div>
        <p class="mt-1 text-xs text-base-content/50">aus <code>runtime.mjs</code> (de-gender), nicht nachgebaut</p>
      </div>

      <!-- Sichtbarkeit -->
      <div>
        <h3 class="mb-1 text-sm font-semibold">Sichtbarkeit ({{ visibleBlockCount }}/{{ blockCount }} Blöcke)</h3>
        <div class="flex flex-col gap-1">
          <div v-for="b in editor.blocks.value" :key="b.id" :class="preview.blockVisible(b.id) ? '' : 'opacity-40'">
            <div class="flex items-center gap-1 text-sm">
              <span class="badge badge-xs" :class="preview.blockVisible(b.id) ? 'badge-success' : 'badge-ghost'">
                {{ preview.blockVisible(b.id) ? 'sichtbar' : 'aus' }}
              </span>
              <span class="font-medium">{{ b.title }}</span>
              <span v-if="b.optional" class="badge badge-outline badge-xs">opt</span>
              <span v-if="b.visibleIf" class="badge badge-ghost badge-xs">bedingt</span>
            </div>
            <ul v-if="preview.blockVisible(b.id)" class="pl-5 text-xs">
              <li v-for="(p, i) in b.points ?? []" :key="p.id ?? i" :class="preview.pointVisible(p.id) ? '' : 'text-base-content/40 line-through'">
                {{ displayName(p) }}
                <span v-if="p.visibleIf && !preview.pointVisible(p.id)">— ausgeblendet</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
