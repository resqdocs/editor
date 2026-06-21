// Nachschlage-Referenz (#225): knapp, jede Konzept-Erklaerung mit Mini-Beispiel statt abstrakter
// Definition. Bewusst GETRENNT vom Einstiegs-Tutorial, damit Anfaenger nicht erschlagen werden.
// Einfache Sprache; erster Wurf (Fachsprache schaerft der Maintainer).

export interface RefEntry {
  term: string
  what: string
  example: string
}
export interface RefSection {
  id: string
  title: string
  intro: string
  entries: RefEntry[]
}

export const reference: RefSection[] = [
  {
    id: 'punkte',
    title: 'Bausteine (Punkt-Typen)',
    intro: 'Die einzelnen Zeilen in einem Block. Es gibt sechs Arten.',
    entries: [
      { term: 'Text', what: 'Ein fester Satz, der immer gleich erscheint. Kann Platzhalter enthalten.', example: 'Inhalt: „Patient wird leitliniengerecht versorgt."' },
      { term: 'Feld', what: 'Eine Stelle, die im Einsatz ausgefüllt wird (Freitext).', example: 'Label: „Einsatzort" → im Einsatz: „A3, km 12".' },
      { term: 'Liste', what: 'Mehrere Stichpunkte untereinander.', example: 'Einträge: „Lagerung", „Sauerstoffgabe".' },
      { term: 'Befund', what: 'Hat einen Normalbefund; im Einsatz: normal / auffällig / nicht erhoben.', example: 'Haut → normal: „rosig, warm, trocken".' },
      { term: 'Befundgruppe', what: 'Fasst mehrere Befunde in eine Zeile zusammen (z. B. xABCDE). Jeder Unter-Befund hat eine eigene Kennung.', example: 'B → Atemweg: frei. Atmung: regelrecht.' },
      { term: 'Medikamente', what: 'Platz für eine Medikamententabelle. Die Zeilen entstehen erst im Einsatz — Vorlagen tragen keine Patientendaten.', example: 'Nur Label + Sichtbarkeit; keine Einträge in der Vorlage.' },
    ],
  },
  {
    id: 'variablen',
    title: 'Variablen',
    intro: 'Ein Wert, den du einmal setzt und der an vielen Stellen wirkt. Vier Arten.',
    entries: [
      { term: 'Auswahl (select)', what: 'Eine feste Liste von Optionen mit Anzeige-Text.', example: 'Einsatzart: internistisch / traumatologisch.' },
      { term: 'Schalter (boolean)', what: 'Ja/Nein.', example: 'Bewusstlos? an/aus.' },
      { term: 'Text', what: 'Freier Text.', example: 'Name des Krankenhauses.' },
      { term: 'Zahl (number)', what: 'Eine Zahl.', example: 'Alter: 67.' },
      { term: 'Gender-Grammatik', what: 'Eine Auswahl-Variable (w/m/d) mit „de-gender" liefert Anrede-Platzhalter.', example: '{{patient}} → Patientin / Patient / Patient*in · {{der_die}} → die / der / der*die · {{er_sie}} → sie / er / er*sie.' },
      { term: 'Platzhalter', what: 'Im Text fügst du Variablen als {{var:id}} ein; sie werden automatisch ersetzt.', example: '„Alter: {{var:alter}} Jahre" → „Alter: 67 Jahre".' },
    ],
  },
  {
    id: 'bedingungen',
    title: 'Bedingungen (visibleIf)',
    intro: 'Steuert, ob ein Block oder Punkt sichtbar ist. Fehlt eine Bedingung, ist es immer sichtbar.',
    entries: [
      { term: 'gleich (eq)', what: 'Zeigen, wenn eine Variable einen bestimmten Wert hat.', example: 'Einsatzart = traumatologisch.' },
      { term: 'eine von (in)', what: 'Zeigen, wenn der Wert in einer Liste ist.', example: 'Einsatzart in [traumatologisch, neurologisch].' },
      { term: 'gesetzt (truthy)', what: 'Zeigen, wenn ein Schalter an / ein Wert vorhanden ist.', example: 'Bewusstlos? = an.' },
      { term: 'ausgefüllt (filled)', what: 'Zeigen, wenn ein Punkt einen Wert hat.', example: 'wenn „Einsatzort" ausgefüllt ist.' },
      { term: 'Befund-Status (state)', what: 'Zeigen abhängig vom Befund-Status (normal/auffällig).', example: 'wenn „Reanimation" = auffällig → „Details" einblenden.' },
      { term: 'UND / ODER / NICHT', what: 'Mehrere Bedingungen verschachteln. Der Editor kann den vollen Baum.', example: 'UND( Einsatzart = traumatologisch, NICHT(Bewusstlos? ) ).' },
    ],
  },
  {
    id: 'tri-state',
    title: 'Befunde: die drei Zustände',
    intro: 'Jeder Befund kennt drei Zustände — das vermeidet „vergessen" vs. „war normal".',
    entries: [
      { term: 'normal', what: 'Der hinterlegte Normalbefund erscheint.', example: 'Haut: „rosig, warm, trocken".' },
      { term: 'auffällig', what: 'Ein abweichender Befund (im Einsatz eingegeben).', example: 'Haut: „blass, kaltschweißig".' },
      { term: 'nicht erhoben', what: 'Der Punkt wird komplett weggelassen (Pflichtpunkte können das ausschließen).', example: 'Haut: (erscheint gar nicht im Text).' },
      { term: 'Varianten', what: 'Alternative Normalbefund-Texte, die man statt des Standards wählen kann.', example: 'Pupillen: „isokor" oder „seitengleich, mittelweit".' },
    ],
  },
]
