<script setup lang="ts">
/** Didaktische Beispiele (#225): ein Klick laedt das Beispiel und springt in die Live-Vorschau. */
import { useLearn } from '@/composables/editorKey'
import { examples } from '@/data/examples'

const learn = useLearn()
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-base-content/70">
      Jedes Beispiel zeigt EIN Konzept; das letzte kombiniert alles. „Beispiel öffnen" lädt es und springt
      in die Live-Vorschau zum Ausprobieren. Das sind Lern-Beispiele, keine echten medizinischen Vorlagen.
    </p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="ex in examples" :key="ex.key" class="card border border-base-300">
        <div class="card-body gap-2 p-3">
          <div class="flex items-center gap-2">
            <h3 class="card-title text-sm">{{ ex.title }}</h3>
            <span class="badge badge-ghost badge-sm">{{ ex.focus }}</span>
          </div>
          <p class="text-xs text-base-content/70">{{ ex.description }}</p>
          <button class="btn btn-sm btn-primary self-start" @click="learn.openExample(ex.protocol)">Beispiel öffnen</button>
        </div>
      </div>
    </div>
  </div>
</template>
