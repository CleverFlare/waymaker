<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    label: string;
    children?: Snippet;
  }
  let { label, children }: Props = $props();
</script>

<div class="space-y-1">
  <p class="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
  {@render children?.()}
</div>
