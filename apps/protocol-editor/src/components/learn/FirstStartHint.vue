<script setup lang="ts">
/** Dezenter Erststart-Hinweis aufs Tutorial (#225). Draengt nichts auf — beides ist ein Klick weg. */
defineEmits<{ start: []; dismiss: [] }>()
</script>

<template>
  <div class="alert flex-wrap gap-2 py-2 text-sm">
    <span>Neu hier? Ein kurzes, jederzeit überspringbares Tutorial zeigt dir Schritt für Schritt alles.</span>
    <div class="ml-auto flex gap-2">
      <button class="btn btn-sm btn-primary" @click="$emit('start')">Tutorial starten</button>
      <button class="btn btn-sm btn-ghost" @click="$emit('dismiss')">Später</button>
    </div>
  </div>
</template>
