// Laedt die kanonische Referenz-Vorlage aus protocols/ (Single Source of Truth -
// dieselbe Datei, die auch die App nutzt; bewusst NICHT kopiert, um Drift zu
// vermeiden). Read-only fuer das Editor-Grundgeruest (#221).
//
// Aufloesung: '@protocols' -> ../../protocols (Vite-Alias + tsconfig paths),
// genau wie in apps/pico-pwa/src/data/protocols.ts.
import seed from '@protocols/standardprotokoll.json'
import type { ProtocolTemplate } from '@resqdocs/protocol-core/renderer/render.mjs'

export const sampleProtocol = seed as unknown as ProtocolTemplate
