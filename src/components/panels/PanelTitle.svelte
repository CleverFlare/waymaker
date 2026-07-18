<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props { children?: Snippet; }
  let { children }: Props = $props();
</script>

<p class="text-sm font-medium text-foreground truncate">{@render children?.()}</p>
