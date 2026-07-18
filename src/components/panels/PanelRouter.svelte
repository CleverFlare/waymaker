<script lang="ts">
  import { sceneStore } from "@/store/sceneStore.svelte";
  import type { ImagePlaneNode } from "@/store/sceneStore.svelte";
  import DefaultPanel from "./DefaultPanel.svelte";
  import ImagePlanePanel from "./ImagePlanePanel.svelte";

  const node = $derived(sceneStore.selectedUuid ? (sceneStore.nodes[sceneStore.selectedUuid] ?? null) : null);
</script>

{#if node}
  {#if node.type === "ImagePlane"}
    <ImagePlanePanel node={node as ImagePlaneNode} />
  {:else}
    <DefaultPanel {node} />
  {/if}
{/if}
