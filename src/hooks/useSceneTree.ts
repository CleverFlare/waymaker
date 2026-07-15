import { useLayoutEffect, useRef } from "react";
import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  dragAndDropFeature,
  createOnDropHandler,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useSceneStore, type SceneNode } from "@/store/sceneStore";
import { useAutoReveal } from "@/hooks/useAutoReveal";
import { SCENE_ROOT_ID } from "@/lib/scene";

export interface TreeItemData {
  name: string;
  type: string;
  children: string[];
}

type TreeDataMap = Record<string, TreeItemData>;

function nodesStructurallyEqual(
  a: Record<string, SceneNode>,
  b: Record<string, SceneNode>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => {
    const an = a[k],
      bn = b[k];
    if (!bn) return false;
    return (
      an.name === bn.name &&
      an.type === bn.type &&
      an.children.length === bn.children.length &&
      an.children.every((c, i) => c === bn.children[i])
    );
  });
}

export function useSceneTree() {
  const nodes = useSceneStore((s) => s.nodes, nodesStructurallyEqual);
  const modelRoots = useSceneStore((s) => s.modelRoots);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const selectNode = useSceneStore((s) => s.selectNode);
  const getObject = useSceneStore((s) => s.getObject);
  const reparentNodes = useSceneStore((s) => s.reparentNodes);

  const treeDataRef = useRef<TreeDataMap>({});
  treeDataRef.current = {
    [SCENE_ROOT_ID]: { name: "Scene", type: "Scene", children: modelRoots },
    ...nodes,
  };

  const tree = useTree<TreeItemData>({
    rootItemId: SCENE_ROOT_ID,
    indent: 16,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (id) => treeDataRef.current[id],
      getChildren: (id) => treeDataRef.current[id]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, dragAndDropFeature],
    initialState: {
      expandedItems: [SCENE_ROOT_ID, ...modelRoots],
    },
    canDrop: () => true,
    onDrop: createOnDropHandler((item, newChildIds) => {
      const parentId = item.getId();
      const currentChildIds = treeDataRef.current[parentId]?.children ?? [];
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
  }, [modelRoots, nodes]);

  useAutoReveal(tree, selectedUuid, nodes, modelRoots, SCENE_ROOT_ID);

  return { tree, treeDataRef, modelRoots, selectedUuid, selectNode };
}
