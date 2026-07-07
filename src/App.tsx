import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  CameraControls,
  Environment,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector2, WebGPURenderer } from "three/webgpu";
import { Toolbar } from "@/components/Toolbar";
import { SceneGraph } from "@/components/SceneGraph";
import { PropertiesPanel } from "@/components/PropertiesPanel";
// import { InfiniteGrid } from "@/components/InfiniteGrid";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useSceneStore,
  createImagePlaneNode,
  type ImagePlaneNode,
} from "@/store/sceneStore";
import { flattenScene, SCENE_ROOT_ID } from "@/lib/scene";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useBoxHelper } from "@/hooks/useBoxHelper";
import { usePivotSprite } from "@/hooks/usePivotSprite";
import { NetworkIcon } from "lucide-react";
import { InfiniteGrid } from "./components/GridHelper";

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

interface SceneModel {
  id: string;
  url: string;
}

interface SceneImage {
  id: string;
  url: string;
  name: string;
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
  const boxHelper = useBoxHelper(selectedObject ?? null);
  const pivotSprite = usePivotSprite(selectedObject ?? null);

  return (
    <>
      {boxHelper && <primitive object={boxHelper} />}
      {pivotSprite && <primitive object={pivotSprite} />}
    </>
  );
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

function ImageInstance({ id, url, name }: SceneImage) {
  const texture = useTexture(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeModel = useSceneStore((s) => s.removeModel);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  const mesh = useMemo(() => {
    const w = (texture.image?.width as number) || 1;
    const h = (texture.image?.height as number) || 1;
    const max = Math.max(w, h);
    const geo = new THREE.PlaneGeometry(w / max, h / max);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }, [texture]);

  useEffect(() => {
    mesh.name = name;
    addModel(
      id,
      { [mesh.uuid]: createImagePlaneNode(mesh.uuid, name) },
      mesh.uuid,
    );
    registerObject(mesh.uuid, mesh);
    return () => {
      removeModel(id);
      unregisterObject(mesh.uuid);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };
  }, [id, mesh, name]);

  const _wp = useMemo(() => new THREE.Vector3(), []);
  const prevBillboard = useRef(false);
  const prevSizeAttenuation = useRef(false);

  useFrame(({ camera }) => {
    const node = useSceneStore.getState().nodes[mesh.uuid] as
      | ImagePlaneNode
      | undefined;
    if (!node) return;

    if (node.billboard) {
      mesh.quaternion.copy(camera.quaternion);
    } else if (prevBillboard.current) {
      mesh.rotation.set(node.rotation[0], node.rotation[1], node.rotation[2]);
    }
    prevBillboard.current = node.billboard;

    if (node.sizeAttenuation) {
      const dist = camera.position.distanceTo(mesh.getWorldPosition(_wp));
      if (node.sizeAttenuationRef === null) {
        useSceneStore
          .getState()
          .updateNode(mesh.uuid, { sizeAttenuationRef: dist });
      } else {
        const r = node.sizeAttenuationRef;
        mesh.scale.set(
          (node.scale[0] * dist) / r,
          (node.scale[1] * dist) / r,
          (node.scale[2] * dist) / r,
        );
      }
    } else if (prevSizeAttenuation.current) {
      mesh.scale.set(node.scale[0], node.scale[1], node.scale[2]);
    }
    prevSizeAttenuation.current = node.sizeAttenuation;
  });

  return <primitive object={mesh} />;
}

function App() {
  const [models, setModels] = useState<SceneModel[]>([]);
  const [images, setImages] = useState<SceneImage[]>([]);

  useEffect(() => {
    return window.electronAPI.onImportFiles((files) => {
      for (const { name, buffer } of files) {
        const url = URL.createObjectURL(new Blob([buffer]));
        if (IMAGE_EXT.test(name)) {
          setImages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              url,
              name: name.replace(/\.[^.]+$/, ""),
            },
          ]);
        } else {
          setModels((prev) => [...prev, { id: crypto.randomUUID(), url }]);
        }
      }
    });
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
        <PropertiesPanel />
        <Toolbar />
      </div>
    </TooltipProvider>
  );
}

export default App;
