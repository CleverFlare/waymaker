<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props { children?: Snippet; }
  let { children }: Props = $props();
</script>

<aside class="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
  {@render children?.()}
</aside>
