<script lang="ts">
	import { boxWith, mergeProps } from "svelte-toolbelt";
	// import { createId } from "$lib/internal/create-id.js";
	import { createId } from "@/lib/internal/create-id.js";
	import { NumberFieldDecrementState } from "../number-field.svelte.js";
	import type { NumberFieldDecrementProps } from "../types.js";

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		disabled = false,
		...restProps
	}: NumberFieldDecrementProps = $props();

	const decrementState = NumberFieldDecrementState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		),
		disabled: boxWith(() => disabled),
	});

	const mergedProps = $derived(mergeProps(restProps, decrementState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<button {...mergedProps}>
		{@render children?.()}
	</button>
{/if}
