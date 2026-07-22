<script lang="ts">
	import { boxWith, mergeProps } from 'svelte-toolbelt';
	// import { createId } from "$lib/internal/create-id.js";
	import { createId } from '$bits/dist/internal/create-id.js';
	import { NumberFieldScrubAreaState } from '../number-field.svelte.js';
	import type { NumberFieldScrubAreaProps } from '../types.js';

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		direction = 'horizontal',
		pixelSensitivity = 2,
		teleportDistance,
		...restProps
	}: NumberFieldScrubAreaProps = $props();

	const scrubAreaState = NumberFieldScrubAreaState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		),
		direction: boxWith(() => direction),
		pixelSensitivity: boxWith(() => pixelSensitivity),
		teleportDistance: boxWith(() => teleportDistance)
	});

	const mergedProps = $derived(mergeProps(restProps, scrubAreaState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<span {...mergedProps}>
		{@render children?.()}
	</span>
{/if}
