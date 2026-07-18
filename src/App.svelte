<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import { CameraControls, Grid } from "@threlte/extras";
  import { NetworkIcon } from "lucide-svelte";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import SceneGraph from "@/components/SceneGraph.svelte";
  import PanelRouter from "@/components/panels/PanelRouter.svelte";
  import Toolbar from "@/components/Toolbar.svelte";
  import SceneRegistrar from "@/components/scene/SceneRegistrar.svelte";
  import SelectionManager from "@/components/scene/SelectionManager.svelte";
  import TransformGizmo from "@/components/scene/TransformGizmo.svelte";
  import ModelInstance from "@/components/scene/ModelInstance.svelte";
  import ImageInstance from "@/components/scene/ImageInstance.svelte";
  import {
    sceneStore,
    addImportedModel,
    addImportedImage,
  } from "@/store/sceneStore.svelte";

  // Absorbed from the dissolved useImportedFiles hook (Phase 4)
  const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

  $effect(() => {
    return window.electronAPI.onImportFiles((files) => {
      for (const { name, buffer } of files) {
        const url = URL.createObjectURL(new Blob([buffer]));
        if (IMAGE_EXT.test(name)) {
          addImportedImage(url, name.replace(/\.[^.]+$/, ""));
        } else {
          addImportedModel(url);
        }
      }
    });
  });
</script>

<TooltipProvider>
  <div class="relative w-full h-full">
    <!-- Scene graph sidebar -->
    <aside class="absolute left-4 top-4 bottom-4 z-10 w-60 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
      <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
        <span class="text-sm font-medium text-foreground">
          <NetworkIcon class="inline-block text-muted-foreground pointer-events-none size-3.5 shrink-0 me-2" />
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
        infiniteGrid
        followCamera
        fadeDistance={120}
        cellColor="#666666"
        sectionColor="#999999"
        sectionSize={10}
        gridSize={240}
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
</TooltipProvider>
