import { useEffect, useMemo } from "react";
import {
  abs,
  float,
  fract,
  floor,
  length,
  log2,
  mix,
  pow,
  uniform,
  vec4,
  positionWorld,
  cameraPosition,
} from "three/tsl";
import {
  MeshBasicNodeMaterial,
  LineBasicNodeMaterial,
  Mesh,
  PlaneGeometry,
  LineSegments,
  BufferGeometry,
  Float32BufferAttribute,
  Color,
} from "three/webgpu";

interface InfiniteGridProps {
  gridColor?: number;
  xAxisColor?: number;
  yAxisColor?: number;
  zAxisColor?: number;
  fadeDistance?: number;
}

export function InfiniteGrid({
  gridColor = 0x6f6f6f,
  xAxisColor = 0xff4444,
  yAxisColor = 0x44ff44,
  zAxisColor = 0x4444ff,
  fadeDistance = 100,
}: InfiniteGridProps) {
  const uniforms = useMemo(
    () => ({
      gridColor: uniform(new Color(gridColor)),
      xAxisColor: uniform(new Color(xAxisColor)),
      yAxisColor: uniform(new Color(yAxisColor)),
      zAxisColor: uniform(new Color(zAxisColor)),
      fadeDistance: uniform(fadeDistance),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.gridColor.value.set(gridColor);
  }, [gridColor]);
  useEffect(() => {
    uniforms.xAxisColor.value.set(xAxisColor);
  }, [xAxisColor]);
  useEffect(() => {
    uniforms.yAxisColor.value.set(yAxisColor);
  }, [yAxisColor]);
  useEffect(() => {
    uniforms.zAxisColor.value.set(zAxisColor);
  }, [zAxisColor]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    (uniforms.fadeDistance as any).value = fadeDistance;
  }, [fadeDistance]);

  const { gridMesh, xAxisLine, zAxisLine, yAxisLine } = useMemo(() => {
    const {
      gridColor: uGrid,
      xAxisColor: uXAxis,
      zAxisColor: uZAxis,
      fadeDistance: uFade,
    } = uniforms;

    // ── Dynamic LOD ────────────────────────────────────────────────────────────
    const camH = cameraPosition.y.abs().max(0.01);
    const logH = log2(camH).div(log2(float(10.0)));
    const lodScale = pow(float(10.0), floor(logH));
    const tBlend = fract(logH);

    // 10 subdivisions per decade — squares are 10× denser than a raw power-of-10
    const fineScale = lodScale.div(float(10.0));
    const coarseScale = lodScale;

    // ── Anti-aliased grid lines ────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridLine = (xz: any, scale: any) => {
      const c: any = xz.div(scale);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = abs(fract(c.sub(0.5)).sub(0.5)).div(
        c.fwidth().max(0.0001),
      );
      return float(1.0).sub(g.x.min(g.y).clamp(0.0, 1.0));
    };

    // positionWorld.xz is the exact world-space XZ of each fragment on the Y=0 plane
    const fine = gridLine(positionWorld.xz, fineScale);
    const coarse = gridLine(positionWorld.xz, coarseScale);
    const gridAlpha = fine.mul(float(1.0).sub(tBlend)).add(coarse);

    // ── Distance fade (continuous — camera height, no decade snap) ─────────────
    const xzDist = length(positionWorld.xz.sub(cameraPosition.xz));
    const fadeR = uFade.mul(camH);
    const fade = float(1.0).sub(
      xzDist.sub(fadeR.mul(0.5)).div(fadeR.mul(0.5)).clamp(0.0, 1.0),
    );

    // ── X and Z axis highlighting (fwidth AA — ~1 px screen width) ────────────
    const xMask = float(1.0).sub(
      abs(positionWorld.z)
        .div(positionWorld.z.fwidth().max(0.0001))
        .clamp(0.0, 1.0),
    );
    const zMask = float(1.0).sub(
      abs(positionWorld.x)
        .div(positionWorld.x.fwidth().max(0.0001))
        .clamp(0.0, 1.0),
    );

    const col = mix(mix(uGrid, uXAxis, xMask), uZAxis, zMask);
    const alpha = gridAlpha.max(xMask).max(zMask).mul(fade);

    // ── Grid material ──────────────────────────────────────────────────────────
    // Real world-space geometry at Y=0 — no custom vertexNode or depthNode needed.
    // alphaTest discards gap pixels so they don't write depth, letting below-Y=0
    // geometry show through the gaps while grid lines act as a physical surface.
    // polygonOffset pushes the plane back one depth unit so objects placed exactly
    // at Y=0 always win the depth test without z-fighting.
    const gridMat = new MeshBasicNodeMaterial();
    gridMat.transparent = true;
    gridMat.depthWrite = true;
    gridMat.depthTest = true;
    gridMat.alphaTest = 0.01;
    gridMat.polygonOffset = true;
    gridMat.polygonOffsetFactor = 1;
    gridMat.polygonOffsetUnits = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gridMat as any).colorNode = vec4(col, alpha);

    // 100 000-unit plane — large enough to cover any practical camera height
    const gridGeo = new PlaneGeometry(100_000, 100_000);
    gridGeo.rotateX(-Math.PI / 2); // lay flat in the XZ plane at Y=0
    const gridMesh = new Mesh(gridGeo, gridMat);
    gridMesh.frustumCulled = false;

    // ── Axes ───────────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const makeAxis = (points: number[], colorUniform: any) => {
      const axisMat = new LineBasicNodeMaterial();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (axisMat as any).colorNode = colorUniform;
      const axisGeo = new BufferGeometry();
      axisGeo.setAttribute("position", new Float32BufferAttribute(points, 3));
      return new LineSegments(axisGeo, axisMat);
    };

    const xAxisLine = makeAxis(
      [-10000, 0, 0, 10000, 0, 0],
      uniforms.xAxisColor,
    );
    const zAxisLine = makeAxis(
      [0, 0, -10000, 0, 0, 10000],
      uniforms.zAxisColor,
    );
    const yAxisLine = makeAxis(
      [0, -10000, 0, 0, 10000, 0],
      uniforms.yAxisColor,
    );

    return { gridMesh, xAxisLine, zAxisLine, yAxisLine };
  }, [uniforms]);

  return (
    <group>
      <primitive object={gridMesh} renderOrder={0} />
      <primitive object={xAxisLine} renderOrder={1} />
      <primitive object={zAxisLine} renderOrder={1} />
      <primitive object={yAxisLine} renderOrder={1} />
    </group>
  );
}
