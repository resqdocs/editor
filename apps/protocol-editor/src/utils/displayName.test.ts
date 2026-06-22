// Tests fuer den Anzeige-Namen-Fallback (#70). node:test, keine Vue-Abhaengigkeit.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { displayName, humanize } from './displayName.ts'

test('title gewinnt vor leerem label', () => {
  assert.equal(displayName({ title: 'Blutdruck', label: '', id: 'bp' }), 'Blutdruck')
})

test('label-Fallback, wenn kein title', () => {
  assert.equal(displayName({ title: '', label: 'RR', id: 'bp' }), 'RR')
})

test('humanize(id) als letzter Fallback', () => {
  assert.equal(displayName({ id: 'systolicValue' }), 'systolic Value')
})

test('trim-Robustheit: whitespace-title faellt auf (getrimmtes) label', () => {
  assert.equal(displayName({ title: '  ', label: ' RR ', id: 'bp' }), 'RR')
})

test('humanize: snake/kebab/camel -> Woerter', () => {
  assert.equal(humanize('blut_druck'), 'blut druck')
  assert.equal(humanize('blut-druck'), 'blut druck')
  assert.equal(humanize('systolicValue'), 'systolic Value')
})
