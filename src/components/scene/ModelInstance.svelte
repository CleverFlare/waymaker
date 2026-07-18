<script lang="ts">
	import { untrack } from 'svelte';
	import { T } from '@threlte/core';
	import { useGltf } from '@threlte/extras';
	import {
		addModel,
		removeNode,
		registerObject,
		unregisterObject
	} from '@/store/sceneStore.svelte';
	import { flattenScene } from '@/lib/scene';

	interface Props {
		url: string;
	}

	let { url }: Props = $props();

	const gltf = useGltf(untrack(() => url));

	$effect(() => {
		const loaded = $gltf;
		if (!loaded) return;

		const { rootUuid, nodes } = flattenScene(loaded.scene);
		addModel(nodes, rootUuid);
		loaded.scene.traverse((obj) => registerObject(obj.uuid, obj));

		return () => {
			removeNode(rootUuid);
			loaded.scene.traverse((obj) => unregisterObject(obj.uuid));
		};
	});
</script>

{#if $gltf}
	<T is={$gltf.scene} />
{/if}
