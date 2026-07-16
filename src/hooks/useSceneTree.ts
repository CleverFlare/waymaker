import { useLayoutEffect, useRef } from "react";
import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  dragAndDropFeature,
  createOnDropHandler,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useSceneStore } from "@/store/sceneStore";
import { useAutoReveal } from "@/hooks/useAutoReveal";
import { SCENE_ROOT_ID } from "@/lib/scene";

export interface TreeItemData {
  name: string;
  type: string;
  children: string[];
}

function getNodeData(id: string): TreeItemData | undefined {
  const { nodes, modelRoots } = useSceneStore.getState();
  if (id === SCENE_ROOT_ID)
    return { name: "Scene", type: "Scene", children: modelRoots };
  return nodes[id];
}

export function useSceneTree() {
  const structureVersion = useSceneStore((s) => s.structureVersion);
  const nodes = useSceneStore((s) => s.nodes);
  const modelRoots = useSceneStore((s) => s.modelRoots);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const selectNode = useSceneStore((s) => s.selectNode);
  const getObject = useSceneStore((s) => s.getObject);
  const reparentNodes = useSceneStore((s) => s.reparentNodes);

  const tree = useTree<TreeItemData>({
    rootItemId: SCENE_ROOT_ID,
    indent: 16,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (id) => getNodeData(id)!,
      getChildren: (id) => getNodeData(id)!.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, dragAndDropFeature],
    initialState: {
      expandedItems: [SCENE_ROOT_ID, ...modelRoots],
    },
    canDrop: () => true,
    onDrop: createOnDropHandler((item, newChildIds) => {
      const parentId = item.getId();
      const currentChildIds = getNodeData(parentId)?.children ?? [];
      const addedIds = newChildIds.filter(
        (id) => !currentChildIds.includes(id),
      );

      reparentNodes(parentId, newChildIds);

      const parentObject = getObject(parentId);
      if (parentObject) {
        addedIds.forEach((id) => {
          const childObject = getObject(id);
          if (childObject) parentObject.attach(childObject);
        });
      }
    }),
  });

  useLayoutEffect(() => {
    tree.rebuildTree();
  }, [structureVersion]);

  useAutoReveal(tree, selectedUuid, nodes, modelRoots, SCENE_ROOT_ID);

  return { tree, modelRoots, selectedUuid, selectNode };
}
