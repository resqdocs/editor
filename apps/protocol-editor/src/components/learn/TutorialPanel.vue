<script setup lang="ts">
/** Gestuftes, ueberspringbares Tutorial (#225): Kapitel-Navigation, aktuelles Kapitel, „Beispiel
 *  oeffnen & ausprobieren" (aktives Lernen). An jedem Punkt aussteigbar (skip). */
import { computed } from 'vue'
import { useLearn } from '@/composables/editorKey'
import { examples } from '@/data/examples'

const learn = useLearn()
const t = learn.tutorial

const exampleFor = computed(() => {
  const key = t.current.value.exampleKey
  return key ? (examples.find((e) => e.key === key) ?? null) : null
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <progress class="progress progress-primary w-32" :value="t.progress.value" max="100"></progress>
      <span class="text-xs text-base-content/60">Kapitel {{ t.index.value + 1 }} / {{ t.total }}</span>
      <button class="btn btn-ghost btn-xs ml-auto" @click="t.skip()">Tutorial überspringen</button>
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        v-for="(c, i) in t.tutorial"
        :key="c.id"
        class="btn btn-xs"
        :class="i === t.index.value ? 'btn-primary' : 'btn-ghost'"
        :title="c.title"
        @click="t.goto(i)"
      >
        <span v-if="t.isDone(c.id)">✓</span>{{ i + 1 }}
      </button>
    </div>

    <div class="card border border-base-300">
      <div class="card-body gap-2 p-4">
        <h3 class="card-title text-base">{{ t.current.value.title }}</h3>
        <p class="text-sm">{{ t.current.value.intro }}</p>
        <ul class="list-disc pl-5 text-sm">
          <li v-for="(p, i) in t.current.value.points" :key="i">{{ p }}</li>
        </ul>
        <div v-if="exampleFor" class="mt-1 rounded-box bg-base-200 p-3 text-sm">
          <p class="mb-1">Probier es aus: <strong>{{ exampleFor.title }}</strong></p>
          <p v-if="t.current.value.tryHint" class="text-xs text-base-content/70">{{ t.current.value.tryHint }}</p>
          <button class="btn btn-sm btn-primary mt-2" @click="learn.openExample(exampleFor.protocol)">
            Beispiel öffnen &amp; ausprobieren
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button class="btn btn-sm" :disabled="t.isFirst.value" @click="t.prev()">Zurück</button>
      <button class="btn btn-ghost btn-sm" @click="t.skip()">Aussteigen</button>
      <button class="btn btn-primary btn-sm ml-auto" @click="t.next()">{{ t.isLast.value ? 'Fertig' : 'Weiter' }}</button>
    </div>
  </div>
</template>
