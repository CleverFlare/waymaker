import { Suspense, useCallback, useState } from "react";
import { CameraControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Toolbar } from "@/components/Toolbar";
import { ImportButton } from "@/components/ImportButton";
import { TooltipProvider } from "@/components/ui/tooltip";

interface SceneModel {
  id: string;
  url: string;
}

function ModelInstance({ url }: { url: string }) {
  const { scene } = useGLTF(url);
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
              <ModelInstance key={id} url={url} />
            ))}
          </Suspense>
          <Environment preset="city" />
          <CameraControls makeDefault dollyToCursor />
        </Canvas>
        <ImportButton onImport={handleImport} />
        <Toolbar />
      </div>
    </TooltipProvider>
  );
}

export default App;
