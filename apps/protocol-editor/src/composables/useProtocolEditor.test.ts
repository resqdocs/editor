// Tests fuer den Editor-Composable (#222): jede Mutation laeuft ueber creator, der Draft bleibt
// schema-valide, und Domain-Invarianten (id-Immutabilitaet) schlagen als lastError durch.
// node:test mit Vue-Reaktivitaet (headless; ref/computed/toRaw sind reine JS-Logik).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { POINT_TYPES, VARIABLE_TYPES, type Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { useProtocolEditor } from './useProtocolEditor.ts'

const seed = JSON.parse(
  readFileSync(new URL('../../../../protocols/standardprotokoll.json', import.meta.url), 'utf8'),
) as Protocol

test('startet aus dem Seed mit gueltigem Draft', () => {
  const ed = useProtocolEditor(seed)
  assert.equal(ed.validation.value.valid, true)
  assert.ok(ed.blocks.value.length > 0)
})

test('Block anlegen: waehlt neuen Block, bleibt valide', () => {
  const ed = useProtocolEditor(seed)
  const before = ed.blocks.value.length
  ed.addBlock()
  assert.equal(ed.blocks.value.length, before + 1)
  assert.ok(ed.selectedBlockId.value)
  assert.equal(ed.validation.value.valid, true)
})

test('jeder Punkt-Typ laesst sich anlegen und haelt den Draft valide', () => {
  const ed = useProtocolEditor(seed)
  ed.addBlock()
  const blockId = ed.selectedBlockId.value!
  for (const type of POINT_TYPES) {
    ed.addPoint(blockId, type)
    assert.equal(ed.lastError.value, null, `addPoint(${type}) ohne Fehler`)
    assert.equal(ed.validation.value.valid, true, `Draft nach addPoint(${type}) valide`)
  }
  const block = ed.blocks.value.find((b) => b.id === blockId)!
  assert.equal(block.points.length, POINT_TYPES.length)
})

test('jeder Variablen-Typ laesst sich anlegen (select bekommt options)', () => {
  const ed = useProtocolEditor(seed)
  for (const type of VARIABLE_TYPES) {
    ed.addVariable(type)
    assert.equal(ed.lastError.value, null, `addVariable(${type}) ohne Fehler`)
  }
  assert.equal(ed.validation.value.valid, true)
  const sel = ed.variables.value.find((v) => v.type === 'select')!
  assert.ok(Array.isArray(sel.options) && sel.options.length >= 1)
})

test('Punkt editieren laeuft ueber updatePoint (Label uebernommen)', () => {
  const ed = useProtocolEditor(seed)
  ed.addBlock()
  ed.addPoint(ed.selectedBlockId.value!, 'field')
  const pid = ed.selectedPointId.value!
  ed.updatePoint(pid, { label: 'Geprueft' })
  assert.equal(ed.selectedPoint.value!.label, 'Geprueft')
  assert.equal(ed.validation.value.valid, true)
})

test('id-Aenderung wird von creator abgelehnt und als lastError gemeldet', () => {
  const ed = useProtocolEditor(seed)
  ed.addVariable('text')
  const vid = ed.selectedVariableId.value!
  ed.updateVariable(vid, { id: 'anders' } as never)
  assert.match(ed.lastError.value ?? '', /nicht editierbar/i)
  assert.ok(ed.variables.value.some((v) => v.id === vid), 'alte id bleibt erhalten')
})

test('voller visibleIf-Baum laesst sich auf einen Punkt setzen', () => {
  const ed = useProtocolEditor(seed)
  ed.addBlock()
  ed.addPoint(ed.selectedBlockId.value!, 'text')
  const pid = ed.selectedPointId.value!
  ed.setPointVisibleIf(pid, { all: [{ var: 'x', eq: '1' }, { not: { point: pid, filled: true } }] })
  assert.equal(ed.lastError.value, null)
  assert.ok(ed.selectedPoint.value!.visibleIf)
})

test('Block loeschen entfernt ihn aus dem Draft', () => {
  const ed = useProtocolEditor(seed)
  ed.addBlock()
  const id = ed.selectedBlockId.value!
  const before = ed.blocks.value.length
  ed.removeBlock(id)
  assert.equal(ed.blocks.value.length, before - 1)
  assert.ok(!ed.blocks.value.some((b) => b.id === id))
})
