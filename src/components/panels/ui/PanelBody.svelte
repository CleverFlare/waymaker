<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props { children?: Snippet; }
  let { children }: Props = $props();
</script>

<div class="min-h-0 overflow-y-auto p-3 space-y-4">
  {@render children?.()}
</div>
