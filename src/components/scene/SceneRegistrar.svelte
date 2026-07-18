<script lang="ts">
  import { useThrelte } from "@threlte/core";
  import { registerObject, unregisterObject } from "@/store/sceneStore.svelte";
  import { SCENE_ROOT_ID } from "@/lib/scene";

  const { scene } = useThrelte();

  $effect(() => {
    registerObject(SCENE_ROOT_ID, scene);
    return () => unregisterObject(SCENE_ROOT_ID);
  });
</script>
