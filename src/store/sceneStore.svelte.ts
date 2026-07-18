import type { Object3D } from "three";
import { SCENE_ROOT_ID } from "@/lib/scene";

export type Vec3 = [number, number, number];
export type Tool = "select" | "move" | "rotate" | "resize";

export interface ImportedModel {
  id: string;
  url: string;
}

export interface ImportedImage {
  id: string;
  url: string;
  name: string;
}

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

export const sceneStore = $state({
  nodes: {} as Record<string, SceneNode>,
  sceneRootChildren: [] as string[],
  selectedUuid: null as string | null,
  activeTool: "select" as Tool,
  importedModels: [] as ImportedModel[],
  importedImages: [] as ImportedImage[],
});

// Non-reactive Object3D registry (same as before)
const objectRefs: Record<string, Object3D> = {};

export function setActiveTool(tool: Tool) {
  sceneStore.activeTool = tool;
}

export function addImportedModel(url: string) {
  sceneStore.importedModels = [...sceneStore.importedModels, { id: crypto.randomUUID(), url }];
}

export function addImportedImage(url: string, name: string) {
  sceneStore.importedImages = [...sceneStore.importedImages, { id: crypto.randomUUID(), url, name }];
}

export function addModel(
  newNodes: Record<string, SceneNode>,
  rootUuid: string,
) {
  sceneStore.nodes = { ...sceneStore.nodes, ...newNodes };
  sceneStore.sceneRootChildren = [...sceneStore.sceneRootChildren, rootUuid];
}

export function removeNode(rootUuid: string) {
  const toRemove = new Set<string>();
  const queue = [rootUuid];
  while (queue.length) {
    const uuid = queue.shift()!;
    toRemove.add(uuid);
    sceneStore.nodes[uuid]?.children.forEach((c) => queue.push(c));
  }

  const newNodes = { ...sceneStore.nodes };
  toRemove.forEach((uuid) => delete newNodes[uuid]);

  sceneStore.nodes = newNodes;
  sceneStore.sceneRootChildren = sceneStore.sceneRootChildren.filter((uuid) => uuid !== rootUuid);
  if (toRemove.has(sceneStore.selectedUuid ?? "")) sceneStore.selectedUuid = null;
}

export function selectNode(uuid: string | null) {
  sceneStore.selectedUuid = uuid;
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
    sceneStore.sceneRootChildren = newChildIds;
  } else {
    const node = sceneStore.nodes[parentId];
    if (!node) return;
    sceneStore.nodes = { ...sceneStore.nodes, [parentId]: { ...node, children: newChildIds } };
  }
}

export function updateNode(uuid: string, patch: Partial<SceneNode>) {
  const node = sceneStore.nodes[uuid];
  if (!node) return;
  sceneStore.nodes = { ...sceneStore.nodes, [uuid]: { ...node, ...patch } };
}
