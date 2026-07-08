import { Suspense } from "react";
import { CameraControls, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import { Toolbar } from "@/components/Toolbar";
import { SceneGraph } from "@/components/SceneGraph";
import { PanelRouter } from "@/components/panels/PanelRouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SceneRegistrar } from "@/components/scene/SceneRegistrar";
import { SelectionManager } from "@/components/scene/SelectionManager";
import { TransformGizmo } from "@/components/scene/TransformGizmo";
import { ModelInstance } from "@/components/scene/ModelInstance";
import { ImageInstance } from "@/components/scene/ImageInstance";
import { InfiniteGrid } from "@/components/scene/InfiniteGrid";
import { useImportedFiles } from "@/hooks/useImportedFiles";
import { NetworkIcon } from "lucide-react";

export default function App() {
  const { models, images } = useImportedFiles();

  return (
    <TooltipProvider>
      <div className="relative w-full h-full">
        <aside className="absolute left-4 top-4 bottom-4 z-10 w-60 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-foreground">
              <NetworkIcon className="inline-block text-muted-foreground pointer-events-none size-3.5 shrink-0 me-2" />
              Scene
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SceneGraph />
          </div>
        </aside>

        <Canvas
          camera={{ position: [10, 10, 15], fov: 25 }}
          gl={async ({ canvas, antialias }) => {
            const renderer = new WebGPURenderer({
              canvas: canvas as HTMLCanvasElement,
              antialias,
              alpha: true,
            });
            await renderer.init();
            return renderer;
          }}
        >
          <SceneRegistrar />
          <SelectionManager />
          <TransformGizmo />
          <color attach="background" args={["#404040"]} />
          <InfiniteGrid fadeRadius={1000} />
          <Suspense fallback={null}>
            {models.map(({ id, url }) => (
              <ModelInstance key={id} id={id} url={url} />
            ))}
            {images.map((img) => (
              <ImageInstance key={img.id} {...img} />
            ))}
          </Suspense>
          <Environment preset="city" />
          <CameraControls makeDefault dollyToCursor />
        </Canvas>
        <PanelRouter />
        <Toolbar />
      </div>
    </TooltipProvider>
  );
}
