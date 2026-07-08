import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Mesh, PerspectiveCamera } from "three";
import { type ImagePlaneNode, useSceneStore, type Vec3 } from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";
import { gizmoInteracting } from "@/lib/gizmoInteracting";

export function useSizeAttenuation(mesh: Mesh, uuid: string) {
  const cameraScaleRef = useRef<Vec3>([0.1, 0.1, 1]);
  const prevSizeAttenuation = useRef(false);

  useEffect(() => {
    const node = useSceneStore.getState().nodes[uuid] as ImagePlaneNode | undefined;
    if (node?.type === "ImagePlane") cameraScaleRef.current = node.cameraScale;
  }, [uuid]);

  useEffect(() => {
    const handler = ({ uuid: id, cameraScale }: { uuid: string; cameraRotation: Vec3; cameraScale: Vec3 }) => {
      if (id !== uuid) return;
      cameraScaleRef.current = cameraScale;
    };
    eventBus.on("imagePlane", handler);
    return () => eventBus.off("imagePlane", handler);
  }, [uuid]);

  useFrame(({ camera }) => {
    const node = useSceneStore.getState().nodes[uuid] as ImagePlaneNode | undefined;
    if (!node || node.type !== "ImagePlane") return;

    if (node.sizeAttenuation) {
      if (!gizmoInteracting.current) {
        const dist = camera.position.distanceTo(mesh.position);
        const fov = camera instanceof PerspectiveCamera ? camera.fov : 50;
        const factor = dist * 2 * Math.tan(MathUtils.degToRad(fov / 2));
        const [sx, sy] = cameraScaleRef.current;
        mesh.scale.set(sx * factor, sy * factor, 1);
      }
    } else if (prevSizeAttenuation.current) {
      mesh.scale.set(node.scale[0], node.scale[1], node.scale[2]);
    }

    prevSizeAttenuation.current = node.sizeAttenuation;
  });
}
