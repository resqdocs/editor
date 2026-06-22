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

// ---- Ausfuell-Maske: Blöcke in PROTOKOLLREIHENFOLGE, optionale an IHRER Position (#258) ----
// Spiegelt das App-Muster (#49, ProtocolRuntimeView): displayBlocks = optional || sichtbar; der
// optionale Block erscheint an seiner Stelle mit Inline-Toggle (statt in einer Sammel-Sektion).

export type FillKind = 'field' | 'finding' | 'list' | 'text' | 'medikamente'
export interface FillControl {
  kind: FillKind
  id: string
  label: string
  entries?: string[]
  content?: string
  referenced: boolean
}
export interface FillGroup {
  blockId: string
  title: string
  optional: boolean
  active: boolean // nur fuer optional relevant (Toggle-Stand)
  visible: boolean // blockVisible -> Controls anzeigen (optional: aktiv && visibleIf)
  controls: FillControl[]
}

/** Geteilte Sichtbarkeit/Status — kapselt usePreviewState, damit buildFillGroups Vue-frei testbar bleibt. */
export interface FillVisibility {
  blockVisible(id: string): boolean
  isBlockActive(id: string): boolean
  pointVisible(id: string | undefined): boolean
  isReferenced(id: string): boolean
}

type AnyPoint = { id?: string; type?: string; [k: string]: unknown }
type AnyBlock = { id?: string; title?: unknown; optional?: unknown; points?: AnyPoint[] }

function plabel(p: Record<string, unknown>): string {
  return String(p.title ?? p.label ?? p.id ?? '')
}

function buildControls(b: AnyBlock, vis: FillVisibility): FillControl[] {
  const out: FillControl[] = []
  for (const p of b.points ?? []) {
    if (!p.id || !vis.pointVisible(p.id)) continue
    const bag = p as Record<string, unknown>
    const referenced = vis.isReferenced(p.id)
    switch (p.type) {
      case 'field':
        out.push({ kind: 'field', id: p.id, label: plabel(bag), referenced })
        break
      case 'finding':
        out.push({ kind: 'finding', id: p.id, label: plabel(bag), referenced })
        break
      case 'findingGroup': {
        const key = String(bag.key ?? '')
        for (const f of (bag.findings as Array<Record<string, unknown>>) ?? []) {
          if (typeof f.id === 'string') {
            out.push({ kind: 'finding', id: f.id, label: `${key} › ${plabel(f)}`, referenced: vis.isReferenced(f.id) })
          }
        }
        break
      }
      case 'list':
        out.push({ kind: 'list', id: p.id, label: plabel(bag), entries: (bag.entries as string[]) ?? [], referenced })
        break
      case 'text':
        out.push({ kind: 'text', id: p.id, label: plabel(bag), content: String(bag.content ?? ''), referenced })
        break
      case 'medikamente':
        out.push({ kind: 'medikamente', id: p.id, label: plabel(bag), referenced })
        break
    }
  }
  return out
}

/**
 * Ausfuell-Gruppen in Dokumentreihenfolge. Optionale Blöcke werden IMMER aufgenommen (Inline-Toggle
 * an ihrer Position), auch wenn inaktiv (dann visible=false, controls=[]); normale Blöcke nur, wenn
 * sichtbar UND nicht leer (wie zuvor). Gleiche Sichtbarkeit wie der Renderer -> Maske ↔ Ausgabe
 * bleiben konsistent.
 */
export function buildFillGroups(blocks: AnyBlock[], vis: FillVisibility): FillGroup[] {
  const out: FillGroup[] = []
  for (const b of blocks ?? []) {
    const id = String(b.id ?? '')
    const optional = b.optional === true
    const visible = vis.blockVisible(id)
    if (!optional && !visible) continue // normaler, unsichtbarer Block -> weg (z. B. visibleIf false)
    const controls = visible ? buildControls(b, vis) : []
    if (!optional && controls.length === 0) continue // leerer normaler Block -> weg (wie bisher)
    out.push({ blockId: id, title: String(b.title ?? id), optional, active: vis.isBlockActive(id), visible, controls })
  }
  return out
}
