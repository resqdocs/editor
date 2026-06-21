// visibleIfModel.ts — reine (Vue-freie) Hilfslogik fuer den visibleIf-Baum-Editor (#222, Stufe 5).
//
// Der Editor bearbeitet den VOLLEN deklarativen Bedingungsbaum (Subjekte var|point;
// Operatoren eq|in|truthy|filled|state; Kombinatoren all|any|not, beliebig verschachtelt).
// Die geteilte Logik (creator.mjs) liefert NUR den Leaf-Konstruktor createSimpleVisibleIf
// und den Detektor isSimpleVisibleIf — fuer all/any/not gibt es bewusst keinen Builder.
// Daher: Blaetter werden ueber createSimpleVisibleIf (Domain) gebaut, die Kombinatoren
// sind reine, schema-valide Datencontainer ({all:[...]}/{any:[...]}/{not:...}). Die
// eigentliche MUTATION (Setzen von block/point.visibleIf) laeuft im Editor ueber
// updateBlock/updatePoint; die Gueltigkeit garantiert assertValidProtocolDraft.
//
// Diese Datei enthaelt KEINE Protokoll-Mutation — nur Umwandlung zwischen Predicate und
// einem editierbaren Knotenmodell (parse/build) plus Beschreibung. Rein + testbar.
import { createSimpleVisibleIf, type Predicate, type SimpleOp } from '@resqdocs/protocol-core/creator/creator.mjs'

export type PredSource = 'var' | 'point'
export type PredKind = 'leaf' | 'all' | 'any' | 'not'

export interface LeafNode {
  kind: 'leaf'
  source: PredSource
  id: string
  op: SimpleOp
  /** eq: string | in: string[] | truthy/filled: boolean | state: 'normal'|'abnormal' */
  value: unknown
}
export interface GroupNode {
  kind: 'all' | 'any'
  children: PredNode[]
}
export interface NotNode {
  kind: 'not'
  child: PredNode
}
export type PredNode = LeafNode | GroupNode | NotNode

/** Operatoren je Subjekt — `state` nur fuer point (createSimpleVisibleIf erzwingt das). */
export function opsForSource(source: PredSource): SimpleOp[] {
  return source === 'point' ? ['eq', 'in', 'truthy', 'filled', 'state'] : ['eq', 'in', 'truthy', 'filled']
}

/** Sinnvoller Default-Wert je Operator (fuer frische Leafs / Operatorwechsel). */
export function defaultValueForOp(op: SimpleOp): unknown {
  switch (op) {
    case 'in':
      return [] as string[]
    case 'truthy':
    case 'filled':
      return true
    case 'state':
      return 'abnormal'
    default:
      return ''
  }
}

export function emptyLeaf(source: PredSource = 'var'): LeafNode {
  return { kind: 'leaf', source, id: '', op: 'eq', value: '' }
}

/** Predicate (aus geladenem Draft) -> editierbares Knotenmodell. */
export function parsePredicate(pred: Predicate | null | undefined): PredNode {
  if (pred && typeof pred === 'object') {
    if (Array.isArray(pred.all)) return { kind: 'all', children: pred.all.map(parsePredicate) }
    if (Array.isArray(pred.any)) return { kind: 'any', children: pred.any.map(parsePredicate) }
    if (pred.not && typeof pred.not === 'object') return { kind: 'not', child: parsePredicate(pred.not) }
    const source: PredSource = 'point' in pred ? 'point' : 'var'
    const id = String((source === 'point' ? pred.point : pred.var) ?? '')
    const op = (['eq', 'in', 'truthy', 'filled', 'state'] as SimpleOp[]).find((o) => o in pred)
    if (op) return { kind: 'leaf', source, id, op, value: normalizeValue(op, (pred as Record<string, unknown>)[op]) }
    return { kind: 'leaf', source, id, op: 'eq', value: '' }
  }
  return emptyLeaf()
}

function normalizeValue(op: SimpleOp, raw: unknown): unknown {
  if (op === 'in') return Array.isArray(raw) ? raw.map((x) => String(x)) : []
  if (op === 'truthy' || op === 'filled') return raw !== false
  if (op === 'state') return raw === 'normal' ? 'normal' : 'abnormal'
  return raw == null ? '' : raw
}

/**
 * Knotenmodell -> Predicate. Blaetter ueber createSimpleVisibleIf (Domain), Kombinatoren
 * als Datencontainer. Unvollstaendige Knoten (Leaf ohne id, leere Gruppe) -> null.
 */
export function buildPredicate(node: PredNode | null): Predicate | null {
  if (!node) return null
  if (node.kind === 'leaf') {
    if (!node.id) return null
    try {
      return createSimpleVisibleIf({ source: node.source, id: node.id, op: node.op, value: node.value })
    } catch {
      return null
    }
  }
  if (node.kind === 'not') {
    const child = buildPredicate(node.child)
    return child ? { not: child } : null
  }
  const children = node.children.map(buildPredicate).filter((p): p is Predicate => p !== null)
  if (children.length === 0) return null
  return node.kind === 'all' ? { all: children } : { any: children }
}

/** Kompakte, menschenlesbare Beschreibung (fuer Badges / Vorschau). */
export function describePredicate(pred: Predicate | null | undefined): string {
  const node = pred ? parsePredicate(pred) : null
  if (!node) return ''
  return describeNode(node)
}

function describeNode(node: PredNode): string {
  if (node.kind === 'leaf') {
    const subj = `${node.source}:${node.id || '?'}`
    if (node.op === 'truthy') return `${subj} gesetzt`
    if (node.op === 'filled') return `${subj} ausgefüllt`
    if (node.op === 'state') return `${subj} = ${node.value}`
    if (node.op === 'in') return `${subj} in [${(Array.isArray(node.value) ? node.value : []).join(', ')}]`
    return `${subj} = ${String(node.value ?? '')}`
  }
  if (node.kind === 'not') return `NICHT(${describeNode(node.child)})`
  const sep = node.kind === 'all' ? ' UND ' : ' ODER '
  return `(${node.children.map(describeNode).join(sep)})`
}
