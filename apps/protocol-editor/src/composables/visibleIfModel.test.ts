// Tests fuer die reine visibleIf-Baum-Logik (#222, Stufe 5). node:test, keine Vue-Abhaengigkeit.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertValidProtocolDraft, type Predicate, type Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { parsePredicate, buildPredicate } from './visibleIfModel.ts'

/** Predicate in ein Minimal-Protokoll haengen und Schema-Gueltigkeit pruefen. */
function validWith(pred: Predicate): ReturnType<typeof assertValidProtocolDraft> {
  const p: Protocol = {
    schemaVersion: '0.2.0',
    id: 'test',
    title: 'Test',
    variables: [{ id: 'x', type: 'text' }],
    blocks: [{ id: 'b', title: 'B', visibleIf: pred, points: [{ id: 'p', type: 'text', content: 'x' }] }],
  }
  return assertValidProtocolDraft(p)
}

test('round-trip: einfaches var/eq-Blatt', () => {
  const pred: Predicate = { var: 'x', eq: '1' }
  assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
})

test('round-trip: point/state-Blatt', () => {
  const pred: Predicate = { point: 'p', state: 'abnormal' }
  assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
})

test('round-trip: var/in-Blatt mit Liste', () => {
  const pred: Predicate = { var: 'x', in: ['a', 'b'] }
  assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
})

test('round-trip: truthy/filled inkl. negativer Werte', () => {
  for (const pred of [
    { var: 'x', truthy: true },
    { var: 'x', truthy: false },
    { point: 'p', filled: true },
    { point: 'p', filled: false },
  ] as Predicate[]) {
    assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
  }
})

test('round-trip: point-source eq und in', () => {
  for (const pred of [{ point: 'p', eq: 'ja' }, { point: 'p', in: ['a', 'b'] }] as Predicate[]) {
    assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
  }
})

test('round-trip: verschachtelt all/any/not', () => {
  const pred: Predicate = {
    all: [{ var: 'x', eq: '1' }, { any: [{ point: 'p', filled: true }, { not: { point: 'p', state: 'abnormal' } }] }],
  }
  assert.deepEqual(buildPredicate(parsePredicate(pred)), pred)
})

test('gebaute Baeume sind schema-valide', () => {
  const built = buildPredicate(parsePredicate({ all: [{ var: 'x', eq: '1' }, { not: { point: 'p', state: 'abnormal' } }] }))
  assert.ok(built)
  assert.equal(validWith(built).valid, true)
})

test('unvollstaendige Knoten -> null', () => {
  assert.equal(buildPredicate({ kind: 'leaf', source: 'var', id: '', op: 'eq', value: '' }), null)
  assert.equal(buildPredicate({ kind: 'all', children: [] }), null)
  assert.equal(buildPredicate({ kind: 'not', child: { kind: 'leaf', source: 'var', id: '', op: 'eq', value: '' } }), null)
})

test('leere/ungueltige Kinder werden aus Gruppen gefiltert', () => {
  const node = {
    kind: 'any' as const,
    children: [
      { kind: 'leaf' as const, source: 'var' as const, id: 'x', op: 'eq' as const, value: '1' },
      { kind: 'leaf' as const, source: 'var' as const, id: '', op: 'eq' as const, value: '' },
    ],
  }
  assert.deepEqual(buildPredicate(node), { any: [{ var: 'x', eq: '1' }] })
})
