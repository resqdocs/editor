// Anzeige-Name eines Punkts im Editor/der Vorschau (#70).
//
// title = reiner Anzeige-Titel (nur 'field' fuehrt ihn, siehe PointDetail.vue),
// label = getippter Output (DARF leer sein), key = typ-spezifischer Schluessel,
// id = stabiler Bezeichner. Reihenfolge: title -> label -> key -> humanize(id).
//
// WICHTIG: Leerstring zaehlt als "nicht gesetzt" (PointDetail.vue schreibt ein
// geleertes Label als '' statt undefined). Darum '||'-Semantik mit trim, NICHT '??'.

function trimmed(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Humanisiert eine id: snake_case / kebab-case / camelCase -> "Woerter mit Leerzeichen". */
export function humanize(id: unknown): string {
  return String(id ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Anzeige-Name eines Punkts: title || label || key || humanize(id). */
export function displayName(p: { title?: unknown; label?: unknown; key?: unknown; id?: unknown }): string {
  return trimmed(p.title) || trimmed(p.label) || trimmed(p.key) || humanize(p.id)
}
