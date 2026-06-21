# apps/protocol-editor - Protokoll-Editor (Grundgeruest)

Eigenstaendige Web-App (Vue 3 + Vite + Tailwind CSS v4 + daisyUI) zum Ansehen und - in spaeteren
Slices - Bearbeiten von Protokoll-Vorlagen. Nutzt die geteilte, plattformneutrale Logik aus
`@resqdocs/protocol-core` (`packages/shared`), exakt wie die App.

**Aktueller Stand (#221, read-only):** laedt EINE kanonische Referenz-Vorlage
(`protocols/standardprotokoll.json`, Single Source of Truth - geteilt mit der App, bewusst nicht
kopiert) und zeigt sie strukturiert an (Titel, Variablen, Bloecke -> Punkte mit Typ) plus den
gerenderten Klartext ueber `render()`. Noch **kein** Editieren, **keine** Persistenz.

## Lokal starten

```bash
cd apps/protocol-editor
npm install      # verlinkt @resqdocs/protocol-core (file:../../packages/shared)
npm run dev      # Vite-Dev-Server, URL erscheint im Terminal
```

Produktions-Build:

```bash
npm run build    # vue-tsc -b && vite build  ->  dist/
npm run preview  # dist/ lokal vorschauen
```

## Aufloesung der geteilten Logik

Wie in `apps/pico-pwa` ueber drei abgestimmte Stellen (kein Build-Schritt im Paket noetig):

- `package.json`: `"@resqdocs/protocol-core": "file:../../packages/shared"`
- `vite.config.ts`: Alias `@resqdocs/protocol-core` -> `../../packages/shared` (+ `@protocols` -> `../../protocols`)
- `tsconfig.app.json`: `paths` fuer `@resqdocs/protocol-core/*` und `@protocols/*`

Importe nennen die Datei explizit mit `.mjs`, z. B.
`import { render } from '@resqdocs/protocol-core/renderer/render.mjs'`.

## Deployment

Siehe [`deploy/README.md`](deploy/README.md). Auslieferung als schlanker Docker-Container ueber
HTTP auf **Port 8081**; TLS/Domain via externem Reverse Proxy.
