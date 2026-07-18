<script lang="ts">
	import { boxWith, mergeProps } from 'svelte-toolbelt';
	// import { createId } from "$lib/internal/create-id.js";
	// import Portal from "$lib/bits/utilities/portal/portal.svelte";
	import { createId } from '@/lib/internal/create-id.js';
	import Portal from '@/lib/bits/utilities/portal/portal.svelte';
	import { NumberFieldScrubAreaCursorState } from '../number-field.svelte.js';
	import type { NumberFieldScrubAreaCursorProps } from '../types.js';

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		...restProps
	}: NumberFieldScrubAreaCursorProps = $props();

	const cursorState = NumberFieldScrubAreaCursorState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		)
	});

	const mergedProps = $derived(mergeProps(restProps, cursorState.props));
</script>

{#if cursorState.shouldRender}
	<Portal to="body">
		{#if child}
			{@render child({ props: mergedProps })}
		{:else}
			<span {...mergedProps}>
				{@render children?.()}
			</span>
		{/if}
	</Portal>
{/if}
