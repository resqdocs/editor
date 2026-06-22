// useProtocolEditor.ts — Editor-Zustand + DUENNE Wrapper auf creator.mjs (#222).
//
// GRUNDREGEL: KEINE eigene Editier-Logik. JEDE Mutation laeuft ueber eine creator-Funktion
// aus @resqdocs/protocol-core (pure, immutable, gibt ein NEUES Protokoll zurueck). Dieser
// Composable haelt nur den Bearbeitungs-Zustand (aktuelle Vorlage + Auswahl) und ruft die
// Domain-Funktionen auf. Nach jeder Mutation ist der Draft per creator-Garantien valide;
// assertValidProtocolDraft liefert zusaetzlich Struktur-/Dangling-Ref-Hinweise.
//
// PROXY-GRENZE (bug-089/#40): creator klont via structuredClone, was an Vue-Reactive-Proxies
// scheitert. Darum wird VOR jedem creator-Aufruf mit toRaw() entpackt; nur Lesen bleibt reaktiv.
import { computed, ref, toRaw, type Ref } from 'vue'
import { displayName } from '../utils/displayName.ts'
import { isPointReferenced, computeDerivedId, withPointId } from '../utils/derivePointId.ts'
import {
  createProtocol,
  duplicateProtocol,
  addBlock as cAddBlock,
  updateBlock as cUpdateBlock,
  removeBlock as cRemoveBlock,
  duplicateBlock as cDuplicateBlock,
  moveBlock as cMoveBlock,
  ensureProtocolPointIds,
  addPoint as cAddPoint,
  updatePoint as cUpdatePoint,
  removePoint as cRemovePoint,
  duplicatePoint as cDuplicatePoint,
  movePoint as cMovePoint,
  addVariable as cAddVariable,
  updateVariable as cUpdateVariable,
  removeVariable as cRemoveVariable,
  findVariableReferences,
  assertValidProtocolDraft,
  exportProtocol,
  parseImport,
  slugify,
  type Protocol,
  type Block,
  type Point,
  type Variable,
  type Predicate,
  type PointType,
  type VariableType,
  type ValidationResult,
  type VariableReference,
} from '@resqdocs/protocol-core/creator/creator.mjs'

export interface PointRef {
  id: string
  label: string
  group: string
}

/** Default-Eingabe je Punkt-Typ — so gewaehlt, dass der Draft nach dem Anlegen valide bleibt. */
function defaultPointInput(type: PointType): Partial<Point> & { type: PointType } {
  switch (type) {
    case 'finding':
      return { type, label: 'Neuer Befund', normal: '' }
    case 'findingGroup':
      return { type, key: 'Neu', findings: [] } as Partial<Point> & { type: PointType }
    case 'list':
      return { type, label: 'Neue Liste', entries: [] } as Partial<Point> & { type: PointType }
    case 'text':
      return { type, label: 'Neuer Text', content: '' } as Partial<Point> & { type: PointType }
    case 'medikamente':
      return { type, label: 'Medikamente' }
    case 'field':
    default:
      return { type: 'field', label: 'Neues Feld' }
  }
}

/** Default-Eingabe je Variablen-Typ (select braucht zwingend options). */
function defaultVariableInput(type: VariableType): Partial<Variable> & { type: VariableType } {
  switch (type) {
    case 'select':
      return { type, label: 'Neue Auswahl', options: [{ value: 'option-1', label: 'Option 1' }], default: 'option-1' }
    case 'boolean':
      return { type, label: 'Neuer Schalter', default: false }
    case 'number':
      return { type, label: 'Neue Zahl', default: 0 }
    case 'text':
    default:
      return { type: 'text', label: 'Neuer Text', default: '' }
  }
}

/** Normalisiert eine Vorlage zu einem sauberen, voll adressierbaren Edit-Draft.
 *  Die Tiefkopie macht createProtocol selbst (creator.clone mit structuredClone→JSON-Fallback,
 *  proxy-sicher); hier nur toRaw als saubere, einheitliche Proxy-Grenze. */
