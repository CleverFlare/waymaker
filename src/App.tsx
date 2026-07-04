import { CameraControls, Environment, Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Toolbar } from "@/components/Toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
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
              position={[0, 0.01, 0]}
              args={[10.5, 10.5]}
              cellSize={0.6}
              cellThickness={1}
              cellColor="#6f6f6f"
              sectionSize={3.6}
              sectionThickness={1.5}
              sectionColor="#9d4b4b"
              fadeDistance={50}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
            />
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
