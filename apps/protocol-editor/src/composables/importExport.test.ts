// Tests fuer Import/Export (#223): Round-Trip-Treue + Fehlerfaelle. Serialisierung/Validierung
// kommen verbatim aus creator (exportProtocol/parseImport) ueber den Editor-Composable.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import type { Protocol } from '@resqdocs/protocol-core/creator/creator.mjs'
import { useProtocolEditor } from './useProtocolEditor.ts'

const seed = JSON.parse(
  readFileSync(new URL('../../../../protocols/standardprotokoll.json', import.meta.url), 'utf8'),
) as Protocol
const sha = (s: string): string => createHash('sha256').update(s).digest('hex')

test('Round-Trip: Export -> Import -> Export ist byte-identisch', () => {
  const ed = useProtocolEditor(seed)
  const export1 = ed.exportCurrent()
  const res = ed.importFromJson(export1)
  assert.equal(res.ok, true)
  const export2 = ed.exportCurrent()
  assert.equal(sha(export1), sha(export2), 'beide Exporte identisch')
  assert.equal(export1, export2)
})

test('App-Format (Seed) importieren: laedt + ist voll editierbar (alle Punkte adressierbar)', () => {
  const ed = useProtocolEditor(seed)
  const res = ed.importFromJson(JSON.stringify(seed))
  assert.equal(res.ok, true)
  assert.ok(ed.blocks.value.length > 0)
  // ensureProtocolPointIds-Garantie: jeder Punkt hat eine id (auch findingGroup) -> editierbar
  for (const b of ed.blocks.value) for (const p of b.points ?? []) assert.ok(p.id, 'Punkt hat id')
  // Slice-3-Funktionen greifen weiter:
  ed.addBlock()
  assert.equal(ed.validation.value.valid, true)
})

test('Negativ: kaputtes JSON -> klare Meldung, State unveraendert', () => {
  const ed = useProtocolEditor(seed)
  const before = ed.blocks.value.length
  const res = ed.importFromJson('{ das ist kein json')
  assert.equal(res.ok, false)
  assert.match(res.errors.join(' '), /JSON/i)
  assert.equal(ed.blocks.value.length, before, 'Editor-State bleibt intakt')
})

test('Negativ: ohne schemaVersion -> abgelehnt', () => {
  const ed = useProtocolEditor(seed)
  const res = ed.importFromJson(JSON.stringify({ id: 'x', title: 'X', blocks: [] }))
  assert.equal(res.ok, false)
  assert.ok(res.errors.length > 0)
})

test('Negativ: falsche Major-Version -> abgelehnt', () => {
  const ed = useProtocolEditor(seed)
  const res = ed.importFromJson(JSON.stringify({ schemaVersion: '2.0.0', id: 'x', title: 'X', blocks: [] }))
  assert.equal(res.ok, false)
  assert.match(res.errors.join(' '), /schemaVersion/i)
})

test('Negativ: strukturell invalide (select ohne options) -> abgelehnt, State intakt', () => {
  const ed = useProtocolEditor(seed)
  const before = ed.blocks.value.length
  const bad = { schemaVersion: '0.2.0', id: 'x', title: 'X', variables: [{ id: 'v', type: 'select' }], blocks: [] }
  const res = ed.importFromJson(JSON.stringify(bad))
  assert.equal(res.ok, false)
  assert.equal(ed.blocks.value.length, before)
})

// Dokumentiert das tatsaechliche Verhalten der GETEILTEN Validierung: parseImport nutzt
// assertValidProtocolDraft (KEINE additionalProperties-Pruefung), daher passieren unbekannte
// Felder den Import. Striktes Ablehnen waere eine separate Schema-Haertung in protocol-core
// (siehe #222-Befund) — bewusst NICHT hier nachgebaut.
test('Doku: unbekanntes Top-Level-Feld wird von der geteilten Validierung NICHT abgelehnt', () => {
  const ed = useProtocolEditor(seed)
  const withExtra = { schemaVersion: '0.2.0', id: 'x', title: 'X', blocks: [], unbekanntesFeld: 123 }
  const res = ed.importFromJson(JSON.stringify(withExtra))
  assert.equal(res.ok, true)
})
