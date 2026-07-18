<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { ItemInstance } from '@headless-tree/core';
	import { cn } from '@/lib/utils';
	import { MinusIcon, PlusIcon, ChevronDownIcon } from 'lucide-svelte';
	import { TREE_CTX, type TreeContext } from './Tree.svelte';

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
			'flex min-w-0 items-center gap-1 overflow-hidden rounded-md px-2 py-1.5 text-sm transition-colors not-in-data-[folder=true]:ps-7 hover:bg-white/10 in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50 in-data-[drag-target=true]:bg-white/10 in-data-[search-match=true]:bg-blue-50! in-data-[selected=true]:bg-white/10 in-data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
			className
		)}
		{...rest}
	>
		{#if item.isFolder()}
			{#if ctx.toggleIconType === 'plus-minus'}
				{#if item.isExpanded()}
					<MinusIcon class="size-3.5 text-muted-foreground" stroke="currentColor" strokeWidth={1} />
				{:else}
					<PlusIcon class="size-3.5 text-muted-foreground" stroke="currentColor" strokeWidth={1} />
				{/if}
			{:else}
				<ChevronDownIcon class="size-4 text-muted-foreground in-aria-[expanded=false]:-rotate-90" />
			{/if}
		{/if}
		<span class="min-w-0 flex-1 truncate">
			{#if children}
				{@render children()}
			{:else if typeof item.getItemName === 'function'}
				{item.getItemName()}
			{/if}
		</span>
	</span>
{/if}
