// previewFill.ts — Ableitungen fuer die Full-Fill-Vorschau-Maske (#fulltest / Bug B).
// Rein, editor-lokal, ohne Vue. Spiegelt die Wert-Shapes der App (PointInput.vue) GENAU so,
// wie der GETEILTE Renderer/runtime.mjs sie liest (Override-Typ aus render.d.mts):
//   field -> string | { excluded:true } | (leer -> undefined)
//   list  -> string[]            (runtime.listEntries liest das Array direkt)
//   finding -> { state } | { excluded:true } | (Standard -> undefined)
// packages/shared bleibt UNVERAENDERT (nur Typ/Renderer werden importiert).
import type { Override } from '@resqdocs/protocol-core/renderer/render.mjs'

// Punkt-Typen, die in der Maske ein WERT-Control bekommen. 'text' = nur Anzeige (read-only).
const FILLABLE = new Set(['field', 'finding', 'findingGroup', 'list', 'medikamente'])

/** Bekommt dieser Punkt-Typ ein Eingabe-Control? (findingGroup ueber seine Kinder.) */
export function isFillable(type: string | undefined): boolean {
  return FILLABLE.has(String(type ?? ''))
}

/** list-Override (oder Template-Default-Eintraege) -> Textarea-Text, ein Eintrag je Zeile. */
export function listValueToText(value: Override | undefined, fallbackEntries: string[] = []): string {
  let arr: unknown[]
  if (Array.isArray(value)) {
    arr = value
  } else {
    const inner = value && typeof value === 'object' ? (value as { value?: unknown }).value : undefined
    arr = Array.isArray(inner) ? inner : fallbackEntries
  }
  return arr.map((e) => String(e)).join('\n')
}

/** Textarea-Text -> list-Eintraege (leere Zeilen entfernt). Leer => [] (Aufrufer setzt dann undefined). */
export function listEntriesFromText(text: string): string[] {
  return String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
