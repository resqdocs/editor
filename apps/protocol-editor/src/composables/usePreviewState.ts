// usePreviewState.ts — FLUECHTIGER Vorschau-/Einsatz-Zustand fuer die Live-Vorschau (#224).
//
// WICHTIG: Dieser Zustand ist KEIN Teil der gespeicherten Vorlage. Er fuettert nur den caseState,
// mit dem render() rendert — zum Lernen/Ausprobieren. Export (Slice 4) enthaelt weiterhin NUR das
// Template. Sichtbarkeit + Gender werden ueber die GETEILTEN runtime-Funktionen abgeleitet
// (buildContext/getVisibleBlocks/getVisiblePoints + ctx.grammar) — NICHTS davon nachgebaut.
import { computed, reactive, ref, toRaw, type Ref } from 'vue'
import {
  buildContext,
  getVisibleBlocks,
  getVisiblePoints,
  type RenderContext,
} from '@resqdocs/protocol-core/renderer/runtime.mjs'
import type { Protocol, Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'
import type { Override, RenderCase } from '@resqdocs/protocol-core/renderer/render.mjs'

function collectPointSubjects(pred: Predicate | undefined, into: Set<string>): void {
  if (!pred || typeof pred !== 'object') return
  if (typeof pred.point === 'string') into.add(pred.point)
  for (const c of pred.all ?? []) collectPointSubjects(c, into)
  for (const c of pred.any ?? []) collectPointSubjects(c, into)
  if (pred.not) collectPointSubjects(pred.not, into)
}

export function usePreviewState(protocol: Ref<Protocol>) {
  const variableValues = reactive<Record<string, unknown>>({})
  const values = reactive<Record<string, Override>>({})
  const activeBlocks = ref<string[]>([])

  /** Der an render()/buildContext uebergebene Einsatz-Zustand (frische, einfache Objekte). */
  const caseState = computed<RenderCase>(() => ({
    variableValues: { ...variableValues },
    values: { ...values },
    activeBlocks: [...activeBlocks.value],
  }))

  /** Aufgeloester Kontext (vom geteilten Runtime gebaut) — Quelle fuer Sichtbarkeit + Gender. */
  const ctx = computed<RenderContext>(() => buildContext(toRaw(protocol.value), caseState.value))

  // ----- Variablen -----
  function varValue(id: string, fallback: unknown): unknown {
    return id in variableValues ? variableValues[id] : fallback
  }
  function setVariable(id: string, value: unknown): void {
    if (value === undefined) delete variableValues[id]
    else variableValues[id] = value
  }

  // ----- Punkt-/Befund-Zustaende -----
  function getValue(id: string): Override | undefined {
    return id in values ? values[id] : undefined
  }
  function setValue(id: string, value: Override | undefined): void {
    if (value === undefined) delete values[id]
    else values[id] = value
  }

  // ----- Optionale Bloecke -----
  function isBlockActive(id: string): boolean {
    return activeBlocks.value.includes(id)
  }
  function toggleBlock(id: string, on: boolean): void {
    const has = activeBlocks.value.includes(id)
    if (on && !has) activeBlocks.value = [...activeBlocks.value, id]
    else if (!on && has) activeBlocks.value = activeBlocks.value.filter((x) => x !== id)
  }

  function reset(): void {
    for (const k of Object.keys(variableValues)) delete variableValues[k]
    for (const k of Object.keys(values)) delete values[k]
    activeBlocks.value = []
  }

  /** true, sobald irgendein Vorschau-Wert gesetzt ist (neutral vs. ausgefuellt). */
  const hasOverrides = computed(
    () => Object.keys(variableValues).length > 0 || Object.keys(values).length > 0 || activeBlocks.value.length > 0,
  )

  // ----- Gender (aus runtime ctx.grammar, NICHT nachgebaut) -----
  const genderTokens = computed<Array<[string, string]>>(() => Object.entries(ctx.value.grammar))

  // ----- Sichtbarkeit (aus runtime getVisibleBlocks/getVisiblePoints, NICHT nachgebaut) -----
  const visibleBlockIds = computed<Set<string>>(
    () => new Set(getVisibleBlocks(toRaw(protocol.value), ctx.value).map((b) => b.id)),
  )
  const visiblePointIds = computed<Set<string>>(() => {
    const out = new Set<string>()
    for (const b of toRaw(protocol.value).blocks ?? []) {
      for (const p of getVisiblePoints(b, ctx.value)) if (p.id) out.add(p.id)
    }
    return out
  })
  function blockVisible(id: string): boolean {
    return visibleBlockIds.value.has(id)
  }
  function pointVisible(id: string | undefined): boolean {
    return id ? visiblePointIds.value.has(id) : false
  }

  /** Punkt-ids, die in irgendeinem visibleIf als `point`-Subjekt vorkommen (fuer gezielte Controls). */
  const referencedPointIds = computed<Set<string>>(() => {
    const s = new Set<string>()
    const p = toRaw(protocol.value)
    for (const b of p.blocks ?? []) {
      collectPointSubjects(b.visibleIf, s)
      for (const pt of b.points ?? []) collectPointSubjects(pt.visibleIf, s)
    }
    return s
  })

  return {
    caseState,
    ctx,
    varValue,
    setVariable,
    getValue,
    setValue,
    isBlockActive,
    toggleBlock,
    reset,
    hasOverrides,
    genderTokens,
    blockVisible,
    pointVisible,
    referencedPointIds,
  }
}

export type PreviewState = ReturnType<typeof usePreviewState>
