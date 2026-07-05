import { create } from "zustand"

export interface SceneNode {
  uuid: string
  name: string
  type: string
  children: string[]
}

interface SceneStore {
  nodes: Record<string, SceneNode>
  modelRoots: string[]
  modelIdToRoot: Record<string, string>
  selectedUuid: string | null
  addModel: (modelId: string, nodes: Record<string, SceneNode>, rootUuid: string) => void
  removeModel: (modelId: string) => void
  selectNode: (uuid: string | null) => void
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  nodes: {},
  modelRoots: [],
  modelIdToRoot: {},
  selectedUuid: null,

  addModel: (modelId, newNodes, rootUuid) =>
    set((state) => ({
      nodes: { ...state.nodes, ...newNodes },
      modelRoots: [...state.modelRoots, rootUuid],
      modelIdToRoot: { ...state.modelIdToRoot, [modelId]: rootUuid },
    })),

  removeModel: (modelId) => {
    const rootUuid = get().modelIdToRoot[modelId]
    if (!rootUuid) return

    const toRemove = new Set<string>()
    const queue = [rootUuid]
    const { nodes } = get()
    while (queue.length) {
      const uuid = queue.shift()!
      toRemove.add(uuid)
      nodes[uuid]?.children.forEach((c) => queue.push(c))
    }

    set((state) => {
      const newNodes = { ...state.nodes }
      toRemove.forEach((uuid) => delete newNodes[uuid])
      const { [modelId]: _, ...newModelIdToRoot } = state.modelIdToRoot
      return {
        nodes: newNodes,
        modelRoots: state.modelRoots.filter((r) => r !== rootUuid),
        modelIdToRoot: newModelIdToRoot,
        selectedUuid: toRemove.has(state.selectedUuid ?? "") ? null : state.selectedUuid,
      }
    })
  },

  selectNode: (uuid) => set({ selectedUuid: uuid }),
}))
