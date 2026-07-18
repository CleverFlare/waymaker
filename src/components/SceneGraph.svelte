<script lang="ts">
  import { FolderOpenIcon, FolderIcon, BoxIcon, FileIcon, ImageIcon } from "lucide-svelte";
  import Tree from "@/components/reui/Tree.svelte";
  import TreeItem from "@/components/reui/TreeItem.svelte";
  import TreeItemLabel from "@/components/reui/TreeItemLabel.svelte";
  import TreeDragLine from "@/components/reui/TreeDragLine.svelte";
  import { createSceneTree } from "@/hooks/useSceneTree.svelte";
  import { sceneStore, selectNode } from "@/store/sceneStore.svelte";

  const MESH_TYPES = new Set(["Mesh", "SkinnedMesh"]);
  const IMAGE_TYPES = new Set(["ImagePlane"]);

  const { tree, items, treeData } = createSceneTree();
</script>

{#if sceneStore.sceneRootChildren.length === 0}
  <p class="px-4 py-6 text-center text-xs text-muted-foreground">
    Import a GLB or GLTF to see the scene graph
  </p>
{:else}
  <Tree {tree} indent={16} toggleIconType="chevron" class="p-2">
    {#each items as item (item.getId())}
      {@const data = treeData[item.getId()]}
      {@const isMesh = MESH_TYPES.has(data?.type ?? "")}
      {@const isImage = IMAGE_TYPES.has(data?.type ?? "")}
      <TreeItem {item} {...item.getDragHandleProps()}>
        <TreeItemLabel
          class={sceneStore.selectedUuid === item.getId() ? "!bg-white/10 !text-accent-foreground" : ""}
          onclick={() => selectNode(item.getId())}
        >
          <span class="flex items-center gap-1.5 min-w-0">
            {#if item.isFolder()}
              {#if item.isExpanded()}
                <FolderOpenIcon class="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
              {:else}
                <FolderIcon class="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
              {/if}
            {:else if isImage}
              <ImageIcon class="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
            {:else if isMesh}
              <BoxIcon class="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
            {:else}
              <FileIcon class="text-muted-foreground pointer-events-none size-3.5 shrink-0" />
            {/if}
            <span class="truncate">{item.getItemName()}</span>
          </span>
        </TreeItemLabel>
      </TreeItem>
    {/each}
    <TreeDragLine />
  </Tree>
{/if}
