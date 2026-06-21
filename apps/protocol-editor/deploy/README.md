# Deployment - ResQDocs Protokoll-Editor

Statischer Build (Vue + Vite) hinter **nginx**, ausgeliefert ueber **HTTP auf Port 8081**.
TLS, Domain und Zertifikate uebernimmt ein **externer Reverse Proxy** - der Container verwaltet
keine Zertifikate.

> Platzhalter in diesem Dokument bitte durch eigene Werte ersetzen:
> `<host>` = Zielhost deines Reverse Proxy / Docker-Hosts, `editor.example.com` = deine
> (Sub-)Domain. Keine echten internen Hosts/IPs eintragen.

## Build-Besonderheit: Repo-Wurzel als Kontext

Der Editor nutzt das lokale Paket `packages/shared` (`@resqdocs/protocol-core`) **und** liest die
kanonischen Seeds aus `protocols/`. Beide liegen ausserhalb des App-Ordners, daher ist der
Docker-Build-Kontext das **Repo-Wurzelverzeichnis** (nicht `apps/protocol-editor`).

## Weg A - Standalone-Image (image-gebacken)

```bash
# aus apps/protocol-editor (compose setzt context: ../../):
docker compose up -d --build

# oder direkt, vom Repo-Root:
docker build -f apps/protocol-editor/Dockerfile -t resqdocs-editor:latest .
docker run -d --restart unless-stopped -p 8081:8081 resqdocs-editor:latest
```

## Weg B - Produktion (nginx-unprivileged, gemountetes Bundle)

Gehaertete Variante (non-root, read-only FS). Serviert ein **vorab gebautes** Bundle:

```bash
# 1) Bundle bauen (vom Repo-Root oder aus apps/protocol-editor):
cd apps/protocol-editor && npm ci && npm run build

# 2) dist/ als ./deploy/site bereitstellen und Container starten:
cp -r dist deploy/site
cd deploy && docker compose -f docker-compose.yml up -d
```

`deploy/nginx.conf` ist fuer beide Wege die einzige Quelle der Wahrheit.

## Reverse Proxy

Im vorgelagerten Reverse Proxy `editor.example.com` -> `http://<host>:8081` weiterleiten und
TLS dort terminieren. Aktualisieren = neues Bundle bauen und neu ausrollen; der Container ist
zustandslos.
