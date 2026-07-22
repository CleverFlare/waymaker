<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { CameraControls, Grid } from '@threlte/extras';
	import { NetworkIcon } from 'lucide-svelte';
	import { TooltipProvider } from '@/components/ui/tooltip';
	import SceneGraph from '@/components/SceneGraph.svelte';
	import PanelRouter from '@/components/panels/PanelRouter.svelte';
	import Toolbar from '@/components/Toolbar.svelte';
	import SceneRegistrar from '@/components/scene/SceneRegistrar.svelte';
	import SelectionManager from '@/components/scene/SelectionManager.svelte';
	import TransformGizmo from '@/components/scene/TransformGizmo.svelte';
	import ModelInstance from '@/components/scene/ModelInstance.svelte';
	import ImageInstance from '@/components/scene/ImageInstance.svelte';
	import { sceneStore, addImportedModel, addImportedImage } from '@/store/sceneStore.svelte';
	import { Toaster } from '@/components/ui/sonner';
	import { toast } from 'svelte-sonner';

	// Absorbed from the dissolved useImportedFiles hook (Phase 4)
	const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
	const MODEL_EXT = /\.(glb|gltf)$/i;

	$effect(() => {
		return window.electronAPI.onImportFiles((files) => {
			for (const { name, buffer } of files) {
				if (IMAGE_EXT.test(name)) {
					const url = URL.createObjectURL(new Blob([buffer]));
					addImportedImage(url, name.replace(/\.[^.]+$/, ''));
				} else if (MODEL_EXT.test(name)) {
					const url = URL.createObjectURL(new Blob([buffer]));
					addImportedModel(url);
				} else {
					toast.error(`"${name}" is not a supported format.`);
				}
			}
		});
	});
</script>

<TooltipProvider>
	<div class="relative h-full w-full">
		<!-- Scene graph sidebar -->
		<aside
			class="absolute top-4 bottom-4 left-4 z-10 flex w-60 flex-col overflow-hidden rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-sm"
		>
			<div
				class="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2"
			>
				<span class="text-sm font-medium text-foreground">
					<NetworkIcon
						class="pointer-events-none me-2 inline-block size-3.5 shrink-0 text-muted-foreground"
					/>
					Scene
				</span>
			</div>
			<div class="flex-1 overflow-y-auto">
				<SceneGraph />
			</div>
		</aside>

		<!-- 3D canvas -->
		<Canvas>
			<T.PerspectiveCamera makeDefault position={[10, 10, 15]} fov={25}>
				<CameraControls dollyToCursor />
			</T.PerspectiveCamera>

			<SceneRegistrar />
			<SelectionManager />
			<TransformGizmo />

			<T.AmbientLight intensity={0.6} />
			<T.DirectionalLight position={[5, 10, 5]} intensity={1.5} />

			<Grid
				followCamera
				gridSize={[200, 200]}
				cellSize={1}
				cellColor="#cccccc"
				cellThickness={1.4}
				sectionSize={5}
				sectionColor="#ff3e00"
				sectionThickness={2.0}
				fadeDistance={100}
			/>

			{#each sceneStore.importedModels as { id, url } (id)}
				<ModelInstance {url} />
			{/each}
			{#each sceneStore.importedImages as img (img.id)}
				<ImageInstance url={img.url} name={img.name} />
			{/each}
		</Canvas>

		<PanelRouter />
		<Toolbar />
	</div>
	<Toaster theme="dark" />
</TooltipProvider>
