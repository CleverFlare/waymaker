import { useLayoutEffect, useRef } from "react";
import { Tree, TreeItem, TreeItemLabel, TreeDragLine } from "@/components/reui/tree";
import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  dragAndDropFeature,
  createOnDropHandler,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { FolderOpenIcon, FolderIcon, BoxIcon, FileIcon, ImageIcon } from "lucide-react";
import { useSceneStore } from "@/store/sceneStore";
import { useAutoReveal } from "@/hooks/useAutoReveal";
import { SCENE_ROOT_ID } from "@/lib/scene";

const MESH_TYPES = new Set(["Mesh", "SkinnedMesh"]);
const IMAGE_TYPES = new Set(["ImagePlane"]);

interface TreeItemData {
  name: string;
  type: string;
  children: string[];
}

type TreeDataMap = Record<string, TreeItemData>;

export function SceneGraph() {
  const nodes = useSceneStore((s) => s.nodes);
  const modelRoots = useSceneStore((s) => s.modelRoots);
  const selectNode = useSceneStore((s) => s.selectNode);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
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
      const addedIds = newChildIds.filter((id) => !currentChildIds.includes(id));

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

  // Rebuild tree whenever hierarchy changes (model load/unload or reparenting)
  useLayoutEffect(() => {
    tree.rebuildTree();
  }, [modelRoots, nodes]);

  useAutoReveal(tree, selectedUuid, nodes, modelRoots, SCENE_ROOT_ID);

  if (modelRoots.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-xs text-muted-foreground">
        Import a GLB or GLTF to see the scene graph
      </p>
    );
  }

  return (
    <Tree tree={tree} indent={16} toggleIconType="chevron" className="p-2">
      {tree.getItems().map((item) => {
        const data = treeDataRef.current[item.getId()];
        const isSelected = item.getId() === selectedUuid;
        const isMesh = MESH_TYPES.has(data?.type ?? "");
        const isImage = IMAGE_TYPES.has(data?.type ?? "");

        return (
          <TreeItem key={item.getId()} item={item} {...item.getDragHandleProps()}>
            <TreeItemLabel
              className={isSelected ? "!bg-white/10 !text-accent-foreground" : ""}
              onClick={() => selectNode(item.getId())}
            >
              <span className="flex items-center gap-1.5">
                {item.isFolder() ? (
                  item.isExpanded() ? (
                    <FolderOpenIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                  ) : (
                    <FolderIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                  )
                ) : isImage ? (
                  <ImageIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                ) : isMesh ? (
                  <BoxIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                ) : (
                  <FileIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                )}
                {item.getItemName()}
              </span>
            </TreeItemLabel>
          </TreeItem>
        );
      })}
      <TreeDragLine />
    </Tree>
  );
}
