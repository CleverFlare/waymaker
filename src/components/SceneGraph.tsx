import { useEffect, useLayoutEffect, useRef } from "react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { FolderOpenIcon, FolderIcon, BoxIcon, FileIcon } from "lucide-react";
import { useSceneStore, type SceneNode } from "@/store/sceneStore";

const SCENE_ROOT_ID = "__scene__";
const MESH_TYPES = new Set(["Mesh", "SkinnedMesh"]);

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

  const treeDataRef = useRef<TreeDataMap>({});
  treeDataRef.current = {
    [SCENE_ROOT_ID]: { name: "Scene", type: "Scene", children: modelRoots },
    ...(nodes as Record<string, SceneNode>),
  };

  const tree = useTree<TreeItemData>({
    rootItemId: SCENE_ROOT_ID,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (id) => treeDataRef.current[id],
      getChildren: (id) => treeDataRef.current[id]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
    initialState: {
      expandedItems: [SCENE_ROOT_ID, ...modelRoots],
    },
  });

  useLayoutEffect(() => {
    tree.rebuildTree();
  }, [modelRoots]);

  useEffect(() => {
    if (!selectedUuid) return;

    // Build child→parent map
    const parentMap: Record<string, string> = {};
    modelRoots.forEach((id) => {
      parentMap[id] = SCENE_ROOT_ID;
    });
    Object.values(nodes).forEach((node) => {
      node.children.forEach((childId) => {
        parentMap[childId] = node.uuid;
      });
    });

    // Walk up from selected node, collecting ancestors
    const ancestors: string[] = [];
    let current: string | undefined = parentMap[selectedUuid];
    while (current) {
      ancestors.push(current);
      current = parentMap[current];
    }

    ancestors.forEach((id) => tree.getItemInstance(id).expand());

    // Wait for the tree to re-render with expanded ancestors before scrolling
    requestAnimationFrame(() => {
      tree
        .getItemInstance(selectedUuid)
        .getElement()
        ?.scrollIntoView({ block: "center" });
    });
  }, [selectedUuid]);

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

        return (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel
              className={
                isSelected ? "!bg-white/10 !text-accent-foreground" : ""
              }
              onClick={() => selectNode(item.getId())}
            >
              <span className="flex items-center gap-1.5">
                {item.isFolder() ? (
                  item.isExpanded() ? (
                    <FolderOpenIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                  ) : (
                    <FolderIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
                  )
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
    </Tree>
  );
}
