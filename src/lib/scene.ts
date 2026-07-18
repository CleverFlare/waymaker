import type { Object3D } from "three";
import { createBaseNode, type SceneNode } from "@/store/sceneStore.svelte";

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
    nodes[obj.uuid] = createBaseNode(
      obj.uuid,
      name,
      obj.type,
      validChildren,
      [obj.position.x, obj.position.y, obj.position.z],
      [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      [obj.scale.x, obj.scale.y, obj.scale.z],
    );
    return obj.uuid;
  }

  return { rootUuid: walk(root), nodes };
}
