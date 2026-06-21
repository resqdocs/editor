// Provide/inject-Schluessel fuer die eine Editor-Instanz (#222). Vermeidet Prop-Drilling
// bis in die rekursive visibleIf-Baum-UI.
import { inject, type InjectionKey } from 'vue'
import type { ProtocolEditor } from './useProtocolEditor'
import type { PreviewState } from './usePreviewState'
import type { Tutorial } from './useTutorial'
import type { ProtocolTemplate } from '@resqdocs/protocol-core/renderer/render.mjs'

export const editorKey: InjectionKey<ProtocolEditor> = Symbol('protocol-editor')
export const previewKey: InjectionKey<PreviewState> = Symbol('protocol-preview')

/** Lern-Kontext (#225): Tutorial-Fortschritt + „Beispiel oeffnen" (laedt es + springt in die Vorschau). */
export interface LearnContext {
  tutorial: Tutorial
  openExample: (protocol: ProtocolTemplate) => void
}
export const learnKey: InjectionKey<LearnContext> = Symbol('protocol-learn')

export function useEditor(): ProtocolEditor {
  const ed = inject(editorKey)
  if (!ed) throw new Error('Editor-Instanz nicht bereitgestellt (provide editorKey fehlt).')
  return ed
}

export function usePreview(): PreviewState {
  const pv = inject(previewKey)
  if (!pv) throw new Error('Preview-Instanz nicht bereitgestellt (provide previewKey fehlt).')
  return pv
}

export function useLearn(): LearnContext {
  const l = inject(learnKey)
  if (!l) throw new Error('Learn-Kontext nicht bereitgestellt (provide learnKey fehlt).')
  return l
}
