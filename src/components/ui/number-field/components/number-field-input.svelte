<script lang="ts">
	import { boxWith, mergeProps } from 'svelte-toolbelt';
	// import { createId } from "$lib/internal/create-id.js";
	import { createId } from '@/lib/internal/create-id.js';
	import { NumberFieldInputState } from '../number-field.svelte.js';
	import type { NumberFieldInputProps } from '../types.js';

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		...restProps
	}: NumberFieldInputProps = $props();

	const inputState = NumberFieldInputState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		)
	});

	const mergedProps = $derived(mergeProps(restProps, inputState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<input {...mergedProps} />
{/if}
