// A2 (#70): sprechende Punkt-id EINMALIG aus erstem echten Titel/Label ableiten, dann eingefroren.
// node:test, keine Vue-Vue-Komponenten — der Composable selbst ist headless testbar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Point, Predicate, Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { useProtocolEditor } from './useProtocolEditor.ts'
import { computeDerivedId, isPointReferenced } from '../utils/derivePointId.ts'

function baseProtocol(): Protocol {
  return {
    schemaVersion: '0.2.0',
    id: 'test',
    title: 'Test',
    variables: [],
    blocks: [{ id: 'b', title: 'B', points: [] }],
  } as Protocol
}
type Editor = ReturnType<typeof useProtocolEditor>
function firstPointId(ed: Editor): string {
  return ed.blocks.value[0]?.points?.[0]?.id ?? ''
}

test('A2: erstes echtes Label leitet sprechende id ab + zieht Auswahl nach', () => {
  const ed = useProtocolEditor(baseProtocol())
  ed.addPoint('b', 'field')
  const id0 = ed.selectedPointId.value as string // 'neues-feld'
  ed.updatePoint(id0, { title: 'Blutdruck' } as Partial<Point>)
  ed.deriveIdFromName(id0)
  assert.equal(firstPointId(ed), 'blutdruck')
  assert.equal(ed.selectedPointId.value, 'blutdruck')
})

test('A2: gleicher Titel zweimal -> -2-Suffix (Kollision gegen ganzen Namespace)', () => {
  const ed = useProtocolEditor(baseProtocol())
  ed.addPoint('b', 'field')
  const a = ed.selectedPointId.value as string
  ed.updatePoint(a, { title: 'Blutdruck' } as Partial<Point>)
  ed.deriveIdFromName(a)
  ed.addPoint('b', 'field')
  const c = ed.selectedPointId.value as string
  ed.updatePoint(c, { title: 'Blutdruck' } as Partial<Point>)
  ed.deriveIdFromName(c)
  const ids = (ed.blocks.value[0].points ?? []).map((p) => p.id)
  assert.deepEqual(ids, ['blutdruck', 'blutdruck-2'])
})

test('A2: bereits referenzierte id wandert NICHT (kein Remap)', () => {
  const ed = useProtocolEditor(baseProtocol())
  ed.addPoint('b', 'field')
  const a = ed.selectedPointId.value as string // neues-feld
  ed.addPoint('b', 'field')
  const b2 = ed.selectedPointId.value as string // neues-feld-2
  ed.setPointVisibleIf(b2, { point: a, filled: true } as Predicate) // B haengt an A
  ed.updatePoint(a, { title: 'Blutdruck' } as Partial<Point>)
  ed.deriveIdFromName(a)
  assert.equal(ed.blocks.value[0].points?.[0].id, a) // unveraendert
})

test('A2: nur EINMALIG — zweite Ableitung ist no-op (eingefroren)', () => {
  const ed = useProtocolEditor(baseProtocol())
  ed.addPoint('b', 'field')
  const a = ed.selectedPointId.value as string
  ed.updatePoint(a, { title: 'Blutdruck' } as Partial<Point>)
  ed.deriveIdFromName(a) // -> blutdruck
  ed.updatePoint('blutdruck', { title: 'Anders' } as Partial<Point>)
  ed.deriveIdFromName('blutdruck')
  assert.equal(firstPointId(ed), 'blutdruck')
})

test('A2: leere Basis -> id unveraendert, bleibt aber ableitbar (spaeterer Titel greift)', () => {
  const ed = useProtocolEditor(baseProtocol())
  ed.addPoint('b', 'field')
  const a = ed.selectedPointId.value as string // neues-feld (label "Neues Feld")
  ed.updatePoint(a, { label: '' } as Partial<Point>) // Basis leer
  ed.deriveIdFromName(a)
  assert.equal(firstPointId(ed), a) // KEIN Rueckfall, unveraendert
  ed.updatePoint(a, { title: 'Blutdruck' } as Partial<Point>) // spaeter echter Titel
  ed.deriveIdFromName(a)
  assert.equal(firstPointId(ed), 'blutdruck')
})

// ---- reine Helfer ----
test('computeDerivedId: leere Basis -> null', () => {
  assert.equal(computeDerivedId(baseProtocol(), 'x', '   '), null)
})

test('isPointReferenced erkennt verschachtelte all/any/not', () => {
  const proto = baseProtocol()
  proto.blocks[0].points = [{ id: 'p1', type: 'field', label: 'P1' }] as Point[]
  proto.blocks[0].visibleIf = { all: [{ not: { point: 'p1', filled: true } }] } as Predicate
  assert.equal(isPointReferenced(proto, 'p1'), true)
  assert.equal(isPointReferenced(proto, 'pX'), false)
})
