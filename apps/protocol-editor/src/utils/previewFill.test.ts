// Full-Fill-Vorschau (#fulltest / Bug B): die Maske schreibt typgerechte Werte in den caseState,
// die der GETEILTE Renderer liest. Tests = reine Helfer + Integration (usePreviewState -> render).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import type { Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { render } from '@resqdocs/protocol-core/renderer/render.mjs'
import { usePreviewState } from '../composables/usePreviewState.ts'
import { isFillable, listValueToText, listEntriesFromText, buildFillGroups, type FillVisibility } from './previewFill.ts'

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

// ---- #258: optionale Blöcke an IHRER Position (statt Sammel-Sektion) ----
const A_B_C = [
  { id: 'A', title: 'A', points: [{ id: 'a1', type: 'field', label: 'A1' }] },
  { id: 'B', title: 'B', optional: true, points: [{ id: 'b1', type: 'field', label: 'B1' }] },
  { id: 'C', title: 'C', points: [{ id: 'c1', type: 'field', label: 'C1' }] },
]
function vis(opts: { visibleBlocks: Set<string>; activeBlocks?: Set<string> }): FillVisibility {
  return {
    blockVisible: (id) => opts.visibleBlocks.has(id),
    isBlockActive: (id) => (opts.activeBlocks ?? new Set()).has(id),
    pointVisible: () => true,
    isReferenced: () => false,
  }
}

test('#258 Anordnung: optionaler Block erscheint an SEINER Position (A, B, C), nicht gebündelt', () => {
  const g = buildFillGroups(A_B_C, vis({ visibleBlocks: new Set(['A', 'B', 'C']), activeBlocks: new Set(['B']) }))
  assert.deepEqual(g.map((x) => x.blockId), ['A', 'B', 'C'])
  assert.equal(g[1].optional, true)
})

test('#258 inaktiver optionaler Block: bleibt an Position, nur Toggle (keine Controls)', () => {
  // B inaktiv -> blockVisible(B)=false; A/C sichtbar
  const g = buildFillGroups(A_B_C, vis({ visibleBlocks: new Set(['A', 'C']) }))
  assert.deepEqual(g.map((x) => x.blockId), ['A', 'B', 'C']) // B weiterhin an Index 1
  assert.equal(g[1].optional, true)
  assert.equal(g[1].active, false)
  assert.equal(g[1].visible, false)
  assert.equal(g[1].controls.length, 0)
})

test('#258 aktiver optionaler Block: zeigt seine Controls an Position', () => {
  const g = buildFillGroups(A_B_C, vis({ visibleBlocks: new Set(['A', 'B', 'C']), activeBlocks: new Set(['B']) }))
  assert.equal(g[1].visible, true)
  assert.equal(g[1].controls.length, 1)
  assert.equal(g[1].controls[0].id, 'b1')
})

test('#258 leerer/unsichtbarer NORMALER Block wird übersprungen', () => {
  const g = buildFillGroups(
    [{ id: 'X', title: 'X', points: [{ id: 'x1', type: 'field' }] }],
    vis({ visibleBlocks: new Set() }),
  )
  assert.equal(g.length, 0)
})

// ---- #258 Integration: Maske ↔ render() konsistent für optionale Blöcke ----
function protoOpt(): Protocol {
  return {
    schemaVersion: '0.2.0',
    id: 't',
    title: 'T',
    variables: [],
    blocks: [
      { id: 'a', title: 'A', points: [{ id: 'a1', type: 'field', label: 'A1' }] },
      { id: 'opt', title: 'Opt', optional: true, points: [{ id: 'o1', type: 'field', label: 'O1' }] },
      { id: 'c', title: 'C', points: [{ id: 'c1', type: 'field', label: 'C1' }] },
    ],
  } as Protocol
}
function visFromPreview(ps: ReturnType<typeof usePreviewState>): FillVisibility {
  return {
    blockVisible: (id) => ps.blockVisible(id),
    isBlockActive: (id) => ps.isBlockActive(id),
    pointVisible: (id) => ps.pointVisible(id),
    isReferenced: (id) => ps.referencedPointIds.value.has(id),
  }
}

test('#258 Integration: optionaler Block — Maske + render konsistent (inaktiv→Toggle, aktiv→Inhalt an Position)', () => {
  const p = ref(protoOpt())
  const ps = usePreviewState(p)
  // inaktiv: Position erhalten, nur Toggle, render zeigt den Block NICHT
  let g = buildFillGroups(p.value.blocks, visFromPreview(ps))
  assert.deepEqual(g.map((x) => x.blockId), ['a', 'opt', 'c'])
  assert.equal(g[1].visible, false)
  assert.ok(!render(p.value, ps.caseState.value).includes('O1'))
  // aktivieren: Controls an Position, render zeigt den Block an seiner Stelle
  ps.toggleBlock('opt', true)
  g = buildFillGroups(p.value.blocks, visFromPreview(ps))
  assert.equal(g[1].visible, true)
  assert.equal(g[1].controls[0].id, 'o1')
  assert.ok(render(p.value, ps.caseState.value).includes('- O1:'))
})
