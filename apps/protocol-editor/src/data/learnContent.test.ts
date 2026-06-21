// Tests (#225): Integritaet der Lern-Inhalte — Tutorial-Kapitel eindeutig, jedes verlinkte
// Beispiel existiert wirklich, Referenz nicht leer. tutorial.ts/reference.ts sind importfrei.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { tutorial } from './tutorial.ts'
import { reference } from './reference.ts'

// vorhandene Beispiel-ids direkt aus den JSON-Dateien (examples.ts ist via Vite-JSON-Imports
// nicht node-importierbar; die UI-keys sind = protocol.id, siehe examples.ts).
const dir = fileURLToPath(new URL('./examples/', import.meta.url))
const exampleIds = new Set(
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(dir + f, 'utf8')).id as string),
)

test('Tutorial hat mehrere Kapitel mit eindeutigen ids', () => {
  assert.ok(tutorial.length >= 5)
  const ids = tutorial.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length, 'Kapitel-ids eindeutig')
})

test('jedes verlinkte exampleKey zeigt auf ein existierendes Beispiel', () => {
  for (const c of tutorial) {
    if (c.exampleKey) assert.ok(exampleIds.has(c.exampleKey), `unbekanntes Beispiel: ${c.exampleKey}`)
  }
})

test('jedes Kapitel hat Titel, Intro und Erklaerpunkte', () => {
  for (const c of tutorial) {
    assert.ok(c.title && c.intro && c.points.length > 0, `Kapitel ${c.id} unvollstaendig`)
  }
})

test('Referenz hat Abschnitte mit Eintraegen (jeweils mit Mini-Beispiel)', () => {
  assert.ok(reference.length >= 3)
  for (const s of reference) {
    assert.ok(s.entries.length > 0, `Abschnitt ${s.id} leer`)
    for (const e of s.entries) assert.ok(e.term && e.what && e.example, `Eintrag in ${s.id} unvollstaendig`)
  }
})
