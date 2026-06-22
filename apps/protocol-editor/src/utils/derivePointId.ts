// derivePointId.ts — A2 (#70-Folge): leitet die Punkt-id EINMALIG aus dem ersten echten
// Titel/Label ab (sprechend statt "neues-feld") und friert sie danach EIN. Bewusst KEIN Remap:
// die Ableitung greift nur, solange KEIN visibleIf den Punkt referenziert — die einzige
// Punkt-id-Referenz im Template (es gibt keinen {{point:id}}-Textplatzhalter, nur {{var:id}}).
// Editor-lokal; packages/shared bleibt UNBERUEHRT (importiert nur die exportierten Helfer).
import { collectProtocolIds, createUniqueId } from '@resqdocs/protocol-core/creator/creator.mjs'
import type { Protocol, Predicate } from '@resqdocs/protocol-core/creator/creator.mjs'

/** Sammelt rekursiv alle Punkt-ids, die in einem visibleIf als `point`-Subjekt vorkommen. */
function collectPointSubjects(pred: Predicate | undefined, into: Set<string>): void {
  if (!pred || typeof pred !== 'object') return
  const p = pred as { point?: unknown; all?: Predicate[]; any?: Predicate[]; not?: Predicate }
  if (typeof p.point === 'string') into.add(p.point)
  for (const c of p.all ?? []) collectPointSubjects(c, into)
  for (const c of p.any ?? []) collectPointSubjects(c, into)
  if (p.not) collectPointSubjects(p.not, into)
}

/**
 * Sicherheitsbedingung (b): Wird `pointId` von IRGENDEINEM Block- oder Punkt-visibleIf als
 * `point`-Subjekt referenziert? Wenn ja, darf A2 die id NICHT ableiten (das waere ein Rename
 * mit Remap = A1, hier ausgeschlossen).
 */
export function isPointReferenced(protocol: Protocol, pointId: string): boolean {
  const s = new Set<string>()
  for (const b of protocol.blocks ?? []) {
    collectPointSubjects(b.visibleIf as Predicate | undefined, s)
    for (const pt of b.points ?? []) collectPointSubjects(pt.visibleIf as Predicate | undefined, s)
  }
  return s.has(pointId)
}

/**
 * Leitet aus `base` (Titel||Label) eine sprechende, kollisionsfreie id ab — geprueft gegen den
 * GANZEN flachen id-Namespace (Variablen+Bloecke+Punkte+Befunde) ausser dem Punkt selbst.
 * Gibt die neue id zurueck — oder null, wenn die Basis leer ist (Bedingung c) oder die
 * abgeleitete id der aktuellen entspricht (nichts zu tun).
 */
export function computeDerivedId(protocol: Protocol, pointId: string, base: string): string | null {
  const b = String(base ?? '').trim()
  if (!b) return null
  const ids = collectProtocolIds(protocol)
  ids.delete(pointId)
  const next = createUniqueId(b, ids)
  return next === pointId ? null : next
}

/**
 * Reine, immutable Aenderung der id GENAU EINES Punkts (Tiefkopie via JSON; KEIN Remap — der
 * Aufrufer garantiert ueber isPointReferenced, dass der Punkt unreferenziert ist, sodass keine
 * Referenz mitwandern muss).
 */
export function withPointId(protocol: Protocol, oldId: string, newId: string): Protocol {
  const next = JSON.parse(JSON.stringify(protocol)) as Protocol
  for (const b of next.blocks ?? []) {
    for (const pt of b.points ?? []) {
      if (pt.id === oldId) pt.id = newId
    }
  }
  return next
}
