import {
  Tree,
  TreeItem,
  TreeItemLabel,
  TreeDragLine,
} from "@/components/reui/tree";
import {
  FolderOpenIcon,
  FolderIcon,
  BoxIcon,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import { useSceneTree } from "@/hooks/useSceneTree";

const MESH_TYPES = new Set(["Mesh", "SkinnedMesh"]);
const IMAGE_TYPES = new Set(["ImagePlane"]);

export function SceneGraph() {
  const { tree, treeDataRef, rootUuids, selectedUuid, selectNode } =
    useSceneTree();

  if (rootUuids.length === 0) {
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
          <TreeItem
            key={item.getId()}
            item={item}
            {...item.getDragHandleProps()}
          >
            <TreeItemLabel
              className={
                isSelected ? "!bg-white/10 !text-accent-foreground" : ""
              }
              onClick={() => selectNode(item.getId())}
            >
              <span className="flex items-center gap-1.5 min-w-0">
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
                <span className="truncate">{item.getItemName()}</span>
              </span>
            </TreeItemLabel>
          </TreeItem>
        );
      })}
      <TreeDragLine />
    </Tree>
  );
}
