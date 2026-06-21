// Didaktische Beispiel-Vorlagen (#225). Jede zeigt EIN Konzept isoliert; das letzte kombiniert alles.
// Alle sind gegen protocol.schema.json valide (Test: examples.test.ts) und sofort im Editor ladbar.
import minimal from './examples/beispiel-minimal.json'
import variablen from './examples/beispiel-variablen.json'
import bedingungen from './examples/beispiel-bedingungen.json'
import befunde from './examples/beispiel-befunde.json'
import kombiniert from './examples/beispiel-kombiniert.json'
import type { ProtocolTemplate } from '@resqdocs/protocol-core/renderer/render.mjs'

export interface Example {
  /** Stabiler Schluessel fuer die UI. */
  key: string
  title: string
  /** Welches Konzept das Beispiel zeigt (kurz). */
  focus: string
  /** Ein, zwei Saetze, was man hier lernt. */
  description: string
  protocol: ProtocolTemplate
}

export const examples: Example[] = [
  {
    key: 'beispiel-minimal',
    title: '1 · Das Einfachste',
    focus: 'Blöcke & Punkte',
    description:
      'Ein Block mit den drei einfachsten Bausteinen: ein fester Text, ein Eingabefeld und eine Liste. So sieht das Allereinfachste aus.',
    protocol: minimal as unknown as ProtocolTemplate,
  },
  {
    key: 'beispiel-variablen',
    title: '2 · Variablen & Anrede',
    focus: 'Variablen + Gender',
    description:
      'Stelle in der Live-Vorschau das Geschlecht um und sieh, wie sich „die Patientin / der Patient" und das Alter automatisch im Text anpassen.',
    protocol: variablen as unknown as ProtocolTemplate,
  },
  {
    key: 'beispiel-bedingungen',
    title: '3 · Bedingungen',
    focus: 'Bedingungen',
    description:
      'Der Block „Unfallhergang" erscheint nur, wenn die Einsatzart „traumatologisch" ist. Stelle es in der Vorschau um und beobachte, wie der Block kommt und geht.',
    protocol: bedingungen as unknown as ProtocolTemplate,
  },
  {
    key: 'beispiel-befunde',
    title: '4 · Befunde',
    focus: 'Befunde & Befundgruppen',
    description:
      'Befunde haben einen Normalbefund und können auf „auffällig" oder „nicht erhoben" gestellt werden. Eine Befundgruppe fasst mehrere zu einer Zeile zusammen (wie xABCDE).',
    protocol: befunde as unknown as ProtocolTemplate,
  },
  {
    key: 'beispiel-kombiniert',
    title: '5 · Alles zusammen',
    focus: 'Kombination',
    description:
      'Variablen, eine Bedingung und Befunde in einer Vorlage — näher an einem echten Protokoll. Spiele in der Vorschau mit Geschlecht und „Bewusstlos?".',
    protocol: kombiniert as unknown as ProtocolTemplate,
  },
]
