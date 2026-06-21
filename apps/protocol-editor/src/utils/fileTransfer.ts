// fileTransfer.ts — die EINZIGE Stelle mit Browser-Datei-APIs im Editor (Konvention, analog
// apps/pico-pwa/src/utils/fileTransfer.ts). Reine Web-App: nur Blob-Download + Datei-Lesen,
// kein Capacitor/Server. Import/Export-Inhalt selbst kommt verbatim aus protocol-core.

/** Laedt JSON als Datei herunter (Web-Blob). Anker MUSS im DOM haengen, sonst ignoriert
 *  Firefox den programmatischen Klick; URL wird im finally freigegeben (kein Leak). */
export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Liest eine ausgewaehlte Datei als Text. Wirft bei Lesefehler (vom Aufrufer behandelt). */
export function readTextFile(file: File): Promise<string> {
  return file.text()
}
