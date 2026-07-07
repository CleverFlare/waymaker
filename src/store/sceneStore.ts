import { create } from "zustand"
import type { Object3D } from "three"
import { SCENE_ROOT_ID } from "@/lib/scene"

export type Vec3 = [number, number, number]

export interface BaseNode {
  uuid: string
  name: string
  type: string
  children: string[]
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export interface ImagePlaneNode extends BaseNode {
  type: "ImagePlane"
  billboard: boolean
  sizeAttenuation: boolean
  sizeAttenuationRef: number | null
}

export type SceneNode = BaseNode | ImagePlaneNode

export function createBaseNode(
  uuid: string,
  name: string,
  type: string,
  children: string[],
  position: Vec3 = [0, 0, 0],
  rotation: Vec3 = [0, 0, 0],
  scale: Vec3 = [1, 1, 1],
): BaseNode {
  return { uuid, name, type, children, position, rotation, scale }
}

export function createImagePlaneNode(uuid: string, name: string): ImagePlaneNode {
  return {
    uuid,
    name,
    type: "ImagePlane",
    children: [],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    billboard: false,
    sizeAttenuation: false,
    sizeAttenuationRef: null,
  }
}

interface SceneStore {
  nodes: Record<string, SceneNode>
  modelRoots: string[]
  modelIdToRoot: Record<string, string>
  selectedUuid: string | null
  addModel: (modelId: string, nodes: Record<string, SceneNode>, rootUuid: string) => void
  removeModel: (modelId: string) => void
  selectNode: (uuid: string | null) => void
  registerObject: (uuid: string, obj: Object3D) => void
  unregisterObject: (uuid: string) => void
  getObject: (uuid: string) => Object3D | undefined
  reparentNodes: (parentId: string, newChildIds: string[]) => void
  updateNode: (uuid: string, patch: Partial<SceneNode>) => void
}

export const useSceneStore = create<SceneStore>((set, get) => {
  const objectRefs: Record<string, Object3D> = {}

  return {
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

    registerObject: (uuid, obj) => { objectRefs[uuid] = obj },
    unregisterObject: (uuid) => { delete objectRefs[uuid] },
    getObject: (uuid) => objectRefs[uuid],

    reparentNodes: (parentId, newChildIds) => {
      if (parentId === SCENE_ROOT_ID) {
        set({ modelRoots: newChildIds })
      } else {
        set((state) => {
          const node = state.nodes[parentId]
          if (!node) return state
          return {
            nodes: { ...state.nodes, [parentId]: { ...node, children: newChildIds } },
          }
        })
      }
    },

    updateNode: (uuid, patch) =>
      set((state) => {
        const node = state.nodes[uuid]
        if (!node) return state
        return { nodes: { ...state.nodes, [uuid]: { ...node, ...patch } } }
      }),
  }
})
