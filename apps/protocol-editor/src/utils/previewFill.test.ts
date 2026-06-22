// Full-Fill-Vorschau (#fulltest / Bug B): die Maske schreibt typgerechte Werte in den caseState,
// die der GETEILTE Renderer liest. Tests = reine Helfer + Integration (usePreviewState -> render).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import type { Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { render } from '@resqdocs/protocol-core/renderer/render.mjs'
import { usePreviewState } from '../composables/usePreviewState.ts'
import { isFillable, listValueToText, listEntriesFromText } from './previewFill.ts'

// ---- reine Helfer ----
test('isFillable: text ist read-only, alle anderen Typen fuellbar', () => {
  assert.equal(isFillable('field'), true)
  assert.equal(isFillable('finding'), true)
  assert.equal(isFillable('findingGroup'), true)
  assert.equal(isFillable('list'), true)
  assert.equal(isFillable('medikamente'), true)
  assert.equal(isFillable('text'), false)
  assert.equal(isFillable(undefined), false)
})

test('list value<->text inkl. Template-Default-Fallback und Leerzeilen-Filter', () => {
  assert.equal(listValueToText(['a', 'b']), 'a\nb')
  assert.equal(listValueToText(undefined, ['x', 'y']), 'x\ny')
  assert.equal(listValueToText({ value: undefined } as never, ['d']), 'd')
  assert.deepEqual(listEntriesFromText('a\n  b \n\n c '), ['a', 'b', 'c'])
  assert.deepEqual(listEntriesFromText('   \n  '), [])
})

// ---- Integration: Maske -> caseState -> render() (Wert-Shape je Typ stimmt mit runtime) ----
function proto(): Protocol {
  return {
    schemaVersion: '0.2.0',
    id: 't',
    title: 'T',
    variables: [],
    blocks: [
      {
        id: 'b',
        title: 'Block',
        points: [
          { id: 'feld', type: 'field', label: 'Feld' },
          { id: 'liste', type: 'list', label: 'Liste', entries: [] },
          { id: 'bef', type: 'finding', label: 'Befund', normal: 'o.B.' },
          { id: 'cond', type: 'field', label: 'Bedingt', visibleIf: { point: 'feld', filled: true } },
        ],
      },
    ],
  } as Protocol
}

test('neues field fuellen -> Wert erscheint in render() (Mechanismus B geloest)', () => {
  const p = ref(proto())
  const ps = usePreviewState(p)
  assert.ok(!render(p.value, ps.caseState.value).includes('Hallo'))
  ps.setValue('feld', 'Hallo')
  assert.ok(render(p.value, ps.caseState.value).includes('- Feld: Hallo'))
})

test('list-Eintraege (string[]) -> Liste rendert (Mechanismus A geloest, leer war unsichtbar)', () => {
  const p = ref(proto())
  const ps = usePreviewState(p)
  assert.ok(!render(p.value, ps.caseState.value).includes('- a')) // leer -> nichts
  ps.setValue('liste', listEntriesFromText('a\nb'))
  const out = render(p.value, ps.caseState.value)
  assert.ok(out.includes('- a') && out.includes('- b'))
})

test('finding-Zustand wirkt (abnormal mit Text)', () => {
  const p = ref(proto())
  const ps = usePreviewState(p)
  ps.setValue('bef', { state: 'abnormal', value: 'auffaellig' })
  assert.ok(render(p.value, ps.caseState.value).includes('auffaellig'))
})

test('visibleIf live: abhaengiger Punkt erscheint erst nach Fuellen des Subjekts', () => {
  const p = ref(proto())
  const ps = usePreviewState(p)
  assert.equal(ps.pointVisible('cond'), false) // feld leer -> cond unsichtbar
  assert.ok(!render(p.value, ps.caseState.value).includes('Bedingt'))
  ps.setValue('feld', 'x')
  assert.equal(ps.pointVisible('cond'), true) // feld gefuellt -> cond sichtbar (gleiche Sichtbarkeit wie Renderer)
  assert.ok(render(p.value, ps.caseState.value).includes('Bedingt'))
})

test('field „nicht erhoben“ ({excluded:true}) entfernt das Feld aus der Ausgabe', () => {
  const p = ref(proto())
  const ps = usePreviewState(p)
  assert.ok(render(p.value, ps.caseState.value).includes('- Feld:')) // Stub sichtbar
  ps.setValue('feld', { excluded: true })
  assert.ok(!render(p.value, ps.caseState.value).includes('- Feld:')) // n.e. -> weg
})
