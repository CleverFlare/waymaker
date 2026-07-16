import { useEffect } from "react";
import type { SceneNode } from "@/store/sceneStore";

export function useAutoReveal(
  tree: any,
  selectedUuid: string | null,
  nodes: Record<string, SceneNode>,
  rootUuids: string[],
  rootId: string,
) {
  useEffect(() => {
    if (!selectedUuid) return;

    const parentMap: Record<string, string> = {};
    rootUuids.forEach((id) => {
      parentMap[id] = rootId;
    });
    Object.values(nodes).forEach((node) => {
      node.children.forEach((childId) => {
        parentMap[childId] = node.uuid;
      });
    });

    const ancestors: string[] = [];
    let current: string | undefined = parentMap[selectedUuid];
    while (current) {
      ancestors.push(current);
      current = parentMap[current];
    }

    ancestors.forEach((id) => tree.getItemInstance(id).expand());

    requestAnimationFrame(() => {
      tree
        .getItemInstance(selectedUuid)
        .getElement()
        ?.scrollIntoView({ block: "center" });
    });
  }, [selectedUuid]);
}
