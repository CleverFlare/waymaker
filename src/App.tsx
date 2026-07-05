import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CameraControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Toolbar } from "@/components/Toolbar";
import { ImportButton } from "@/components/ImportButton";
import { SceneGraph } from "@/components/SceneGraph";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSceneStore } from "@/store/sceneStore";
import { flattenScene, findByUuid } from "@/lib/scene";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useBoxHelper } from "@/hooks/useBoxHelper";
import { NetworkIcon } from "lucide-react";

interface SceneModel {
  id: string;
  url: string;
}

function ModelInstance({ id, url }: { id: string; url: string }) {
  const { scene } = useGLTF(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeModel = useSceneStore((s) => s.removeModel);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);

  useEffect(() => {
    const { rootUuid, nodes } = flattenScene(scene);
    addModel(id, nodes, rootUuid);
    return () => removeModel(id);
  }, [scene, id]);

  const selectedObject = useMemo(
    () => (selectedUuid ? findByUuid(scene, selectedUuid) : null),
    [scene, selectedUuid],
  );

  const boxHelper = useBoxHelper(selectedObject);

  return (
    <>
      <primitive object={scene} position={[0, 0, 0]} />
      {boxHelper && <primitive object={boxHelper} />}
    </>
  );
}

function App() {
  const [models, setModels] = useState<SceneModel[]>([]);
  const selectNode = useSceneStore((s) => s.selectNode);
  const { onPointerDown, wasDrag } = useDragGuard(5);

  const handleImport = useCallback((files: FileList) => {
    const incoming = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }));
    setModels((prev) => [...prev, ...incoming]);
  }, []);

  return (
    <TooltipProvider>
      <div
        className="relative w-full h-full"
        onPointerDown={onPointerDown}
      >
        <aside className="absolute left-4 top-4 bottom-4 z-10 w-60 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-foreground">
              <NetworkIcon className="inline-block text-muted-foreground pointer-events-none size-3.5 shrink-0 me-2" />
              Scene
            </span>
            <ImportButton onImport={handleImport} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SceneGraph />
          </div>
        </aside>

        <Canvas
          camera={{ position: [10, 10, 15], fov: 25 }}
          gl={{ antialias: true }}
          onPointerMissed={(e) => {
            if (wasDrag(e)) return;
            selectNode(null);
          }}
        >
          <color attach="background" args={["#404040"]} />
          <group position={[0, 0, 0]}>
            <axesHelper args={[50]} renderOrder={1000}>
              <lineBasicMaterial
                attach="material"
                vertexColors
                depthTest={true}
              />
            </axesHelper>
            <Grid
              args={[10.5, 10.5]}
              cellSize={0.6}
              cellThickness={1}
              cellColor="rgba(111, 111, 111, 1)"
              sectionSize={3.6}
              sectionThickness={1}
              sectionColor="rgba(111, 111, 111, 1)"
              fadeDistance={1000}
              fadeStrength={1}
              followCamera={true}
              infiniteGrid
            />
          </group>
          <group
            onClick={(e) => {
              if (wasDrag(e)) return;
              e.stopPropagation();
              selectNode(e.object.uuid);
            }}
          >
            <Suspense fallback={null}>
              {models.map(({ id, url }) => (
                <ModelInstance key={id} id={id} url={url} />
              ))}
            </Suspense>
          </group>
          <Environment preset="city" />
          <CameraControls makeDefault dollyToCursor />
        </Canvas>
        <Toolbar />
      </div>
    </TooltipProvider>
  );
}

export default App;
