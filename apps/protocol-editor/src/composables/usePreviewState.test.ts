// Tests fuer die Live-Vorschau-Logik (#224): caseState -> render()/runtime; Variablen, Gender,
// visibleIf-Sichtbarkeit (var + point + optional block), Trennung Vorschau<->Template, Reset.
// Sichtbarkeit/Gender kommen aus den geteilten runtime-Funktionen (nicht nachgebaut).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { toRaw } from 'vue'
import { render } from '@resqdocs/protocol-core/renderer/render.mjs'
import type { Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { useProtocolEditor } from './useProtocolEditor.ts'
import { usePreviewState } from './usePreviewState.ts'

const seed = JSON.parse(
  readFileSync(new URL('../../../../protocols/standardprotokoll.json', import.meta.url), 'utf8'),
) as Protocol

function setup() {
  const ed = useProtocolEditor(seed)
  const pv = usePreviewState(ed.protocol)
  const text = () => render(toRaw(ed.protocol.value), pv.caseState.value, {})
  return { ed, pv, text }
}

test('Variable + Gender: geschlecht=m wirkt auf Text und Grammatik (aus runtime ctx.grammar)', () => {
  const { pv, text } = setup()
  assert.match(text(), /Patientin/, 'Default w -> Patientin')
  pv.setVariable('geschlecht', 'm')
  const tokens = new Map(pv.genderTokens.value)
  assert.equal(tokens.get('patient'), 'Patient', 'ctx.grammar liefert m-Tokens')
  assert.match(text(), /\bPatient\b/)
  assert.doesNotMatch(text(), /Patientin/, 'm -> nicht mehr Patientin')
})

test('visibleIf (var/eq): Schwangerschaft nur bei geschlecht=w', () => {
  const { pv, text } = setup()
  assert.equal(pv.pointVisible('schwangerschaft'), true)
  assert.match(text(), /Schwangerschaft/)
  pv.setVariable('geschlecht', 'm')
  assert.equal(pv.pointVisible('schwangerschaft'), false)
  assert.doesNotMatch(text(), /Schwangerschaft/)
})

test('visibleIf (point/state): Reanimation-Details erscheint, wenn c_reanimation=abnormal', () => {
  const { pv, text } = setup()
  assert.equal(pv.pointVisible('reanimation_details'), false)
  pv.setValue('c_reanimation', { state: 'abnormal' })
  assert.equal(pv.pointVisible('reanimation_details'), true)
  assert.match(text(), /Reanimation/)
})

test('visibleIf (var/truthy): Pack-Years erscheint, wenn raucher=true', () => {
  const { pv } = setup()
  assert.equal(pv.pointVisible('packyears'), false)
  pv.setVariable('raucher', true)
  assert.equal(pv.pointVisible('packyears'), true)
})

test('optionaler Block: Transportverweigerung erst nach Aktivierung sichtbar', () => {
  const { pv, text } = setup()
  assert.equal(pv.blockVisible('transportverweigerung'), false)
  assert.doesNotMatch(text(), /Transportverweigerung/)
  pv.toggleBlock('transportverweigerung', true)
  assert.equal(pv.blockVisible('transportverweigerung'), true)
  assert.match(text(), /Transportverweigerung/)
})

test('Trennung: Vorschau-Zustand veraendert das gespeicherte Template NICHT (Export unveraendert)', () => {
  const { ed, pv } = setup()
  const before = ed.exportCurrent()
  pv.setVariable('geschlecht', 'm')
  pv.setValue('c_reanimation', { state: 'abnormal' })
  pv.toggleBlock('transportverweigerung', true)
  assert.equal(ed.exportCurrent(), before, 'Template/Export enthaelt keine Vorschau-Werte')
})

test('Reset: zuruecksetzen ergibt wieder den Default-Render', () => {
  const { pv, text } = setup()
  const neutral = text()
  pv.setVariable('geschlecht', 'm')
  pv.toggleBlock('transportverweigerung', true)
  assert.notEqual(text(), neutral)
  assert.equal(pv.hasOverrides.value, true)
  pv.reset()
  assert.equal(pv.hasOverrides.value, false)
  assert.equal(text(), neutral)
})

test('Vorschau == render(): identisch zu direktem render() mit demselben caseState', () => {
  const { ed, pv, text } = setup()
  pv.setVariable('geschlecht', 'd')
  const direct = render(toRaw(ed.protocol.value), { variableValues: { geschlecht: 'd' }, values: {}, activeBlocks: [] }, {})
  assert.equal(text(), direct)
})
