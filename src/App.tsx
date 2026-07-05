import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CameraControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { BoxHelper, type Object3D } from "three";
import { Toolbar } from "@/components/Toolbar";
import { ImportButton } from "@/components/ImportButton";
import { SceneGraph } from "@/components/SceneGraph";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSceneStore, type SceneNode } from "@/store/sceneStore";

interface SceneModel {
  id: string;
  url: string;
}

function flattenScene(root: Object3D): { rootUuid: string; nodes: Record<string, SceneNode> } {
  const nodes: Record<string, SceneNode> = {};
  let counter = 0;

  function walk(obj: Object3D): string {
    const name = obj.name.trim() || `${obj.type} #${++counter}`;
    const validChildren = obj.children
      .filter((c) => c.type !== "Bone")
      .map((c) => walk(c));
    nodes[obj.uuid] = { uuid: obj.uuid, name, type: obj.type, children: validChildren };
    return obj.uuid;
  }

  return { rootUuid: walk(root), nodes };
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

  const selectedObject = useMemo(() => {
    if (!selectedUuid) return null;
    let found: Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.uuid === selectedUuid) found = obj;
    });
    return found;
  }, [scene, selectedUuid]);

  const [boxHelper, setBoxHelper] = useState<BoxHelper | null>(null);

  useEffect(() => {
    if (!selectedObject) {
      setBoxHelper(null);
      return;
    }
    setBoxHelper(new BoxHelper(selectedObject, 0xffff00));
    return () => setBoxHelper(null);
  }, [selectedObject]);

  useFrame(() => boxHelper?.update());

  return (
    <>
      <primitive object={scene} position={[0, 0, 0]} />
      {boxHelper && <primitive object={boxHelper} />}
    </>
  );
}

function App() {
  const [models, setModels] = useState<SceneModel[]>([]);

  const handleImport = useCallback((files: FileList) => {
    const incoming = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }));
    setModels((prev) => [...prev, ...incoming]);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex w-full h-full">
        <aside className="w-60 shrink-0 border-r border-border bg-background flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-foreground">Scene</span>
            <ImportButton onImport={handleImport} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SceneGraph />
          </div>
        </aside>

        <div className="relative flex-1">
          <Canvas
            camera={{ position: [10, 10, 15], fov: 25 }}
            gl={{ antialias: true }}
          >
            <color attach="background" args={["#404040"]} />
            <group position={[0, 0, 0]}>
              <Grid
                position={[0, 0.05, 0]}
                args={[10.5, 10.5]}
                cellSize={0.6}
                cellThickness={1}
                cellColor="#6f6f6f"
                sectionSize={3.6}
                sectionThickness={1.5}
                sectionColor="#9d4b4b"
                fadeDistance={300}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid
              />
            </group>
            <Suspense fallback={null}>
              {models.map(({ id, url }) => (
                <ModelInstance key={id} id={id} url={url} />
              ))}
            </Suspense>
            <Environment preset="city" />
            <CameraControls makeDefault dollyToCursor />
          </Canvas>
          <Toolbar />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