function toDraft(p: Protocol): Protocol {
  return ensureProtocolPointIds(createProtocol(toRaw(p)))
}

export function useProtocolEditor(initial: Protocol) {
  const protocol: Ref<Protocol> = ref(toDraft(initial))
  const selectedBlockId = ref<string | null>(null)
  const selectedPointId = ref<string | null>(null)
  const selectedVariableId = ref<string | null>(null)
  const lastError = ref<string | null>(null)
  // A2 (#70): ids frisch via addPoint angelegter Punkte, deren id noch EINMALIG aus dem ersten
  // echten Titel/Label abgeleitet werden darf. Nach Ableitung (oder Einfrieren) entfernt; bei
  // jedem Vorlagen-Wechsel geleert. Editor-lokales Bookkeeping — KEIN Bestandteil der Vorlage.
  const derivablePointIds = new Set<string>()

  const raw = (): Protocol => toRaw(protocol.value)

  /** Einziger Mutations-Pfad: creator-Funktion auf den entpackten Draft, Ergebnis uebernehmen. */
  function commit(fn: (p: Protocol) => Protocol): boolean {
    try {
      const next = fn(raw())
      protocol.value = next
      lastError.value = null
      return true
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e)
      return false
    }
  }

  const blocks = computed<Block[]>(() => protocol.value.blocks ?? [])
  const variables = computed<Variable[]>(() => protocol.value.variables ?? [])
  const validation = computed<ValidationResult>(() => assertValidProtocolDraft(raw()))

  const selectedBlock = computed<Block | null>(() => blocks.value.find((b) => b.id === selectedBlockId.value) ?? null)
  const selectedPoint = computed<Point | null>(() => {
    for (const b of blocks.value) {
      const p = (b.points ?? []).find((pt) => pt.id === selectedPointId.value)
      if (p) return p
    }
    return null
  })
  const selectedVariable = computed<Variable | null>(
    () => variables.value.find((v) => v.id === selectedVariableId.value) ?? null,
  )

  /** Alle als visibleIf-`point`-Subjekt waehlbaren Punkte (inkl. findingGroup-Kinder). */
  const pointRefs = computed<PointRef[]>(() => {
    const refs: PointRef[] = []
    for (const b of blocks.value) {
      for (const p of b.points ?? []) {
        if (typeof p.id === 'string' && p.id) {
          refs.push({ id: p.id, label: displayName(p), group: String(b.title ?? b.id) })
        }
        if (p.type === 'findingGroup') {
          const bag = p as Record<string, unknown>
          const findings = Array.isArray(bag.findings) ? (bag.findings as Array<Record<string, unknown>>) : []
          const key = String(bag.key ?? '')
          for (const f of findings) {
            if (typeof f.id === 'string' && f.id) {
              refs.push({ id: f.id, label: `${key} › ${displayName(f)}`, group: String(b.title ?? b.id) })
            }
          }
        }
      }
    }
    return refs
  })

  function newIdAmong(beforeIds: string[], afterIds: string[]): string | null {
    return afterIds.find((id) => !beforeIds.includes(id)) ?? null
  }

  // ----- Auswahl -----
  function selectBlock(id: string | null): void {
    selectedBlockId.value = id
    selectedPointId.value = null
    selectedVariableId.value = null
  }
  function selectPoint(id: string): void {
    for (const b of blocks.value) {
      if ((b.points ?? []).some((p) => p.id === id)) {
        selectedBlockId.value = b.id
        break
      }
    }
    selectedPointId.value = id
    selectedVariableId.value = null
  }
  function selectVariable(id: string): void {
    selectedVariableId.value = id
    selectedBlockId.value = null
    selectedPointId.value = null
  }

  // ----- Block-Operationen (Stufe 1) -----
  function addBlock(): void {
    const before = blocks.value.map((b) => b.id)
    if (commit((p) => cAddBlock(p, { title: 'Neuer Block' }))) {
      const created = newIdAmong(before, blocks.value.map((b) => b.id))
      if (created) selectBlock(created)
    }
  }
  function renameBlock(blockId: string, title: string): void {
    commit((p) => cUpdateBlock(p, blockId, { title }))
  }
  function setBlockOptional(blockId: string, optional: boolean): void {
    commit((p) => cUpdateBlock(p, blockId, { optional }))
  }
  function removeBlock(blockId: string): void {
    if (commit((p) => cRemoveBlock(p, blockId)) && selectedBlockId.value === blockId) selectBlock(null)
  }
  function duplicateBlock(blockId: string): void {
    commit((p) => cDuplicateBlock(p, blockId))
  }
  function moveBlock(blockId: string, direction: 'up' | 'down'): void {
    commit((p) => cMoveBlock(p, blockId, direction))
  }
  function setBlockVisibleIf(blockId: string, predicate: Predicate | null): void {
    commit((p) => cUpdateBlock(p, blockId, { visibleIf: predicate ?? undefined }))
  }

  // ----- Punkt-Operationen (Stufen 1-3) -----
  function addPoint(blockId: string, type: PointType): void {
    const before = (blocks.value.find((b) => b.id === blockId)?.points ?? []).map((p) => p.id ?? '')
    if (commit((p) => cAddPoint(p, blockId, defaultPointInput(type)))) {
      const after = (blocks.value.find((b) => b.id === blockId)?.points ?? []).map((p) => p.id ?? '')
      const created = newIdAmong(before, after)
      if (created) {
        selectPoint(created)
        derivablePointIds.add(created) // A2: frische Auto-id, einmalig aus Titel/Label ableitbar
      }
    }
  }
  function updatePoint(pointId: string, patch: Partial<Point>): void {
    commit((p) => cUpdatePoint(p, pointId, patch))
  }
  /**
   * A2 (#70): leitet die id eines FRISCH angelegten Punkts EINMALIG aus Titel/Label ab (Trigger:
   * on blur des Titel-/Label-Felds). Sicher OHNE Remap, weil nur ausgefuehrt, solange
   * (a) die id noch "auto" ist (in derivablePointIds), (b) KEIN visibleIf sie referenziert und
   * (c) die Basis (Titel||Label) nicht leer ist. Danach eingefroren — eine bereits referenzierte
   * oder schon abgeleitete id wird NIE veraendert (kein stilles Brechen).
   */
  function deriveIdFromName(pointId: string): void {
    if (!derivablePointIds.has(pointId)) return // schon abgeleitet / nicht-auto -> nichts tun
    const proto = toRaw(protocol.value)
    let pt: Point | undefined
    for (const b of proto.blocks ?? []) {
      const found = (b.points ?? []).find((x) => x.id === pointId)
      if (found) { pt = found; break }
    }
    if (!pt) { derivablePointIds.delete(pointId); return }
    if (isPointReferenced(proto, pointId)) return // (b) referenziert -> NIE ableiten (das waere A1)
    const base = String((pt as Record<string, unknown>).title ?? '').trim() || String(pt.label ?? '').trim()
    if (!base) return // (c) leere Basis -> bleibt ableitbar, KEIN Rueckfall auf Roh-/Default-id
    const newId = computeDerivedId(proto, pointId, base)
    derivablePointIds.delete(pointId) // EINMALIG: ab dem ersten echten Namen eingefroren
    if (!newId) return // id ist bereits sprechend genug
    if (commit((p) => withPointId(p, pointId, newId)) && selectedPointId.value === pointId) {
      selectedPointId.value = newId // Auswahl auf die neue id nachziehen
    }
  }
  function removePoint(pointId: string): void {
    if (commit((p) => cRemovePoint(p, pointId)) && selectedPointId.value === pointId) selectedPointId.value = null
  }
  function duplicatePoint(pointId: string): void {
    commit((p) => cDuplicatePoint(p, pointId))
  }
  function movePoint(pointId: string, direction: 'up' | 'down'): void {
    commit((p) => cMovePoint(p, pointId, direction))
  }
  function setPointVisibleIf(pointId: string, predicate: Predicate | null): void {
    commit((p) => cUpdatePoint(p, pointId, { visibleIf: predicate ?? undefined }))
  }

  // ----- Variablen-Operationen (Stufe 4) -----
  function addVariable(type: VariableType): void {
    const before = variables.value.map((v) => v.id)
    if (commit((p) => cAddVariable(p, defaultVariableInput(type)))) {
      const created = newIdAmong(before, variables.value.map((v) => v.id))
      if (created) selectVariable(created)
    }
  }
  function updateVariable(variableId: string, patch: Partial<Variable>): void {
    commit((p) => cUpdateVariable(p, variableId, patch))
  }
  function removeVariable(variableId: string): void {
    if (commit((p) => cRemoveVariable(p, variableId)) && selectedVariableId.value === variableId) {
      selectedVariableId.value = null
    }
  }
  function variableReferences(variableId: string): VariableReference[] {
    return findVariableReferences(raw(), variableId)
  }

  // ----- Draft laden / zuruecksetzen -----
  function loadDraft(p: Protocol): void {
    protocol.value = toDraft(p)
    derivablePointIds.clear()
    selectBlock(null)
    lastError.value = null
  }
  function newEmpty(): void {
    protocol.value = createProtocol({ title: 'Neues Protokoll' })
    derivablePointIds.clear()
    selectBlock(null)
    lastError.value = null
  }
  function duplicateCurrent(): void {
    protocol.value = duplicateProtocol(raw())
    derivablePointIds.clear()
    selectBlock(null)
    lastError.value = null
  }

  // ----- Import / Export (#223): VERBATIM ueber creator, KEIN eigener Parser/Validator -----
  /** Serialisiert die aktuelle Vorlage ueber exportProtocol (validiert + schema-gated). Wirft bei invalide. */
  function exportCurrent(): string {
    return exportProtocol(raw())
  }
  /** Sinnvoller Download-Dateiname aus title/id (creator.slugify). */
  function suggestedFilename(): string {
    return `${slugify(protocol.value.title || protocol.value.id || 'protokoll') || 'protokoll'}.json`
  }
  /**
   * Laedt eine Vorlage aus JSON ueber parseImport (Domain-Validierung). Bei Erfolg wird der Draft
   * ersetzt (+ ensureProtocolPointIds fuer volle Editierbarkeit). Bei Fehler bleibt der Editor-State
   * UNVERAENDERT und es kommen klare Fehlermeldungen zurueck.
   */
  function importFromJson(text: string): { ok: boolean; errors: string[]; warnings: string[] } {
    const res = parseImport(text)
    if (res.ok) {
      protocol.value = ensureProtocolPointIds(res.protocol)
      derivablePointIds.clear()
      selectBlock(null)
      lastError.value = null
      return { ok: true, errors: [], warnings: res.warnings }
    }
    return { ok: false, errors: res.errors, warnings: res.warnings }
  }

  return {
    protocol,
    blocks,
    variables,
    validation,
    lastError,
    selectedBlockId,
    selectedPointId,
    selectedVariableId,
    selectedBlock,
    selectedPoint,
    selectedVariable,
    pointRefs,
    selectBlock,
    selectPoint,
    selectVariable,
    addBlock,
    renameBlock,
    setBlockOptional,
    removeBlock,
    duplicateBlock,
    moveBlock,
    setBlockVisibleIf,
    addPoint,
    updatePoint,
    removePoint,
    duplicatePoint,
    movePoint,
    setPointVisibleIf,
    deriveIdFromName,
    addVariable,
    updateVariable,
    removeVariable,
    variableReferences,
    loadDraft,
    newEmpty,
    duplicateCurrent,
    exportCurrent,
    suggestedFilename,
    importFromJson,
  }
}

export type ProtocolEditor = ReturnType<typeof useProtocolEditor>
