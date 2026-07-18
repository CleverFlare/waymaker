<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '@/lib/utils';
	import { TREE_CTX, type TreeContext } from './Tree.svelte';

	interface Props {
		class?: string;
		[key: string]: unknown;
	}

	let { class: className, ...rest }: Props = $props();

	const ctx = getContext<TreeContext>(TREE_CTX);

	function dragLineStyle(): string {
		const s = ctx.tree?.getDragLineStyle?.() as Record<string, string> | null | undefined;
		if (!s) return 'display:none';
		return Object.entries(s)
			.map(([p, v]) => `${p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
			.join(';');
	}
</script>

{#if ctx.tree}
	<div
		style={dragLineStyle()}
		class={cn(
			'absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background',
			className
		)}
		{...rest}
	></div>
{/if}
