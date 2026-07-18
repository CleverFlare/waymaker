<script lang="ts">
  import { selectedUuid, nodes } from "@/store/sceneStore.svelte";
  import type { ImagePlaneNode } from "@/store/sceneStore.svelte";
  import DefaultPanel from "./DefaultPanel.svelte";
  import ImagePlanePanel from "./ImagePlanePanel.svelte";

  const node = $derived(selectedUuid ? (nodes[selectedUuid] ?? null) : null);
</script>

{#if node}
  {#if node.type === "ImagePlane"}
    <ImagePlanePanel node={node as ImagePlaneNode} />
  {:else}
    <DefaultPanel {node} />
  {/if}
{/if}
