import type { Object3D } from "three";
import type { SceneNode } from "@/store/sceneStore";

export const SCENE_ROOT_ID = "__scene__";

export function flattenScene(root: Object3D): {
  rootUuid: string;
  nodes: Record<string, SceneNode>;
} {
  const nodes: Record<string, SceneNode> = {};
  let counter = 0;

  function walk(obj: Object3D): string {
    const name = obj.name.trim() || `${obj.type} #${++counter}`;
    const validChildren = obj.children
      .filter((c) => c.type !== "Bone")
      .map((c) => walk(c));
    nodes[obj.uuid] = { uuid: obj.uuid, name, type: obj.type, children: validChildren };
    return obj.uuid;
  }

  return { rootUuid: walk(root), nodes };
}

export function findByUuid(root: Object3D, uuid: string): Object3D | null {
  let found: Object3D | null = null;
  root.traverse((obj) => {
    if (obj.uuid === uuid) found = obj;
  });
  return found;
}
