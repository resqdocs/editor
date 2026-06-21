<script setup lang="ts">
/**
 * Rekursiver Editor fuer EINEN Knoten des visibleIf-Baums (#222, Stufe 5).
 * Knoten = Blatt (Subjekt var|point + Operator + Wert) ODER Kombinator UND/ODER/NICHT.
 * Controlled: gibt bei jeder Aenderung einen NEUEN Knoten hoch. Baut KEINE Predicates und
 * mutiert nichts — die Umwandlung in ein Predicate + Persistenz erledigt der Aufrufer
 * (VisibleIfEditor -> editor.set*VisibleIf -> updateBlock/updatePoint).
 */
import { useEditor } from '@/composables/editorKey'
import {
  emptyLeaf,
  opsForSource,
  defaultValueForOp,
  type PredNode,
  type LeafNode,
  type PredKind,
  type PredSource,
} from '@/composables/visibleIfModel'
import type { SimpleOp } from '@resqdocs/protocol-core/creator/creator.mjs'
import StringListEditor from './StringListEditor.vue'

defineOptions({ name: 'PredicateNode' })
const props = defineProps<{ modelValue: PredNode; depth?: number }>()
const emit = defineEmits<{ 'update:modelValue': [PredNode]; remove: [] }>()

const editor = useEditor()
const depth = props.depth ?? 0

function setKind(kind: PredKind): void {
  const cur = props.modelValue
  if (kind === cur.kind) return
  if (kind === 'leaf') {
    emit('update:modelValue', cur.kind === 'leaf' ? cur : emptyLeaf())
  } else if (kind === 'not') {
    emit('update:modelValue', { kind: 'not', child: cur.kind === 'not' ? cur.child : cur })
  } else {
    const children = cur.kind === 'all' || cur.kind === 'any' ? cur.children : [cur]
    emit('update:modelValue', { kind, children })
  }
}

// ----- Blatt -----
function leaf(): LeafNode {
  return props.modelValue as LeafNode
}
function setLeaf(patch: Partial<LeafNode>): void {
  emit('update:modelValue', { ...leaf(), ...patch })
}
function setSource(source: PredSource): void {
  const l = leaf()
  const op = opsForSource(source).includes(l.op) ? l.op : 'eq'
  setLeaf({ source, op, value: op === l.op ? l.value : defaultValueForOp(op) })
}
function setOp(op: SimpleOp): void {
  setLeaf({ op, value: defaultValueForOp(op) })
}

// ----- Kombinatoren -----
function updateChild(i: number, child: PredNode): void {
  const g = props.modelValue as Extract<PredNode, { kind: 'all' | 'any' }>
  const children = g.children.slice()
  children[i] = child
  emit('update:modelValue', { ...g, children })
}
function removeChild(i: number): void {
  const g = props.modelValue as Extract<PredNode, { kind: 'all' | 'any' }>
  emit('update:modelValue', { ...g, children: g.children.filter((_, idx) => idx !== i) })
}
function addChild(): void {
  const g = props.modelValue as Extract<PredNode, { kind: 'all' | 'any' }>
  emit('update:modelValue', { ...g, children: [...g.children, emptyLeaf()] })
}
function updateNotChild(child: PredNode): void {
  emit('update:modelValue', { kind: 'not', child })
}

const KIND_LABELS: Record<PredKind, string> = { leaf: 'Bedingung', all: 'UND (alle)', any: 'ODER (eine)', not: 'NICHT' }
</script>

