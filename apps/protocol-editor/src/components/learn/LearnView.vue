<script setup lang="ts">
/** „Lernen"-Bereich (#225): Tabs Tutorial / Beispiele / Referenz. Getrennter, nicht aufdraengender
 *  Lern-Raum — die Editier-UI bleibt unbelastet. */
import { ref } from 'vue'
import TutorialPanel from './TutorialPanel.vue'
import ExamplesPanel from './ExamplesPanel.vue'
import ReferencePanel from './ReferencePanel.vue'

const tab = ref<'tutorial' | 'beispiele' | 'referenz'>('tutorial')
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body gap-4 p-4">
      <div role="tablist" class="tabs tabs-boxed self-start">
        <button role="tab" class="tab" :class="tab === 'tutorial' ? 'tab-active' : ''" @click="tab = 'tutorial'">Tutorial</button>
        <button role="tab" class="tab" :class="tab === 'beispiele' ? 'tab-active' : ''" @click="tab = 'beispiele'">Beispiele</button>
        <button role="tab" class="tab" :class="tab === 'referenz' ? 'tab-active' : ''" @click="tab = 'referenz'">Referenz</button>
      </div>

      <TutorialPanel v-if="tab === 'tutorial'" />
      <ExamplesPanel v-else-if="tab === 'beispiele'" />
      <ReferencePanel v-else />
    </div>
  </div>
</template>
