<script lang="ts">
  import type { Component } from "svelte";
  import { MousePointer2, Move, RotateCw, Scaling } from "lucide-svelte";
  import { buttonVariants } from "@/components/ui/button";
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  } from "@/components/ui/tooltip";
  import { activeTool, setActiveTool } from "@/store/sceneStore.svelte";
  import type { Tool } from "@/store/sceneStore.svelte";

  const tools: { id: Tool; label: string; icon: Component }[] = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "move", label: "Move", icon: Move },
    { id: "rotate", label: "Rotate", icon: RotateCw },
    { id: "resize", label: "Resize", icon: Scaling },
  ];
</script>

<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1.5 shadow-lg backdrop-blur-sm">
  {#each tools as { id, label, icon }}
    <Tooltip>
      <TooltipTrigger
        class={buttonVariants({ variant: activeTool === id ? "default" : "outline", size: "icon-lg" })}
        aria-pressed={activeTool === id}
        onclick={() => setActiveTool(id)}
      >
        <svelte:component this={icon} />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  {/each}
</div>
