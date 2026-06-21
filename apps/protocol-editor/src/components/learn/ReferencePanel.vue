<script setup lang="ts">
/** Nachschlage-Referenz (#225): knapp, jedes Stichwort mit Mini-Beispiel. Getrennt vom Tutorial. */
import { reference } from '@/data/reference'
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-base-content/70">
      Kurzes Nachschlagewerk — jedes Stichwort mit Mini-Beispiel. Für alle, die tiefer einsteigen wollen.
    </p>
    <section v-for="s in reference" :key="s.id">
      <h3 class="text-sm font-semibold">{{ s.title }}</h3>
      <p class="text-xs text-base-content/60">{{ s.intro }}</p>
      <div class="mt-1 overflow-x-auto">
        <table class="table table-xs">
          <tbody>
            <tr v-for="e in s.entries" :key="e.term">
              <td class="align-top font-medium whitespace-nowrap">{{ e.term }}</td>
              <td class="align-top">
                {{ e.what }}
                <div class="text-base-content/50">{{ e.example }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
