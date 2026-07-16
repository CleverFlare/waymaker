import type { Object3D } from "three";
import { SCENE_ROOT_ID } from "@/lib/scene";

export type Vec3 = [number, number, number];
export type Tool = "select" | "move" | "rotate" | "resize";

export interface BaseNode {
  uuid: string;
  name: string;
  type: string;
  children: string[];
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface ImagePlaneNode extends BaseNode {
  type: "ImagePlane";
  billboard: boolean;
  sizeAttenuation: boolean;
  cameraRotation: Vec3;
  cameraScale: Vec3;
}

export type SceneNode = BaseNode | ImagePlaneNode;

export function createBaseNode(
  uuid: string,
  name: string,
  type: string,
  children: string[],
  position: Vec3 = [0, 0, 0],
  rotation: Vec3 = [0, 0, 0],
  scale: Vec3 = [1, 1, 1],
): BaseNode {
  return { uuid, name, type, children, position, rotation, scale };
}

export function createImagePlaneNode(
  uuid: string,
  name: string,
): ImagePlaneNode {
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
    cameraRotation: [0, 0, 0],
    cameraScale: [0.1, 0.1, 1],
  };
}

// Reactive state
export let nodes = $state<Record<string, SceneNode>>({});
export let modelRoots = $state<string[]>([]);
export let modelIdToRoot = $state<Record<string, string>>({});
export let selectedUuid = $state<string | null>(null);
export let activeTool = $state<Tool>("select");

// Non-reactive Object3D registry (same as before)
const objectRefs: Record<string, Object3D> = {};

export function setActiveTool(tool: Tool) {
  activeTool = tool;
}

export function addModel(
  modelId: string,
  newNodes: Record<string, SceneNode>,
  rootUuid: string,
) {
  nodes = { ...nodes, ...newNodes };
  modelRoots = [...modelRoots, rootUuid];
  modelIdToRoot = { ...modelIdToRoot, [modelId]: rootUuid };
}

export function removeModel(modelId: string) {
  const rootUuid = modelIdToRoot[modelId];
  if (!rootUuid) return;

  const toRemove = new Set<string>();
  const queue = [rootUuid];
  while (queue.length) {
    const uuid = queue.shift()!;
    toRemove.add(uuid);
    nodes[uuid]?.children.forEach((c) => queue.push(c));
  }

  const newNodes = { ...nodes };
  toRemove.forEach((uuid) => delete newNodes[uuid]);
  const { [modelId]: _, ...newModelIdToRoot } = modelIdToRoot;

  nodes = newNodes;
  modelRoots = modelRoots.filter((r) => r !== rootUuid);
  modelIdToRoot = newModelIdToRoot;
  if (toRemove.has(selectedUuid ?? "")) selectedUuid = null;
}

export function selectNode(uuid: string | null) {
  selectedUuid = uuid;
}

export function registerObject(uuid: string, obj: Object3D) {
  objectRefs[uuid] = obj;
}

export function unregisterObject(uuid: string) {
  delete objectRefs[uuid];
}

export function getObject(uuid: string): Object3D | undefined {
  return objectRefs[uuid];
}

export function reparentNodes(parentId: string, newChildIds: string[]) {
  if (parentId === SCENE_ROOT_ID) {
    modelRoots = newChildIds;
  } else {
    const node = nodes[parentId];
    if (!node) return;
    nodes = { ...nodes, [parentId]: { ...node, children: newChildIds } };
  }
}

export function updateNode(uuid: string, patch: Partial<SceneNode>) {
  const node = nodes[uuid];
  if (!node) return;
  nodes = { ...nodes, [uuid]: { ...node, ...patch } };
}
