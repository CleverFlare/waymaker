<script lang="ts">
  import { getContext, setContext } from "svelte";
  import type { Snippet } from "svelte";
  import type { ItemInstance } from "@headless-tree/core";
  import { cn, normalizeHtProps } from "@/lib/utils";
  import { TREE_CTX, type TreeContext } from "./Tree.svelte";

  interface Props {
    item: ItemInstance<any>;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { item, class: className, children, ...rest }: Props = $props();

  const parentCtx = getContext<TreeContext>(TREE_CTX);

  // Child context overrides currentItem so TreeItemLabel can read it from context
  const itemCtx = $state<TreeContext>({ ...parentCtx, currentItem: undefined });
  $effect.pre(() => { itemCtx.currentItem = item; });
  setContext(TREE_CTX, itemCtx);

  // Normalize headless-tree item props — captured once at init; ref/attrs are stable.
  const { ref: registerItem, attrs: itemAttrs } =
    typeof item.getProps === "function"
      ? normalizeHtProps(item.getProps())
      : { ref: undefined, attrs: {} };

  // Convert camelCase event handlers from getDragHandleProps() passed as rest props
  const normalizedRest = $derived(
    Object.fromEntries(
      Object.entries(rest).map(([k, v]) => [/^on[A-Z]/.test(k) ? k.toLowerCase() : k, v]),
    )
  );

  let el: HTMLButtonElement | undefined = $state();
  $effect(() => {
    if (!el || !registerItem) return;
    registerItem(el);
    return () => registerItem(null);
  });
</script>

<button
  bind:this={el}
  data-slot="tree-item"
  style="--tree-padding: {item.getItemMeta().level * parentCtx.indent}px"
  class={cn(
    "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className,
  )}
  data-focus={item.isFocused?.() || false}
  data-folder={item.isFolder?.() || false}
  data-selected={item.isSelected?.() || false}
  data-drag-target={item.isDragTarget?.() || false}
  data-search-match={item.isMatchingSearch?.() || false}
  {...itemAttrs}
  {...normalizedRest}
>
  {@render children?.()}
</button>
