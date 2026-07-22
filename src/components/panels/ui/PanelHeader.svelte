<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props { children?: Snippet; }
  let { children }: Props = $props();
</script>

<div class="px-3 py-2 border-b border-border shrink-0">
  {@render children?.()}
</div>
