// Gestuftes, ueberspringbares Tutorial (#225). Sprache bewusst einfach + konkret, Du-Ansprache,
// fuer Kolleg:innen OHNE IT-Hintergrund. Jedes Kapitel ist fuer sich verstaendlich; wer mag, oeffnet
// das passende Beispiel und probiert es direkt in der Live-Vorschau aus (aktives Lernen).
//
// Hinweis: erster Wurf — die Fachsprache/Beispiele schaerft der Maintainer (Fachexperte) noch.

export interface TutorialChapter {
  id: string
  title: string
  /** Ein, zwei Saetze zum Einstieg. */
  intro: string
  /** Einfache, konkrete Erklaerpunkte. */
  points: string[]
  /** Optional: dieses Beispiel oeffnen und ausprobieren. */
  exampleKey?: string
  /** Was man dann in der Live-Vorschau tun soll. */
  tryHint?: string
}

export const tutorial: TutorialChapter[] = [
  {
    id: 'was-ist-eine-vorlage',
    title: 'Was ist eine Vorlage?',
    intro:
      'Eine Vorlage ist ein Gerüst für deinen Protokolltext. Du baust sie aus „Blöcken" und „Punkten" zusammen — wie Überschriften und Stichpunkte.',
    points: [
      'Ein BLOCK ist ein Abschnitt mit einer Überschrift (z. B. „Situation" oder „Untersuchung").',
      'In einem Block stehen PUNKTE — die einzelnen Zeilen.',
      'Rechts siehst du immer den fertigen Text, der daraus entsteht.',
      'Du musst nichts kaputtmachen können: Änderungen wirken nur in dieser Vorlage.',
    ],
    exampleKey: 'beispiel-minimal',
    tryHint: 'Öffne das Beispiel und schau dir links die Struktur und rechts den fertigen Text an.',
  },
  {
    id: 'punkte-fuellen',
    title: 'Punkte: Text, Feld, Liste',
    intro: 'Es gibt verschiedene Arten von Punkten. Die drei einfachsten reichen für den Anfang.',
    points: [
      'TEXT: ein fester Satz, der immer gleich erscheint.',
      'FELD: eine Stelle, die später im Einsatz ausgefüllt wird (z. B. „Einsatzort").',
      'LISTE: mehrere Stichpunkte untereinander (z. B. durchgeführte Maßnahmen).',
      'Im Bearbeiten-Modus wählst du links einen Punkt aus und änderst ihn in der Mitte.',
    ],
    exampleKey: 'beispiel-minimal',
    tryHint: 'Wechsle in „Bearbeiten", klicke einen Punkt an und ändere seinen Text oder seine Einträge.',
  },
  {
    id: 'befunde',
    title: 'Befunde & Befundgruppen',
    intro:
      'Ein Befund hat einen „Normalbefund" (das, was bei gesund dasteht) und kann im Einsatz auf „auffällig" oder „nicht erhoben" gestellt werden.',
    points: [
      'NORMALBEFUND: z. B. Haut „rosig, warm, trocken".',
      'Drei Zustände: normal · auffällig · nicht erhoben (wird dann weggelassen).',
      'Eine BEFUNDGRUPPE fasst mehrere Befunde in eine Zeile zusammen — so wie das xABCDE-Schema.',
    ],
    exampleKey: 'beispiel-befunde',
    tryHint: 'Stelle in der Live-Vorschau einen Befund auf „auffällig" oder „nicht erhoben" und sieh, wie sich die Zeile ändert.',
  },
  {
    id: 'variablen',
    title: 'Variablen (warum sich der Text anpasst)',
    intro:
      'Eine Variable ist ein Wert, den du einmal setzt und der an vielen Stellen wirkt — am eindrücklichsten beim Geschlecht.',
    points: [
      'Eine GENDER-Variable sorgt dafür, dass aus „die Patientin" automatisch „der Patient" wird.',
      'Es gibt vier Arten: Auswahl, Schalter (ja/nein), Text und Zahl.',
      'Im Text setzt du Platzhalter wie {{der_die}} oder {{var:alter}} — die werden automatisch ersetzt.',
    ],
    exampleKey: 'beispiel-variablen',
    tryHint: 'Stelle in der Vorschau das Geschlecht um (w/m/d) und das Alter — der Satz rechts passt sich sofort an.',
  },
  {
    id: 'bedingungen',
    title: 'Bedingungen: nur zeigen, wenn …',
    intro:
      'Mit einer Bedingung („visibleIf") erscheint ein Block oder Punkt nur, wenn etwas zutrifft — z. B. „Unfallhergang" nur bei einem Unfall.',
    points: [
      'Eine einfache Bedingung: „zeige diesen Block nur, wenn Einsatzart = traumatologisch".',
      'Bedingungen können sich auf Variablen ODER auf Befunde beziehen.',
      'Fortgeschritten: mehrere Bedingungen mit UND / ODER / NICHT verschachteln — der Editor kann das voll.',
    ],
    exampleKey: 'beispiel-bedingungen',
    tryHint: 'Stelle in der Vorschau die Einsatzart auf „traumatologisch" — der Block „Unfallhergang" taucht auf und wieder ab.',
  },
  {
    id: 'import-export',
    title: 'Speichern, Teilen & die App',
    intro:
      'Vorlagen kannst du als Datei exportieren und wieder importieren. Es ist dasselbe Format, das auch die ResQDocs-App nutzt.',
    points: [
      'EXPORTIEREN lädt die Vorlage als Datei herunter (oben in der Leiste).',
      'IMPORTIEREN lädt eine Datei wieder in den Editor — alles bleibt erhalten.',
      'Weil es dasselbe Format ist, passt eine hier gebaute Vorlage zur App.',
      'Wichtig: die Vorschau-Werte (Geschlecht, „auffällig" …) sind nur zum Ausprobieren — sie werden NICHT mitgespeichert.',
    ],
    exampleKey: 'beispiel-kombiniert',
    tryHint: 'Öffne das große Beispiel, exportiere es, und importiere die Datei gleich wieder.',
  },
]
