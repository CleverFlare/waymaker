<script lang="ts">
  import { getContext } from "svelte";
  import type { Snippet } from "svelte";
  import type { ItemInstance } from "@headless-tree/core";
  import { cn } from "@/lib/utils";
  import { MinusIcon, PlusIcon, ChevronDownIcon } from "lucide-svelte";
  import { TREE_CTX, type TreeContext } from "./Tree.svelte";

  interface Props {
    item?: ItemInstance<any>;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { item: propItem, class: className, children, ...rest }: Props = $props();

  const ctx = getContext<TreeContext>(TREE_CTX);
  // Prefer explicit prop; fall back to context-provided currentItem
  const item = $derived(propItem ?? ctx.currentItem);
</script>

{#if item}
  <span
    data-slot="tree-item-label"
    class={cn(
      "in-focus-visible:ring-ring/50 hover:bg-white/10 in-data-[selected=true]:bg-white/10 in-data-[selected=true]:text-accent-foreground in-data-[drag-target=true]:bg-white/10 flex items-center gap-1 transition-colors not-in-data-[folder=true]:ps-7 in-focus-visible:ring-[3px] in-data-[search-match=true]:bg-blue-50! [&_svg]:pointer-events-none [&_svg]:shrink-0 rounded-md py-1.5 px-2 text-sm min-w-0 overflow-hidden",
      className,
    )}
    {...rest}
  >
    {#if item.isFolder()}
      {#if ctx.toggleIconType === "plus-minus"}
        {#if item.isExpanded()}
          <MinusIcon class="text-muted-foreground size-3.5" stroke="currentColor" strokeWidth={1} />
        {:else}
          <PlusIcon class="text-muted-foreground size-3.5" stroke="currentColor" strokeWidth={1} />
        {/if}
      {:else}
        <ChevronDownIcon class="text-muted-foreground size-4 in-aria-[expanded=false]:-rotate-90" />
      {/if}
    {/if}
    <span class="flex-1 min-w-0 truncate">
      {#if children}
        {@render children()}
      {:else if typeof item.getItemName === "function"}
        {item.getItemName()}
      {/if}
    </span>
  </span>
{/if}
