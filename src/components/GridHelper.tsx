import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  positionWorld,
  fwidth,
  fract,
  abs,
  min,
  mix,
  vec4,
  float,
  cameraPosition,
  distance,
  smoothstep,
  log,
  floor,
  pow,
} from "three/tsl";
// Add this helper function below your imports
const tslLog10 = (val: any) => log(val).div(log(10.0));

interface InfiniteGridProps {
  fadeRadius?: number;
  gridColor?: [number, number, number];
  xAxisColor?: [number, number, number];
  zAxisColor?: [number, number, number];
}

export const InfiniteGrid: React.FC<InfiniteGridProps> = ({
  fadeRadius = 120.0,
  gridColor = [0.4, 0.4, 0.4],
  xAxisColor = [1.0, 0.2, 0.2],
  zAxisColor = [0.2, 0.2, 1.0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Keep the grid centered under the camera to retain high precision
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = state.camera.position.x;
      meshRef.current.position.z = state.camera.position.z;
    }
  });

  const gridMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // --- TSL Shader Pipeline ---
    const coord = positionWorld.xz;
    const camDist = distance(positionWorld, cameraPosition);

    const logScale = tslLog10(camDist.mul(0.5).max(0.001));

    // INCREASED THRESHOLD:
    // 0.0 means the smallest grid squares will lock at 1.0 unit sizes.
    // Set to 1.0 if you want them to lock at 10.0 unit sizes instead.
    const minScaleLimit = float(0.0);

    const clampedLogScale = logScale.max(minScaleLimit);
    const baseLog = floor(clampedLogScale);
    const blendFactor = clampedLogScale.sub(baseLog).clamp(0.0, 1.0);

    const mainCellSize = pow(float(10.0), baseLog);
    const subCellSize = mainCellSize.div(10.0);

    // 3. Screen-space derivatives for line anti-aliasing
    const derivative = fwidth(coord);
    const targetLineWidthPixels = float(0.9);

    // --- Helper function node to compute anti-aliased grid lines ---
    const getGridFactor = (scale: any) => {
      const scaledCoord = coord.div(scale);
      const gridDist = abs(fract(scaledCoord.sub(0.5)).sub(0.5));
      const pixelDist = gridDist.mul(scale).div(derivative);

      const lineX = smoothstep(
        targetLineWidthPixels,
        targetLineWidthPixels.sub(1.0),
        pixelDist.x,
      );
      const lineY = smoothstep(
        targetLineWidthPixels,
        targetLineWidthPixels.sub(1.0),
        pixelDist.y,
      );
      return lineX.max(lineY);
    };

    // Calculate grid structural densities for both scales
    const mainGridFactor = getGridFactor(mainCellSize);
    const subGridFactor = getGridFactor(subCellSize);

    // 4. Smoothly blend sub-grid lines in or out based on camera elevation profile
    // As you zoom out, the sub-grid structural visibility drops to 0
    const finalGridFactor = mix(subGridFactor, mainGridFactor, blendFactor);
    const baseGrid = vec4(...gridColor, finalGridFactor.mul(0.3));

    // 5. Solid primary reference axes (X & Z)
    const axisWidthX = derivative.y.mul(targetLineWidthPixels);
    const axisWidthZ = derivative.x.mul(targetLineWidthPixels);

    const xAxisLine = smoothstep(
      axisWidthX,
      axisWidthX.sub(derivative.y),
      abs(positionWorld.z),
    );
    const zAxisLine = smoothstep(
      axisWidthZ,
      axisWidthZ.sub(derivative.x),
      abs(positionWorld.x),
    );

    let finalColor = mix(baseGrid, vec4(...xAxisColor, 0.8), xAxisLine);
    finalColor = mix(finalColor, vec4(...zAxisColor, 0.8), zAxisLine);

    // 6. Horizon atmospheric falloff
    const fade = float(1.0).sub(min(camDist.div(float(fadeRadius)), 1.0));

    material.colorNode = finalColor.mul(fade);

    return material;
  }, [fadeRadius, gridColor, xAxisColor, zAxisColor]);

  const geometrySize = fadeRadius * 2.5;

  return (
    <mesh
      ref={meshRef}
      geometry={new THREE.PlaneGeometry(geometrySize, geometrySize)}
      material={gridMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
};
