import { untrack } from "svelte";
import {
  createTree,
  syncDataLoaderFeature,
  hotkeysCoreFeature,
  dragAndDropFeature,
  createOnDropHandler,
} from "@headless-tree/core";
import {
  sceneStore,
  getObject,
  reparentNodes,
} from "@/store/sceneStore.svelte";
import { SCENE_ROOT_ID } from "@/lib/scene";

export interface TreeItemData {
  name: string;
  type: string;
  children: string[];
}

type TreeDataMap = Record<string, TreeItemData>;

export function createSceneTree() {
  // Bumped by headless-tree's setState callback to signal interactive state
  // changes (expand/collapse, drag) that aren't driven by store updates.
  let treeVersion = $state(0);

  // Plain variable — updated synchronously before each rebuild so the
  // dataLoader closure always sees the latest data.
  let treeData: TreeDataMap = {};

  const tree = createTree<TreeItemData>({
    rootItemId: SCENE_ROOT_ID,
    indent: 16,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (id) => treeData[id],
      getChildren: (id) => treeData[id]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, dragAndDropFeature],
    initialState: {
      expandedItems: [SCENE_ROOT_ID, ...sceneStore.sceneRootChildren],
    },
    canDrop: () => true,
    onDrop: createOnDropHandler((item, newChildIds) => {
      const parentId = item.getId();
      const currentChildIds = treeData[parentId]?.children ?? [];
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
    setState: () => {
      treeVersion++;
    },
  });

  // Mirrors useLayoutEffect: runs before the DOM is painted so the first
  // render already has the up-to-date item list.
  $effect.pre(() => {
    treeData = {
      [SCENE_ROOT_ID]: { name: "Scene", type: "Scene", children: sceneStore.sceneRootChildren },
      ...sceneStore.nodes,
    };
    tree.rebuildTree();
  });

  // Auto-reveal: expand all ancestors of the newly selected item and scroll
  // it into view. Reads nodes/sceneRootChildren via untrack so only
  // selectedUuid changes trigger this effect (same as the original
  // useEffect(..., [selectedUuid])).
  $effect(() => {
    if (!sceneStore.selectedUuid) return;

    const currentNodes = untrack(() => sceneStore.nodes);
    const currentChildren = untrack(() => sceneStore.sceneRootChildren);

    const parentMap: Record<string, string> = {};
    currentChildren.forEach((id) => {
      parentMap[id] = SCENE_ROOT_ID;
    });
    Object.values(currentNodes).forEach((node) => {
      node.children.forEach((childId) => {
        parentMap[childId] = node.uuid;
      });
    });

    let current: string | undefined = parentMap[sceneStore.selectedUuid];
    while (current) {
      tree.getItemInstance(current).expand();
      current = parentMap[current];
    }

    requestAnimationFrame(() => {
      tree
        .getItemInstance(sceneStore.selectedUuid!)
        .getElement()
        ?.scrollIntoView({ block: "center" });
    });
  });

  const items = $derived.by(() => {
    treeVersion; // reactive dependency — re-evaluates on any tree state change
    return tree.getItems();
  });

  return {
    tree,
    get items() {
      return items;
    },
    get treeData() {
      return treeData;
    },
  };
}
