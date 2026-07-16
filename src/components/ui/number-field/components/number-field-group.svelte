<script lang="ts">
	import { boxWith, mergeProps } from "svelte-toolbelt";
	import { createId } from "$lib/internal/create-id.js";
	import { NumberFieldGroupState } from "../number-field.svelte.js";
	import type { NumberFieldGroupProps } from "../types.js";

	const uid = $props.id();

	let {
		children,
		child,
		id = createId(uid),
		ref = $bindable(null),
		...restProps
	}: NumberFieldGroupProps = $props();

	const groupState = NumberFieldGroupState.create({
		id: boxWith(() => id),
		ref: boxWith(
			() => ref,
			(v) => (ref = v)
		),
	});

	const mergedProps = $derived(mergeProps(restProps, groupState.props));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div {...mergedProps}>
		{@render children?.()}
	</div>
{/if}
