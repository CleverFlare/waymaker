import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CameraControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Vector2, WebGPURenderer } from "three/webgpu";
import { Toolbar } from "@/components/Toolbar";
import { ImportButton } from "@/components/ImportButton";
import { SceneGraph } from "@/components/SceneGraph";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSceneStore } from "@/store/sceneStore";
import { flattenScene, SCENE_ROOT_ID } from "@/lib/scene";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useBoxHelper } from "@/hooks/useBoxHelper";
import { NetworkIcon } from "lucide-react";

interface SceneModel {
  id: string;
  url: string;
}

function SceneRegistrar() {
  const threeScene = useThree((s) => s.scene);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  useEffect(() => {
    registerObject(SCENE_ROOT_ID, threeScene);
    return () => unregisterObject(SCENE_ROOT_ID);
  }, [threeScene]);

  return null;
}

function SelectionManager() {
  const { scene, camera, raycaster, gl } = useThree();
  const selectNode = useSceneStore((s) => s.selectNode);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const getObject = useSceneStore((s) => s.getObject);
  const nodes = useSceneStore((s) => s.nodes);
  const { onPointerDown, wasDrag } = useDragGuard(5);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    const canvas = gl.domElement;

    const handleClick = (e: MouseEvent) => {
      if (wasDrag(e)) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => nodesRef.current[i.object.uuid]);
      selectNode(hit ? hit.object.uuid : null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [scene, camera, raycaster, gl, onPointerDown, wasDrag, selectNode]);

  const selectedObject = selectedUuid ? getObject(selectedUuid) : null;
  const boxHelper = useBoxHelper(selectedObject);

  return boxHelper ? <primitive object={boxHelper} /> : null;
}

function ModelInstance({ id, url }: { id: string; url: string }) {
  const { scene } = useGLTF(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeModel = useSceneStore((s) => s.removeModel);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  useEffect(() => {
    const { rootUuid, nodes } = flattenScene(scene);
    addModel(id, nodes, rootUuid);
    scene.traverse((obj) => registerObject(obj.uuid, obj));

    return () => {
      removeModel(id);
      scene.traverse((obj) => unregisterObject(obj.uuid));
    };
  }, [scene, id]);

  return <primitive object={scene} position={[0, 0, 0]} />;
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
      <div className="relative w-full h-full">
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
          gl={async ({ canvas, antialias, alpha }) => {
            const renderer = new WebGPURenderer({
              canvas: canvas as HTMLCanvasElement,
              antialias,
              alpha,
            });
            await renderer.init();
            return renderer;
          }}
        >
          <SceneRegistrar />
          <SelectionManager />
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
          <Suspense fallback={null}>
            {models.map(({ id, url }) => (
              <ModelInstance key={id} id={id} url={url} />
            ))}
          </Suspense>
          <Environment preset="city" />
          <CameraControls makeDefault dollyToCursor />
        </Canvas>
        <PropertiesPanel />
        <Toolbar />
      </div>
    </TooltipProvider>
  );
}

export default App;