<template>
  <div class="rounded-box border border-base-300 p-2" :class="depth > 0 ? 'bg-base-100' : 'bg-base-200'">
    <div class="flex flex-wrap items-center gap-2">
      <select
        class="select select-xs select-bordered"
        :value="modelValue.kind"
        @change="setKind(($event.target as HTMLSelectElement).value as PredKind)"
      >
        <option v-for="k in (['leaf', 'all', 'any', 'not'] as PredKind[])" :key="k" :value="k">{{ KIND_LABELS[k] }}</option>
      </select>

      <!-- Blatt: Subjekt + Operator + Wert -->
      <template v-if="modelValue.kind === 'leaf'">
        <select
          class="select select-xs select-bordered"
          :value="modelValue.source"
          @change="setSource(($event.target as HTMLSelectElement).value as PredSource)"
        >
          <option value="var">Variable</option>
          <option value="point">Punkt</option>
        </select>

        <select
          class="select select-xs select-bordered"
          :value="modelValue.id"
          @change="setLeaf({ id: ($event.target as HTMLSelectElement).value })"
        >
          <option value="" disabled>– wählen –</option>
          <template v-if="modelValue.source === 'var'">
            <option v-for="v in editor.variables.value" :key="v.id" :value="v.id">{{ v.label || v.id }}</option>
          </template>
          <template v-else>
            <option v-for="r in editor.pointRefs.value" :key="r.id" :value="r.id">{{ r.label }} ({{ r.group }})</option>
          </template>
        </select>

        <select
          class="select select-xs select-bordered"
          :value="modelValue.op"
          @change="setOp(($event.target as HTMLSelectElement).value as SimpleOp)"
        >
          <option v-for="o in opsForSource(modelValue.source)" :key="o" :value="o">{{ o }}</option>
        </select>

        <!-- Wert je Operator -->
        <input
          v-if="modelValue.op === 'eq'"
          class="input input-xs input-bordered w-40"
          :value="String(modelValue.value ?? '')"
          placeholder="Wert"
          @input="setLeaf({ value: ($event.target as HTMLInputElement).value })"
        />
        <select
          v-else-if="modelValue.op === 'state'"
          class="select select-xs select-bordered"
          :value="String(modelValue.value)"
          @change="setLeaf({ value: ($event.target as HTMLSelectElement).value })"
        >
          <option value="abnormal">abnormal</option>
          <option value="normal">normal</option>
        </select>
        <label v-else-if="modelValue.op === 'truthy' || modelValue.op === 'filled'" class="label cursor-pointer gap-1 py-0">
          <input
            type="checkbox"
            class="toggle toggle-xs"
            :checked="modelValue.value !== false"
            @change="setLeaf({ value: ($event.target as HTMLInputElement).checked })"
          />
          <span class="label-text text-xs">{{ modelValue.value !== false ? 'true' : 'false' }}</span>
        </label>
      </template>

      <span v-else class="text-xs text-base-content/60">
        {{ modelValue.kind === 'not' ? 'negiert die innere Bedingung' : 'verknüpft die Bedingungen' }}
      </span>

      <button v-if="depth > 0" class="btn btn-ghost btn-xs text-error ml-auto" title="entfernen" @click="emit('remove')">
        ✕
      </button>
    </div>

    <!-- `in`-Werte (Liste) -->
    <div v-if="modelValue.kind === 'leaf' && modelValue.op === 'in'" class="mt-2 pl-2">
      <span class="text-xs text-base-content/60">Werte (Treffer = einer davon):</span>
      <StringListEditor
        :model-value="(modelValue.value as string[]) ?? []"
        placeholder="Wert"
        add-label="Wert"
        @update:model-value="setLeaf({ value: $event })"
      />
    </div>

    <!-- UND/ODER: Kinderliste -->
    <div v-if="modelValue.kind === 'all' || modelValue.kind === 'any'" class="mt-2 flex flex-col gap-2 pl-2">
      <PredicateNode
        v-for="(child, i) in modelValue.children"
        :key="i"
        :model-value="child"
        :depth="depth + 1"
        @update:model-value="updateChild(i, $event)"
        @remove="removeChild(i)"
      />
      <button class="btn btn-ghost btn-xs self-start" @click="addChild">+ Bedingung</button>
    </div>

    <!-- NICHT: ein Kind -->
    <div v-if="modelValue.kind === 'not'" class="mt-2 pl-2">
      <PredicateNode :model-value="modelValue.child" :depth="depth + 1" @update:model-value="updateNotChild" />
    </div>
  </div>
</template>
