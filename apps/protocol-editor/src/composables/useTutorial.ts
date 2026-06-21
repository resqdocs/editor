// useTutorial.ts — Fortschritt des gestuften Tutorials (#225). REIN IM EDITOR-STATE (Vue-Refs),
// KEIN localStorage — wie die uebrige State-Haltung im Editor (fluechtig, kein Persistenz-Layer).
// An JEDEM Punkt ueberspringbar: skip() beendet das ganze Tutorial, pro Kapitel navigierbar.
import { computed, ref } from 'vue'
import { tutorial, type TutorialChapter } from '@/data/tutorial'

export function useTutorial() {
  const total = tutorial.length
  const index = ref(0)
  const completed = ref<string[]>([])
  const started = ref(false)
  const dismissed = ref(false) // Tutorial uebersprungen / Erststart-Hinweis weg

  const current = computed<TutorialChapter>(() => tutorial[index.value])
  const isFirst = computed(() => index.value === 0)
  const isLast = computed(() => index.value === total - 1)
  const progress = computed(() => Math.round((completed.value.length / total) * 100))
  const isDone = (id: string): boolean => completed.value.includes(id)

  function markDone(id: string): void {
    if (!completed.value.includes(id)) completed.value = [...completed.value, id]
  }
  function start(): void {
    started.value = true
    dismissed.value = false
    index.value = 0
  }
  function goto(i: number): void {
    if (i >= 0 && i < total) index.value = i
  }
  function next(): void {
    markDone(current.value.id)
    if (!isLast.value) index.value++
    else finish()
  }
  function prev(): void {
    if (!isFirst.value) index.value--
  }
  /** Ganzes Tutorial ueberspringen / „spaeter". */
  function skip(): void {
    dismissed.value = true
    started.value = false
  }
  function finish(): void {
    markDone(current.value.id)
    dismissed.value = true
    started.value = false
  }

  return {
    tutorial,
    total,
    index,
    current,
    completed,
    started,
    dismissed,
    isFirst,
    isLast,
    progress,
    isDone,
    markDone,
    start,
    goto,
    next,
    prev,
    skip,
    finish,
  }
}

export type Tutorial = ReturnType<typeof useTutorial>
