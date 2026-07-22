<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    label: string;
    children?: Snippet;
  }
  let { label, children }: Props = $props();
</script>

<div class="flex items-center justify-between gap-2">
  <span class="text-xs text-foreground">{label}</span>
  {@render children?.()}
</div>
