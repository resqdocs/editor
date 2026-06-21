# ResQDocs Protokoll-Editor

Eigenständiger Open-Source-Build des ResQDocs **Protokoll-Editors** — ein Web-Werkzeug, um
Protokollvorlagen aus Blöcken, Befunden und Feldern zusammenzustellen (mit Variablen,
Bedingungen und einer interaktiven Live-Vorschau). Die fachliche Logik teilt sich der Editor
mit der ResQDocs-App über das Paket `@resqdocs/protocol-core`.

> Dieses Repository enthält den Open-Source-Stand des Editors. Es baut eigenständig; für ein
> eigenes Deployment hinterlege eigene Konfigurationswerte.

## Struktur

```
apps/protocol-editor/   # die Editor-Web-App (Vue 3 + Vite + Tailwind)
packages/shared/        # @resqdocs/protocol-core (renderer/creator/runtime), eigenständig
protocols/              # Protokoll-Schema + Beispiel-Vorlage
```

## Lokal bauen

```bash
cd apps/protocol-editor
npm ci          # bzw. npm install
npm run build   # Ausgabe in apps/protocol-editor/dist/
npm run dev     # lokaler Dev-Server
```

## Deployment

Statischer Build hinter nginx, ausgeliefert als schlanker Docker-Container über HTTP
(Port 8081); TLS/Domain übernimmt ein externer Reverse Proxy. Siehe
`apps/protocol-editor/deploy/` (Platzhalter durch eigene Werte ersetzen).

## Lizenz

Die Editor-App steht unter **GPL-3.0-or-later** (siehe `LICENSE`); `packages/shared`
(`@resqdocs/protocol-core`) unter **MIT** (siehe dortige `package.json`).
