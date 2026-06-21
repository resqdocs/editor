// Tests (#225): jede didaktische Beispiel-Vorlage ist gegen protocol.schema.json valide
// (ajv, Draft 2020-12), erfuellt assertValidProtocolDraft und rendert ohne Fehler.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { assertValidProtocolDraft } from '@resqdocs/protocol-core/creator/creator.mjs'
import { render } from '@resqdocs/protocol-core/renderer/render.mjs'

const schema = JSON.parse(
  readFileSync(new URL('../../../../protocols/protocol.schema.json', import.meta.url), 'utf8'),
)
const ajv = new Ajv2020({ allErrors: true })
const validate = ajv.compile(schema)

const dir = fileURLToPath(new URL('./examples/', import.meta.url))
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))

test('es gibt mindestens 5 Beispiele', () => {
  assert.ok(files.length >= 5, `nur ${files.length} Beispiele`)
})

for (const f of files) {
  const proto = JSON.parse(readFileSync(dir + f, 'utf8'))

  test(`${f}: gegen protocol.schema.json valide (ajv 2020)`, () => {
    const ok = validate(proto)
    assert.equal(ok, true, JSON.stringify(validate.errors, null, 2))
  })

  test(`${f}: assertValidProtocolDraft + render + Metadaten`, () => {
    assert.equal(assertValidProtocolDraft(proto).valid, true)
    assert.doesNotThrow(() => render(proto, {}, {}))
    assert.equal(proto.schemaVersion, '0.2.0')
    assert.equal(proto.example, true, 'als didaktisches Beispiel markiert')
  })
}
