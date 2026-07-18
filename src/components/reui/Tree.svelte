<script module>
  import type { ItemInstance } from "@headless-tree/core";

  export type ToggleIconType = "chevron" | "plus-minus";

  export interface TreeContext {
    indent: number;
    tree: any;
    toggleIconType: ToggleIconType;
    currentItem: ItemInstance<any> | undefined;
  }

  export const TREE_CTX = Symbol("tree");
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import type { Snippet } from "svelte";
  import { cn, normalizeHtProps } from "@/lib/utils";

  interface Props {
    indent?: number;
    tree?: any;
    toggleIconType?: ToggleIconType;
    class?: string;
    children?: Snippet;
  }

  let {
    indent = 20,
    tree,
    class: className,
    toggleIconType = "chevron",
    children,
  }: Props = $props();

  // Reactive context object — TreeItem updates currentItem here
  const ctx = $state<TreeContext>({ indent: 20, tree: undefined, toggleIconType: "chevron", currentItem: undefined });
  $effect.pre(() => {
    ctx.indent = indent;
    ctx.tree = tree;
    ctx.toggleIconType = toggleIconType;
  });
  setContext(TREE_CTX, ctx);

  // Normalize headless-tree container props (camelCase events, ref, style object)
  // Captured once at init — tree instance is stable for the component lifetime.
  const { ref: registerContainer, style: htStyle, attrs: htAttrs } = tree
    ? normalizeHtProps(tree.getContainerProps())
    : { ref: undefined, style: undefined, attrs: {} };

  let el: HTMLDivElement | undefined = $state();
  $effect(() => {
    if (!el || !registerContainer) return;
    registerContainer(el);
    return () => registerContainer(null);
  });
</script>

<div
  bind:this={el}
  data-slot="tree"
  style="--tree-indent: {indent}px{htStyle ? `; ${htStyle}` : ''}"
  class={cn("flex flex-col", className)}
  {...htAttrs}
>
  {@render children?.()}
</div>
