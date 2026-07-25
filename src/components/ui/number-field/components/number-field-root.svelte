<script lang="ts">
	import { boxWith, mergeProps } from 'svelte-toolbelt';
	// import { noop } from "$lib/internal/noop.js";
	// import { createId } from "$lib/internal/create-id.js";
	import { noop } from '$bits/dist/internal/noop.js';
	import { createId } from '$bits/dist/internal/create-id.js';
	import { NumberFieldRootState } from '../number-field.svelte.js';
	import type { NumberFieldRootProps } from '../types.js';

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		value = $bindable(null),
		onValueChange = noop,
		onValueCommitted = noop,
		onScrubStart = noop,
		onScrubEnd = noop,
		min,
		max,
		step = 1,
		smallStep = 0.1,
		largeStep = 10,
		snapOnStep = false,
		allowOutOfRange = false,
		allowWheelScrub = false,
		format,
		locale,
		disabled = false,
		readOnly = false,
		required = false,
		name,
		form,
		...restProps
	}: NumberFieldRootProps = $props();

	const rootState = NumberFieldRootState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		),
		value: boxWith(
			() => value,
			(v) => {
				value = v;
				onValueChange(v);
			}
		),
		onValueChange: boxWith(() => onValueChange),
		onValueCommitted: boxWith(() => onValueCommitted),
		onScrubStart: boxWith(() => onScrubStart),
		onScrubEnd: boxWith(() => onScrubEnd),
		min: boxWith(() => min),
		max: boxWith(() => max),
		step: boxWith(() => step),
		smallStep: boxWith(() => smallStep),
		largeStep: boxWith(() => largeStep),
		snapOnStep: boxWith(() => snapOnStep),
		allowOutOfRange: boxWith(() => allowOutOfRange),
		allowWheelScrub: boxWith(() => allowWheelScrub),
		format: boxWith(() => format),
		locale: boxWith(() => locale),
		disabled: boxWith(() => disabled),
		readOnly: boxWith(() => readOnly),
		required: boxWith(() => required),
		name: boxWith(() => name),
		form: boxWith(() => form)
	});

	const mergedProps = $derived(mergeProps(restProps, rootState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div {...mergedProps}>
		{@render children?.()}
	</div>
{/if}

{#if name}
	<input {...rootState.hiddenInputProps} />
{/if}
