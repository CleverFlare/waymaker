<script lang="ts">
	import { boxWith, mergeProps } from 'svelte-toolbelt';
	// import { createId } from "$lib/internal/create-id.js";
	import { createId } from '$bits/dist/internal/create-id.js';
	import { NumberFieldIncrementState } from '../number-field.svelte.js';
	import type { NumberFieldIncrementProps } from '../types.js';

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		disabled = false,
		...restProps
	}: NumberFieldIncrementProps = $props();

	const incrementState = NumberFieldIncrementState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		),
		disabled: boxWith(() => disabled)
	});

	const mergedProps = $derived(mergeProps(restProps, incrementState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<button {...mergedProps}>
		{@render children?.()}
	</button>
{/if}
